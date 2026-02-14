/*
  # Subscription Tier Limits and Pricing
  
  Configures specific limits and pricing for each subscription tier.
  
  ## Subscription Tiers
  
  1. **DEMO (Try Free)**
     - Price: $0
     - Max signals: 3 total (lifetime limit)
     - Methods: Basic
     - Timeframes: All
     - Markets: All
  
  2. **1 MONTH (Starter)**
     - Price: $25
     - Max signals: 5 per day
     - Methods: ICT
     - Timeframes: M1, M5, M15
     - Markets: All
  
  3. **3 MONTHS (Popular)**
     - Price: $69
     - Max signals: 12 per day
     - Methods: ICT, SMC
     - Timeframes: M1, M5, M30, H1
     - Markets: All
  
  4. **6 MONTHS (Pro Traders)**
     - Price: $139
     - Max signals: 25 per day
     - Methods: ICT, SMC, Elliott Wave
     - Timeframes: M1, M5, M15, M30, H1, D1
     - Markets: All
     - Chart integration enabled
  
  5. **12 MONTHS (Best Value)**
     - Price: $279
     - Max signals: Unlimited
     - Methods: ICT, SMC, Elliott Wave
     - Timeframes: All (M1, M5, M15, M30, H1, H4, D1, W1)
     - Markets: All
     - Full Market Intelligence access
     - Chart integration enabled
  
  ## Changes
  
  - Add pricing fields to subscriptions table
  - Add allowed_methods field (array of strings)
  - Add allowed_timeframes field (array of strings)
  - Add max_signals_total field (for demo)
  - Add has_chart_integration field
  - Update demo subscription creation to set proper limits
*/

