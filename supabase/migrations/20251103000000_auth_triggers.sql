-- =====================================================
-- Auth Triggers Migration (Migration 4)
-- =====================================================
-- This migration creates automatic profile and role creation
-- after user signs up in Supabase Auth
-- =====================================================

-- =====================================================
-- Function: Handle New User Signup
-- =====================================================
-- This function creates a profile and user_roles entry
-- whenever a new user is created in auth.users
-- Uses SECURITY DEFINER to run with elevated privileges
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_full_name text;
  v_campus_id text;
BEGIN
  -- Extract metadata from the new user
  v_role := COALESCE((NEW.raw_app_meta_data->>'role')::text, 'student');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_campus_id := NEW.raw_user_meta_data->>'campus_id';

  -- Create profile entry using direct SQL with current_setting
  PERFORM set_config('app.current_user_id', NEW.id::text, true);
  
  INSERT INTO public.profiles (id, full_name, student_id, preferred_campus_id, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(v_full_name, 'User'),
    COALESCE(NEW.email, ''),
    v_campus_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create user_roles entry
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (
    NEW.id,
    v_role::public.app_role,
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Create chat_settings entry (required for chat functionality)
  INSERT INTO public.chat_settings (user_id, temperature, max_tokens, system_prompt)
  VALUES (
    NEW.id,
    0.7,
    1000,
    'You are KCA Connect AI, an intelligent assistant for KCA University students, lecturers, and administrators.'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Trigger: Create Profile and Roles on Signup
-- =====================================================
-- This trigger fires AFTER a new user is inserted into auth.users
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- RLS Policies for profiles table
-- =====================================================
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile  
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow anyone to view profiles (for social features)
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

-- =====================================================
-- RLS Policies for user_roles table
-- =====================================================
-- Allow users to view their own role
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- Function: Update Profile Timestamp
-- =====================================================
-- Updates the updated_at timestamp when profile is modified
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_profile_update() TO postgres, anon, authenticated;

-- Add comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile and user_roles entries when a new user signs up';
COMMENT ON FUNCTION public.handle_profile_update() IS 'Updates the updated_at timestamp on profile changes';

-- =====================================================
-- Seed Test Data (Optional - for development)
-- =====================================================
-- The student_registrations table should already have test data
-- from migration 20251102000000_student_registrations.sql
-- =====================================================

-- Verify existing student registrations (for reference)
SELECT student_id, full_name, program, is_active 
FROM public.student_registrations 
ORDER BY student_id
LIMIT 10;

