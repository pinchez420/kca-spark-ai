-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================
-- CORE USER TABLES
-- =======================

-- Campuses
CREATE TABLE public.campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default campuses
INSERT INTO public.campuses (name, code, address) VALUES
('Main Campus', 'MAIN', 'Main Campus, Nairobi'),
('Town Campus', 'TOWN', 'Town Campus, Nairobi CBD'),
('Kitengela Campus', 'KITENGELA', 'Kitengela Campus');

-- User Profiles (additional info beyond auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  student_id TEXT UNIQUE,
  program TEXT,
  year_of_study INTEGER,
  preferred_campus_id UUID REFERENCES public.campuses(id),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles (CRITICAL: Separate table for security)
CREATE TYPE public.app_role AS ENUM ('student', 'lecturer', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Function to check user role (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =======================
-- AI CHAT SYSTEM
-- =======================

-- Chat Sessions
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =======================
-- ACADEMIC DATA
-- =======================

-- Units/Courses
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER DEFAULT 3,
  program TEXT,
  year INTEGER,
  semester INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Timetable
CREATE TABLE public.timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES public.campuses(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  lecturer_name TEXT,
  program TEXT,
  year INTEGER,
  semester INTEGER,
  academic_year TEXT,
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exam Schedules
CREATE TABLE public.exam_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES public.campuses(id),
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue TEXT NOT NULL,
  exam_type TEXT CHECK (exam_type IN ('midterm', 'final', 'special')),
  instructions TEXT,
  academic_year TEXT,
  semester INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =======================
-- FINANCIAL DATA
-- =======================

-- Fee Structures
CREATE TABLE public.fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program TEXT NOT NULL,
  year INTEGER NOT NULL,
  semester INTEGER,
  tuition_fee DECIMAL(10,2) NOT NULL,
  activity_fee DECIMAL(10,2) DEFAULT 0,
  facility_fee DECIMAL(10,2) DEFAULT 0,
  total_fee DECIMAL(10,2) NOT NULL,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program, year, semester, academic_year)
);

-- Student Fee Status (individual tracking)
CREATE TABLE public.student_fee_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  total_fee DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) NOT NULL,
  payment_deadline DATE,
  status TEXT CHECK (status IN ('paid', 'partial', 'unpaid', 'overdue')) DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, academic_year, semester)
);

-- =======================
-- NOTIFICATIONS & ANNOUNCEMENTS
-- =======================

CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('academic', 'administrative', 'emergency', 'social')) DEFAULT 'general',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  target_role public.app_role,
  target_campus_id UUID REFERENCES public.campuses(id),
  target_program TEXT,
  target_year INTEGER,
  created_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Notification Read Status
CREATE TABLE public.user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- =======================
-- ROW LEVEL SECURITY (RLS)
-- =======================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles policies (read-only for users)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Chat sessions policies
CREATE POLICY "Users can view their own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
  ON public.chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions"
  ON public.chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view messages in their sessions"
  ON public.chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chat_sessions
    WHERE id = chat_messages.session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages in their sessions"
  ON public.chat_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_sessions
    WHERE id = chat_messages.session_id AND user_id = auth.uid()
  ));

-- Academic data (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view campuses"
  ON public.campuses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view units"
  ON public.units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view timetables"
  ON public.timetable FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view exam schedules"
  ON public.exam_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view fee structures"
  ON public.fee_structures FOR SELECT
  TO authenticated
  USING (true);

-- Fee status policies (users can only see their own)
CREATE POLICY "Users can view their own fee status"
  ON public.student_fee_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all fee statuses"
  ON public.student_fee_status FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Announcements policies
CREATE POLICY "Authenticated users can view active announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Lecturers and admins can create announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'lecturer') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Creators can update their announcements"
  ON public.announcements FOR UPDATE
  USING (auth.uid() = created_by);

-- User notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification reads"
  ON public.user_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification reads"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- =======================
-- TRIGGERS & FUNCTIONS
-- =======================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_fee_status_updated_at
  BEFORE UPDATE ON public.student_fee_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  
  -- Assign default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =======================
-- INDEXES FOR PERFORMANCE
-- =======================

CREATE INDEX idx_profiles_user_id ON public.profiles(id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_timetable_campus_id ON public.timetable(campus_id);
CREATE INDEX idx_exam_schedules_campus_id ON public.exam_schedules(campus_id);
CREATE INDEX idx_student_fee_status_user_id ON public.student_fee_status(user_id);
CREATE INDEX idx_announcements_published_at ON public.announcements(published_at);
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);