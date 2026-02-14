/*
  # Update Upgrade Cost Calculation to Use Full Credit
  
  This migration changes the upgrade pricing logic to give users full credit
  for their current subscription, regardless of time remaining.
  
  ## New Logic
  
  Instead of prorating based on remaining time:
  - **Credit Applied**: Full price of current plan
  - **Pay Now**: New plan price - full credit
  - **Next Billing**: Full price of new plan
  
  ## Examples
  
  1 month ($25) to 3 months ($69):
    - Credit: $25
    - Pay now: $69 - $25 = $44
    - Next billing: $69
  
  1 month ($25) to 6 months ($139):
    - Credit: $25
    - Pay now: $139 - $25 = $114
    - Next billing: $139
  
  3 months ($69) to 12 months ($279):
    - Credit: $69
    - Pay now: $279 - $69 = $210
    - Next billing: $279
*/

-- Updated function to calculate upgrade cost with full credit (no proration)
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
  v_full_credit decimal;
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

  -- Get new plan details
  SELECT * INTO v_new_plan_limits FROM get_plan_limits(p_new_plan_type);

  -- If no subscription or demo only, charge full price
  IF v_current_sub IS NULL OR v_current_sub.plan_type = 'demo' THEN
    RETURN QUERY SELECT 
      v_new_plan_limits.price,
      true,
      'demo'::text,
      p_new_plan_type,
      0::decimal,
      v_new_plan_limits.price,
      'New subscription - full payment required'::text;
    RETURN;
  END IF;

  -- Check if current subscription has expired
  v_is_after_renewal := v_current_sub.end_date <= now();

  IF v_is_after_renewal THEN
    -- After renewal: charge full amount
    v_upgrade_cost := v_new_plan_limits.price;
    v_full_credit := 0;

    RETURN QUERY SELECT 
      v_upgrade_cost,
      true,
      v_current_sub.plan_type,
      p_new_plan_type,
      v_full_credit,
      v_new_plan_limits.price,
      'Subscription expired - full payment required'::text;
    RETURN;
  ELSE
    -- Before renewal: apply FULL credit of current plan
    -- Use amount_paid if available, otherwise use price
    v_full_credit := COALESCE(v_current_sub.amount_paid, v_current_sub.price, 0);
    v_upgrade_cost := GREATEST(v_new_plan_limits.price - v_full_credit, 0);

    RETURN QUERY SELECT 
      v_upgrade_cost,
      false,
      v_current_sub.plan_type,
      p_new_plan_type,
      v_full_credit,
      v_new_plan_limits.price,
      format('Full credit of $%s applied from current plan', ROUND(v_full_credit, 2))::text;
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_upgrade_cost IS 'Calculates upgrade cost with full credit of current plan (no time-based proration)';