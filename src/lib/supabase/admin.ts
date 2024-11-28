import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://kpexnfigsepdbozkfeji.supabase.co'

// Regular client for normal operations
const supabase = createClient(
  supabaseUrl, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Admin client for privileged operations
const supabaseAdmin = createClient(
  supabaseUrl, 
  import.meta.env.VITE_SUPABASE_SERVICE_KEY
)

// Admin stats retrieval function
export async function getAdminStats() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error loading admin stats:', error)
    throw error
  }
}

// Export both clients for flexibility
export { supabase, supabaseAdmin }
