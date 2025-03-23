-- Function to confirm a user's email directly
CREATE OR REPLACE FUNCTION confirm_user(user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE auth.users
    SET 
        email_confirmed_at = NOW(),
        confirmed_at = NOW(),
        raw_app_meta_data = raw_app_meta_data || '{"email_verified": true}'::jsonb
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 