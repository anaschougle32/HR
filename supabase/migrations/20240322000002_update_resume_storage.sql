-- Enable storage for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Create a policy to allow public access to resume files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');

-- Update existing resume URLs to include full path if needed
UPDATE applicant_profiles
SET resume_url = CASE 
  WHEN resume_url IS NOT NULL AND NOT resume_url LIKE 'http%' 
  THEN storage.storage_public_url('resumes', resume_url)
  ELSE resume_url
END; 