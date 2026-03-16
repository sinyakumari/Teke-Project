/**
 * Migration script: MongoDB → Supabase
 * Run with: npx ts-node scripts/migrate-to-supabase.ts
 *
 * Requires ts-node:  npm install -D ts-node
 */

import mongoose from 'mongoose'
import { createClient } from '@supabase/supabase-js'

// ─── Config ──────────────────────────────────────────────────────────────────

const MONGO_URI = 'mongodb://127.0.0.1:27017/teke'

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wnxsfpukosmhuuusnnyv.supabase.co'

const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY is not set.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Mongoose Schemas (inline, so we don't import Next.js models) ─────────────

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  profilePicture: String,
  phone: String,
  address: String,
  bio: String,
  lastLogin: Date,
  accountStatus: String,
  appLock: Boolean,
  reviewReminders: Boolean,
}, { timestamps: true })

const TrainingSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  title: String,
  instructor: String,
  locationType: String,
  locationName: String,
  structure: String,
  startDate: Date,
  endDate: Date,
  duration: Number,
  unit: String,
  category: String,
  vision: String,
  objective: String,
  notes: String,
  status: String,
}, { timestamps: true })

const TaskSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  trainingId: mongoose.Schema.Types.ObjectId,
  name: String,
  status: String,
  deadline: Date,
  blockedBy: [mongoose.Schema.Types.ObjectId],
  source: String,
  pdfPage: Number,
  pdfText: String,
}, { timestamps: true })

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert MongoDB Task status → Supabase snake_case lowercase */
function mapTaskStatus(mongoStatus: string): string {
  return (mongoStatus || 'pending')
    .toLowerCase()
    .replace(/\s+/g, '_')
}

/** Convert Training category → lowercase */
function mapCategory(cat: string): string {
  return (cat || 'other').toLowerCase()
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔌  Connecting to MongoDB...')
  await mongoose.connect(MONGO_URI)
  console.log('✅  Connected to MongoDB')

  const User = mongoose.model('User', UserSchema)
  const Training = mongoose.model('Training', TrainingSchema)
  const Task = mongoose.model('Task', TaskSchema)

  // Maps: MongoDB _id string → Supabase UUID string
  const userIdMap: Record<string, string> = {}
  const trainingIdMap: Record<string, string> = {}

  // ── 1. Migrate Users ───────────────────────────────────────────────────────
  console.log('\n👤  Migrating users...')
  const mongoUsers = await User.find({})
  let userCount = 0

  for (const u of mongoUsers) {
    const mongoId = (u._id as mongoose.Types.ObjectId).toString()

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email as string,
      password: 'Teke@1234',
      email_confirm: true,
      user_metadata: { name: u.name as string },
    })

    if (error) {
      // If user already exists in Supabase, try to look them up
      if (error.message?.toLowerCase().includes('already')) {
        console.warn(`  ⚠️  User ${u.email} already exists — skipping`)
      } else {
        console.error(`  ❌  Failed to create user ${u.email}:`, error.message)
      }
      continue
    }

    const supabaseUid = data.user!.id
    userIdMap[mongoId] = supabaseUid
    userCount++
    console.log(`  ✅  ${u.email}  →  ${supabaseUid}`)
  }

  // ── 2. Migrate Trainings ───────────────────────────────────────────────────
  console.log('\n📚  Migrating trainings...')
  const mongoTrainings = await Training.find({})
  let trainingCount = 0

  for (const t of mongoTrainings) {
    const mongoUserId = (t.userId as mongoose.Types.ObjectId).toString()
    const supabaseUserId = userIdMap[mongoUserId]

    if (!supabaseUserId) {
      console.warn(`  ⚠️  No Supabase user for training "${t.title}" (mongoUserId=${mongoUserId}) — skipping`)
      continue
    }

    const mongoTrainingId = (t._id as mongoose.Types.ObjectId).toString()
    const isArchived = t.status === 'archived'

    const row = {
      user_id: supabaseUserId,
      title: t.title || '',
      instructor: t.instructor || '',
      location_type: t.locationType || 'Online',
      structure: t.structure || 'Single Session',
      start_date: t.startDate ? (t.startDate as Date).toISOString() : null,
      end_date: t.endDate ? (t.endDate as Date).toISOString() : null,
      duration_value: t.duration ?? null,
      duration_unit: t.unit || null,
      category: mapCategory(t.category as string),
      vision: t.vision || '',
      mission: t.objective || '',          // objective → mission
      notes_delta: t.notes
        ? { text: t.notes }                // notes string → {text: notes}
        : null,
      is_archived: isArchived,
    }

    const { data, error } = await supabase
      .from('trainings')
      .insert(row)
      .select('id')
      .single()

    if (error) {
      console.error(`  ❌  Failed to insert training "${t.title}":`, error.message)
      continue
    }

    trainingIdMap[mongoTrainingId] = data.id
    trainingCount++
    console.log(`  ✅  "${t.title}"  →  ${data.id}`)
  }

  // ── 3. Migrate Tasks ───────────────────────────────────────────────────────
  console.log('\n✅  Migrating tasks...')
  const mongoTasks = await Task.find({})
  let taskCount = 0

  for (const tk of mongoTasks) {
    const mongoUserId = (tk.userId as mongoose.Types.ObjectId).toString()
    const mongoTrainingId = (tk.trainingId as mongoose.Types.ObjectId).toString()

    const supabaseUserId = userIdMap[mongoUserId]
    const supabaseTrainingId = trainingIdMap[mongoTrainingId]

    if (!supabaseUserId) {
      console.warn(`  ⚠️  No Supabase user for task "${tk.name}" — skipping`)
      continue
    }
    if (!supabaseTrainingId) {
      console.warn(`  ⚠️  No Supabase training for task "${tk.name}" — skipping`)
      continue
    }

    const row = {
      user_id: supabaseUserId,
      training_id: supabaseTrainingId,
      name: tk.name || '',
      status: mapTaskStatus(tk.status as string),
      deadline: tk.deadline ? (tk.deadline as Date).toISOString() : null,
      blocked_by_task_id: null,         // blockedBy array not directly mappable; left null
      source_snippet: tk.pdfText || null,
      source_page: tk.pdfPage ?? null,
    }

    const { error } = await supabase
      .from('tasks')
      .insert(row)

    if (error) {
      console.error(`  ❌  Failed to insert task "${tk.name}":`, error.message)
      continue
    }

    taskCount++
    console.log(`  ✅  "${tk.name}"`)
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  await mongoose.disconnect()
  console.log('\n🎉  Migration complete!')
  console.log(`    Users:     ${userCount} / ${mongoUsers.length}`)
  console.log(`    Trainings: ${trainingCount} / ${mongoTrainings.length}`)
  console.log(`    Tasks:     ${taskCount} / ${mongoTasks.length}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
