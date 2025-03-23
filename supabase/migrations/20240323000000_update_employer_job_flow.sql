-- Update jobs table to include new status options
ALTER TABLE jobs
DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE jobs
ADD CONSTRAINT jobs_status_check
CHECK (status IN ('pending_review', 'active', 'rejected', 'closed'));

-- Add interview_status to applications table
ALTER TABLE applications
DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications
ADD CONSTRAINT applications_status_check
CHECK (status IN ('pending', 'shortlisted', 'rejected', 'interview_scheduled', 'hired'));

-- Add interview_date and interview_notes to applications
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS interview_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS interview_notes text;

-- Create a view for employer job statistics
CREATE OR REPLACE VIEW employer_job_stats AS
SELECT 
  j.employer_id,
  COUNT(DISTINCT j.id) as total_jobs,
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'shortlisted' THEN a.id END) as total_shortlisted,
  COUNT(DISTINCT CASE WHEN a.status = 'hired' THEN a.id END) as total_hired,
  COUNT(DISTINCT CASE WHEN j.status = 'pending_review' THEN j.id END) as pending_review_jobs
FROM jobs j
LEFT JOIN applications a ON j.id = a.job_id
GROUP BY j.employer_id; 