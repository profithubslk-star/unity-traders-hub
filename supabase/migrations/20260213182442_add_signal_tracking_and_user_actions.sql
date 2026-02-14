/*
  # Add Signal Tracking and User Actions
  
  1. Changes to signals table
    - Add `user_id` column to track who created the signal
    - Add `user_action` column to track if signal was taken or not taken
    - Add `entry_hit_at` column to track when limit order entry was hit
    - Add `current_price` column to track live price
    - Add `pnl_percentage` column to track profit/loss
    - Add `break_even_moved` column to track if SL moved to break-even
    - Add `tp1_hit_at`, `tp2_hit_at`, `tp3_hit_at`, `sl_hit_at` timestamps
    - Add `methodology` text field for signal description
    
  2. Security
    - Update RLS policies for user-specific signal access
*/

-- Add new columns to signals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE signals ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'user_action'
  ) THEN
    ALTER TABLE signals ADD COLUMN user_action text CHECK (user_action IN ('taken', 'not_taken', 'pending')) DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'entry_hit_at'
  ) THEN
    ALTER TABLE signals ADD COLUMN entry_hit_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'current_price'
  ) THEN
    ALTER TABLE signals ADD COLUMN current_price decimal(20, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'pnl_percentage'
  ) THEN
    ALTER TABLE signals ADD COLUMN pnl_percentage decimal(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'break_even_moved'
  ) THEN
    ALTER TABLE signals ADD COLUMN break_even_moved boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'tp1_hit_at'
  ) THEN
    ALTER TABLE signals ADD COLUMN tp1_hit_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'tp2_hit_at'
  ) THEN
    ALTER TABLE signals ADD COLUMN tp2_hit_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'tp3_hit_at'
  ) THEN
    ALTER TABLE signals ADD COLUMN tp3_hit_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'sl_hit_at'
  ) THEN
    ALTER TABLE signals ADD COLUMN sl_hit_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'methodology'
  ) THEN
    ALTER TABLE signals ADD COLUMN methodology text;
  END IF;
END $$;

-- Update RLS policies for signals table
DROP POLICY IF EXISTS "Users can view own signals" ON signals;
DROP POLICY IF EXISTS "Users can create own signals" ON signals;
DROP POLICY IF EXISTS "Users can update own signals" ON signals;
DROP POLICY IF EXISTS "Users can delete own signals" ON signals;

CREATE POLICY "Users can view own signals"
  ON signals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own signals"
  ON signals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own signals"
  ON signals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own signals"
  ON signals FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());