import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const { data: training, error } = await supabase
      .from('trainings')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 })
    }

    return NextResponse.json({ training }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const { data: training, error } = await supabase
      .from('trainings')
      .update({
        title: body.title,
        instructor: body.instructor,
        location_type: body.locationType?.toLowerCase(),
        location_detail: body.locationDetail,
        structure: body.structure === 'Multi-Lesson' ? 'multi-lesson' : 'single',
        start_date: body.startDate,
        end_date: body.endDate,
        duration_value: body.duration ? parseInt(body.duration) : undefined,
        duration_unit: body.unit?.toLowerCase(),
        category: body.category?.toLowerCase(),
        vision: body.vision,
        mission: body.objective,
        notes_delta: body.notes ? { text: body.notes } : undefined,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 })
    }

    return NextResponse.json({ training }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const { error } = await supabase
      .from('trainings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete training' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Training deleted' }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}