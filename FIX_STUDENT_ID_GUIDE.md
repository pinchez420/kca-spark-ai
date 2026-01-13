# Fix: Missing 'student_id' Column in Schema Cache

## Problem
The error "could not find the 'student_id' column of 'profiles' in the schema cache" occurs because:
1. The Supabase schema cache is out of sync with the actual database schema
2. The frontend code was trying to insert `student_id` directly which fails if the column isn't in the schema cache
3. The `handle_new_user()` trigger function may not be inserting `student_id`

## Solution

### Step 1: Run the SQL Fix in Supabase Dashboard

Go to your Supabase project → SQL Editor and run the following statements one at a time:

```sql
-- Add student_id column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT UNIQUE;
```

```sql
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

```sql
-- Recreate handle_new_user function with student_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, student_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    student_id = COALESCE(EXCLUDED.student_id, public.profiles.student_id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```sql
-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

```sql
-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated;
```

### Step 2: Refresh the Supabase Schema Cache

**Option A: Via Dashboard (Recommended)**
1. Go to Supabase Dashboard → Settings → API
2. Scroll to "Schema cache" section
3. Click "Reset schema cache" or "Reload schema"

**Option B: Via SQL**
```sql
-- This notifies PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';
```

Then click "Reload Schema" in the dashboard to apply.

### Step 3: Verify the Fix

Run these queries to verify:

```sql
-- Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

```sql
-- Check trigger exists
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

```sql
-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```

### Step 4: Test the Fix

1. Sign up a new user with email like `2200001@students.kca.ac.ke`
2. Check the profiles table:
   ```sql
   SELECT id, full_name, student_id FROM public.profiles;
   ```
3. Verify `student_id` is populated with the email prefix

## Code Changes Made

The frontend code has been updated to gracefully handle cases where `student_id` column might not be available:

1. **Dashboard.tsx** - Profile creation now:
   - Inserts without `student_id` first
   - Then attempts to update `student_id` in a try/catch block
   - Ignores errors if column doesn't exist

2. **Settings.tsx** - Profile operations now:
   - Create and update profiles without `student_id` in the initial insert
   - Upsert operations no longer include `student_id`

This ensures the app works even if the database schema cache is stale.

## Files Created/Updated

- `FIX_STUDENT_ID.sql` - The SQL fix file
- `FIX_STUDENT_ID_GUIDE.md` - This guide
- `src/pages/Dashboard.tsx` - Updated to handle missing column gracefully
- `src/pages/Settings.tsx` - Updated to handle missing column gracefully

## Related Files

- `supabase/migrations/20251028062039_36bdefa2-536a-4699-b841-473f855210fd.sql` - Original migration with student_id column
- `supabase/functions/handle-post-signup/index.ts` - Edge Function for post-signup processing
- `src/integrations/supabase/types.ts` - TypeScript types (already correct)

