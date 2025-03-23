-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can read applicant profiles for job applications" ON applicant_profiles;

-- Create a simplified policy that allows recruiters to read applicant profiles
CREATE POLICY "Recruiters can read applicant profiles"
ON applicant_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recruiter_profiles
    WHERE recruiter_profiles.user_id = auth.uid()
  )
);

-- Add a policy for employers to read applicant profiles
CREATE POLICY "Employers can read applicant profiles"
ON applicant_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employer_profiles
    WHERE employer_profiles.user_id = auth.uid()
  )
); 