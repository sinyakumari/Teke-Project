import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch all task counts grouped by training_id
    const { data, error } = await supabase
      .from('tasks')
      .select('training_id, status')
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const counts: Record<string, { total: number; completed: number }> = {}

    data.forEach((task: any) => {
      if (!task.training_id) return
      if (!counts[task.training_id]) {
        counts[task.training_id] = { total: 0, completed: 0 }
      }
      counts[task.training_id].total++
      if (task.status === 'complete') {
        counts[task.training_id].completed++
      }
    })

    return NextResponse.json({ counts }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
