import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const protectedRoutes = ['/home', '/trainings', '/tasks', '/profile']
const authRoutes = ['/login', '/register']

export function middleware(req: NextRequest) {
    const token = req.cookies.get('token')?.value
    const { pathname } = req.nextUrl

    const isProtected = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    )
    const isAuthRoute = authRoutes.some((route) =>
        pathname.startsWith(route)
    )

    if (isProtected && !token) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    if (isAuthRoute && token) {
        const decoded = verifyToken(token)
        if (decoded) {
            return NextResponse.redirect(new URL('/home', req.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/home/:path*', '/trainings/:path*', '/tasks/:path*', '/profile/:path*', '/login', '/register'],
}