-- Add new fields to subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'price'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN price decimal(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'allowed_methods'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN allowed_methods text[] DEFAULT ARRAY['basic'];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'allowed_timeframes'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN allowed_timeframes text[] DEFAULT ARRAY['M1','M5','M15','M30','H1','H4','D1','W1'];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'max_signals_total'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN max_signals_total integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'has_chart_integration'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN has_chart_integration boolean DEFAULT false;
  END IF;
END $$;

-- Update existing demo subscriptions with proper limits
UPDATE subscriptions
SET 
  price = 0,
  max_signals_total = 3,
  max_signals_per_day = NULL,
  allowed_methods = ARRAY['basic'],
  allowed_timeframes = ARRAY['M1','M5','M15','M30','H1','H4','D1','W1'],
  can_access_market_intelligence = false,
  has_chart_integration = false
WHERE plan_type = 'demo';

-- Function to get subscription limits based on plan type
CREATE OR REPLACE FUNCTION get_plan_limits(plan text)
RETURNS TABLE (
  price decimal,
  max_signals_per_day integer,
  max_signals_total integer,
  allowed_methods text[],
  allowed_timeframes text[],
  can_access_market_intelligence boolean,
  has_chart_integration boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE plan
      WHEN 'demo' THEN 0::decimal
      WHEN '1_month' THEN 25::decimal
      WHEN '3_months' THEN 69::decimal
      WHEN '6_months' THEN 139::decimal
      WHEN '12_months' THEN 279::decimal
      ELSE 0::decimal
    END,
    CASE plan
      WHEN 'demo' THEN NULL
      WHEN '1_month' THEN 5
      WHEN '3_months' THEN 12
      WHEN '6_months' THEN 25
      WHEN '12_months' THEN NULL
      ELSE NULL
    END,
    CASE plan
      WHEN 'demo' THEN 3
      ELSE NULL
    END,
    CASE plan
      WHEN 'demo' THEN ARRAY['basic']
      WHEN '1_month' THEN ARRAY['ict']
      WHEN '3_months' THEN ARRAY['ict', 'smc']
      WHEN '6_months' THEN ARRAY['ict', 'smc', 'elliott_wave']
      WHEN '12_months' THEN ARRAY['ict', 'smc', 'elliott_wave']
      ELSE ARRAY['basic']
    END,
    CASE plan
      WHEN 'demo' THEN ARRAY['M1','M5','M15','M30','H1','H4','D1','W1']
      WHEN '1_month' THEN ARRAY['M1','M5','M15']
      WHEN '3_months' THEN ARRAY['M1','M5','M30','H1']
      WHEN '6_months' THEN ARRAY['M1','M5','M15','M30','H1','D1']
      WHEN '12_months' THEN ARRAY['M1','M5','M15','M30','H1','H4','D1','W1']
      ELSE ARRAY['M1','M5','M15']
    END,
    CASE plan
      WHEN '12_months' THEN true
      ELSE false
    END,
    CASE plan
      WHEN '6_months' THEN true
      WHEN '12_months' THEN true
      ELSE false
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the handle_new_user function to set proper demo limits
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  limits RECORD;
BEGIN
  -- Get demo plan limits
  SELECT * INTO limits FROM get_plan_limits('demo');
  
  -- Insert demo subscription with proper limits
  INSERT INTO subscriptions (
    user_id, 
    plan_type, 
    status, 
    end_date,
    price,
    max_signals_total,
    max_signals_per_day,
    allowed_methods,
    allowed_timeframes,
    can_access_market_intelligence,
    has_chart_integration,
    signals_viewed_count
  )
  VALUES (
    NEW.id, 
    'demo', 
    'active', 
    now() + interval '365 days',
    limits.price,
    limits.max_signals_total,
    limits.max_signals_per_day,
    limits.allowed_methods,
    limits.allowed_timeframes,
    limits.can_access_market_intelligence,
    limits.has_chart_integration,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can generate signal
CREATE OR REPLACE FUNCTION can_generate_signal(user_uuid uuid)
RETURNS TABLE (
  can_generate boolean,
  reason text,
  signals_remaining integer
) AS $$
DECLARE
  sub RECORD;
  total_signals integer;
  daily_signals integer;
BEGIN
  -- Get user's active subscription
  SELECT * INTO sub
  FROM subscriptions
  WHERE user_id = user_uuid
  AND status = 'active'
  AND (end_date IS NULL OR end_date > now())
  ORDER BY created_at DESC
  LIMIT 1;

  -- No active subscription
  IF sub IS NULL THEN
    RETURN QUERY SELECT false, 'No active subscription', 0;
    RETURN;
  END IF;

  -- Check total signals limit (for demo)
  IF sub.max_signals_total IS NOT NULL THEN
    SELECT COUNT(*) INTO total_signals
    FROM user_signals
    WHERE user_signals.user_id = user_uuid;
    
    IF total_signals >= sub.max_signals_total THEN
      RETURN QUERY SELECT false, 'Maximum signal limit reached. Please upgrade your plan.', 0;
      RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 'OK', (sub.max_signals_total - total_signals);
    RETURN;
  END IF;

  -- Check daily signals limit
  IF sub.max_signals_per_day IS NOT NULL THEN
    SELECT COUNT(*) INTO daily_signals
    FROM user_signals
    WHERE user_signals.user_id = user_uuid
    AND user_signals.seen_at > (now() - interval '24 hours');
    
    IF daily_signals >= sub.max_signals_per_day THEN
      RETURN QUERY SELECT false, 'Daily signal limit reached. Try again tomorrow.', 0;
      RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 'OK', (sub.max_signals_per_day - daily_signals);
    RETURN;
  END IF;

  -- Unlimited signals
  RETURN QUERY SELECT true, 'OK', -1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON COLUMN subscriptions.price IS 'Subscription price in USD';
COMMENT ON COLUMN subscriptions.allowed_methods IS 'Trading methods available: basic, ict, smc, elliott_wave';
COMMENT ON COLUMN subscriptions.allowed_timeframes IS 'Timeframes user can generate signals for';
COMMENT ON COLUMN subscriptions.max_signals_total IS 'Total signals allowed (demo only), NULL = unlimited in period';
COMMENT ON COLUMN subscriptions.has_chart_integration IS 'Can view signals directly on chart (6 & 12 month plans)';
