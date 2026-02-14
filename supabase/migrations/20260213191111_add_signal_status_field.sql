/*
  # Add Signal Status Field
  
  1. Changes
    - Add `status` column to signals table to track signal lifecycle
      - 'active': Signal is still open and being tracked
      - 'completed': All TPs hit or SL hit, signal is done
    - Default new signals to 'active'
    
  2. Purpose
    - Separate active signals (shown in Signals page) from completed signals (shown in Dashboard)
    - Keep Signals page clean with only ongoing signals
    - Maintain history in Dashboard for performance tracking
*/

-- Add status column to signals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'status'
  ) THEN
    ALTER TABLE signals ADD COLUMN status text CHECK (status IN ('active', 'completed')) DEFAULT 'active';
  END IF;
END $$;

-- Create index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_user_status ON signals(user_id, status);