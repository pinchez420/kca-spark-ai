// Email validation utilities for KCA University student emails


/**
 * Regex pattern for valid KCA student email format:
 * 6 or 7-digit student number + @students.kcau.ac.ke
 */
export const STUDENT_EMAIL_PATTERN = /^[0-9]{6,7}@students\.kcau\.ac\.ke$/;

/**
 * Validates if an email follows the KCA student email format
 */
export const isValidStudentEmail = (email: string): boolean => {
  return STUDENT_EMAIL_PATTERN.test(email);
};

/**
 * Extracts student number from email
 */
export const extractStudentNumber = (email: string): string | null => {
  if (!isValidStudentEmail(email)) return null;
  return email.split('@')[0];
};

/**
 * Validates email format and provides user-friendly error messages
 */
export const validateStudentEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!isValidStudentEmail(email)) {
    return { 
      isValid: false, 
      error: 'Email must be in format: 2200000@students.kcau.ac.ke (6 or 7-digit student number)' 
    };
  }

  return { isValid: true };
};


/**
 * Validates password strength
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
};

/**
 * Validates if a student number is registered in the database
 * Uses the student_registrations table for verification
 */
export const validateStudentNumberExists = async (studentNumber: string): Promise<{ isValid: boolean; error?: string }> => {
  if (!studentNumber || !/^[0-9]{6,7}$/.test(studentNumber)) {
    return { isValid: false, error: 'Invalid student number format (6 or 7 digits required)' };
  }

  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Check if Supabase URL is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('undefined') || supabaseUrl.includes('your-project')) {
      console.log('Supabase not configured, skipping student verification');
      return { isValid: true };
    }
    
    // First, check if student_registrations table exists by trying to select from it
    // If it doesn't exist yet, we'll skip verification and allow sign-up
    const { data: tableCheck, error: tableError } = await supabase
      .from('student_registrations')
      .select('student_id')
      .limit(1)
      .catch((err) => {
        // If table doesn't exist or any DB error, skip verification
        console.log('Student registrations table not available:', err.message);
        return { data: null, error: err };
      });

    // If table doesn't exist (error code 42P01 is undefined_table), skip verification
    if (tableError) {
      console.log('Student registrations table not found, skipping verification');
      // For now, allow sign-up if table doesn't exist
      return { isValid: true };
    }

    // Table exists, proceed with verification
    const { data: regData, error: regError } = await supabase
      .from('student_registrations')
      .select('student_id, is_active')
      .eq('student_id', studentNumber)
      .maybeSingle();

    if (regError) {
      console.error('Error checking student registration:', regError);
      // On error, allow sign-up rather than blocking
      return { isValid: true };
    }

    if (!regData) {
      return { isValid: false, error: 'Student number not found in our records. Please contact the registrar.' };
    }

    if (regData.is_active === false) {
      return { isValid: false, error: 'Student number is no longer active. Please contact support.' };
    }

    return { isValid: true };
  } catch (error: any) {
    console.error('Error validating student number:', error);
    // On any error, allow sign-up rather than blocking
    // This prevents network errors from blocking registration
    return { isValid: true };
  }
};

