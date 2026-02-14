/*
  # Use Fixed Upgrade Pricing
  
  Replace automatic upgrade cost calculation with fixed pricing values.
  
  ## Fixed Pricing Rules
  
  ### 1-Month Upgrades:
  - To 3-months: Credit $25, Pay $44, Next billing $69
  - To 6-months: Credit $25, Pay $114, Next billing $139
  - To 12-months: Credit $25, Pay $254, Next billing $279
  
  ### 3-Month Upgrades:
  - To 6-months: Credit $69, Pay $70, Next billing $139
  - To 12-months: Credit $69, Pay $210, Next billing $279
  
  ### 6-Month Upgrades:
  - To 12-months: Credit $139, Pay $140, Next billing $279
  
  ## Changes
  
  - Replace calculate_upgrade_cost function with fixed pricing logic
  - No time-based calculations
  - Simple plan-to-plan mapping
*/

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
  v_upgrade_cost decimal;
  v_credit decimal;
  v_plan_hierarchy text[] := ARRAY['demo', '1_month', '3_months', '6_months', '12_months'];
  v_current_plan_index int;
  v_new_plan_index int;
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

  -- Get plan hierarchy indexes
  SELECT array_position(v_plan_hierarchy, v_current_sub.plan_type) INTO v_current_plan_index;
  SELECT array_position(v_plan_hierarchy, p_new_plan_type) INTO v_new_plan_index;

  -- Validate that this is an upgrade, not a downgrade or same plan
  IF v_new_plan_index IS NULL OR v_current_plan_index IS NULL THEN
    RETURN QUERY SELECT 
      0::decimal,
      false,
      v_current_sub.plan_type,
      p_new_plan_type,
      0::decimal,
      v_new_plan_limits.price,
      'Invalid plan type'::text;
    RETURN;
  END IF;

  IF v_new_plan_index <= v_current_plan_index THEN
    RETURN QUERY SELECT 
      0::decimal,
      false,
      v_current_sub.plan_type,
      p_new_plan_type,
      0::decimal,
      v_new_plan_limits.price,
      'Use schedule_downgrade function for downgrades'::text;
    RETURN;
  END IF;

  -- FIXED PRICING LOGIC - No calculations based on time
  
  -- 1-Month Upgrades
  IF v_current_sub.plan_type = '1_month' THEN
    v_credit := 25;
    
    IF p_new_plan_type = '3_months' THEN
      v_upgrade_cost := 44;
    ELSIF p_new_plan_type = '6_months' THEN
      v_upgrade_cost := 114;
    ELSIF p_new_plan_type = '12_months' THEN
      v_upgrade_cost := 254;
    END IF;
  
  -- 3-Month Upgrades
  ELSIF v_current_sub.plan_type = '3_months' THEN
    v_credit := 69;
    
    IF p_new_plan_type = '6_months' THEN
      v_upgrade_cost := 70;
    ELSIF p_new_plan_type = '12_months' THEN
      v_upgrade_cost := 210;
    END IF;
  
  -- 6-Month Upgrades
  ELSIF v_current_sub.plan_type = '6_months' THEN
    v_credit := 139;
    
    IF p_new_plan_type = '12_months' THEN
      v_upgrade_cost := 140;
    END IF;
  END IF;

  RETURN QUERY SELECT 
    v_upgrade_cost,
    false,
    v_current_sub.plan_type,
    p_new_plan_type,
    v_credit,
    v_new_plan_limits.price,
    format('Fixed credit of $%s applied', v_credit)::text;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_upgrade_cost IS 'Returns fixed upgrade pricing - no time-based calculations';