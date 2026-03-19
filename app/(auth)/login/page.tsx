'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setError('Please confirm your email first. Check your inbox for the confirmation link.')
        } else {
          setError(error.message)
        }
        return
      }
      router.push('/home')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/home`,
        },
      })

      if (error) {
        setError(error.message)
      }
      // The redirect happens automatically via Supabase
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      // In OAuth flow, the page will redirect, but we stop loading for safety
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        {/* Logo + Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#1a1f2e] w-12 h-12 rounded-2xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">T</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1f2e]">Welcome back</h1>
            <p className="text-gray-400 text-sm">Sign in to your TEKE account</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
            Email address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors"
          />
        </div>

        {/* Password */}
        <div className="mb-2">
          <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="········"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors pr-12"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M1 1l22 22" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9ca3af" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="2"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Forgot Password */}
        <div className="flex justify-end mb-6">
          <button className="text-sm text-gray-400 hover:text-[#1a1f2e] transition-colors">
            Forgot password?
          </button>
        </div>

        {/* Sign In Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#1a1f2e] text-white rounded-2xl py-3.5 font-semibold text-base mb-4 hover:bg-[#2d3548] transition-colors disabled:opacity-70"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </div>
          ) : 'Sign In'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google Button */}
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-200 rounded-2xl py-3.5 font-semibold text-sm text-[#1a1f2e] flex items-center justify-center gap-3 mb-6 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-70"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#1a1f2e] font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}