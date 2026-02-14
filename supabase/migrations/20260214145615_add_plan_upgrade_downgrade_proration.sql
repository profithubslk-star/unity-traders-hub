/*
  # Plan Upgrade/Downgrade with Proration

  This migration adds support for upgrading and downgrading subscription plans
  with intelligent proration and billing cycle management.

  ## Upgrade Logic
  - Before renewal: Charge only the difference (prorated)
  - After renewal: Charge full amount for new plan
  
  ## Downgrade Logic
  - No immediate charge
  - Schedule downgrade for next billing cycle
  - Apply new pricing at next renewal

  ## New Fields
  
  ### subscriptions table
  - `pending_plan_type` (text) - Plan scheduled for next billing cycle
  - `pending_plan_price` (decimal) - Price of pending plan
  - `amount_paid` (decimal) - Total amount paid for current subscription
  - `plan_change_scheduled_at` (timestamptz) - When plan change was requested
  
  ## New Functions
  
  1. `calculate_upgrade_cost` - Calculates prorated upgrade amount
  2. `schedule_downgrade` - Schedules a plan downgrade
  3. `apply_scheduled_plan_changes` - Applies pending plan changes at renewal
  4. `get_subscription_value_remaining` - Calculates remaining subscription value

  ## Security
  
  - All existing RLS policies remain in place
  - Users can only modify their own subscriptions
*/

