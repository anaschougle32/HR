import { supabase } from '../lib/supabase';
import { forceUpdateUserRole } from '../utils/auth';

const fixRecruiterRole = async () => {
  try {
    // First sign in as the user
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email: 'chougleanas22@gmail.com',
      password: 'your_password_here'
    });

    if (error) throw error;

    // Force update the role
    await forceUpdateUserRole('chougleanas22@gmail.com', 'recruiter');

    console.log('Role updated successfully');
  } catch (error) {
    console.error('Error fixing role:', error);
  }
};

// Run this function
fixRecruiterRole(); 