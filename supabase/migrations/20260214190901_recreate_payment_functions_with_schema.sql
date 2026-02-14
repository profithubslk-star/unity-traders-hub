/*
  # Recreate Payment Functions with Explicit Schema References

  1. Purpose
    - Fix "relation does not exist" error by explicitly qualifying table names
    - Recreate functions to pick up schema changes
    
  2. Changes
    - Drop and recreate create_payment_request with public.table_name references
    - Drop and recreate activate_subscription_from_payment
    - Ensure all table references are fully qualified
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS create_payment_request(text, numeric, text, numeric);
DROP FUNCTION IF EXISTS activate_subscription_from_payment(uuid, text);

-- Recreate function to create payment request with explicit schema
CREATE OR REPLACE FUNCTION public.create_payment_request(
  p_plan_type text,
  p_amount_usd numeric,
  p_crypto_currency text,
  p_crypto_amount numeric
)
RETURNS uuid AS $$
DECLARE
  v_payment_id uuid;
  v_wallet_address text;
BEGIN
  -- Get the wallet address for the selected currency (explicit schema)
  SELECT wallet_address INTO v_wallet_address
  FROM public.payment_wallet_config
  WHERE currency = p_crypto_currency AND is_active = true;

  IF v_wallet_address IS NULL THEN
    RAISE EXCEPTION 'Payment method not available';
  END IF;

  -- Create payment record (explicit schema)
  INSERT INTO public.crypto_payments (
    user_id,
    plan_type,
    amount_usd,
    crypto_currency,
    crypto_amount,
    wallet_address,
    status,
    expires_at
  )
  VALUES (
    auth.uid(),
    p_plan_type,
    p_amount_usd,
    p_crypto_currency,
    p_crypto_amount,
    v_wallet_address,
    'pending',
    now() + interval '30 minutes'
  )
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate function to activate subscription from payment
CREATE OR REPLACE FUNCTION public.activate_subscription_from_payment(
  p_payment_id uuid,
  p_transaction_hash text
)
RETURNS boolean AS $$
DECLARE
  v_payment RECORD;
  v_plan_limits RECORD;
BEGIN
  -- Get payment details (explicit schema)
  SELECT * INTO v_payment
  FROM public.crypto_payments
  WHERE id = p_payment_id
  AND status = 'pending';

  IF v_payment IS NULL THEN
    RETURN false;
  END IF;

  -- Check if payment expired
  IF v_payment.expires_at < now() THEN
    UPDATE public.crypto_payments
    SET status = 'expired', updated_at = now()
    WHERE id = p_payment_id;
    RETURN false;
  END IF;

  -- Update payment status (explicit schema)
  UPDATE public.crypto_payments
  SET 
    status = 'confirmed',
    transaction_hash = p_transaction_hash,
    verified_at = now(),
    updated_at = now()
  WHERE id = p_payment_id;

  -- Get plan limits
  SELECT * INTO v_plan_limits FROM public.get_plan_limits(v_payment.plan_type);

  -- Deactivate existing subscriptions (explicit schema)
  UPDATE public.subscriptions
  SET status = 'inactive', updated_at = now()
  WHERE user_id = v_payment.user_id
  AND status = 'active';

  -- Create new subscription (explicit schema)
  INSERT INTO public.subscriptions (
    user_id,
    plan_type,
    status,
    start_date,
    end_date,
    price,
    max_signals_per_day,
    max_signals_total,
    allowed_methods,
    allowed_timeframes,
    can_access_market_intelligence,
    has_chart_integration,
    signals_viewed_count
  )
  VALUES (
    v_payment.user_id,
    v_payment.plan_type,
    'active',
    now(),
    CASE v_payment.plan_type
      WHEN '1_month' THEN now() + interval '1 month'
      WHEN '3_months' THEN now() + interval '3 months'
      WHEN '6_months' THEN now() + interval '6 months'
      WHEN '12_months' THEN now() + interval '12 months'
      ELSE now() + interval '1 month'
    END,
    v_plan_limits.price,
    v_plan_limits.max_signals_per_day,
    v_plan_limits.max_signals_total,
    v_plan_limits.allowed_methods,
    v_plan_limits.allowed_timeframes,
    v_plan_limits.can_access_market_intelligence,
    v_plan_limits.has_chart_integration,
    0
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_payment_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_subscription_from_payment TO authenticated;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
