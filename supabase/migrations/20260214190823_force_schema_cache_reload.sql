/*
  # Force Schema Cache Reload

  1. Purpose
    - Force Supabase PostgREST to reload schema cache
    - Ensure all tables and functions are accessible
    
  2. Changes
    - Re-grant permissions on all payment-related tables
    - Re-grant permissions on payment functions
    - Notify PostgREST to reload schema
*/

-- Re-grant permissions on payment tables
GRANT ALL ON payment_wallet_config TO authenticated;
GRANT ALL ON crypto_payments TO authenticated;
GRANT ALL ON payment_transactions TO authenticated;

-- Re-grant permissions on payment functions
GRANT EXECUTE ON FUNCTION create_payment_request TO authenticated;
GRANT EXECUTE ON FUNCTION activate_subscription_from_payment TO authenticated;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
