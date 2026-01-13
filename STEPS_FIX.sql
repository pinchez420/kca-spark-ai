-- =====================================================
-- COMPLETE RESET - Run ONE at a time
-- =====================================================

-- 1. FIRST: Run this query
SELECT 'STEP 1: Checking tables...' as status

-- 2. SECOND: Run this query
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users

-- 3. THIRD: Run this query  
DROP FUNCTION IF EXISTS public.handle_new_user()

-- 4. FOURTH: Run this query
DROP TABLE IF EXISTS public.profiles

-- 5. FIFTH: Run this query
DROP TABLE IF EXISTS public.user_roles

-- 6. SIXTH: Run this query
DROP TYPE IF EXISTS public.app_role

-- 7. SEVENTH: Run this query
CREATE TYPE public.app_role AS ENUM ('student', 'lecturer', 'admin')

-- 8. EIGHTH: Run this query
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  preferred_campus_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- 9. NINTH: Run this query
CREATE TABLE public.user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  UNIQUE(user_id)
)

-- 10. TENTH: Run this query
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY

-- 11. ELEVENTH: Run this query
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY

-- 12. TWELFTH: Run this query
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id)

-- 13. THIRTEENTH: Run this query
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id)

-- 14. FOURTEENTH: Run this query
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER

-- 15. FIFTEENTH: Run this query
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user()

-- 16. SIXTEENTH: Run this query
GRANT ALL ON public.profiles TO postgres, anon, authenticated

-- 17. SEVENTEENTH: Run this query
GRANT ALL ON public.user_roles TO postgres, anon, authenticated

-- 18. EIGHTEENTH: Run this query
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated

-- 19. NINETEENTH: Run this to verify
SELECT 'COMPLETE' as status, trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'

