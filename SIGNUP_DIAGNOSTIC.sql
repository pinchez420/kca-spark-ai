-- =====================================================
-- SUPABASE SIGNUP DIAGNOSTIC QUERIES
-- Run these in Supabase SQL Editor
-- =====================================================

-- Query 1: Check if handle_new_user function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user'

-- Query 2: Check triggers on auth.users
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'

-- Query 3: Check profiles table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position

-- Query 4: Check RLS policies on profiles
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'profiles'

-- Query 5: Check if app_role type exists
SELECT typname FROM pg_type WHERE typname = 'app_role'

-- Query 6: Check recent signups
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5

