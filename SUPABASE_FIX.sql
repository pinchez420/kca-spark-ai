-- =====================================================
-- SUPABASE SIGNUP FIX
-- Copy and run ONE statement at a time
-- =====================================================

-- COPY THIS FIRST STATEMENT AND RUN:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users

-- COPY THIS SECOND STATEMENT AND RUN:
DROP FUNCTION IF EXISTS public.handle_new_user()

-- COPY THIS THIRD STATEMENT AND RUN:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER

-- COPY THIS FOURTH STATEMENT AND RUN:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user()

-- COPY THIS FIFTH STATEMENT AND RUN:
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated

-- COPY THIS TO VERIFY:
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created'

