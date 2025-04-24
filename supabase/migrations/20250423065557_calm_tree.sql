/*
  # Add second admin user

  1. Changes
    - Add policy to allow second admin user (rahul@craftech360.com) to manage MQTT auth entries
*/

-- Update admin policy to include both admin emails
DROP POLICY IF EXISTS "Allow admin to manage mqtt_auth" ON mqtt_auth;

CREATE POLICY "Allow admin to manage mqtt_auth" ON mqtt_auth
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('admin@gmail.com', 'rahul@craftech360.com'))
    WITH CHECK (auth.jwt() ->> 'email' IN ('admin@gmail.com', 'rahul@craftech360.com'));