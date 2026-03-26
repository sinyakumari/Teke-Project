import { NextRequest, NextResponse } from 'next/server'
import { deleteFromGoogleDrive, setCredentials, refreshAccessToken } from '@/lib/google-drive'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id: trainingId, lessonId } = await params

    if (!trainingId || !lessonId) {
      return NextResponse.json(
        { success: false, error: 'Training ID and lesson ID are required' },
        { status: 400 }
      )
    }

    // Google Auth Check
    const accessToken = request.cookies.get('google_access_token')?.value
    const refreshToken = request.cookies.get('google_refresh_token')?.value

    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Google authentication required' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('file_id')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 })
    }

    // Set credentials and refresh if needed
    setCredentials({ access_token: accessToken, refresh_token: refreshToken })

    // Delete from Drive
    try {
      await deleteFromGoogleDrive(lesson.file_id)
    } catch (driveError) {
      console.error('Failed to delete from Drive:', driveError)
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)

    if (deleteError) {
      console.error('Error deleting lesson from DB:', deleteError)
      return NextResponse.json({ success: false, error: 'Failed to delete lesson' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Lesson deleted successfully' })
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id: trainingId, lessonId } = await params
    const body = await request.json()

    if (!trainingId || !lessonId) {
      return NextResponse.json({ success: false, error: 'Training ID and lesson ID are required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: lesson, error } = await supabase
      .from('lessons')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .select()
      .single()

    if (error) {
      console.error('Error updating lesson:', error)
      return NextResponse.json({ success: false, error: 'Failed to update lesson' }, { status: 500 })
    }

    return NextResponse.json({ success: true, lesson })
  } catch (error) {
    console.error('Error updating lesson:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
