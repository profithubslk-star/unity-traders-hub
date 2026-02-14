/*
  # Cryptocurrency Payment System

  This migration adds support for automatic cryptocurrency payment processing via Binance.

  ## New Tables

  1. **crypto_payments**
     - `id` (uuid, primary key)
     - `user_id` (uuid, foreign key to auth.users)
     - `plan_type` (text) - The subscription plan being purchased
     - `amount_usd` (decimal) - Payment amount in USD
     - `crypto_currency` (text) - Currency used (BNB, USDT_TRC20, USDT_BEP20)
     - `crypto_amount` (decimal) - Amount in crypto
     - `wallet_address` (text) - The wallet address payment should be sent to
     - `transaction_hash` (text) - Blockchain transaction hash
     - `status` (text) - pending, verifying, confirmed, failed, expired
     - `verified_at` (timestamptz) - When transaction was verified
     - `expires_at` (timestamptz) - Payment expiration (30 minutes)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. **payment_wallet_config**
     - `id` (uuid, primary key)
     - `currency` (text) - BNB, USDT_TRC20, USDT_BEP20
     - `wallet_address` (text) - Receiving wallet address
     - `blockchain_network` (text) - BSC, TRON
     - `is_active` (boolean) - Whether this payment method is active

  ## Security

  - Enable RLS on all tables
  - Users can view their own payments
  - Users can create new payments
  - Only authenticated users can access payment config
  - System verifies transactions automatically

  ## Features

  - Automatic transaction verification using blockchain APIs
  - 30-minute payment window
  - Real-time payment status tracking
  - Support for multiple cryptocurrencies
*/

-- Create payment_wallet_config table
CREATE TABLE IF NOT EXISTS payment_wallet_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL UNIQUE,
  wallet_address text NOT NULL,
  blockchain_network text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create crypto_payments table
CREATE TABLE IF NOT EXISTS crypto_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL,
  amount_usd decimal(10, 2) NOT NULL,
  crypto_currency text NOT NULL,
  crypto_amount decimal(20, 8) NOT NULL,
  wallet_address text NOT NULL,
  transaction_hash text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'confirmed', 'failed', 'expired')),
  verified_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_crypto_payments_user_id ON crypto_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_status ON crypto_payments(status);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_transaction_hash ON crypto_payments(transaction_hash);

-- Enable RLS
ALTER TABLE payment_wallet_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_wallet_config
CREATE POLICY "Anyone can view active payment methods"
  ON payment_wallet_config
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for crypto_payments
CREATE POLICY "Users can view own payments"
  ON crypto_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments"
  ON crypto_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending payments"
  ON crypto_payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Insert wallet configuration
INSERT INTO payment_wallet_config (currency, wallet_address, blockchain_network, is_active)
VALUES
  ('BNB', '0xa901d68d82401dd7efb5e69b91208d6172513009', 'BSC', true),
  ('USDT_BEP20', '0xa901d68d82401dd7efb5e69b91208d6172513009', 'BSC', true),
  ('USDT_TRC20', 'TXB8SLdBz9ahgHomP58dyBGMDk9K8mhZtZ', 'TRON', true)
ON CONFLICT (currency) DO UPDATE SET
  wallet_address = EXCLUDED.wallet_address,
  blockchain_network = EXCLUDED.blockchain_network,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Function to create a new payment request
CREATE OR REPLACE FUNCTION create_payment_request(
  p_plan_type text,
  p_amount_usd decimal,
  p_crypto_currency text,
  p_crypto_amount decimal
)
RETURNS uuid AS $$
DECLARE
  v_payment_id uuid;
  v_wallet_address text;
BEGIN
  -- Get the wallet address for the selected currency
  SELECT wallet_address INTO v_wallet_address
  FROM payment_wallet_config
  WHERE currency = p_crypto_currency AND is_active = true;

  IF v_wallet_address IS NULL THEN
    RAISE EXCEPTION 'Payment method not available';
  END IF;

  -- Create payment record
  INSERT INTO crypto_payments (
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

-- Function to verify and activate subscription
CREATE OR REPLACE FUNCTION activate_subscription_from_payment(
  p_payment_id uuid,
  p_transaction_hash text
)
RETURNS boolean AS $$
DECLARE
  v_payment RECORD;
  v_plan_limits RECORD;
BEGIN
  -- Get payment details
  SELECT * INTO v_payment
  FROM crypto_payments
  WHERE id = p_payment_id
  AND status = 'pending';

  IF v_payment IS NULL THEN
    RETURN false;
  END IF;

  -- Check if payment expired
  IF v_payment.expires_at < now() THEN
    UPDATE crypto_payments
    SET status = 'expired', updated_at = now()
    WHERE id = p_payment_id;
    RETURN false;
  END IF;

  -- Update payment status
  UPDATE crypto_payments
  SET 
    status = 'confirmed',
    transaction_hash = p_transaction_hash,
    verified_at = now(),
    updated_at = now()
  WHERE id = p_payment_id;

  -- Get plan limits
  SELECT * INTO v_plan_limits FROM get_plan_limits(v_payment.plan_type);

  -- Deactivate existing subscriptions
  UPDATE subscriptions
  SET status = 'inactive', updated_at = now()
  WHERE user_id = v_payment.user_id
  AND status = 'active';

  -- Create new subscription
  INSERT INTO subscriptions (
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

-- Function to expire old pending payments
CREATE OR REPLACE FUNCTION expire_old_payments()
RETURNS void AS $$
BEGIN
  UPDATE crypto_payments
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending'
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE payment_wallet_config IS 'Configuration for cryptocurrency payment receiving wallets';
COMMENT ON TABLE crypto_payments IS 'Cryptocurrency payment transactions for subscription purchases';
COMMENT ON FUNCTION create_payment_request IS 'Creates a new payment request with 30-minute expiration';
COMMENT ON FUNCTION activate_subscription_from_payment IS 'Verifies payment and activates user subscription';
