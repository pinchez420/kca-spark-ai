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
 * Validates if a student number exists in the database
 */

export const validateStudentNumberExists = async (studentNumber: string): Promise<{ isValid: boolean; error?: string }> => {
  if (!studentNumber || !/^[0-9]{6,7}$/.test(studentNumber)) {
    return { isValid: false, error: 'Invalid student number format (6 or 7 digits required)' };
  }

  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('student_id', studentNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { isValid: false, error: 'Student number not found in our records' };
      }
      return { isValid: false, error: 'Unable to verify student number' };
    }

    if (!data) {
      return { isValid: false, error: 'Student number not found in our records' };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating student number:', error);
    return { isValid: false, error: 'Unable to verify student number' };
  }
};
