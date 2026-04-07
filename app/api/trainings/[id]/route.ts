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

    // Build update object with only provided fields
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.instructor !== undefined) updateData.instructor = body.instructor || null
    if (body.locationType !== undefined) updateData.location_type = body.locationType?.toLowerCase() || null
    if (body.locationDetail !== undefined) updateData.location_detail = body.locationDetail || null
    if (body.endDate !== undefined) updateData.end_date = body.endDate || null
    if (body.category !== undefined) updateData.category = body.category?.toLowerCase() || null
    if (body.notifications_enabled !== undefined) updateData.notifications_enabled = body.notifications_enabled
    if (body.is_archived !== undefined) updateData.is_archived = body.is_archived

    console.log('[PUT Training] updateData:', JSON.stringify(updateData))
    console.log('[PUT Training] id:', id, 'user_id:', user.id)

    const { data: training, error } = await supabase
      .from('trainings')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[PUT Training] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!training) {
      return NextResponse.json({ error: 'Training not found after update' }, { status: 404 })
    }

    return NextResponse.json({ training }, { status: 200 })
  } catch (error: any) {
    console.error('[PUT Training] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
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