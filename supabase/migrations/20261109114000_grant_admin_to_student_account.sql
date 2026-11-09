DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id
  INTO admin_user_id
  FROM auth.users
  WHERE email = '2023001543@habittracker.app';

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Create the Supabase Auth user 2023001543@habittracker.app before applying this migration';
  END IF;

  INSERT INTO public.admin_users (user_id)
  VALUES (admin_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END
$$;
