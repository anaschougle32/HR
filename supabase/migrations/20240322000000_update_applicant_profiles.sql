-- Add new columns to applicant_profiles table
ALTER TABLE applicant_profiles
ADD COLUMN IF NOT EXISTS experience text,
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS resume_url text;

-- Update existing policies to include new columns
DROP POLICY IF EXISTS "Users can read applicant profiles for job applications" ON applicant_profiles;
CREATE POLICY "Users can read applicant profiles for job applications"
ON applicant_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.applicant_id = applicant_profiles.id
    AND EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND EXISTS (
        SELECT 1 FROM recruiter_profiles
        WHERE recruiter_profiles.employer_id = jobs.employer_id
        AND recruiter_profiles.user_id = auth.uid()
      )
    )
  )
); 