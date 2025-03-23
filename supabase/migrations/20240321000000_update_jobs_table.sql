-- Update jobs table structure
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS salary_min integer,
ADD COLUMN IF NOT EXISTS salary_max integer,
ADD COLUMN IF NOT EXISTS employment_type text CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
ADD COLUMN IF NOT EXISTS applications_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('Design', 'Development', 'Marketing', 'Sales', 'Finance', 'Technology', 'Other')),
ALTER COLUMN status SET DEFAULT 'active',
ALTER COLUMN status SET NOT NULL;

-- Drop existing policies on applications table
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;

-- Update applications table structure
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS applicant_id uuid REFERENCES applicant_profiles(id);

-- Migrate data if needed
UPDATE applications 
SET applicant_id = applicant_profile_id
WHERE applicant_profile_id IS NOT NULL;

-- Drop old column
ALTER TABLE applications
DROP COLUMN IF EXISTS applicant_profile_id;

-- Recreate policies with new column name
CREATE POLICY "Users can view their own applications"
ON applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applicant_profiles
    WHERE applicant_profiles.id = applications.applicant_id
    AND applicant_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own applications"
ON applications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applicant_profiles
    WHERE applicant_profiles.id = applications.applicant_id
    AND applicant_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own applications"
ON applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applicant_profiles
    WHERE applicant_profiles.id = applications.applicant_id
    AND applicant_profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applicant_profiles
    WHERE applicant_profiles.id = applications.applicant_id
    AND applicant_profiles.user_id = auth.uid()
  )
);

-- Update existing jobs if they exist, otherwise insert new ones
DO $$
BEGIN
    -- Update or insert first job
    IF EXISTS (SELECT 1 FROM jobs WHERE id = 'a7b3c129-0e96-4037-a73b-cea56c350ead') THEN
        UPDATE jobs SET
            title = 'Mobile App Developer',
            company = 'HiQual Solutions',
            location = 'Bangalore, India',
            description = 'We are seeking a talented Mobile Developer to create and maintain high-quality mobile applications. You will be working with React Native to build cross-platform applications.\r\n\r\nKey Responsibilities:\r\n- Develop mobile applications using React Native\r\n- Implement new features and maintain existing ones\r\n- Ensure high performance and reliability\r\n- Write clean, testable code\r\n- Collaborate with the design team',
            requirements = '- 3+ years of mobile development experience\r\n- Strong knowledge of React Native\r\n- Experience with state management (Redux/Context)\r\n- Understanding of iOS and Android platforms\r\n- Knowledge of RESTful APIs\r\n- Good debugging skills',
            salary_min = 80000,
            salary_max = 120000,
            employment_type = 'full-time',
            experience_level = 3,
            category = 'Development',
            status = 'active'
        WHERE id = 'a7b3c129-0e96-4037-a73b-cea56c350ead';
    ELSE
        INSERT INTO jobs (id, employer_id, title, company, location, description, requirements, salary_min, salary_max, employment_type, experience_level, category, status)
        VALUES (
            'a7b3c129-0e96-4037-a73b-cea56c350ead',
            '1fb0dba5-301c-409f-871f-a5633cc6a703',
            'Mobile App Developer',
            'HiQual Solutions',
            'Bangalore, India',
            'We are seeking a talented Mobile Developer to create and maintain high-quality mobile applications. You will be working with React Native to build cross-platform applications.\r\n\r\nKey Responsibilities:\r\n- Develop mobile applications using React Native\r\n- Implement new features and maintain existing ones\r\n- Ensure high performance and reliability\r\n- Write clean, testable code\r\n- Collaborate with the design team',
            '- 3+ years of mobile development experience\r\n- Strong knowledge of React Native\r\n- Experience with state management (Redux/Context)\r\n- Understanding of iOS and Android platforms\r\n- Knowledge of RESTful APIs\r\n- Good debugging skills',
            80000, 120000, 'full-time', 3, 'Development', 'active'
        );
    END IF;

    -- Insert new jobs with generated UUIDs
    INSERT INTO jobs (
        id, employer_id, title, company, location, description, requirements,
        salary_min, salary_max, employment_type, experience_level, category, status
    ) VALUES
    (
        gen_random_uuid(),
        '1fb0dba5-301c-409f-871f-a5633cc6a703',
        'Frontend Developer',
        'TechCorp',
        'Mumbai, India',
        'Looking for a skilled Frontend Developer with expertise in React and modern web technologies.',
        '- 2+ years of frontend development experience\r\n- Strong knowledge of React.js\r\n- Experience with modern CSS and responsive design',
        60000, 90000, 'full-time', 2, 'Development', 'active'
    ),
    (
        gen_random_uuid(),
        '1fb0dba5-301c-409f-871f-a5633cc6a703',
        'DevOps Engineer',
        'CloudTech Solutions',
        'Remote',
        'Seeking a DevOps Engineer to help automate and improve our deployment and infrastructure processes.',
        '- 3+ years of DevOps experience\r\n- Strong knowledge of AWS/Azure\r\n- Experience with Docker and Kubernetes',
        90000, 140000, 'full-time', 3, 'Technology', 'active'
    ),
    (
        gen_random_uuid(),
        '1fb0dba5-301c-409f-871f-a5633cc6a703',
        'Part-time Data Analyst',
        'DataInsights',
        'Delhi, India',
        'Looking for a part-time Data Analyst to help analyze and interpret complex data sets.',
        '- 2+ years of data analysis experience\r\n- Proficiency in SQL and Python\r\n- Experience with data visualization tools',
        30000, 45000, 'part-time', 2, 'Technology', 'active'
    ),
    (
        gen_random_uuid(),
        '1fb0dba5-301c-409f-871f-a5633cc6a703',
        'Product Manager Intern',
        'StartupHub',
        'Pune, India',
        'Exciting internship opportunity for aspiring Product Managers to learn and grow.',
        '- Final year student or recent graduate\r\n- Strong analytical skills\r\n- Excellent communication abilities',
        15000, 25000, 'internship', 1, 'Other', 'active'
    ),
    (
        gen_random_uuid(),
        '1fb0dba5-301c-409f-871f-a5633cc6a703',
        'Full Stack Developer',
        'WebTech Solutions',
        'Hyderabad, India',
        'Join our team as a Full Stack Developer and work on exciting projects using modern technologies.',
        '- 3+ years of full-stack development experience\r\n- Proficiency in React and Node.js\r\n- Experience with databases and API design',
        85000, 130000, 'full-time', 3, 'Development', 'active'
    ),
    (
        gen_random_uuid(),
        '1fb0dba5-301c-409f-871f-a5633cc6a703',
        'UX Researcher',
        'DesignLabs',
        'Remote',
        'Looking for a UX Researcher to conduct user research and improve our product experience.',
        '- 2+ years of UX research experience\r\n- Experience with user testing methodologies\r\n- Strong analytical and communication skills',
        70000, 110000, 'contract', 2, 'Design', 'active'
    );
END $$; 