/*
  # Add Timeframe and Methods to Signals Table

  1. Changes
    - Add `timeframe` column to store the selected timeframe (1m, 5m, 15m, etc.)
    - Add `methods` column to store the array of selected analysis methods (ICT, SMC, Elliott Wave)
  
  2. Notes
    - Timeframe is required for displaying which timeframe the signal was generated on
    - Methods array allows displaying only the methodologies that were actually used
*/

-- Add timeframe column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'timeframe'
  ) THEN
    ALTER TABLE signals ADD COLUMN timeframe TEXT NOT NULL DEFAULT '15m';
  END IF;
END $$;

-- Add methods column (array of text)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'methods'
  ) THEN
    ALTER TABLE signals ADD COLUMN methods TEXT[] NOT NULL DEFAULT ARRAY['ict']::TEXT[];
  END IF;
END $$;
