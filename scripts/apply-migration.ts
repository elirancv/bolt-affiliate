import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/21_dashboard_fixes.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('Error applying migration:', error)
      process.exit(1)
    }

    console.log('Migration applied successfully!')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

applyMigration()
