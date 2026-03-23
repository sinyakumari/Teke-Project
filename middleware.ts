import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Let the OAuth callback pass through — session cookies will be set by /api/auth/callback
  if (pathname.startsWith('/api/auth/callback')) {
    return supabaseResponse
  }

  const protectedRoutes = ['/home', '/trainings', '/tasks', '/profile']
  const authRoutes = ['/login', '/register']

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/home/:path*',
    '/trainings/:path*',
    '/tasks/:path*',
    '/profile/:path*',
    '/login',
    '/register',
    '/api/auth/callback',
  ],
}
