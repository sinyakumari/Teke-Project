import { NextResponse } from 'next/server'
import { getFileBuffer, refreshAccessToken } from '@/lib/google-drive'
import { cookies } from 'next/headers'

/**
 * Proxy route to bypass CORS and download private Google Drive files
 * GET /api/proxy/google-drive/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params
  
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('google_access_token')?.value || ''
    const refreshToken = cookieStore.get('google_refresh_token')?.value || ''

    // 1. Auto-refresh if access token is missing but refresh token exists
    if (!accessToken && refreshToken) {
      try {
        const credentials = await refreshAccessToken(refreshToken)
        accessToken = credentials.access_token || ''
      } catch (err: any) {
        console.error('[Proxy] Token refresh failed:', err.message)
        return new Response('Authentication session expired. Please re-login with Google.', { status: 401 })
      }
    }

    if (!accessToken) {
      return new Response('Unauthorized: Google account not connected.', { status: 401 })
    }

    // 2. Fetch the actual binary buffer from Google Drive
    try {
      const buffer = await getFileBuffer({ access_token: accessToken }, fileId)
      
      // Convert to ArrayBuffer for the Response constructor
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

      return new Response(arrayBuffer as ArrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Access-Control-Allow-Origin': '*', // Crucial for client-side PDF.js access
          'Content-Length': buffer.length.toString(),
        }
      })
    } catch (driveErr: any) {
      console.error('[Proxy] Google Drive API Error:', driveErr.message)
      // Check if it's a scope/permission issue
      if (driveErr.message?.includes('403') || driveErr.message?.includes('permission')) {
          return new Response('Permission Denied: Ensure you granted "View files in your Google Drive" during login.', { status: 403 })
      }
      return new Response(`Google Drive Error: ${driveErr.message}`, { status: 502 })
    }
  } catch (error: any) {
    console.error('[Proxy] Fatal Error:', error)
    return new Response(`Server error retrieving file: ${error.message}`, { status: 500 })
  }
}
