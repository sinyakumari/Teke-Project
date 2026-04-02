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
      .select('*, trainings(title)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (trainingId && trainingId !== 'null' && trainingId !== 'undefined') {
      query = query.eq('training_id', trainingId)
    }
    if (status && status !== 'All') {
      query = query.eq('status', status)
    }

    // Fetch all results to allow client-side pagination (matching trainings page)
    const { data: tasks, error, count } = await query

    if (error) {
      console.error('Get tasks error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ tasks, totalCount: count || 0 }, { status: 200 })
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
      .select('*, trainings(title)')

    if (error) {
      console.error('Create task error:', error)
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }

    const rawTask = isBulk ? result : result?.[0]
    const formattedTask = isBulk 
      ? (result as any[]).map(t => ({ ...t, training: t.trainings?.[0] || t.trainings }))
      : { ...rawTask, training: (rawTask as any)?.trainings?.[0] || (rawTask as any)?.trainings }

    return NextResponse.json({ task: formattedTask }, { status: 201 })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}