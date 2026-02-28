CREATE TABLE public.saved_grade_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roll_number TEXT NOT NULL,
  courses JSONB NOT NULL,
  show_cgpa BOOLEAN NOT NULL DEFAULT false,
  cgpa_data JSONB,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on roll_number (case-insensitive)
CREATE UNIQUE INDEX idx_saved_grade_cards_roll ON public.saved_grade_cards (UPPER(roll_number));

-- Allow public read/write (no auth needed for this feature)
ALTER TABLE public.saved_grade_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read saved grade cards" ON public.saved_grade_cards FOR SELECT USING (true);
CREATE POLICY "Anyone can insert saved grade cards" ON public.saved_grade_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update saved grade cards" ON public.saved_grade_cards FOR UPDATE USING (true);