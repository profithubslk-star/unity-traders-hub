/*
  # Fix amount_paid to Use Full Plan Price
  
  This migration corrects the subscription amount_paid logic to always store
  the full plan price, not the discounted upgrade price. This ensures that
  credits are calculated correctly when users upgrade from one plan to another.
  
  ## Changes
  
  1. **Update activate_subscription_from_payment Function**
     - Changed `amount_paid` from `v_payment.amount_usd` to `v_plan_limits.price`
     - This ensures amount_paid always reflects the full plan value
  
  2. **Backfill Existing Subscriptions**
     - Updates all active subscriptions to have correct amount_paid
     - Maps plan_type to correct full price:
       - 1_month: $25
       - 3_months: $69
       - 6_months: $139
       - 12_months: $279
  
  ## Why This Matters
  
  When users upgrade:
  - 1-month subscriber upgrading should get $25 credit
  - 3-month subscriber upgrading should get $69 credit
  - 6-month subscriber upgrading should get $139 credit
  - 12-month subscriber upgrading should get $279 credit
  
  Without this fix, all upgrades were only getting $25 credit.
*/

-- Update the activate_subscription_from_payment function
-- to set amount_paid to the full plan price
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
  -- IMPORTANT: amount_paid is set to full plan price for correct credit calculation
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
    v_plan_limits.price,  -- Changed from v_payment.amount_usd to v_plan_limits.price
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

COMMENT ON FUNCTION activate_subscription_from_payment IS 'Verifies payment and activates user subscription with correct amount_paid';

-- Backfill existing subscriptions with correct amount_paid values
UPDATE subscriptions
SET amount_paid = CASE plan_type
  WHEN '1_month' THEN 25.00
  WHEN '3_months' THEN 69.00
  WHEN '6_months' THEN 139.00
  WHEN '12_months' THEN 279.00
  ELSE price
END,
updated_at = now()
WHERE status = 'active'
AND plan_type != 'demo'
AND (
  amount_paid IS NULL 
  OR amount_paid != CASE plan_type
    WHEN '1_month' THEN 25.00
    WHEN '3_months' THEN 69.00
    WHEN '6_months' THEN 139.00
    WHEN '12_months' THEN 279.00
    ELSE price
  END
);