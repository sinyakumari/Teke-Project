import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const isArchived = searchParams.get('is_archived') === 'true' || searchParams.get('status') === 'archived'

    const { data: trainings, error } = await supabase
      .from('trainings')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', isArchived)
      .order('created_at', { ascending: false })

    console.log(`[DEBUG - GET TRAININGS] UserId: ${user.id}, isArchived: ${isArchived}, Found: ${trainings?.length || 0} trainings`);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ trainings }, { status: 200 })

  } catch (error) {
    console.error('Fetch trainings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const { data: training, error } = await supabase
      .from('trainings')
      .insert({
        user_id: user.id,
        title: body.title,
        instructor: body.instructor || null,
        location_type: body.locationType?.toLowerCase() || null,
        location_detail: body.locationDetail || null,
        structure: body.structure === 'Multi-Lesson' ? 'multi-lesson' : 'single',
        start_date: body.startDate || null,
        end_date: body.endDate || null,
        duration_value: body.duration ? parseInt(body.duration) : null,
        duration_unit: body.unit?.toLowerCase() || null,
        category: body.category?.toLowerCase() || null,
        vision: body.vision || null,
        mission: body.objective || null,
        notes_delta: body.notes ? { text: body.notes } : null,
        is_archived: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ training }, { status: 201 })

  } catch (error) {
    console.error('Create training error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}