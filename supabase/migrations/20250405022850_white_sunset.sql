/*
  # Initial Schema Setup for AI Toy Application

  1. New Tables
    - users: Stores user information
      - id (uuid, primary key)
      - email (text, unique)
      - created_at (timestamp)
    
    - user_otps: Stores OTP codes for user authentication
      - id (uuid, primary key)
      - email (text, references users)
      - otp_code (text)
      - expires_at (timestamp)
      - is_used (boolean)
      - created_at (timestamp)
    
    - mqtt_auth: Stores MQTT authentication credentials
      - serial_number (text, primary key)
      - password_hash (text)
      - is_active (boolean)
      - created_at (timestamp)
    
    - toys: Stores toy information
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - serial_number (text, unique, references mqtt_auth)
      - name (text)
      - activation_key (text)
      - role_type (text, enum)
      - language (text, enum)
      - voice (text, enum)
      - last_online (timestamp)
      - created_at (timestamp)
    
    - mqtt_messages: Stores MQTT message history
      - id (uuid, primary key)
      - serial_number (text, references toys)
      - topic (text)
      - payload (text)
      - qos (smallint)
      - received_at (timestamp)
    
    - toy_status: Tracks toy online status
      - serial_number (text, primary key, references toys)
      - is_online (boolean)
      - last_seen (timestamp)

  2. Security
    - RLS policies for each table
    - Foreign key constraints
    - Enum types for role, language, and voice options
*/

-- Create custom types for enums
CREATE TYPE role_type AS ENUM ('Puzzle Solver', 'Story Teller', 'Math Tutor');
CREATE TYPE language_type AS ENUM ('English', 'Spanish', 'French', 'Hindi');
CREATE TYPE voice_type AS ENUM ('Sparkles for Kids', 'Deep Voice', 'Soft Calm Voice');

-- Create users table
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create user_otps table
CREATE TABLE user_otps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text REFERENCES users(email) ON DELETE CASCADE,
    otp_code text NOT NULL,
    expires_at timestamptz NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Create mqtt_auth table
CREATE TABLE mqtt_auth (
    serial_number text PRIMARY KEY,
    password_hash text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Create toys table
CREATE TABLE toys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    serial_number text UNIQUE NOT NULL REFERENCES mqtt_auth(serial_number) ON DELETE CASCADE,
    name text NOT NULL,
    activation_key text NOT NULL,
    role_type role_type NOT NULL,
    language language_type NOT NULL,
    voice voice_type NOT NULL,
    last_online timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Create mqtt_messages table
CREATE TABLE mqtt_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number text REFERENCES toys(serial_number) ON DELETE CASCADE,
    topic text NOT NULL,
    payload text NOT NULL,
    qos smallint CHECK (qos IN (0, 1, 2)),
    received_at timestamptz DEFAULT now()
);

-- Create toy_status table
CREATE TABLE toy_status (
    serial_number text PRIMARY KEY REFERENCES toys(serial_number) ON DELETE CASCADE,
    is_online boolean DEFAULT false,
    last_seen timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mqtt_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE toys ENABLE ROW LEVEL SECURITY;
ALTER TABLE mqtt_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE toy_status ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data" ON users
    FOR SELECT TO authenticated
    USING (auth.uid() IN (
        SELECT user_id FROM toys WHERE toys.user_id = auth.uid()
    ));

-- Create policies for toys table
CREATE POLICY "Users can read own toys" ON toys
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own toys" ON toys
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own toys" ON toys
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create policies for mqtt_messages table
CREATE POLICY "Users can read messages for their toys" ON mqtt_messages
    FOR SELECT TO authenticated
    USING (serial_number IN (
        SELECT serial_number FROM toys WHERE user_id = auth.uid()
    ));

-- Create policies for toy_status table
CREATE POLICY "Users can read status of their toys" ON toy_status
    FOR SELECT TO authenticated
    USING (serial_number IN (
        SELECT serial_number FROM toys WHERE user_id = auth.uid()
    ));

-- Create function to update toy last_online status
CREATE OR REPLACE FUNCTION update_toy_last_online()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE toys
    SET last_online = NEW.last_seen
    WHERE serial_number = NEW.serial_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update toy last_online
CREATE TRIGGER update_toy_last_online_trigger
    AFTER UPDATE OF last_seen ON toy_status
    FOR EACH ROW
    EXECUTE FUNCTION update_toy_last_online();