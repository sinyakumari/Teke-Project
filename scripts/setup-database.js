const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function setupDatabase() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Read the migration file
    const fs = require('fs')
    const path = require('path')
    const migrationPath = path.join(__dirname, '..', 'migrations', 'create_worksheets_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('Creating worksheets tables...')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('Error executing migration:', error)
      
      // Try direct SQL execution if RPC fails
      console.log('Attempting direct table creation...')
      
      // Create worksheets table
      const { error: worksheetsError } = await supabase
        .from('worksheets')
        .select('*')
        .limit(1)

      if (worksheetsError && worksheetsError.code === 'PGRST116') {
        // Table doesn't exist, create it
        console.log('Worksheets table not found, creating...')
        
        const createWorksheetsSQL = `
          CREATE TABLE IF NOT EXISTS worksheets (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name VARCHAR(255) NOT NULL,
              training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
              lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createWorksheetsSQL })
        if (createError) {
          console.error('Error creating worksheets table:', createError)
        } else {
          console.log('✅ Worksheets table created successfully')
        }
      } else {
        console.log('✅ Worksheets table already exists')
      }

      // Create worksheet_questions table
      const { error: questionsError } = await supabase
        .from('worksheet_questions')
        .select('*')
        .limit(1)

      if (questionsError && questionsError.code === 'PGRST116') {
        console.log('Worksheet questions table not found, creating...')
        
        const createQuestionsSQL = `
          CREATE TABLE IF NOT EXISTS worksheet_questions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              worksheet_id UUID NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
              question TEXT NOT NULL,
              answer TEXT,
              "order" INTEGER NOT NULL DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createQuestionsSQL })
        if (createError) {
          console.error('Error creating worksheet_questions table:', createError)
        } else {
          console.log('✅ Worksheet questions table created successfully')
        }
      } else {
        console.log('✅ Worksheet questions table already exists')
      }

    } else {
      console.log('✅ Migration executed successfully')
    }

    console.log('🎉 Database setup complete!')

  } catch (error) {
    console.error('Setup failed:', error)
  }
}

setupDatabase()
