/*
  # Add 'failed' status to signals table
  
  1. Changes
    - Updates the status CHECK constraint on signals table to include 'failed' status
    - This allows tracking signal generation attempts that didn't produce a valid setup
  
  2. Purpose
    - Failed signal attempts should count toward user's signal limit
    - Users can see which attempts didn't result in valid setups
    - Helps prevent abuse of free signal generation attempts
*/

DO $$
BEGIN
  -- Drop the existing check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'signals_status_check' 
    AND conrelid = 'signals'::regclass
  ) THEN
    ALTER TABLE signals DROP CONSTRAINT signals_status_check;
  END IF;
  
  -- Add the updated check constraint with 'failed' status
  ALTER TABLE signals ADD CONSTRAINT signals_status_check 
    CHECK (status IN ('active', 'tp1_hit', 'tp2_hit', 'tp3_hit', 'completed', 'sl_hit', 'expired', 'cancelled', 'failed'));
END $$;