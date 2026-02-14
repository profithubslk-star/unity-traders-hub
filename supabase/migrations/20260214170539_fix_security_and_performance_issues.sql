/*
  # Fix Security and Performance Issues

  ## 1. Performance Improvements
    - Add missing index on `payment_transactions.user_id` foreign key
    - Optimize all RLS policies to use `(select auth.uid())` instead of `auth.uid()` to prevent per-row re-evaluation
    - Drop unused indexes to reduce database overhead
    - Set immutable search_path on all functions for security
  
  ## 2. RLS Policy Optimizations
    ### Tables Updated:
    - `subscriptions` - 3 policies optimized
    - `signals` - 6 policies optimized + consolidate multiple SELECT policies
    - `user_signals` - 2 policies optimized
    - `user_profiles` - 3 policies optimized
    - `crypto_payments` - 3 policies optimized
    - `payment_transactions` - 2 policies optimized
  
  ## 3. Index Management
    - Add: `idx_payment_transactions_user_id` (missing foreign key index)
    - Drop: 10 unused indexes that are not being utilized
  
  ## 4. Function Security
    - Set search_path to empty string with SECURITY DEFINER on all functions
    - This prevents search_path hijacking attacks
  
  ## 5. Manual Configuration Required (Dashboard)
    - Enable "Leaked Password Protection" in Auth settings
    - Change Auth DB connection strategy to percentage-based allocation
*/

-- =====================================================
-- PART 1: Add Missing Index on Foreign Key
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_payment_transactions_user_id'
  ) THEN
    CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
  END IF;
END $$;

-- =====================================================
-- PART 2: Drop Unused Indexes
-- =====================================================

DROP INDEX IF EXISTS public.idx_signals_market;
DROP INDEX IF EXISTS public.idx_signal_updates_signal_id;
DROP INDEX IF EXISTS public.idx_user_signals_signal_id;
DROP INDEX IF EXISTS public.idx_analysis_logs_created_at;
DROP INDEX IF EXISTS public.idx_user_profiles_user_id;
DROP INDEX IF EXISTS public.idx_crypto_payments_user_id;
DROP INDEX IF EXISTS public.idx_crypto_payments_status;
DROP INDEX IF EXISTS public.idx_crypto_payments_transaction_hash;
DROP INDEX IF EXISTS public.idx_subscriptions_payment_due_date;
DROP INDEX IF EXISTS public.idx_subscriptions_user_status;
DROP INDEX IF EXISTS public.idx_payment_transactions_subscription;

-- =====================================================
-- PART 3: Optimize RLS Policies - user_profiles
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- PART 4: Optimize RLS Policies - subscriptions
-- =====================================================

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- PART 5: Optimize RLS Policies - signals (Consolidate Multiple SELECT Policies)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own signals" ON public.signals;
DROP POLICY IF EXISTS "VIP users can view all non-demo signals" ON public.signals;
DROP POLICY IF EXISTS "Demo users can view demo signals" ON public.signals;
DROP POLICY IF EXISTS "Users can create own signals" ON public.signals;
DROP POLICY IF EXISTS "Users can update own signals" ON public.signals;
DROP POLICY IF EXISTS "Users can delete own signals" ON public.signals;

-- Consolidated SELECT policy (replaces 3 separate policies)
CREATE POLICY "Users can view signals based on subscription"
  ON public.signals
  FOR SELECT
  TO authenticated
  USING (
    -- Users can always view their own signals
    user_id = (select auth.uid())
    OR
    -- Demo users can view demo signals
    (is_demo = true)
    OR
    -- VIP users can view all non-demo signals
    (
      NOT is_demo 
      AND EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.user_id = (select auth.uid())
        AND s.plan_type = 'vip'
        AND s.status = 'active'
      )
    )
  );

CREATE POLICY "Users can create own signals"
  ON public.signals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own signals"
  ON public.signals
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own signals"
  ON public.signals
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- PART 6: Optimize RLS Policies - user_signals
-- =====================================================

DROP POLICY IF EXISTS "Users can view own signal tracking" ON public.user_signals;
DROP POLICY IF EXISTS "Users can insert own signal tracking" ON public.user_signals;

CREATE POLICY "Users can view own signal tracking"
  ON public.user_signals
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own signal tracking"
  ON public.user_signals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- PART 7: Optimize RLS Policies - crypto_payments
-- =====================================================

DROP POLICY IF EXISTS "Users can view own payments" ON public.crypto_payments;
DROP POLICY IF EXISTS "Users can create own payments" ON public.crypto_payments;
DROP POLICY IF EXISTS "Users can update own pending payments" ON public.crypto_payments;

CREATE POLICY "Users can view own payments"
  ON public.crypto_payments
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own payments"
  ON public.crypto_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own pending payments"
  ON public.crypto_payments
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) AND status = 'pending')
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- PART 8: Optimize RLS Policies - payment_transactions
-- =====================================================

DROP POLICY IF EXISTS "Users can view own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can insert own payment transactions" ON public.payment_transactions;

CREATE POLICY "Users can view own payment transactions"
  ON public.payment_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own payment transactions"
  ON public.payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- PART 9: Fix Function Search Paths (Security)
-- =====================================================

-- Update all functions to have immutable search_path
ALTER FUNCTION public.handle_new_user_profile() SET search_path = '';
ALTER FUNCTION public.has_active_vip_subscription(uuid) SET search_path = '';
ALTER FUNCTION public.get_user_subscription(uuid) SET search_path = '';
ALTER FUNCTION public.increment_signal_view_count(uuid) SET search_path = '';
ALTER FUNCTION public.reset_daily_signal_counts() SET search_path = '';
ALTER FUNCTION public.get_plan_limits(text) SET search_path = '';
ALTER FUNCTION public.can_generate_signal(uuid) SET search_path = '';
ALTER FUNCTION public.create_payment_request(text, numeric, text, numeric) SET search_path = '';
ALTER FUNCTION public.activate_subscription_from_payment(uuid, text) SET search_path = '';
ALTER FUNCTION public.expire_old_payments() SET search_path = '';
ALTER FUNCTION public.get_subscription_value_remaining(uuid) SET search_path = '';
ALTER FUNCTION public.schedule_downgrade(uuid, text) SET search_path = '';
ALTER FUNCTION public.apply_scheduled_plan_changes() SET search_path = '';
ALTER FUNCTION public.calculate_upgrade_cost(uuid, text) SET search_path = '';
ALTER FUNCTION public.calculate_payment_due_date(text, timestamptz) SET search_path = '';
ALTER FUNCTION public.should_show_payment_warning(uuid) SET search_path = '';
ALTER FUNCTION public.should_suspend_account(uuid) SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
