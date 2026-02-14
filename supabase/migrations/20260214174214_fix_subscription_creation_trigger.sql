/*
  # Fix Subscription Creation for New Users
  
  ## Problem
  - New users are not getting subscriptions created automatically
  - Trigger calls wrong function (handle_new_user_profile instead of handle_new_user)
  - Demo plan has inconsistent allowed_methods between database and frontend
  
  ## Changes
  1. Update trigger to call correct function that creates subscriptions
  2. Create subscriptions for existing users who don't have one
  3. Fix demo plan to have correct allowed_methods: ['ict', 'smc', 'elliott_wave']
  
  ## Security
  - Maintains existing RLS policies
  - Uses SECURITY DEFINER for automatic user subscription creation
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Create new trigger that creates both profile AND subscription
CREATE TRIGGER on_auth_user_created_full
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update demo plans to have correct allowed methods
UPDATE subscriptions
SET allowed_methods = ARRAY['ict', 'smc', 'elliott_wave']
WHERE plan_type = 'demo'
AND (allowed_methods IS NULL OR allowed_methods = ARRAY['basic']);

-- Create subscriptions for users who don't have one
DO $$
DECLARE
  user_record RECORD;
  limits RECORD;
BEGIN
  FOR user_record IN 
    SELECT u.id 
    FROM auth.users u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    WHERE s.id IS NULL
  LOOP
    -- Get demo plan limits
    SELECT * INTO limits FROM get_plan_limits('demo');
    
    -- Insert demo subscription
    INSERT INTO subscriptions (
      user_id, 
      plan_type, 
      status, 
      end_date,
      price,
      max_signals_total,
      max_signals_per_day,
      allowed_methods,
      allowed_timeframes,
      can_access_market_intelligence,
      has_chart_integration,
      signals_viewed_count
    )
    VALUES (
      user_record.id, 
      'demo', 
      'active', 
      now() + interval '365 days',
      limits.price,
      limits.max_signals_total,
      limits.max_signals_per_day,
      ARRAY['ict', 'smc', 'elliott_wave'],
      limits.allowed_timeframes,
      limits.can_access_market_intelligence,
      limits.has_chart_integration,
      0
    )
    ON CONFLICT DO NOTHING;
    
    -- Also create user profile if missing
    INSERT INTO user_profiles (user_id)
    VALUES (user_record.id)
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- Update handle_new_user function to use correct allowed_methods
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  limits RECORD;
BEGIN
  -- Get demo plan limits
  SELECT * INTO limits FROM get_plan_limits('demo');
  
  -- Insert demo subscription with proper limits
  INSERT INTO subscriptions (
    user_id, 
    plan_type, 
    status, 
    end_date,
    price,
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
    now() + interval '365 days',
    limits.price,
    limits.max_signals_total,
    limits.max_signals_per_day,
    ARRAY['ict', 'smc', 'elliott_wave'],
    limits.allowed_timeframes,
    limits.can_access_market_intelligence,
    limits.has_chart_integration,
    0
  )
  ON CONFLICT DO NOTHING;
  
  -- Also create user profile
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
