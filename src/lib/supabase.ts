import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Get the current site URL
const siteUrl = import.meta.env.PROD 
  ? 'https://glittery-gnome-eb1888.netlify.app'
  : 'http://localhost:5173';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    storage: window.localStorage
  }
});

// Update redirect URL to use hash routing
export const getRedirectUrl = () => `${siteUrl}/#/login`;