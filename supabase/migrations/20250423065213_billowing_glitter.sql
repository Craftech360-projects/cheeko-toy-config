/*
  # Add admin access policy for MQTT auth table

  1. Changes
    - Add policy to allow admin user to manage MQTT auth entries
    - Update existing policy to be more specific
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Allow reading mqtt_auth entries" ON mqtt_auth;

-- Create new policies
CREATE POLICY "Allow admin to manage mqtt_auth" ON mqtt_auth
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'admin@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');

CREATE POLICY "Allow users to read active mqtt_auth entries" ON mqtt_auth
    FOR SELECT
    TO authenticated
    USING (is_active = true);