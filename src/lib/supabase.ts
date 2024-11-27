import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'affiliate-store-builder'
    }
  }
});

// Add admin API types
declare module '@supabase/supabase-js' {
  interface SupabaseAuthClient {
    admin: {
      listUsers: () => Promise<{
        data: { users: Array<{
          id: string;
          email: string;
          created_at: string;
        }> };
        error: null | Error;
      }>;
    };
  }
}

// Initialize admin API if using service role key
if (supabaseAnonKey.includes('service_role')) {
  supabase.auth.admin = {
    listUsers: async () => {
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const users = await response.json();
      return { data: { users }, error: null };
    }
  };
}