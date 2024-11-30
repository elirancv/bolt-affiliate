import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Get environment variables
const supabaseUrl = 'https://kpexnfigsepdbozkfeji.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZXhuZmlnc2VwZGJvemtmZWppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjU5MDkxMywiZXhwIjoyMDQ4MTY2OTEzfQ.hSbrfE9_3BczzROD3pZ4p5vKtVgkV8yold8U-M21sPk'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public'
  }
})

async function applyMigration() {
  try {
    const migrationPath = join(__dirname, '../supabase/migrations/21_dashboard_fixes.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim())
    
    // Execute each statement separately
    for (const stmt of statements) {
      if (!stmt.trim()) continue
      
      const { data, error } = await supabase
        .from('_migrations')
        .insert([{
          name: '21_dashboard_fixes',
          sql: stmt + ';',
          executed_at: new Date().toISOString()
        }])
      
      if (error) {
        console.error('Error executing statement:', error)
        console.error('Statement:', stmt)
        process.exit(1)
      }
    }

    console.log('Migration applied successfully!')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

applyMigration()
