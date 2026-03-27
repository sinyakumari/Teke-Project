import { NextResponse } from 'next/server'

/**
 * DELETE /api/auth/google/disconnect
 * Clears Google Drive cookies, effectively disconnecting the user.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Google Drive disconnected.' })
  
  // Clear both tokens
  response.cookies.set('google_access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0, // Immediately expire
    path: '/'
  })
  response.cookies.set('google_refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/'
  })

  return response
}
