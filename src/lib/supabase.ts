import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Initializing Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'unity-traders-web'
    }
  }
});

supabase.auth.getSession().then(({ data, error }) => {
  console.log('Initial session check:', data?.session ? 'Session exists' : 'No session', error);
});
