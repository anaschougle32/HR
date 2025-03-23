-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS interview_scheduled_notification ON interviews;
DROP FUNCTION IF EXISTS notify_interview_scheduled();

-- Recreate the notification function for interview scheduling
CREATE OR REPLACE FUNCTION notify_interview_scheduled()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_applicant_id UUID;
  v_employer_id UUID;
  v_recruiter_id UUID;
BEGIN
  -- Get relevant information
  SELECT 
    j.title,
    ap.user_id,
    j.employer_id,
    rp.user_id
  INTO 
    v_job_title,
    v_applicant_id,
    v_employer_id,
    v_recruiter_id
  FROM 
    applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN applicant_profiles ap ON a.applicant_id = ap.id
    LEFT JOIN recruiter_profiles rp ON j.employer_id = rp.employer_id
  WHERE 
    a.id = NEW.application_id;

  -- Notify applicant
  PERFORM create_notification(
    v_applicant_id,
    'Interview Scheduled',
    'An interview has been scheduled for ' || v_job_title,
    'interview_scheduled',
    'interview',
    NEW.id
  );

  -- Notify employer
  IF v_employer_id IS NOT NULL THEN
    PERFORM create_notification(
      v_employer_id,
      'Interview Scheduled',
      'Interview scheduled for ' || v_job_title,
      'interview_scheduled',
      'interview',
      NEW.id
    );
  END IF;

  -- Notify recruiter
  IF v_recruiter_id IS NOT NULL THEN
    PERFORM create_notification(
      v_recruiter_id,
      'Interview Scheduled',
      'Interview scheduled for ' || v_job_title,
      'interview_scheduled',
      'interview',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger for interview scheduling
CREATE TRIGGER interview_scheduled_notification
AFTER INSERT ON interviews
FOR EACH ROW
EXECUTE FUNCTION notify_interview_scheduled(); 