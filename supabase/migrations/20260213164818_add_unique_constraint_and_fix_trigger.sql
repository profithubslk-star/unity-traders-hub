/*
  # Add Unique Constraint and Fix Trigger

  1. Changes
    - Add unique index on subscriptions(user_id) where status = 'active'
    - Update trigger function to handle conflicts properly
    - Ensure demo subscription creation is bulletproof
    
  2. Security
    - Maintains existing RLS policies
    - Function uses SECURITY DEFINER to bypass RLS
*/

-- Add partial unique index for active subscriptions per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_active 
ON subscriptions(user_id) 
WHERE status = 'active';

-- Drop and recreate function with proper conflict handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_sub_count INTEGER;
BEGIN
  -- Check if user already has an active subscription
  SELECT COUNT(*) INTO existing_sub_count
  FROM public.subscriptions
  WHERE user_id = NEW.id AND status = 'active';
  
  -- Only create if none exists
  IF existing_sub_count = 0 THEN
    INSERT INTO public.subscriptions (user_id, plan_type, status, end_date)
    VALUES (NEW.id, 'demo', 'active', now() + interval '30 days');
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log warning but never block user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
