import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  console.error('Make sure to restart your dev server after adding/updating .env file');
  console.error('Current values:', {
    url: supabaseUrl || 'MISSING',
    key: supabaseAnonKey ? 'SET' : 'MISSING'
  });
}

// Create and export the Supabase client
// The Supabase JS client automatically handles authentication headers (apikey and Authorization)
// The anon key in the JWT automatically sets the role to 'anon' which matches our RLS policy
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Keep session alive even when tab is inactive
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      // Increase refresh buffer to prevent premature token expiration
      flowType: 'pkce'
    }
  }
);

// Log configuration status in development
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Client initialized:', {
    url: supabaseUrl ? '✅ Set' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
    clientUrl: supabaseUrl || 'Not configured'
  });
}

// Type definitions for registration data
export interface RegistrationData {
  name: string;
  email: string;
  phone: string;
  college: string;
  ticket_type?: string;
  price?: string;
  is_rit_student?: boolean;
  created_at?: string;
}
