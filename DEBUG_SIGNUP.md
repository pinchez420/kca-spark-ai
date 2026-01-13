# Signup Debug Guide

## Quick Fix (Do This First)

Run this SQL in your Supabase Dashboard → SQL Editor:

```sql
-- Clean up and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_role TEXT;
  v_campus_id TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_role := COALESCE((NEW.raw_app_meta_data->>'role')::TEXT, 'student');
  v_campus_id := NEW.raw_user_meta_data->>'campus_id';

  INSERT INTO public.profiles (id, full_name, preferred_campus_id)
  VALUES (NEW.id, COALESCE(v_full_name, 'User'), v_campus_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role::public.app_role)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.chat_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

Then disable the Edge Function:
- Supabase Dashboard → Edge Functions → Disable `handle-post-signup`

## If Still Failing - Check These Supabase Settings

### 1. Authentication → Providers → Email
Ensure "Enable email provider" is ON

### 2. Authentication → Configuration
- Check if "Enable email confirmation" is set appropriately
- Check "Minimum password length" (default is 8)

### 3. Authentication → URL Configuration
- Site URL: `http://localhost:8080` (for local dev)
- Redirect URLs: Add `http://localhost:8080/dashboard`

### 4. Database → RLS Policies
Check that no overly restrictive policies exist on `auth.users`

## Test Credentials
Use: `2200001@students.kcau.ac.ke` (exists in seed data)

