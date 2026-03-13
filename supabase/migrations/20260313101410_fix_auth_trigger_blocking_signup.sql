/*
  # Fix Auth Trigger Blocking Signup

  1. Changes
    - Drop the on_auth_user_created_full trigger that's preventing user registration
    - This trigger is causing "Database error saving new user" failures
    
  2. Reason
    - The trigger is interfering with the auth.users table insert
    - Application-level subscription creation is more reliable
*/

-- Drop any triggers on auth.users that might block signup
DROP TRIGGER IF EXISTS on_auth_user_created_full ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;