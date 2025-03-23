const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://mdwvbxtgeljkikspxlhs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd3ZieHRnZWxqa2lrc3B4bGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNDcwMjYsImV4cCI6MjA1NzgyMzAyNn0.cI_6n0kYegWfxLfIk';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const email = 'recruiter123@gmail.com';
const password = 'recruiter123';
const fullName = 'John Smith';
const title = 'Senior Recruiter';

async function createRecruiter() {
    try {
        // 1. Create auth user
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'recruiter'
                }
            }
        });

        if (signUpError) throw signUpError;
        if (!user) throw new Error('Failed to create user');

        console.log('Created auth user:', user.id);

        // 2. Get first employer profile
        const { data: employer, error: employerError } = await supabase
            .from('employer_profiles')
            .select('id')
            .limit(1)
            .single();

        if (employerError) throw employerError;
        if (!employer) throw new Error('No employer found');

        console.log('Found employer:', employer.id);

        // 3. Create recruiter profile
        const { error: profileError } = await supabase
            .from('recruiter_profiles')
            .insert({
                user_id: user.id,
                employer_id: employer.id,
                email: email,
                full_name: fullName,
                title: title,
                permissions: {
                    can_post_jobs: true,
                    can_review_applications: true,
                    can_interview: true
                }
            });

        if (profileError) throw profileError;

        // 4. Confirm email directly in auth.users
        const { error: confirmError } = await supabase.rpc('confirm_user', {
            user_id: user.id
        });

        if (confirmError) throw confirmError;

        console.log('Success! Created recruiter profile');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Full Name:', fullName);
        console.log('Title:', title);

    } catch (error) {
        console.error('Error creating recruiter:', error);
    } finally {
        process.exit(0);
    }
}

createRecruiter(); 