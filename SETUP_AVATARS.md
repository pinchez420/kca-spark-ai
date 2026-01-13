# Avatar Storage Setup Guide

## Run this SQL in Supabase SQL Editor

```sql
-- 1. Add avatar_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies already exist, no need to create them again
```

## If you get "policy already exists" error:

Just run only the column addition:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

## After running the SQL:

1. Go to your Settings page in the app
2. Refresh the page
3. Click the camera icon on your avatar
4. Select an image to upload
