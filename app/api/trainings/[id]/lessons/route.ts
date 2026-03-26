import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { uploadToGoogleDrive, setCredentials, refreshAccessToken } from '@/lib/google-drive'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainingId } = await params

    if (!trainingId) {
      return NextResponse.json(
        { success: false, error: 'Training ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('training_id', trainingId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching lessons:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lessons' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lessons: lessons || []
    })
  } catch (error) {
    console.error('Error in lessons API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainingId } = await params
    const formData = await request.formData()
    
    if (!trainingId) {
      return NextResponse.json({ success: false, error: 'Training ID is required' }, { status: 400 })
    }

    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const orderIndex = parseInt(formData.get('order') as string) || 0

    if (!file || !name) {
      return NextResponse.json({ success: false, error: 'File and name are required' }, { status: 400 })
    }

    // Google Drive Authentication Setup
    let accessToken = request.cookies.get('google_access_token')?.value
    const refreshToken = request.cookies.get('google_refresh_token')?.value
    let tokensUpdated = false
    let newAccessToken = ''

    // If access token is missing but refresh token exists, get a new one immediately
    if (!accessToken && refreshToken) {
      console.log('Access token missing, attempting refresh with refresh_token...')
      const credentials = await refreshAccessToken(refreshToken)
      accessToken = credentials.access_token || ''
      newAccessToken = accessToken
      tokensUpdated = true
    }

    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Google Drive authentication required' }, { status: 401 })
    }

    // Set credentials for this request
    setCredentials({ access_token: accessToken, refresh_token: refreshToken })

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to Google Drive (folder selection logic could go here)
    console.log('Initiating Google Drive upload for:', file.name)
    const { fileId, webViewLink } = await uploadToGoogleDrive(
      buffer,
      file.name,
      file.type
    )
    console.log('Drive upload success:', fileId)

    const supabase = await createServerSupabaseClient()
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        name,
        file_url: webViewLink,
        file_id: fileId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        training_id: trainingId,
        order_index: orderIndex
      })
      .select()
      .single()

    if (error) {
      console.error('Database insertion error:', error)
      return NextResponse.json({ success: false, error: `DB Error: ${error.message}` }, { status: 500 })
    }

    const response = NextResponse.json({ success: true, lesson })

    // If tokens were refreshed, persist the new access token back to cookies
    if (tokensUpdated && newAccessToken) {
      response.cookies.set('google_access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 3600, // 7 days
        path: '/'
      })
    }

    return response
  } catch (error: any) {
    console.error('Detailed lesson upload error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}
