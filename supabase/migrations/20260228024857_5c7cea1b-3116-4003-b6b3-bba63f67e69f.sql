
-- Drop existing RESTRICTIVE policies
DROP POLICY IF EXISTS "Anyone can insert saved grade cards" ON public.saved_grade_cards;
DROP POLICY IF EXISTS "Anyone can read saved grade cards" ON public.saved_grade_cards;
DROP POLICY IF EXISTS "Anyone can update saved grade cards" ON public.saved_grade_cards;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Anyone can insert saved grade cards" ON public.saved_grade_cards FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read saved grade cards" ON public.saved_grade_cards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update saved grade cards" ON public.saved_grade_cards FOR UPDATE TO anon, authenticated USING (true);
