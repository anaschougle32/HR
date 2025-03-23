-- Create recruiter_profiles table
CREATE TABLE recruiter_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT,
  title TEXT,
  permissions JSONB DEFAULT '{"can_post_jobs": true, "can_review_applications": true, "can_interview": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_recruiter_user_id UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX recruiter_profiles_user_id_idx ON recruiter_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Recruiters can view their own profile"
  ON recruiter_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can update their own profile"
  ON recruiter_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can insert their own profile"
  ON recruiter_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION handle_recruiter_profile_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for handling updates
CREATE TRIGGER recruiter_profile_updated
  BEFORE UPDATE ON recruiter_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_recruiter_profile_updated(); 