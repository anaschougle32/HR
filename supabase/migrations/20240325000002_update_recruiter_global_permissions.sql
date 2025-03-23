-- Function to check if a user is a recruiter
CREATE OR REPLACE FUNCTION is_recruiter()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Recruiters can view their employer's jobs" ON jobs;
DROP POLICY IF EXISTS "Recruiters can view applications for their employer's jobs" ON applications;
DROP POLICY IF EXISTS "Recruiters can update applications for their employer's jobs" ON applications;
DROP POLICY IF EXISTS "Recruiters can view applicant profiles for their applications" ON applicant_profiles;
DROP POLICY IF EXISTS "Recruiters can view their employer's profile" ON employer_profiles;

-- Create new global access policies for recruiters

-- Jobs policies
CREATE POLICY "Recruiters can view all jobs"
ON jobs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Recruiters can manage all jobs"
ON jobs
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Applications policies
CREATE POLICY "Recruiters can view all applications"
ON applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Recruiters can update any application"
ON applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Applicant profiles policy
CREATE POLICY "Recruiters can view all applicant profiles"
ON applicant_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Employer profiles policy
CREATE POLICY "Recruiters can view all employer profiles"
ON employer_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Work experience policy
CREATE POLICY "Recruiters can view all work experience"
ON work_experience
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid()
  )
); 