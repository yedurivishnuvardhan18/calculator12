
-- Create admin_users table
CREATE TABLE public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can see admin list
CREATE POLICY "Admins can view admin_users"
ON public.admin_users FOR SELECT TO authenticated
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = _user_id
  )
$$;

-- ========== BRANCHES ==========
DROP POLICY IF EXISTS "Authenticated insert branches" ON public.branches;
DROP POLICY IF EXISTS "Authenticated update branches" ON public.branches;
DROP POLICY IF EXISTS "Authenticated delete branches" ON public.branches;

CREATE POLICY "Admin insert branches" ON public.branches FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin update branches" ON public.branches FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin delete branches" ON public.branches FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- ========== SUBJECTS ==========
DROP POLICY IF EXISTS "Authenticated insert subjects" ON public.subjects;
DROP POLICY IF EXISTS "Authenticated update subjects" ON public.subjects;
DROP POLICY IF EXISTS "Authenticated delete subjects" ON public.subjects;

CREATE POLICY "Admin insert subjects" ON public.subjects FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin update subjects" ON public.subjects FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin delete subjects" ON public.subjects FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- ========== MODULES ==========
DROP POLICY IF EXISTS "Authenticated insert modules" ON public.modules;
DROP POLICY IF EXISTS "Authenticated update modules" ON public.modules;
DROP POLICY IF EXISTS "Authenticated delete modules" ON public.modules;

CREATE POLICY "Admin insert modules" ON public.modules FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin update modules" ON public.modules FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin delete modules" ON public.modules FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- ========== TOPICS ==========
DROP POLICY IF EXISTS "Authenticated insert topics" ON public.topics;
DROP POLICY IF EXISTS "Authenticated update topics" ON public.topics;
DROP POLICY IF EXISTS "Authenticated delete topics" ON public.topics;

CREATE POLICY "Admin insert topics" ON public.topics FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin update topics" ON public.topics FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin delete topics" ON public.topics FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- ========== VIDEOS ==========
DROP POLICY IF EXISTS "Authenticated insert videos" ON public.videos;
DROP POLICY IF EXISTS "Authenticated update videos" ON public.videos;
DROP POLICY IF EXISTS "Authenticated delete videos" ON public.videos;

CREATE POLICY "Admin insert videos" ON public.videos FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin update videos" ON public.videos FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin delete videos" ON public.videos FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- ========== SEMESTERS ==========
DROP POLICY IF EXISTS "Authenticated insert semesters" ON public.semesters;
DROP POLICY IF EXISTS "Authenticated delete semesters" ON public.semesters;

CREATE POLICY "Admin insert semesters" ON public.semesters FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin delete semesters" ON public.semesters FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));
