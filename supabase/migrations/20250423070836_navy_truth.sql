/*
  # Add admin user

  1. Changes
    - Creates admin user with email rahul@craftech360.com
    - Sets password to rahul@123
    - Ensures user has proper authentication settings
*/

-- Create admin user with password
DO $$
BEGIN
  -- Check if user already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'rahul@craftech360.com'
  ) THEN
    -- Insert new admin user
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_current,
      email_change_token_new
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'rahul@craftech360.com',
      crypt('rahul@123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;