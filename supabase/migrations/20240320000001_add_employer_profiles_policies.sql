-- Enable RLS on employer_profiles table
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own employer profile" ON employer_profiles;
DROP POLICY IF EXISTS "Users can read their own employer profile" ON employer_profiles;
DROP POLICY IF EXISTS "Users can update their own employer profile" ON employer_profiles;
DROP POLICY IF EXISTS "Recruiters can read their employer profile" ON employer_profiles;

-- Policy to allow users to create their own employer profile
CREATE POLICY "Users can create their own employer profile"
ON employer_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to read their own employer profile
CREATE POLICY "Users can read their own employer profile"
ON employer_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy to allow users to update their own employer profile
CREATE POLICY "Users can update their own employer profile"
ON employer_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow recruiters to read their employer's profile
CREATE POLICY "Recruiters can read their employer profile"
ON employer_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recruiter_profiles
    WHERE recruiter_profiles.employer_id = employer_profiles.id
    AND recruiter_profiles.user_id = auth.uid()
  )
); 