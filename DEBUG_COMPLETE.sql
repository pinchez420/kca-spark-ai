-- =====================================================
-- COMPLETE DEBUG & FIX FOR SIGNUP ERROR
-- Run each query ONE AT A TIME and report results
-- =====================================================

-- STEP 1: Check if tables exist
SELECT 'STEP 1: Checking tables...' as step;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles', 'chat_settings')
ORDER BY table_name;

-- STEP 2: Check if handle_new_user function exists
SELECT 'STEP 2: Checking function...' as step;
SELECT 
  CASE WHEN COUNT(*) > 0 THEN 'FUNCTION EXISTS' ELSE 'FUNCTION MISSING' END as status,
  proname as function_name
FROM pg_proc 
WHERE proname = 'handle_new_user'
GROUP BY proname;

-- STEP 3: Check if trigger exists
SELECT 'STEP 3: Checking trigger...' as step;
SELECT 
  CASE WHEN COUNT(*) > 0 THEN 'TRIGGER EXISTS' ELSE 'TRIGGER MISSING' END as status,
  trigger_name
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
GROUP BY trigger_name;

-- STEP 4: Check app_role enum
SELECT 'STEP 4: Checking enum type...' as step;
SELECT 
  CASE WHEN COUNT(*) > 0 THEN 'ENUM EXISTS' ELSE 'ENUM MISSING' END as status,
  typname as type_name
FROM pg_type 
WHERE typname = 'app_role'
GROUP BY typname;

-- STEP 5: Check RLS policies
SELECT 'STEP 5: Checking RLS policies...' as step;
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('profiles', 'user_roles', 'chat_settings');

-- STEP 6: Check for any existing users
SELECT 'STEP 6: Checking existing users...' as step;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 3;

-- STEP 7: Check profiles for orphaned records
SELECT 'STEP 7: Checking for orphaned profiles...' as step;
SELECT 
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'WARNING: Orphaned profiles exist'
    ELSE 'OK: No orphaned profiles'
  END as status
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);

-- =====================================================
-- NOW RUN THE FIX (if any issues found above)
-- =====================================================

-- FIX PART 1: Drop existing trigger and function
SELECT 'FIX PART 1: Cleaning up...' as step;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- FIX PART 2: Create the function
SELECT 'FIX PART 2: Creating function...' as step;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, student_id, preferred_campus_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'campus_id'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_app_meta_data->>'role')::text, 'student')::public.app_role
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.chat_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FIX PART 3: Create the trigger
SELECT 'FIX PART 3: Creating trigger...' as step;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- FIX PART 4: Grant permissions
SELECT 'FIX PART 4: Granting permissions...' as step;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated;

-- VERIFY
SELECT '=== VERIFICATION ===' as step;
SELECT 'Function:' as type, 
  (SELECT proname FROM pg_proc WHERE proname = 'handle_new_user') as result
UNION ALL
SELECT 'Trigger:',
  (SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
UNION ALL
SELECT 'Tables:',
  (SELECT string_agg(table_name, ', ') FROM information_schema.tables WHERE table_schema = 'public' 
   AND table_name IN ('profiles', 'user_roles', 'chat_settings'));

-- =====================================================
-- IF YOU SEE ANY "NULL" IN VERIFICATION ABOVE,
-- THERE IS STILL AN ISSUE
-- =====================================================

-- REPORT RESULTS:
-- Copy and paste the output of all queries above
-- and share them to get further help.

