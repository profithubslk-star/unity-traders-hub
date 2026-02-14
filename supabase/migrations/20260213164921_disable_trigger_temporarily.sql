/*
  # Temporarily Disable Trigger

  1. Changes
    - Drop the auth.users trigger
    - Keep the function for reference but don't use it
    - Let the application handle subscription creation instead
    
  2. Reason
    - Troubleshooting signup issues
    - Application-level subscription creation is more reliable
*/

-- Drop the trigger but keep the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- The function will remain for future reference
-- Subscription creation is now handled in the application code
