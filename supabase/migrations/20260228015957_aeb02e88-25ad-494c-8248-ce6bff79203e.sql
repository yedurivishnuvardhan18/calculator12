
-- 1. Normalize existing roll numbers
UPDATE public.saved_grade_cards SET roll_number = UPPER(TRIM(roll_number));

-- 2. Remove duplicates after normalization (keep latest updated_at)
DELETE FROM public.saved_grade_cards a
USING public.saved_grade_cards b
WHERE a.roll_number = b.roll_number
  AND a.updated_at < b.updated_at;

-- 3. Drop expression index if it exists
DROP INDEX IF EXISTS public.idx_saved_grade_cards_roll;

-- 4. Create plain unique index on roll_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_grade_cards_roll_unique ON public.saved_grade_cards (roll_number);
