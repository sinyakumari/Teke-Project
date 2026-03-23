import { NextResponse, NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // if "next" is in search params, use it as the redirect URL
  const next = searchParams.get('next') ?? '/home'

  // On deployed platforms (Vercel, Railway, etc.), the request URL may reflect
  // an internal hostname. Use x-forwarded-host + x-forwarded-proto to get
  // the real public origin the user is browsing from.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const publicOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : origin

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${publicOrigin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${publicOrigin}/login?error=auth-callback-failed`)
}
