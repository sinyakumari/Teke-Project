
import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/google-drive'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/trainings?error=no_code', request.url))
  }

  try {
    const tokens = await getAccessToken(code)
    
    // Set cookies with tokens
    const response = NextResponse.redirect(new URL('/trainings?success=google_connected', request.url))
    
    if (tokens.access_token) {
      response.cookies.set('google_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 3600, // 7 days (the token will be refreshed by backend if expired)
        path: '/'
      })
    }
    
    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 3600, // 30 days
        path: '/'
      })
    }

    return response
  } catch (error) {
    console.error('Google Auth Callback Error:', error)
    return NextResponse.redirect(new URL('/trainings?error=auth_failed', request.url))
  }
}