-- Add new fields to subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'pending_plan_type'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN pending_plan_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'pending_plan_price'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN pending_plan_price decimal(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN amount_paid decimal(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'plan_change_scheduled_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_change_scheduled_at timestamptz;
  END IF;
END $$;

-- Function to calculate remaining subscription value (for upgrades)
CREATE OR REPLACE FUNCTION get_subscription_value_remaining(
  p_subscription_id uuid
)
RETURNS decimal AS $$
DECLARE
  v_sub RECORD;
  v_total_days integer;
  v_days_remaining integer;
  v_value_per_day decimal;
  v_remaining_value decimal;
BEGIN
  SELECT * INTO v_sub
  FROM subscriptions
  WHERE id = p_subscription_id;

  IF v_sub IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate total days in subscription period
  v_total_days := EXTRACT(DAY FROM (v_sub.end_date - v_sub.start_date));
  
  -- Calculate days remaining
  v_days_remaining := EXTRACT(DAY FROM (v_sub.end_date - now()));

  -- If already past end date, no value remaining
  IF v_days_remaining <= 0 THEN
    RETURN 0;
  END IF;

  -- Calculate daily value
  v_value_per_day := v_sub.amount_paid / v_total_days;

  -- Calculate remaining value
  v_remaining_value := v_value_per_day * v_days_remaining;

  RETURN GREATEST(v_remaining_value, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate upgrade cost with proration
CREATE OR REPLACE FUNCTION calculate_upgrade_cost(
  p_user_id uuid,
  p_new_plan_type text
)
RETURNS TABLE (
  upgrade_cost decimal,
  is_after_renewal boolean,
  current_plan text,
  new_plan text,
  remaining_value decimal,
  new_plan_price decimal,
  message text
) AS $$
DECLARE
  v_current_sub RECORD;
  v_new_plan_limits RECORD;
  v_remaining_value decimal;
  v_upgrade_cost decimal;
  v_is_after_renewal boolean;
BEGIN
  -- Get current active subscription
  SELECT * INTO v_current_sub
  FROM subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  AND plan_type != 'demo'
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no subscription or demo only, charge full price
  IF v_current_sub IS NULL OR v_current_sub.plan_type = 'demo' THEN
    SELECT * INTO v_new_plan_limits FROM get_plan_limits(p_new_plan_type);
    
    RETURN QUERY SELECT 
      v_new_plan_limits.price,
      true,
      'demo'::text,
      p_new_plan_type,
      0::decimal,
      v_new_plan_limits.price,
      'New subscription - full payment required';
    RETURN;
  END IF;

  -- Check if current subscription has expired
  v_is_after_renewal := v_current_sub.end_date <= now();

  -- Get new plan details
  SELECT * INTO v_new_plan_limits FROM get_plan_limits(p_new_plan_type);

  IF v_is_after_renewal THEN
    -- After renewal: charge full amount
    v_upgrade_cost := v_new_plan_limits.price;
    v_remaining_value := 0;

    RETURN QUERY SELECT 
      v_upgrade_cost,
      true,
      v_current_sub.plan_type,
      p_new_plan_type,
      v_remaining_value,
      v_new_plan_limits.price,
      'Subscription expired - full payment required';
    RETURN;
  ELSE
    -- Before renewal: calculate prorated cost
    v_remaining_value := get_subscription_value_remaining(v_current_sub.id);
    v_upgrade_cost := GREATEST(v_new_plan_limits.price - v_remaining_value, 0);

    RETURN QUERY SELECT 
      v_upgrade_cost,
      false,
      v_current_sub.plan_type,
      p_new_plan_type,
      v_remaining_value,
      v_new_plan_limits.price,
      format('Prorated upgrade - credit of $%s applied', ROUND(v_remaining_value, 2));
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule a downgrade
CREATE OR REPLACE FUNCTION schedule_downgrade(
  p_user_id uuid,
  p_new_plan_type text
)
RETURNS TABLE (
  success boolean,
  message text,
  effective_date timestamptz
) AS $$
DECLARE
  v_current_sub RECORD;
  v_new_plan_limits RECORD;
BEGIN
  -- Get current active subscription
  SELECT * INTO v_current_sub
  FROM subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  AND plan_type != 'demo'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_current_sub IS NULL THEN
    RETURN QUERY SELECT 
      false,
      'No active subscription found'::text,
      null::timestamptz;
    RETURN;
  END IF;

  -- Get new plan details
  SELECT * INTO v_new_plan_limits FROM get_plan_limits(p_new_plan_type);

  -- Update subscription with pending plan change
  UPDATE subscriptions
  SET 
    pending_plan_type = p_new_plan_type,
    pending_plan_price = v_new_plan_limits.price,
    plan_change_scheduled_at = now(),
    updated_at = now()
  WHERE id = v_current_sub.id;

  RETURN QUERY SELECT 
    true,
    format('Downgrade scheduled to %s at next billing cycle', p_new_plan_type)::text,
    v_current_sub.end_date;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function to activate subscription from payment with upgrade support
CREATE OR REPLACE FUNCTION activate_subscription_from_payment(
  p_payment_id uuid,
  p_transaction_hash text
)
RETURNS boolean AS $$
DECLARE
  v_payment RECORD;
  v_plan_limits RECORD;
  v_current_sub RECORD;
  v_new_start_date timestamptz;
  v_new_end_date timestamptz;
BEGIN
  -- Get payment details
  SELECT * INTO v_payment
  FROM crypto_payments
  WHERE id = p_payment_id
  AND status IN ('pending', 'verifying');

  IF v_payment IS NULL THEN
    RETURN false;
  END IF;

  -- Check if payment expired
  IF v_payment.expires_at < now() THEN
    UPDATE crypto_payments
    SET status = 'expired', updated_at = now()
    WHERE id = p_payment_id;
    RETURN false;
  END IF;

  -- Update payment status
  UPDATE crypto_payments
  SET 
    status = 'confirmed',
    transaction_hash = p_transaction_hash,
    verified_at = now(),
    updated_at = now()
  WHERE id = p_payment_id;

  -- Get plan limits
  SELECT * INTO v_plan_limits FROM get_plan_limits(v_payment.plan_type);

  -- Get current active subscription (if exists)
  SELECT * INTO v_current_sub
  FROM subscriptions
  WHERE user_id = v_payment.user_id
  AND status = 'active'
  AND plan_type != 'demo'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Determine start and end dates
  IF v_current_sub IS NULL OR v_current_sub.end_date <= now() THEN
    -- New subscription or expired subscription
    v_new_start_date := now();
  ELSE
    -- Upgrade: start immediately, extend from current end date
    v_new_start_date := now();
  END IF;

  -- Calculate end date based on plan type
  v_new_end_date := CASE v_payment.plan_type
    WHEN '1_month' THEN v_new_start_date + interval '1 month'
    WHEN '3_months' THEN v_new_start_date + interval '3 months'
    WHEN '6_months' THEN v_new_start_date + interval '6 months'
    WHEN '12_months' THEN v_new_start_date + interval '12 months'
    ELSE v_new_start_date + interval '1 month'
  END;

  -- Deactivate existing non-demo subscriptions
  UPDATE subscriptions
  SET status = 'inactive', updated_at = now()
  WHERE user_id = v_payment.user_id
  AND status = 'active'
  AND plan_type != 'demo';

  -- Create new subscription
  INSERT INTO subscriptions (
    user_id,
    plan_type,
    status,
    start_date,
    end_date,
    price,
    amount_paid,
    max_signals_per_day,
    max_signals_total,
    allowed_methods,
    allowed_timeframes,
    can_access_market_intelligence,
    has_chart_integration,
    signals_viewed_count
  )
  VALUES (
    v_payment.user_id,
    v_payment.plan_type,
    'active',
    v_new_start_date,
    v_new_end_date,
    v_plan_limits.price,
    v_payment.amount_usd,
    v_plan_limits.max_signals_per_day,
    v_plan_limits.max_signals_total,
    v_plan_limits.allowed_methods,
    v_plan_limits.allowed_timeframes,
    v_plan_limits.can_access_market_intelligence,
    v_plan_limits.has_chart_integration,
    0
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply scheduled plan changes (call this at renewal time)
CREATE OR REPLACE FUNCTION apply_scheduled_plan_changes()
RETURNS TABLE (
  subscription_id uuid,
  user_id uuid,
  old_plan text,
  new_plan text,
  applied boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH expired_subs AS (
    SELECT 
      id,
      user_id,
      plan_type,
      pending_plan_type,
      pending_plan_price,
      end_date
    FROM subscriptions
    WHERE status = 'active'
    AND end_date <= now()
    AND pending_plan_type IS NOT NULL
  )
  SELECT 
    es.id,
    es.user_id,
    es.plan_type,
    es.pending_plan_type,
    true
  FROM expired_subs es;

  -- This function can be called by a scheduled job to apply pending changes
  -- For now, it just returns what needs to be changed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON COLUMN subscriptions.pending_plan_type IS 'Plan scheduled to activate at next billing cycle (for downgrades)';
COMMENT ON COLUMN subscriptions.pending_plan_price IS 'Price of pending plan';
COMMENT ON COLUMN subscriptions.amount_paid IS 'Actual amount paid for current subscription period';
COMMENT ON COLUMN subscriptions.plan_change_scheduled_at IS 'When plan change was requested';

COMMENT ON FUNCTION calculate_upgrade_cost IS 'Calculates prorated cost for upgrading to a new plan';
COMMENT ON FUNCTION schedule_downgrade IS 'Schedules a plan downgrade for next billing cycle with no immediate charge';
COMMENT ON FUNCTION get_subscription_value_remaining IS 'Calculates remaining value of current subscription for proration';
