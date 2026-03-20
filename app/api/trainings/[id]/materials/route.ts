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

    const { id: trainingId } = await params

    const { data: materials, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('training_id', trainingId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ materials }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: trainingId } = await params
    const body = await req.json()

    const { data: material, error } = await supabase
      .from('media_files')
      .insert({
        training_id: trainingId,
        user_id: user.id,
        file_type: body.file_type || 'pdf',
        storage_path: body.storage_path,
        file_name: body.file_name,
        file_size_bytes: body.file_size
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ material }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const materialId = searchParams.get('id')
    if (!materialId) return NextResponse.json({ error: 'Material ID required' }, { status: 400 })

    const { error } = await supabase
      .from('media_files')
      .delete()
      .eq('id', materialId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ message: 'Deleted' }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
