import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const trainingId = searchParams.get('training_id') || searchParams.get('trainingId')
    const status = searchParams.get('status')

    let query = supabase
      .from('tasks')
      .select('*, trainings(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (trainingId) query = query.eq('training_id', trainingId)
    if (status) query = query.eq('status', status)

    const { data: tasks, error } = await query

    if (error) {
      console.error('Get tasks error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ tasks }, { status: 200 })
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const isBulk = Array.isArray(body)
    const insertData = isBulk
      ? body.map((t: any) => ({ ...t, user_id: user.id, status: t.status || 'pending' }))
      : { ...body, user_id: user.id, status: body.status || 'pending' }

    const { data: result, error } = await supabase
      .from('tasks')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Create task error:', error)
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ task: isBulk ? result : result[0] }, { status: 201 })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}