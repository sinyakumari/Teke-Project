import { NextRequest, NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/google-drive'

export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get('google_access_token')?.value
    const refreshToken = request.cookies.get('google_refresh_token')?.value

    // No tokens at all - not connected
    if (!accessToken && !refreshToken) {
        return NextResponse.json({ success: false, reason: 'not_connected' })
    }

    // Try to validate/refresh the access token
    if (!accessToken && refreshToken) {
        try {
            const credentials = await refreshAccessToken(refreshToken)
            const newAccessToken = credentials.access_token
            if (!newAccessToken) {
                // Refresh token itself is dead
                const res = NextResponse.json({ success: false, reason: 'refresh_expired' })
                res.cookies.delete('google_access_token')
                res.cookies.delete('google_refresh_token')
                return res
            }
            // Return new access token via cookie
            const res = NextResponse.json({ success: true })
            res.cookies.set('google_access_token', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 3600,
                path: '/'
            })
            return res
        } catch (err) {
            console.error('[GoogleCheck] Refresh failed:', err)
            const res = NextResponse.json({ success: false, reason: 'refresh_failed' })
            res.cookies.delete('google_access_token')
            res.cookies.delete('google_refresh_token')
            return res
        }
    }

    return NextResponse.json({ success: true })
}
