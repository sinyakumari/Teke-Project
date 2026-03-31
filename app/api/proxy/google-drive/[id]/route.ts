import { cookies } from 'next/headers'

// Server-side in-memory cache to prevent redundant Drive API calls within a short window
const bufferCache = new Map<string, { buffer: Buffer; expiresAt: number }>()
const CACHE_TTL = 60 * 1000 // 60 seconds 

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params

  // 0. Check Server Cache
  const cached = bufferCache.get(fileId)
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[Proxy] Serving ${fileId} from server-side cache`)
    const buffer = cached.buffer
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(buffer))
        controller.close()
      }
    })
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Access-Control-Allow-Origin': '*',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      }
    })
  }

  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('google_access_token')?.value || ''
    const refreshToken = cookieStore.get('google_refresh_token')?.value || ''

    let newAccessToken: string | null = null

    // 1. Auto-refresh if access token is missing but refresh token exists
    if (!accessToken && refreshToken) {
      try {
        const credentials = await refreshAccessToken(refreshToken)
        accessToken = credentials.access_token || ''
        newAccessToken = accessToken // track to save back in response
      } catch (err: any) {
        console.error('[Proxy] Token refresh failed:', err.message)
        return new Response('Authentication session expired. Please re-login with Google.', { status: 401 })
      }
    }

    if (!accessToken) {
      return new Response('Unauthorized: Google account not connected.', { status: 401 })
    }

    // 2. Try fetching with current token, retry once with refresh if 401
    let buffer: Buffer
    try {
      buffer = await getFileBuffer({ access_token: accessToken }, fileId)
    } catch (firstErr: any) {
      const is401 = firstErr.message?.includes('401') || firstErr.message?.includes('invalid_grant') || firstErr.message?.includes('Invalid Credentials')

      if (is401 && refreshToken) {
        // Token expired mid-session — refresh and retry once
        try {
          console.warn('[Proxy] Access token expired, refreshing...')
          const credentials = await refreshAccessToken(refreshToken)
          accessToken = credentials.access_token || ''
          newAccessToken = accessToken
          buffer = await getFileBuffer({ access_token: accessToken }, fileId)
        } catch (refreshErr: any) {
          console.error('[Proxy] Retry after refresh failed:', refreshErr.message)
          return new Response('Session expired. Please re-login with Google.', { status: 401 })
        }
      } else {
        throw firstErr // re-throw to outer catch
      }
    }

    // 3. Update Cache
    bufferCache.set(fileId, { 
      buffer, 
      expiresAt: Date.now() + CACHE_TTL 
    })

    // 4. Stream buffer back to client
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(buffer))
        controller.close()
      }
    })

    const response = new Response(stream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Access-Control-Allow-Origin': '*',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      }
    })

    // 4. Save refreshed token back to cookie so next request doesn't fail
    if (newAccessToken) {
      response.headers.append(
        'Set-Cookie',
        `google_access_token=${newAccessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
      )
    }

    return response

  } catch (error: any) {
    console.error('[Proxy] Fatal Error:', error)

    if (error.message?.includes('403') || error.message?.includes('permission')) {
      return new Response('Permission Denied: Ensure you granted Drive access during login.', { status: 403 })
    }
    if (error.message?.includes('404')) {
      return new Response('File not found in Google Drive.', { status: 404 })
    }

    return new Response(`Server error retrieving file: ${error.message}`, { status: 500 })
  }
}