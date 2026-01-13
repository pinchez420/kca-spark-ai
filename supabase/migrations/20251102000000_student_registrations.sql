-- =====================================================
-- Student Registrations Table (Migration 3)
-- =====================================================
-- This migration creates a table to store valid student numbers
-- that can be verified during sign-up
-- =====================================================

-- Create student_registrations table
-- Contains valid student numbers that can register
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_registrations_student_id 
  ON public.student_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_student_registrations_is_active 
  ON public.student_registrations(is_active);

-- Enable RLS
ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can manage all registrations
CREATE POLICY "Admins can manage student registrations" ON public.student_registrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Everyone can view active registrations (for verification)
CREATE POLICY "Anyone can view active student registrations" ON public.student_registrations
  FOR SELECT USING (is_active = true);

-- Function to validate student number against registrations
CREATE OR REPLACE FUNCTION public.validate_student_registration(
  p_student_id VARCHAR(20)
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT,
  student_name TEXT,
  program TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE 
      WHEN sr.student_id IS NOT NULL AND sr.is_active THEN true
      ELSE false
    END AS is_valid,
    CASE 
      WHEN sr.student_id IS NULL THEN 'Student number not found in our records'
      WHEN NOT sr.is_active THEN 'Student number is no longer active'
      ELSE NULL
    END AS error_message,
    sr.full_name AS student_name,
    sr.program AS program
  FROM public.student_registrations sr
  WHERE sr.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed some sample student data (for testing)
-- In production, this would be populated from the registrar's database
INSERT INTO public.student_registrations (student_id, full_name, program, admission_year) VALUES
  ('2200001', 'John Doe', 'Bachelor of Science in Computer Science', 2022),
  ('2200002', 'Jane Smith', 'Bachelor of Business Administration', 2022),
  ('2200003', 'Alice Johnson', 'Bachelor of Science in Information Technology', 2023),
  ('2200004', 'Bob Williams', 'Bachelor of Arts in Economics', 2023),
  ('2200005', 'Carol Brown', 'Master of Business Administration', 2023)
ON CONFLICT (student_id) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.validate_student_registration(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_student_registration(VARCHAR) TO anon;

-- Add comment
COMMENT ON TABLE public.student_registrations IS 'Stores valid student numbers for sign-up verification';
