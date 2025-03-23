-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('interview_scheduled', 'application_status', 'job_status', 'general')),
  related_entity_type TEXT NOT NULL CHECK (related_entity_type IN ('job', 'application', 'interview')),
  related_entity_id UUID NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_read_idx ON notifications(read);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_related_entity_type TEXT,
  p_related_entity_id UUID
) RETURNS notifications AS $$
DECLARE
  v_notification notifications;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    related_entity_type,
    related_entity_id
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_related_entity_type,
    p_related_entity_id
  )
  RETURNING * INTO v_notification;
  
  RETURN v_notification;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_notification_ids UUID[]
) RETURNS SETOF notifications AS $$
BEGIN
  RETURN QUERY
  UPDATE notifications
  SET 
    read = TRUE,
    updated_at = NOW()
  WHERE 
    id = ANY(p_notification_ids)
    AND user_id = auth.uid()
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to create notifications for interview scheduling
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
    a.user_id,
    j.employer_id,
    j.posted_by
  INTO 
    v_job_title,
    v_applicant_id,
    v_employer_id,
    v_recruiter_id
  FROM 
    applications a
    JOIN jobs j ON a.job_id = j.id
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

-- Create trigger for interview scheduling
CREATE TRIGGER interview_scheduled_notification
AFTER INSERT ON interviews
FOR EACH ROW
EXECUTE FUNCTION notify_interview_scheduled();

-- Trigger function to create notifications for application status changes
CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_applicant_id UUID;
  v_employer_id UUID;
  v_recruiter_id UUID;
  v_status_message TEXT;
BEGIN
  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get relevant information
  SELECT 
    j.title,
    a.user_id,
    j.employer_id,
    j.posted_by
  INTO 
    v_job_title,
    v_applicant_id,
    v_employer_id,
    v_recruiter_id
  FROM 
    applications a
    JOIN jobs j ON a.job_id = j.id
  WHERE 
    a.id = NEW.id;

  -- Set status message
  v_status_message := CASE NEW.status
    WHEN 'shortlisted' THEN 'You have been shortlisted for '
    WHEN 'rejected' THEN 'Your application has been rejected for '
    WHEN 'hired' THEN 'Congratulations! You have been hired for '
    ELSE 'Your application status has been updated for '
  END || v_job_title;

  -- Notify applicant
  PERFORM create_notification(
    v_applicant_id,
    'Application Status Updated',
    v_status_message,
    'application_status',
    'application',
    NEW.id
  );

  -- Notify employer
  IF v_employer_id IS NOT NULL THEN
    PERFORM create_notification(
      v_employer_id,
      'Application Status Updated',
      'Application status updated for ' || v_job_title,
      'application_status',
      'application',
      NEW.id
    );
  END IF;

  -- Notify recruiter
  IF v_recruiter_id IS NOT NULL THEN
    PERFORM create_notification(
      v_recruiter_id,
      'Application Status Updated',
      'Application status updated for ' || v_job_title,
      'application_status',
      'application',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for application status changes
CREATE TRIGGER application_status_change_notification
AFTER UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION notify_application_status_change(); 