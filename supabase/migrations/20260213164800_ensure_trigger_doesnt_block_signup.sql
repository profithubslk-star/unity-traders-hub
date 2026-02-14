/*
  # Ensure Trigger Doesn't Block User Signup

  1. Changes
    - Make trigger function completely non-blocking
    - Add NULL check for NEW.id
    - Ensure trigger always returns NEW successfully
    - Use INSERT with ON CONFLICT to handle edge cases
    
  2. Security
    - Maintains SECURITY DEFINER for bypassing RLS
    - Only creates demo subscriptions for new users
*/

-- Drop and recreate function with maximum safety
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if we have a valid user ID
  IF NEW.id IS NOT NULL THEN
    BEGIN
      -- Try to insert demo subscription
      INSERT INTO public.subscriptions (user_id, plan_type, status, end_date)
      VALUES (NEW.id, 'demo', 'active', now() + interval '30 days')
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log but never fail
        RAISE WARNING 'Could not create demo subscription: %', SQLERRM;
    END;
  END IF;
  
  -- Always return NEW to ensure user creation succeeds
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, authenticated, anon;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
