/*
  # Add Downgrade Validation to calculate_upgrade_cost
  
  This migration adds validation to prevent the calculate_upgrade_cost function
  from processing downgrades. The function should only handle upgrades to
  higher-tier plans.
  
  ## Changes
  
  1. **Add Plan Hierarchy Validation**
     - Define plan hierarchy: demo < 1_month < 3_months < 6_months < 12_months
     - Validate that new plan is higher tier than current plan
     - Return error message for downgrade attempts
  
  2. **Return Structure**
     - For downgrades: Return clear error message
     - For upgrades: Continue with normal calculation
  
  ## Examples
  
  - 6_months trying to "upgrade" to 3_months: Returns error "Cannot downgrade"
  - 1_month upgrading to 3_months: Proceeds with calculation
*/

-- Add validation to reject downgrade attempts
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
    -- This is a downgrade or same plan
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

COMMENT ON FUNCTION calculate_upgrade_cost IS 'Calculates upgrade cost with full credit - rejects downgrade attempts';