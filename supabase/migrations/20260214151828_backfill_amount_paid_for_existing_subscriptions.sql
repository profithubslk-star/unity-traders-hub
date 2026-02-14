/*
  # Backfill amount_paid for Existing Subscriptions
  
  This migration fixes the proration calculation by ensuring all existing subscriptions
  have their `amount_paid` field properly set.
  
  ## Changes
  
  1. Updates existing subscriptions where `amount_paid` is NULL or 0
  2. Sets `amount_paid` equal to the `price` field for historical accuracy
  3. Ensures future proration calculations work correctly
  
  ## Why This Is Needed
  
  The `calculate_upgrade_cost` function relies on `amount_paid` to calculate the remaining
  value of a subscription. If this field is 0 or NULL, the remaining value will be 0,
  which means users won't get credit for their current subscription when upgrading.
*/

-- Update all existing subscriptions to set amount_paid = price where amount_paid is NULL or 0
UPDATE subscriptions
SET amount_paid = COALESCE(price, 0),
    updated_at = now()
WHERE (amount_paid IS NULL OR amount_paid = 0)
AND price IS NOT NULL
AND price > 0;

-- Also update the handle_new_user function to include amount_paid
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_limits RECORD;
BEGIN
  -- Insert user_profile
  INSERT INTO user_profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  -- Get demo plan limits
  SELECT * INTO v_plan_limits FROM get_plan_limits('demo');

  -- Create demo subscription with amount_paid
  INSERT INTO subscriptions (
    user_id, 
    plan_type, 
    status, 
    end_date,
    price,
    amount_paid,
    max_signals_total,
    max_signals_per_day,
    allowed_methods,
    allowed_timeframes,
    can_access_market_intelligence,
    has_chart_integration,
    signals_viewed_count
  )
  VALUES (
    NEW.id, 
    'demo', 
    'active', 
    now() + interval '30 days',
    v_plan_limits.price,
    0, -- Demo is free, so amount_paid is 0
    v_plan_limits.max_signals_total,
    v_plan_limits.max_signals_per_day,
    v_plan_limits.allowed_methods,
    v_plan_limits.allowed_timeframes,
    v_plan_limits.can_access_market_intelligence,
    v_plan_limits.has_chart_integration,
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;