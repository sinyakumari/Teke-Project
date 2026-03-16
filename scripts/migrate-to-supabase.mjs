/**
 * Simple Migration Script: MongoDB → Supabase
 * Using direct mongoose connection and hardcoded keys for simplicity.
 */

import mongoose from 'mongoose'
import { createClient } from '@supabase/supabase-js'

const MONGO_URI    = 'mongodb://127.0.0.1:27017/teke'
const SUPABASE_URL = 'https://wnxsfpukosmhuuusnnyv.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndueHNmcHVrb3NtaHV1dXNubnl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY1MzIxOSwiZXhwIjoyMDg5MjI5MjE5fQ.ia2EJVQbXp_cJphZ-8etUzEsvNsOtlkoRREceh-lSlU'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  console.log('🔌 Connecting to MongoDB...')
  await mongoose.connect(MONGO_URI)
  console.log('✅ Connected!')

  const db = mongoose.connection.db

  // 1. Map Users
  console.log('\n👤 Fetching Users...')
  const mongoUsers = await db.collection('users').find({}).toArray()
  console.log(`  Found ${mongoUsers.length} users in MongoDB.`)

  const { data: { users: supabaseUsers }, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) throw userError

  const userIdMap = {}
  for (const mu of mongoUsers) {
    const email = mu.email.toLowerCase()
    const match = supabaseUsers.find(su => su.email?.toLowerCase() === email)
    if (match) {
      userIdMap[mu._id.toString()] = match.id
      console.log(`  🔗 User: ${email} -> ${match.id}`)
    } else {
      console.log(`  ⚠️ User: ${email} NOT found in Supabase. Skipping its data.`)
    }
  }

  // 2. Migrate Trainings
  console.log('\n📚 Fetching Trainings...')
  const mongoTrainings = await db.collection('trainings').find({}).toArray()
  console.log(`  Found ${mongoTrainings.length} trainings in MongoDB.`)

  const trainingIdMap = {}
  for (const mt of mongoTrainings) {
    const suid = userIdMap[mt.userId?.toString()]
    if (!suid) continue

    console.log(`  Migrating training: "${mt.title}"...`)
    const { data, error } = await supabase
      .from('trainings')
      .insert({
        user_id: suid,
        title: mt.title || 'Untitled',
        instructor: mt.instructor || '',
        location_type: (mt.locationType === 'In Person' ? 'offline' : 'online'),
        structure: (mt.structure === 'multi-lesson' ? 'multi-lesson' : 'single'),
        start_date: mt.startDate ? new Date(mt.startDate).toISOString() : null,
        end_date: mt.endDate ? new Date(mt.endDate).toISOString() : null,
        duration_value: mt.duration || null,
        duration_unit: (mt.unit || 'hours').toLowerCase(),
        category: (mt.category || 'other').toLowerCase(),
        is_archived: mt.status === 'archived'
      })
      .select('id')

    if (error) {
       console.error(`    ❌ Error: ${error.message}`)
       continue
    }
    
    if (data && data[0]) {
      trainingIdMap[mt._id.toString()] = data[0].id
      console.log(`    ✅ OK: ${data[0].id}`)
    }
  }

  // 3. Migrate Tasks
  console.log('\n📋 Fetching Tasks...')
  const mongoTasks = await db.collection('tasks').find({}).toArray()
  console.log(`  Found ${mongoTasks.length} tasks in MongoDB.`)

  for (const mk of mongoTasks) {
    const suid = userIdMap[mk.userId?.toString()]
    const stid = trainingIdMap[mk.trainingId?.toString()]

    if (!suid || !stid) {
       console.log(`  ⚠️ Skipping task "${mk.name}" (User/Training mismatch)`)
       continue
    }

    console.log(`  Migrating task: "${mk.name}"...`)
    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: suid,
        training_id: stid,
        name: mk.name || 'Untitled Task',
        status: (mk.status || 'pending').toLowerCase().replace(' ', '_'),
        deadline: mk.deadline ? new Date(mk.deadline).toISOString() : null
      })

    if (error) {
       console.error(`    ❌ Error: ${error.message}`)
    } else {
       console.log(`    ✅ OK`)
    }
  }

  console.log('\n🎉 Finished!')
  await mongoose.disconnect()
}

main().catch(err => {
  console.error('Fatal Error:', err)
  process.exit(1)
})
