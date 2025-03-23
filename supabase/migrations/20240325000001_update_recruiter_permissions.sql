-- Create a function to check if a user is a recruiter for a specific employer
CREATE OR REPLACE FUNCTION is_recruiter_for_employer(employer_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid() 
    AND employer_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for recruiters to view all jobs from their employer
CREATE POLICY "Recruiters can view their employer's jobs"
ON jobs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid() 
    AND employer_id = jobs.employer_id
  )
);

-- Policy for recruiters to view all applications for their employer's jobs
CREATE POLICY "Recruiters can view applications for their employer's jobs"
ON applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles r
    JOIN jobs j ON j.employer_id = r.employer_id
    WHERE r.user_id = auth.uid() 
    AND j.id = applications.job_id
  )
);

-- Policy for recruiters to update application statuses
CREATE POLICY "Recruiters can update applications for their employer's jobs"
ON applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles r
    JOIN jobs j ON j.employer_id = r.employer_id
    WHERE r.user_id = auth.uid() 
    AND j.id = applications.job_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles r
    JOIN jobs j ON j.employer_id = r.employer_id
    WHERE r.user_id = auth.uid() 
    AND j.id = applications.job_id
  )
);

-- Policy for recruiters to view applicant profiles for their applications
CREATE POLICY "Recruiters can view applicant profiles for their applications"
ON applicant_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles r
    JOIN jobs j ON j.employer_id = r.employer_id
    JOIN applications a ON a.job_id = j.id
    WHERE r.user_id = auth.uid() 
    AND a.applicant_id = applicant_profiles.user_id
  )
);

-- Policy for recruiters to view employer profiles they work for
CREATE POLICY "Recruiters can view their employer's profile"
ON employer_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM recruiter_profiles 
    WHERE user_id = auth.uid() 
    AND employer_id = employer_profiles.id
  )
);

-- Add employer_id to jobs table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'jobs' 
    AND column_name = 'employer_id'
  ) THEN
    ALTER TABLE jobs ADD COLUMN employer_id uuid REFERENCES employer_profiles(id);
  END IF;
END $$; 