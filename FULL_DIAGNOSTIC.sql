-- =====================================================
-- COMPLETE SIGNUP DIAGNOSTIC
-- Run all queries one at a time to find the issue
-- =====================================================

-- Q1: Check if profiles table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'profiles'

-- Q2: Check if user_roles table exists  
SELECT table_name FROM information_schema.tables WHERE table_name = 'user_roles'

-- Q3: Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position

-- Q4: Check user_roles structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position

-- Q5: Check if handle_new_user function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user'

-- Q6: Check triggers on auth.users
SELECT trigger_name, event_manipulation FROM information_schema.triggers WHERE trigger_name LIKE '%auth%user%'

-- Q7: Check for orphaned profiles
SELECT COUNT(*) as orphaned_count FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id)

-- Q8: Check app_role enum exists
SELECT typname FROM pg_type WHERE typname = 'app_role'

-- Q9: Test function manually
SELECT public.handle_new_user()

-- Q10: Check recent auth errors (if any)
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5

