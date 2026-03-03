
-- Branches table
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Authenticated insert branches" ON public.branches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update branches" ON public.branches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete branches" ON public.branches FOR DELETE TO authenticated USING (true);

-- Semesters table
CREATE TABLE public.semesters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number >= 1 AND number <= 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(branch_id, number)
);
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read semesters" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Authenticated insert semesters" ON public.semesters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated delete semesters" ON public.semesters FOR DELETE TO authenticated USING (true);

-- Subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Authenticated insert subjects" ON public.subjects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update subjects" ON public.subjects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete subjects" ON public.subjects FOR DELETE TO authenticated USING (true);

-- Modules table
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  module_number INTEGER NOT NULL CHECK (module_number >= 1 AND module_number <= 5),
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subject_id, module_number)
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read modules" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Authenticated insert modules" ON public.modules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update modules" ON public.modules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete modules" ON public.modules FOR DELETE TO authenticated USING (true);

-- Topics table
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Authenticated insert topics" ON public.topics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update topics" ON public.topics FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete topics" ON public.topics FOR DELETE TO authenticated USING (true);

-- Videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Authenticated insert videos" ON public.videos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update videos" ON public.videos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete videos" ON public.videos FOR DELETE TO authenticated USING (true);

-- Trigger: auto-create 8 semesters when a branch is created
CREATE OR REPLACE FUNCTION public.auto_create_semesters()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.semesters (branch_id, number)
  SELECT NEW.id, generate_series(1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_create_semesters
AFTER INSERT ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_semesters();

-- Trigger: auto-create 5 modules when a subject is created
CREATE OR REPLACE FUNCTION public.auto_create_modules()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.modules (subject_id, module_number, title)
  SELECT NEW.id, n, 'Module ' || n
  FROM generate_series(1, 5) AS n;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_create_modules
AFTER INSERT ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_modules();
