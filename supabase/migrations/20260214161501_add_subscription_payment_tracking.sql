/*
  # Add Subscription Payment Tracking and Auto-Suspension System

  1. Changes to Tables
    - `subscriptions`
      - Add `payment_due_date` (timestamptz) - When the next payment is due
      - Add `last_payment_date` (timestamptz) - When the last payment was received
      - Add `payment_warning_sent` (boolean) - Whether warning has been sent
      - Add `warning_sent_at` (timestamptz) - When the warning was sent
      - Add `suspension_reason` (text) - Reason for suspension if applicable
      - Add `suspended_at` (timestamptz) - When the account was suspended
      - Add `last_payment_check` (timestamptz) - Last time we checked for payment
      - Add `payment_attempts` (integer) - Number of times we've checked for payment

  2. New Tables
    - `payment_transactions`
      - Track all payment attempts and successful payments
      - Link to subscriptions table
      - Store transaction hashes and amounts

  3. Functions
    - Function to calculate next payment due date
    - Function to check if account should be suspended
    - Function to check if payment warning should be shown

  4. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Add new columns to subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'payment_due_date'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN payment_due_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'last_payment_date'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN last_payment_date timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'payment_warning_sent'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN payment_warning_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'warning_sent_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN warning_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'suspension_reason'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN suspension_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'suspended_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN suspended_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'last_payment_check'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN last_payment_check timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'payment_attempts'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN payment_attempts integer DEFAULT 0;
  END IF;
END $$;

-- Create payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_hash text,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USDT',
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'crypto',
  from_address text,
  to_address text,
  confirmed boolean DEFAULT false,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for payment_transactions
CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment transactions"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate next payment due date based on plan type
CREATE OR REPLACE FUNCTION calculate_payment_due_date(
  p_plan_type text,
  p_last_payment_date timestamptz
) RETURNS timestamptz AS $$
BEGIN
  CASE p_plan_type
    WHEN 'one_month' THEN
      RETURN p_last_payment_date + INTERVAL '1 month';
    WHEN 'three_months' THEN
      RETURN p_last_payment_date + INTERVAL '3 months';
    WHEN 'twelve_months' THEN
      RETURN p_last_payment_date + INTERVAL '12 months';
    ELSE
      RETURN p_last_payment_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if payment warning should be shown (2 days before due date)
CREATE OR REPLACE FUNCTION should_show_payment_warning(p_subscription_id uuid)
RETURNS boolean AS $$
DECLARE
  v_payment_due_date timestamptz;
  v_warning_threshold timestamptz;
BEGIN
  SELECT payment_due_date INTO v_payment_due_date
  FROM subscriptions
  WHERE id = p_subscription_id AND status = 'active';

  IF v_payment_due_date IS NULL THEN
    RETURN false;
  END IF;

  v_warning_threshold := now() + INTERVAL '2 days';

  RETURN v_payment_due_date <= v_warning_threshold;
END;
$$ LANGUAGE plpgsql;

-- Function to check if account should be suspended (past due date)
CREATE OR REPLACE FUNCTION should_suspend_account(p_subscription_id uuid)
RETURNS boolean AS $$
DECLARE
  v_payment_due_date timestamptz;
BEGIN
  SELECT payment_due_date INTO v_payment_due_date
  FROM subscriptions
  WHERE id = p_subscription_id AND status = 'active';

  IF v_payment_due_date IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_payment_due_date < now();
END;
$$ LANGUAGE plpgsql;

-- Update existing subscriptions with payment due dates
UPDATE subscriptions
SET
  payment_due_date = calculate_payment_due_date(plan_type, COALESCE(last_payment_date, created_at)),
  last_payment_date = COALESCE(last_payment_date, created_at)
WHERE payment_due_date IS NULL AND status = 'active';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_due_date
  ON subscriptions(payment_due_date)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription
  ON payment_transactions(subscription_id, status);
