
-- Drop restrictive policies on saved_grade_cards
DROP POLICY IF EXISTS "Anyone can insert saved grade cards" ON public.saved_grade_cards;
DROP POLICY IF EXISTS "Anyone can read saved grade cards" ON public.saved_grade_cards;
DROP POLICY IF EXISTS "Anyone can update saved grade cards" ON public.saved_grade_cards;

-- Create permissive policies instead
CREATE POLICY "Anyone can insert saved grade cards"
  ON public.saved_grade_cards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read saved grade cards"
  ON public.saved_grade_cards FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update saved grade cards"
  ON public.saved_grade_cards FOR UPDATE
  USING (true);
