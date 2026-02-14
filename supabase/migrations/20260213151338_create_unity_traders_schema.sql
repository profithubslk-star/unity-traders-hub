/*
  # Unity Traders Database Schema
  
  Complete database schema for the Unity Traders VIP trading signals platform.
  
  ## Tables Created
  
  1. **subscriptions**
     - Manages user subscription plans and status
     - Links to auth.users
     - Tracks plan type (1, 3, 6, 12 months)
     - Payment tracking via Binance Pay
  
  2. **signals**
     - Stores all trading signals
     - Includes entry, stop loss, take profit levels
     - Contains analysis data (ICT, SMC, Elliott Wave, indicators)
     - Tracks signal status and confidence score
  
  3. **signal_updates**
     - Tracks updates for each signal (TP hits, SL hits, BE alerts)
     - Links to parent signal
     - Timestamped for tracking
  
  4. **user_signals**
     - Tracks which signals each user has seen
     - Used to enforce demo user limits (3 signals max)
     - Records when user viewed the signal
  
  5. **market_news**
     - Aggregates market news from various sources
     - Impact level rating for filtering
     - Timestamped for relevance
  
  6. **analysis_logs**
     - Logs all market analysis attempts
     - Useful for debugging and improving accuracy
     - Stores indicator data for historical review
  
  ## Security
  
  - RLS enabled on all tables
  - Authenticated users can read their own data
  - Service role required for signal generation
  - Demo users restricted to 3 signals via user_signals table
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('demo', '1_month', '3_months', '6_months', '12_months')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  payment_id text,
  payment_amount decimal(10, 2),
  payment_currency text DEFAULT 'USDT',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create signals table
CREATE TABLE IF NOT EXISTS signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market text NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('buy', 'sell')),
  entry_type text NOT NULL CHECK (entry_type IN ('market', 'limit')),
  entry_price decimal(12, 4) NOT NULL,
  stop_loss decimal(12, 4) NOT NULL,
  take_profit_1 decimal(12, 4) NOT NULL,
  take_profit_2 decimal(12, 4) NOT NULL,
  take_profit_3 decimal(12, 4) NOT NULL,
  tp1_percentage integer DEFAULT 30,
  tp2_percentage integer DEFAULT 40,
  tp3_percentage integer DEFAULT 30,
  confidence_score integer NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  risk_reward_ratio decimal(4, 2),
  analysis_data jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'tp1_hit', 'tp2_hit', 'tp3_hit', 'completed', 'sl_hit', 'expired', 'cancelled')),
  is_demo boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create signal_updates table
CREATE TABLE IF NOT EXISTS signal_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid REFERENCES signals(id) ON DELETE CASCADE NOT NULL,
  update_type text NOT NULL CHECK (update_type IN ('pre_alert', 'signal_sent', 'tp1_hit', 'tp2_hit', 'tp3_hit', 'sl_hit', 'break_even', 'expired', 'cancelled')),
  message text NOT NULL,
  price_at_update decimal(12, 4),
  created_at timestamptz DEFAULT now()
);

-- Create user_signals table (for tracking demo user limits)
CREATE TABLE IF NOT EXISTS user_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  signal_id uuid REFERENCES signals(id) ON DELETE CASCADE NOT NULL,
  seen_at timestamptz DEFAULT now(),
  UNIQUE(user_id, signal_id)
);

-- Create market_news table
CREATE TABLE IF NOT EXISTS market_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  source text NOT NULL,
  url text,
  impact_level text CHECK (impact_level IN ('low', 'medium', 'high')),
  published_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create analysis_logs table
CREATE TABLE IF NOT EXISTS analysis_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market text NOT NULL,
  timeframe text NOT NULL,
  session text,
  indicators_data jsonb DEFAULT '{}',
  ict_data jsonb DEFAULT '{}',
  smc_data jsonb DEFAULT '{}',
  elliott_wave_data jsonb DEFAULT '{}',
  recommendation text,
  confidence_score integer,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_market ON signals(market);
CREATE INDEX IF NOT EXISTS idx_signal_updates_signal_id ON signal_updates(signal_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_user_id ON user_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_signal_id ON user_signals(signal_id);
CREATE INDEX IF NOT EXISTS idx_market_news_published_at ON market_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_created_at ON analysis_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for signals (all authenticated users can read signals they have access to)
CREATE POLICY "VIP users can view all non-demo signals"
  ON signals FOR SELECT
  TO authenticated
  USING (
    is_demo = false AND
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = auth.uid()
      AND subscriptions.status = 'active'
      AND subscriptions.plan_type != 'demo'
    )
  );

CREATE POLICY "Demo users can view demo signals"
  ON signals FOR SELECT
  TO authenticated
  USING (
    is_demo = true OR
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = auth.uid()
      AND subscriptions.status = 'active'
    )
  );

-- RLS Policies for signal_updates
CREATE POLICY "Users can view signal updates for accessible signals"
  ON signal_updates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM signals
      WHERE signals.id = signal_updates.signal_id
    )
  );

-- RLS Policies for user_signals
CREATE POLICY "Users can view own signal tracking"
  ON user_signals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signal tracking"
  ON user_signals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for market_news (all authenticated users can read)
CREATE POLICY "Authenticated users can view market news"
  ON market_news FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for analysis_logs (all authenticated users can read)
CREATE POLICY "Authenticated users can view analysis logs"
  ON analysis_logs FOR SELECT
  TO authenticated
  USING (true);

-- Create function to automatically create demo subscription for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_type, status, end_date)
  VALUES (NEW.id, 'demo', 'active', now() + interval '30 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_signals_updated_at ON signals;
CREATE TRIGGER update_signals_updated_at
  BEFORE UPDATE ON signals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();