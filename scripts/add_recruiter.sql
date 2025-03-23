-- Get the employer ID first and create a recruiter
DO $$ 
DECLARE
    v_employer_id uuid;
    v_user_id uuid;
BEGIN
    -- Get the first employer ID from the system
    SELECT id INTO v_employer_id FROM employer_profiles LIMIT 1;
    
    -- Create a new user using Supabase's auth.sign_up function
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'recruiter123@gmail.com';

    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id
        FROM auth.users
        WHERE id = (
            SELECT id FROM auth.sign_up(
                'recruiter123@gmail.com',
                'recruiter123',
                '{
                    "role": "recruiter"
                }'::jsonb
            )
        );

        -- Confirm the email directly
        UPDATE auth.users
        SET email_confirmed_at = NOW(),
            confirmed_at = NOW()
        WHERE id = v_user_id;
    END IF;

    -- Create or update recruiter profile
    INSERT INTO recruiter_profiles (
        user_id,
        employer_id,
        email,
        full_name,
        title,
        permissions
    ) VALUES (
        v_user_id,
        v_employer_id,
        'recruiter123@gmail.com',
        'John Smith',
        'Senior Recruiter',
        '{
            "can_post_jobs": true,
            "can_review_applications": true,
            "can_interview": true
        }'::jsonb
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        employer_id = EXCLUDED.employer_id,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        title = EXCLUDED.title,
        permissions = EXCLUDED.permissions;

    RAISE NOTICE 'Successfully created/updated recruiter profile with user_id: %', v_user_id;
END $$; 