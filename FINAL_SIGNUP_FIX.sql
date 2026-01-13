-- =====================================================
-- FINAL SIGNUP FIX - Complete Solution
-- =====================================================

-- SECTION A: Clean up everything
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_chat_settings() CASCADE;
DROP FUNCTION IF EXISTS public.update_chat_settings(numeric,integer,text,boolean,boolean,boolean,text) CASCADE;
DROP TABLE IF EXISTS public.chat_settings CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- SECTION B: Create all tables and types
CREATE TYPE public.app_role AS ENUM ('student', 'lecturer', 'admin');

-- Create student_registrations table (if not exists)
CREATE TABLE IF NOT EXISTS public.student_registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  program VARCHAR(255),
  admission_year INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  student_id TEXT,
  preferred_campus_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temperature DECIMAL(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  system_prompt TEXT DEFAULT 'You are KCA Connect AI',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- SECTION C: Enable RLS and create policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own chat settings" ON public.chat_settings FOR SELECT USING (auth.uid() = user_id);

-- SECTION D: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, student_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_app_meta_data->>'role')::text, 'student')::public.app_role)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.chat_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECTION E: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- SECTION F: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated;

-- SECTION G: Seed test student data
INSERT INTO public.student_registrations (student_id, full_name, program) VALUES
  ('2200001', 'John Doe', 'Computer Science'),
  ('2200002', 'Jane Smith', 'Business'),
  ('2200003', 'Alice Johnson', 'IT'),
  ('2200004', 'Bob Williams', 'Economics'),
  ('2200005', 'Carol Brown', 'MBA')
ON CONFLICT (student_id) DO NOTHING;

-- SECTION H: Verification
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
SELECT COUNT(*) as students FROM public.student_registrations;

