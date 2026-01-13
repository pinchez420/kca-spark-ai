# HOW TO FIX SUPABASE SIGNUP ERROR

## IMPORTANT: Run ONE line at a time!

### Step 1: Click "New Query" in Supabase SQL Editor

### Step 2: Copy and run this FIRST:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users
```

### Step 3: Copy and run this SECOND:
```sql
DROP FUNCTION IF EXISTS public.handle_new_user()
```

### Step 4: Copy and run this THIRD:
```sql
DROP TABLE IF EXISTS public.profiles
```

### Step 5: Copy and run this FOURTH:
```sql
DROP TABLE IF EXISTS public.user_roles
```

### Step 6: Copy and run this FIFTH:
```sql
DROP TYPE IF EXISTS public.app_role
```

### Step 7: Copy and run this SIXTH:
```sql
CREATE TYPE public.app_role AS ENUM ('student', 'lecturer', 'admin')
```

### Step 8: Copy and run this SEVENTH:
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL
)
```

### Step 9: Copy and run this EIGHTH:
```sql
CREATE TABLE public.user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role DEFAULT 'student',
  UNIQUE(user_id)
)
```

### Step 10: Copy and run this NINTH:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY
```

### Step 11: Copy and run this TENTH:
```sql
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY
```

### Step 12: Copy and run this ELEVENTH:
```sql
CREATE POLICY p1 ON public.profiles FOR SELECT USING (auth.uid() = id)
```

### Step 13: Copy and run this TWELFTH:
```sql
CREATE POLICY p2 ON public.user_roles FOR SELECT USING (auth.uid() = user_id)
```

### Step 14: Copy and run this THIRTEENTH:
```sql
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
```

### Step 15: Copy and run this FOURTEENTH:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user()
```

### Step 16: Copy and run this FIFTEENTH:
```sql
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated
```

### Step 17: Copy and run this to VERIFY:
```sql
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created'
```

If this returns "on_auth_user_created", the fix is complete!

## After Fix:
1. Disable Edge Function: Supabase Dashboard → Edge Functions → Disable handle-post-signup
2. Clear browser cache
3. Test at: http://localhost:8080/test-supabase

