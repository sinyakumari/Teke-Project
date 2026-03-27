import { NextRequest, NextResponse } from 'next/server'
import { deleteFromGoogleDrive, refreshAccessToken } from '@/lib/google-drive'
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
    let accessToken = request.cookies.get('google_access_token')?.value
    const refreshToken = request.cookies.get('google_refresh_token')?.value
    let newAccessToken = ''
    let tokensUpdated = false

    if (!accessToken && !refreshToken) {
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

    // Delete from Drive with retry logic
    const performDelete = async (token: string) => {
      await deleteFromGoogleDrive({ access_token: token, refresh_token: refreshToken }, lesson.file_id)
    }

    try {
      if (accessToken) {
        await performDelete(accessToken)
      } else {
        throw { response: { status: 401 } }
      }
    } catch (err: any) {
      if (err.response?.status === 401 && refreshToken) {
        try {
          const credentials = await refreshAccessToken(refreshToken)
          newAccessToken = credentials.access_token || ''
          tokensUpdated = true
          await performDelete(newAccessToken)
        } catch (refreshErr) {
          console.error('Failed to refresh token for deletion:', refreshErr)
          return NextResponse.json({ success: false, error: 'Auth expired. Please re-connect.' }, { status: 401 })
        }
      } else {
        console.error('Failed to delete from Drive:', err)
      }
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

    const response = NextResponse.json({ success: true, message: 'Lesson deleted successfully' })
    if (tokensUpdated && newAccessToken) {
      response.cookies.set('google_access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 3600,
        path: '/'
      })
    }
    return response
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
