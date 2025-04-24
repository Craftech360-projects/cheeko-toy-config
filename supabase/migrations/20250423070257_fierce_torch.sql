/*
  # Add admin policy for MQTT auth management

  1. Changes
    - Add policy for admin access to mqtt_auth table
    - Allow specific admin emails to manage MQTT auth
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow admin to manage mqtt_auth" ON mqtt_auth;

-- Add policy for admin access to mqtt_auth table
CREATE POLICY "Allow admin to manage mqtt_auth" ON mqtt_auth
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@gmail.com'::text, 'rahul@craftech360.com'::text]))
  WITH CHECK ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@gmail.com'::text, 'rahul@craftech360.com'::text]));