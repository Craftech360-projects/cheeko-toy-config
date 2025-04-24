/*
  # Create MQTT Auth table

  1. New Tables
    - mqtt_auth: Stores MQTT authentication credentials
      - serial_number (text, primary key)
      - password_hash (text)
      - is_active (boolean)
      - created_at (timestamp)

  2. Security
    - Enable RLS on mqtt_auth table
    - Add policy for authenticated users to read mqtt_auth entries
*/

-- Create mqtt_auth table if it doesn't exist
CREATE TABLE IF NOT EXISTS mqtt_auth (
    serial_number text PRIMARY KEY,
    password_hash text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mqtt_auth ENABLE ROW LEVEL SECURITY;

-- Create policy for reading mqtt_auth entries
CREATE POLICY "Allow reading mqtt_auth entries" ON mqtt_auth
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert sample data
INSERT INTO mqtt_auth (serial_number, password_hash, is_active)
VALUES 
    ('ABC123', 'sample_hash', true)
ON CONFLICT (serial_number) 
DO UPDATE SET is_active = true;