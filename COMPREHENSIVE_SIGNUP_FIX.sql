-- =====================================================
-- COMPREHENSIVE SIGNUP FIX - Run in Supabase SQL Editor
-- =====================================================
-- This script diagnoses and fixes all signup issues
-- Run ONE statement at a time
-- =====================================================

-- STEP 1: Check current state (run this to see current issues)
SELECT '=== DIAGNOSIS ===' as step;
SELECT 'Current triggers:' as info;
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name ILIKE '%auth%user%' OR trigger_name = 'on_auth_user_created';

SELECT 'Current functions:' as info;
SELECT proname FROM pg_proc WHERE proname ILIKE '%handle%user%' OR proname ILIKE '%new%user%';

SELECT 'Tables check:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles', 'chat_settings');

-- STEP 2: Drop everything (run this to clean up)
SELECT '=== CLEANUP ===' as step;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.chat_settings;
DROP TABLE IF EXISTS public.user_roles;
DROP TABLE IF EXISTS public.profiles;
DROP TYPE IF EXISTS public.app_role;

-- STEP 3: Recreate the app_role type (run this)
SELECT '=== RECREATE TYPE ===' as step;
CREATE TYPE public.app_role AS ENUM ('student', 'lecturer', 'admin');

-- STEP 4: Recreate profiles table (run this)
SELECT '=== RECREATE PROFILES ===' as step;
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  student_id TEXT,
  preferred_campus_id TEXT,
  phone TEXT,
  program TEXT,
  year_of_study INTEGER,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- STEP 5: Recreate user_roles table (run this)
SELECT '=== RECREATE USER_ROLES ===' as step;
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- STEP 6: Recreate chat_settings table (run this)
SELECT '=== RECREATE CHAT_SETTINGS ===' as step;
CREATE TABLE IF NOT EXISTS public.chat_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temperature DECIMAL(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  system_prompt TEXT DEFAULT 'You are KCA Connect AI, an intelligent assistant for KCA University students, lecturers, and administrators.',
  enable_streaming BOOLEAN DEFAULT TRUE,
  show_suggestions BOOLEAN DEFAULT TRUE,
  enable_voice BOOLEAN DEFAULT FALSE,
  preferred_model TEXT DEFAULT 'google/gemini-2.5-flash',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- STEP 7: Enable RLS (run this)
SELECT '=== ENABLE RLS ===' as step;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create RLS Policies (run this)
SELECT '=== CREATE RLS POLICIES ===' as step;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own chat settings" ON public.chat_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own chat settings" ON public.chat_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert chat settings" ON public.chat_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- STEP 9: Create the trigger function (run this)
SELECT '=== CREATE TRIGGER FUNCTION ===' as step;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_campus_id TEXT;
BEGIN
  v_role := COALESCE((NEW.raw_app_meta_data->>'role')::TEXT, 'student');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_campus_id := NEW.raw_user_meta_data->>'campus_id';
  
  -- Create profile
  INSERT INTO public.profiles (id, full_name, student_id, preferred_campus_id)
  VALUES (
    NEW.id,
    COALESCE(v_full_name, 'User'),
    COALESCE(NEW.email, ''),
    v_campus_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    v_role::public.app_role
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create chat settings
  INSERT INTO public.chat_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 10: Create the trigger (run this)
SELECT '=== CREATE TRIGGER ===' as step;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 11: Grant permissions (run this)
SELECT '=== GRANT PERMISSIONS ===' as step;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated;

-- STEP 12: Verify (run this to confirm fix)
SELECT '=== VERIFICATION ===' as step;
SELECT 
  'SUCCESS: Trigger is active' as status,
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
LIMIT 1;

SELECT 
  'SUCCESS: Function exists' as status,
  proname as function_name
FROM pg_proc 
WHERE proname = 'handle_new_user'
LIMIT 1;

SELECT 
  'SUCCESS: Tables created' as status,
  table_name,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles', 'chat_settings')
ORDER BY table_name;

-- =====================================================
-- FIX COMPLETE!
-- =====================================================

-- STEP 13: IMPORTANT - Disable Edge Function
-- Go to Supabase Dashboard → Edge Functions
-- Disable or delete: handle-post-signup

-- STEP 14: Test signup at http://localhost:8080

