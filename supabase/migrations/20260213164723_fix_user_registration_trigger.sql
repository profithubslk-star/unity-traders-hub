/*
  # Fix User Registration Trigger

  1. Changes
    - Drop and recreate the handle_new_user() function with proper error handling
    - Ensure the function bypasses RLS by using SECURITY DEFINER
    - Add better error logging
    
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS for system operations
    - Still maintains security by only creating demo subscriptions
*/

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate function with proper permissions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert demo subscription for new user
  INSERT INTO public.subscriptions (user_id, plan_type, status, end_date)
  VALUES (NEW.id, 'demo', 'active', now() + interval '30 days')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating demo subscription for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
