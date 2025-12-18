# Email Format Validation Implementation Plan

## Objective
Implement email format validation to enforce: `220000@students.kcau.ac.ke` (6-digit student number + @students.kcau.ac.ke)

## Tasks

### 1. Database Schema Updates
- [ ] Check current student table structure
- [ ] Ensure student numbers are stored as 6-digit strings
- [ ] Create database function to validate student numbers



### 2. Email Validation Logic
- [x] Create email validation utility function
- [x] Implement regex pattern: `^[0-9]{6}@students\.kcau\.ac\.ke$`
- [x] Create student number validation function (check if exists in database)


### 3. Auth Component Updates
- [x] Add email validation to login form
- [x] Add email validation to registration form
- [x] Update placeholders to reflect new format
- [x] Add real-time validation feedback
- [x] Update validation error messages

### 4. UI/UX Improvements
- [x] Add visual feedback for valid/invalid email format
- [x] Update help text and labels
- [x] Ensure validation works on form submission


### 5. Testing
- [x] Test with valid student emails
- [x] Test with invalid formats
- [x] Test with non-existent student numbers
- [x] Verify error messages are clear

## Technical Details
- Email format: `[6-digit-number]@students.kcau.ac.ke`
- Apply to: All user types (students, lecturers, admins)
- Validation: Both format AND database existence check
- User experience: Real-time validation with visual feedback
