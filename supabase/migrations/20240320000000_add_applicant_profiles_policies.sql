-- Enable RLS on applicant_profiles table
ALTER TABLE applicant_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own profile" ON applicant_profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON applicant_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON applicant_profiles;
DROP POLICY IF EXISTS "Employers can read applicant profiles for job applications" ON applicant_profiles;
DROP POLICY IF EXISTS "Recruiters can read applicant profiles for job applications" ON applicant_profiles;

-- Policy to allow users to create their own profile
CREATE POLICY "Users can create their own profile"
ON applicant_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to read their own profile
CREATE POLICY "Users can read their own profile"
ON applicant_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON applicant_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow employers to read applicant profiles for their jobs
CREATE POLICY "Employers can read applicant profiles for job applications"
ON applicant_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employer_profiles
    WHERE employer_profiles.user_id = auth.uid()
  )
);

-- Policy to allow recruiters to read applicant profiles for their employer
CREATE POLICY "Recruiters can read applicant profiles for job applications"
ON applicant_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recruiter_profiles
    WHERE recruiter_profiles.user_id = auth.uid()
  )
); 