-- Update jobs table to include new status options
ALTER TABLE jobs
DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE jobs
ADD CONSTRAINT jobs_status_check
CHECK (status IN ('pending_review', 'active', 'rejected', 'closed'));

-- Update existing jobs to use new status
UPDATE jobs
SET status = 'pending_review'
WHERE status = 'active' AND created_at > NOW() - INTERVAL '24 hours';

-- Add policy for recruiters to update job status
DROP POLICY IF EXISTS "Recruiters can update job status" ON jobs;

CREATE POLICY "Recruiters can update job status"
ON jobs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recruiter_profiles
    WHERE recruiter_profiles.employer_id = jobs.employer_id
    AND recruiter_profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recruiter_profiles
    WHERE recruiter_profiles.employer_id = jobs.employer_id
    AND recruiter_profiles.user_id = auth.uid()
  )
); 