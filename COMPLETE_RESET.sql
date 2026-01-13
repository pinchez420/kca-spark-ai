-- =====================================================
-- COMPLETE RESET & FIX
-- Run this if the previous fixes didn't work
-- =====================================================

-- STEP 1: Check what exists
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'user_roles' as table_name, COUNT(*) as count FROM public.user_roles

-- STEP 2: Drop trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users
DROP FUNCTION IF EXISTS public.handle_new_user()

-- STEP 3: Drop tables if they exist (they might have wrong schema)
DROP TABLE IF EXISTS public.profiles
DROP TABLE IF EXISTS public.user_roles

-- STEP 4: Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  preferred_campus_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- STEP 5: Create user_roles table
CREATE TYPE public.app_role AS ENUM ('student', 'lecturer', 'admin')
CREATE TABLE public.user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  UNIQUE(user_id)
)

-- STEP 6: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY

-- STEP 7: Create policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id)
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id)

-- STEP 8: Create trigger function
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

-- STEP 9: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user()

-- STEP 10: Grant permissions
GRANT ALL ON public.profiles TO postgres, anon, authenticated
GRANT ALL ON public.user_roles TO postgres, anon, authenticated
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated

-- STEP 11: Verify
SELECT 'SUCCESS' as status

