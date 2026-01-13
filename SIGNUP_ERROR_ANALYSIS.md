# Database Error - New User Signup - Analysis & Fix Plan

## Issue Summary
Database error when saving new user signup data to `profiles`, `user_roles`, and `chat_settings` tables after user registration in Supabase Auth.

---

## Root Cause Analysis

After reviewing the codebase, I've identified **multiple conflicting signup mechanisms** that are causing database errors:

### 1. **Conflicting Trigger Definitions**
The codebase has TWO migration files that both define `handle_new_user()` function:

- **Migration 20251101000000** (`ai_chat_tables.sql`): Creates `profiles`, `user_roles`, AND `chat_settings`
- **Migration 20251103000000** (`auth_triggers.sql`): Creates ONLY `profiles` and `user_roles` (missing `chat_settings`)

Both migrations drop and recreate the trigger `on_auth_user_created`, causing conflicts.

### 2. **Missing `chat_settings` Creation**
The `auth_triggers.sql` migration creates `profiles` and `user_roles` but does NOT create `chat_settings`. This causes errors when the application tries to access chat settings for new users.

### 3. **Edge Function vs Trigger Conflict**
There are TWO mechanisms handling new user signup:
- **Database Trigger** (`handle_new_user()` function)
- **Edge Function** (`handle-post-signup/index.ts`)

Having both can cause race conditions or duplicate key errors.

### 4. **Missing `app_role` Enum**
The trigger uses `v_role::public.app_role` which requires the enum to exist. If the enum type isn't properly created, this will fail.

---

## Files Involved

### Source Files (Working Correctly)
- `src/hooks/useAuth.ts` - Signup logic ✓
- `src/pages/Auth.tsx` - UI form ✓
- `src/lib/validation.ts` - Validation ✓

### Database Files (Needing Fixes)
- `supabase/migrations/20251103000000_auth_triggers.sql` - **INCOMPLETE**
- `supabase/functions/handle-post-signup/index.ts` - **MAY CONFLICT**
- `supabase/migrations/20251101000000_ai_chat_tables.sql` - **OVERWRITES trigger**

---

## Proposed Solution

### Option A: Use Database Trigger Only (Recommended)
This is the cleaner approach recommended in `DEBUG_SIGNUP.md`

1. **Fix the trigger** in `supabase/migrations/20251103000000_auth_triggers.sql`:
   - Add `chat_settings` creation
   - Remove trigger from `20251101000000_ai_chat_tables.sql` (keep table definitions)

2. **Disable the Edge Function**:
   - Delete or disable `supabase/functions/handle-post-signup/index.ts`

### Option B: Use Edge Function Only
1. Keep the Edge Function for user creation
2. Remove the database trigger entirely

---

## Implementation Plan

### Phase 1: Fix Database Trigger
**File**: `supabase/migrations/20251103000000_auth_triggers.sql`

Update the `handle_new_user()` function to include `chat_settings` creation:

```sql
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

  -- Create chat_settings entry (MISSING IN CURRENT MIGRATION!)
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
```

### Phase 2: Clean Up Migration 20251101000000
**File**: `supabase/migrations/20251101000000_ai_chat_tables.sql`

Remove the trigger re-creation step (keep table definitions):

```sql
-- REMOVE THESE LINES:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- ... (all trigger and function definitions at the end)
```

Keep ONLY the table creation and policies.

### Phase 3: Disable Edge Function
**File**: `supabase/functions/handle-post-signup/index.ts`

Rename to `.disabled` or delete the function.

---

## Alternative Quick Fix (Run in Supabase SQL Editor)

If you need a quick fix without modifying migration files, run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- =====================================================
-- QUICK FIX: Consolidate signup trigger
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create consolidated function with chat_settings
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
  INSERT INTO public.profiles (id, full_name, preferred_campus_id)
  VALUES (NEW.id, COALESCE(v_full_name, 'User'), v_campus_id)
  ON CONFLICT (id) DO NOTHING;

  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role::public.app_role)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create chat settings (THE MISSING PIECE!)
  INSERT INTO public.chat_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verify
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```

---

## Testing Checklist

After applying the fix:

1. ✅ Sign up a new user with email format: `2200001@students.kcau.ac.ke`
2. ✅ Check `auth.users` - user should exist
3. ✅ Check `public.profiles` - profile should be created
4. ✅ Check `public.user_roles` - role should be assigned
5. ✅ Check `public.chat_settings` - settings should exist
6. ✅ User should be able to start a chat in the dashboard

---

## Files to Modify

1. `supabase/migrations/20251103000000_auth_triggers.sql` - Add chat_settings
2. `supabase/migrations/20251101000000_ai_chat_tables.sql` - Remove trigger re-creation
3. `supabase/functions/handle-post-signup/index.ts` - Delete or disable

---

## Related Documentation

- `DEBUG_SIGNUP.md` - Debug guide (already has partial fix)
- `SIGNUP_DIAGNOSTIC.sql` - Diagnostic queries
- `src/hooks/useAuth.ts` - Frontend signup logic

