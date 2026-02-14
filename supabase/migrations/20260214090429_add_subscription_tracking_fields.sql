/*
  # Enhanced Subscription Tracking
  
  Adds additional fields to track user subscription usage and limits.
  
  ## Changes
  
  1. **Subscriptions Table Updates**
     - Add `signals_viewed_count` to track how many signals viewed in current period
     - Add `last_signal_viewed_at` to track last signal access
     - Add `max_signals_per_day` for rate limiting (nullable, set per subscription)
     - Add `can_access_market_intelligence` boolean flag
     - Add `can_access_advanced_analysis` boolean flag
     - Add `auto_renew` boolean for subscription renewal tracking
  
  2. **User Profiles Table** (NEW)
     - Stores additional user information
     - Linked to auth.users
     - Tracks user preferences and settings
  
  3. **Helper Functions**
     - Function to check if user has active subscription
     - Function to get user subscription limits
     - Function to increment signal view count
  
  ## Security
  
  - RLS enabled on user_profiles table
  - Users can only read/update their own profile
*/

-- Add new fields to subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'signals_viewed_count'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN signals_viewed_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'last_signal_viewed_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN last_signal_viewed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'max_signals_per_day'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN max_signals_per_day integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'can_access_market_intelligence'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN can_access_market_intelligence boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'can_access_advanced_analysis'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN can_access_advanced_analysis boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'auto_renew'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN auto_renew boolean DEFAULT false;
  END IF;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text,
  telegram_username text,
  preferred_markets text[] DEFAULT ARRAY['crypto'],
  notification_preferences jsonb DEFAULT '{"email": true, "push": true, "telegram": false}',
  timezone text DEFAULT 'UTC',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create user profile for new users
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();

-- Add updated_at trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user has active VIP subscription
CREATE OR REPLACE FUNCTION has_active_vip_subscription(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND plan_type != 'demo'
    AND (end_date IS NULL OR end_date > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current subscription details
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid uuid)
RETURNS TABLE (
  plan_type text,
  status text,
  start_date timestamptz,
  end_date timestamptz,
  signals_viewed_count integer,
  can_access_market_intelligence boolean,
  can_access_advanced_analysis boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.plan_type,
    s.status,
    s.start_date,
    s.end_date,
    s.signals_viewed_count,
    s.can_access_market_intelligence,
    s.can_access_advanced_analysis
  FROM subscriptions s
  WHERE s.user_id = user_uuid
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment signal view count
CREATE OR REPLACE FUNCTION increment_signal_view_count(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET 
    signals_viewed_count = signals_viewed_count + 1,
    last_signal_viewed_at = now()
  WHERE user_id = user_uuid
  AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset daily signal counts (to be called by a cron job)
CREATE OR REPLACE FUNCTION reset_daily_signal_counts()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET signals_viewed_count = 0
  WHERE last_signal_viewed_at < (now() - interval '24 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining subscription types
COMMENT ON COLUMN subscriptions.plan_type IS 'Subscription types: demo (limited access), 1_month, 3_months, 6_months, 12_months (full VIP access)';
COMMENT ON COLUMN subscriptions.signals_viewed_count IS 'Tracks number of signals viewed in current period (can be reset daily or per billing cycle)';
COMMENT ON COLUMN subscriptions.max_signals_per_day IS 'Optional limit on signals per day (NULL = unlimited)';
