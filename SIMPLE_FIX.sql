-- Copy ONE line at a time and run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users
DROP FUNCTION IF EXISTS public.handle_new_user()
DROP TABLE IF EXISTS public.profiles
DROP TABLE IF EXISTS public.user_roles
DROP TYPE IF EXISTS public.app_role
CREATE TYPE public.app_role AS ENUM ('student','lecturer','admin')
CREATE TABLE public.profiles (id UUID REFERENCES auth.users(id) ON DELETE CASCADE, full_name TEXT NOT NULL)
CREATE TABLE public.user_roles (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role DEFAULT 'student', UNIQUE(user_id))
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY
CREATE POLICY p1 ON public.profiles FOR SELECT USING (auth.uid() = id)
CREATE POLICY p2 ON public.user_roles FOR SELECT USING (auth.uid() = user_id)
CREATE FUNCTION handle_new_user() RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)); INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student'); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, anon, authenticated
SELECT 'DONE' as status, (SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') as trigger

