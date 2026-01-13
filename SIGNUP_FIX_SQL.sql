-- =====================================================
-- SIGNUP ERROR FIX - Run in Supabase SQL Editor
-- =====================================================
-- This script fixes the database error when saving new user signup
-- It consolidates the trigger function and ensures all tables are populated
-- =====================================================

-- STEP 1: Drop existing conflicting trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- STEP 2: Create consolidated trigger function with chat_settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_campus_id TEXT;
BEGIN
  -- Extract metadata from the new user
  v_role := COALESCE((NEW.raw_app_meta_data->>'role')::TEXT, 'student');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_campus_id := NEW.raw_user_meta_data->>'campus_id';

  -- Create profile entry
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

  -- Create chat_settings entry (THE MISSING PIECE!)
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

-- STEP 3: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Verify the fix
SELECT 
  'Function created' as status,
  proname as function_name
FROM pg_proc 
WHERE proname = 'handle_new_user'
LIMIT 1;

SELECT 
  'Trigger active' as status,
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
LIMIT 1;

-- STEP 5: Check chat_settings table exists
SELECT 
  'chat_settings table OK' as status,
  COUNT(*) as record_count
FROM public.chat_settings
LIMIT 1;

-- =====================================================
-- SUCCESS! The signup trigger is now fixed.
-- New users will automatically have:
-- - Profile created
-- - User role assigned
-- - Chat settings configured
-- =====================================================

