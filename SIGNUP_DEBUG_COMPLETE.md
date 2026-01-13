# KCA Spark AI - Signup Error Debug Complete

## Files Created

I've created three diagnostic files in your project root:

1. **`SUPABASE_FIX.sql`** - Immediate fix to run in Supabase SQL Editor
2. **`SIGNUP_DIAGNOSTIC.sql`** - Diagnostic queries to identify the issue
3. **`DEBUG_SIGNUP.md`** - Step-by-step debugging guide

## Immediate Steps (Do This Now)

### Step 1: Run SQL Fix in Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `SUPABASE_FIX.sql`
3. Click "Run" 
4. You should see "Success - no rows returned" or similar

### Step 2: Disable Edge Function

1. Go to Supabase Dashboard → Edge Functions
2. Find `handle-post-signup`
3. Click "Disable" (the toggle switch)

### Step 3: Clear Browser Cache

1. Clear all cookies for localhost
2. Clear site data
3. Hard refresh: `Ctrl+Shift+R`

### Step 4: Test Signup

Try signing up with: `2200001@students.kcau.ac.ke`

## If Still Not Working

Run the diagnostic queries:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste `SIGNUP_DIAGNOSTIC.sql`
3. Run the first 5 queries (1-5)
4. Share the results with me

## What Was The Problem?

The signup error "database error saving new user" is caused by:

1. **Conflicting Triggers**: 3 different migration files created conflicting `handle_new_user()` functions
2. **Edge Function Conflict**: The Edge Function and database trigger both tried to create profiles simultaneously
3. **RLS Policy Issues**: Row Level Security may have been blocking the trigger from inserting

## The Fix

The SQL in `SUPABASE_FIX.sql` does the following:

1. Drops the broken trigger
2. Recreates `handle_new_user()` with SECURITY DEFINER
3. Properly creates:
   - Profile record
   - User role record  
   - Chat settings record
4. Grants proper permissions

## Supabase Settings to Verify

After running the fix, check these settings:

1. **Authentication → Providers → Email**: ON
2. **Authentication → URL Configuration**: 
   - Site URL: `http://localhost:8080`
   - Redirect URLs: `http://localhost:8080/dashboard`
3. **Authentication → Configuration**: Password min length = 8

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "duplicate key value violates unique constraint" | Profile already exists - use DO NOTHING |
| "function handle_new_user() does not exist" | Run the SQL fix again |
| "permission denied for table profiles" | Check RLS policies |
| "trigger already exists" | Drop trigger first before recreating |

## Next Steps

After running the fix:

1. Try signing up with a new email
2. Check Supabase Dashboard → Authentication → Users
3. You should see the new user
4. Check `public.profiles` table for the profile entry
5. Check `public.user_roles` table for the role entry

