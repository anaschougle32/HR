-- Create interviews table
CREATE TABLE interviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  meeting_link TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX interviews_application_id_idx ON interviews(application_id);

-- Enable RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Policy for applicants to view their own interviews
CREATE POLICY "Applicants can view their own interviews"
ON interviews FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN applicant_profiles ap ON a.applicant_id = ap.id
    WHERE a.id = interviews.application_id
    AND ap.user_id = auth.uid()
  )
);

-- Policy for employers to manage interviews
CREATE POLICY "Employers can manage interviews"
ON interviews
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.id = interviews.application_id
    AND j.employer_id IN (
      SELECT id FROM employer_profiles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.id = interviews.application_id
    AND j.employer_id IN (
      SELECT id FROM employer_profiles WHERE user_id = auth.uid()
    )
  )
);

-- Policy for recruiters to manage interviews
CREATE POLICY "Recruiters can manage interviews"
ON interviews
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN recruiter_profiles r ON j.employer_id = r.employer_id
    WHERE a.id = interviews.application_id
    AND r.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN recruiter_profiles r ON j.employer_id = r.employer_id
    WHERE a.id = interviews.application_id
    AND r.user_id = auth.uid()
  )
);

-- Function to update application status when interview is scheduled
CREATE OR REPLACE FUNCTION update_application_status_on_interview()
RETURNS TRIGGER AS $$
BEGIN
  -- Update application status to interview_scheduled when a new interview is created
  IF TG_OP = 'INSERT' THEN
    UPDATE applications
    SET status = 'interview_scheduled'
    WHERE id = NEW.application_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for interview creation
CREATE TRIGGER interview_created_update_application
AFTER INSERT ON interviews
FOR EACH ROW
EXECUTE FUNCTION update_application_status_on_interview(); 