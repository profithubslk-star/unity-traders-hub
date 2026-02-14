/*
  # Fix TP Percentage Data Types

  1. Changes
    - Change tp1_percentage, tp2_percentage, tp3_percentage from integer to decimal(10,2)
    - This allows storing decimal percentages like 2.7%, 3.5%, etc.
  
  2. Reasoning
    - Trading requires precise percentage tracking
    - Decimal values provide better accuracy for take profit calculations
*/

DO $$
BEGIN
  -- Change tp1_percentage to decimal
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' 
    AND column_name = 'tp1_percentage'
    AND data_type = 'integer'
  ) THEN
    ALTER TABLE signals ALTER COLUMN tp1_percentage TYPE decimal(10,2);
  END IF;

  -- Change tp2_percentage to decimal
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' 
    AND column_name = 'tp2_percentage'
    AND data_type = 'integer'
  ) THEN
    ALTER TABLE signals ALTER COLUMN tp2_percentage TYPE decimal(10,2);
  END IF;

  -- Change tp3_percentage to decimal
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' 
    AND column_name = 'tp3_percentage'
    AND data_type = 'integer'
  ) THEN
    ALTER TABLE signals ALTER COLUMN tp3_percentage TYPE decimal(10,2);
  END IF;
END $$;