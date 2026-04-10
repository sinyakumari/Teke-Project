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
      const origin = window.location.origin.replace(/\.+$/, '')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/api/auth/callback?next=/home`,
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
    <div className="min-h-screen bg-[#f2f2f7] lg:bg-[#1a1f2e] overflow-x-hidden">
      {/* ==========================================
          DESKTOP VIEW (Large screens)
          ========================================== */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        {/* Left Panel - Brand Messaging */}
        <div className="flex lg:w-[55%] h-full flex-col justify-between p-10 bg-[#1a1f2e] relative overflow-hidden animate-in fade-in slide-in-from-left duration-700">
          {/* Subtle Decorative Rings */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] border-[40px] border-white rounded-full translate-x-[-10%] translate-y-[-10%]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] border-[60px] border-white rounded-full translate-x-[10%] translate-y-[10%]" />
          </div>

          {/* Brand Header */}
          <div className="relative z-10 animate-in fade-in duration-1000 delay-200">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md w-10 h-10 rounded-xl flex items-center justify-center border border-white/20">
                <span className="text-white text-xl">🚀</span>
              </div>
              <div>
                <span className="text-white text-2xl font-bold tracking-tight">TEKE</span>
                <p className="text-white/40 text-[10px] font-bold tracking-[0.2em] leading-none uppercase">Project Manager</p>
              </div>
            </div>
          </div>

          {/* Main Tagline */}
          <div className="relative z-10 max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <h2 className="text-white text-5xl font-bold leading-[1.1] mb-4">
              Track <span className="text-white/40">Smarter.</span><br />
              Train <span className="text-white/40">Better.</span>
            </h2>
            <p className="text-white/60 text-base leading-relaxed mb-8">
              Your all-in-one platform for managing trainings and tasks efficiently. Built for high-performance teams.
            </p>

            {/* Stat Badges */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Trainings', icon: '🎓' },
                { label: 'Tasks tracked', icon: '✅' },
                { label: 'Daily progress', icon: '📊' }
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/10 transition-all cursor-default group">
                  <span className="text-base group-hover:scale-110 transition-transform">{stat.icon}</span>
                  <span className="text-white/80 text-xs font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Credit */}
          <div className="relative z-10 animate-in fade-in duration-1000 delay-500">
            <p className="text-white/30 text-xs italic">Join teams already learning smarter with TEKE</p>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 h-full bg-white flex items-center justify-center px-4 rounded-l-[40px] relative z-20 animate-in fade-in slide-in-from-right duration-700">
          <div className="w-full max-w-md p-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#1a1f2e] mb-1">Welcome back 👋</h1>
              <p className="text-gray-400 text-sm">Sign in to your TEKE account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-5 flex items-center gap-3 animate-shake">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <p className="text-red-600 text-[13px] font-medium leading-tight">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="mb-4">
              <label className="text-xs font-bold text-[#1a1f2e] mb-1.5 block px-1 uppercase tracking-wider opacity-60">
                Email address
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a1f2e] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl pl-12 pr-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] focus:bg-white transition-all shadow-sm focus:shadow-md"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-2">
              <label className="text-xs font-bold text-[#1a1f2e] mb-1.5 block px-1 uppercase tracking-wider opacity-60">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a1f2e] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="········"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl pl-12 pr-12 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] focus:bg-white transition-all shadow-sm focus:shadow-md"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a1f2e] transition-colors p-1"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end mb-6">
              <Link href="/forgot-password" title="Go to forgot password flow" className="text-[13px] font-semibold text-gray-400 hover:text-[#1a1f2e] transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#1a1f2e] text-white rounded-2xl py-3.5 font-semibold text-base mb-5 hover:bg-[#2d3548] active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-[#1a1f2e]/10 hover:shadow-[#1a1f2e]/20"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest opacity-60">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google Button */}
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-gray-100 rounded-2xl py-3 font-semibold text-[13px] text-[#1a1f2e] flex items-center justify-center gap-3 mb-6 hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-70 shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Footer Link */}
            <p className="text-center text-[13px] text-gray-400 font-medium tracking-tight">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-[#1a1f2e] font-semibold hover:underline transition-all">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ==========================================
          MOBILE VIEW (Premium design from Stitch)
          ========================================== */}
      <div className="lg:hidden min-h-screen flex flex-col bg-white font-body text-[#1a1c1f] antialiased relative">
        {/* Header: Desktop-style branding */}
        <header className="absolute top-0 left-0 w-full px-8 py-8 z-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md w-10 h-10 rounded-xl flex items-center justify-center border border-white/20">
              <span className="text-white text-lg">🚀</span>
            </div>
            <div>
              <span className="text-white text-xl font-bold tracking-tight font-headline">TEKE</span>
              <p className="text-white/40 text-[8px] font-bold tracking-[0.2em] leading-none uppercase">Project Manager</p>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          {/* Dynamic Hero Section */}
          <section className="hero-mesh relative overflow-hidden pt-28 pb-12 px-8 rounded-b-[3.5rem] shadow-2xl">
            <div className="technical-pattern absolute inset-0 opacity-40"></div>
            <div className="relative z-10 max-w-md mx-auto">
              <h2 className="font-headline text-[2.75rem] font-extrabold text-white leading-[0.9] tracking-[-0.04em] mb-4">
                Track Smarter.<br/>Train Better.
              </h2>
              <p className="text-white/60 font-body text-xs leading-relaxed mb-0">
                Your all-in-one platform for managing trainings and tasks efficiently.
              </p>
            </div>
            {/* Abstract Glow */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-[100px]"></div>
          </section>

          {/* Form Section */}
          <div className="max-w-md mx-auto px-8 -mt-8 mb-12 relative z-20">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] space-y-8">
              
              {/* Form Header */}
              <div>
                <h3 className="text-2xl font-extrabold text-[#030714] font-headline tracking-tight mb-1">Welcome back 👋</h3>
                <p className="text-[#46464c]/60 text-xs font-medium">Sign in to your TEKE account</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <p className="text-red-600 text-[11px] font-bold uppercase tracking-wider">{error}</p>
                </div>
              )}

              {/* Inputs */}
              <div className="space-y-5">
                <div className="group">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#46464c]/60 mb-2 ml-1">Email address</label>
                  <input 
                    className="w-full h-16 px-6 glass-input rounded-2xl focus:ring-0 focus:outline-none text-[#1a1c1f] font-medium" 
                    placeholder="you@example.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <div className="group">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#46464c]/60">Password</label>
                    <Link href="/forgot-password" title="Go to forgot password flow" className="text-[10px] font-bold text-[#030714]/40 uppercase tracking-widest hover:text-[#030714] transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <input 
                    className="w-full h-16 px-6 glass-input rounded-2xl focus:ring-0 focus:outline-none text-[#1a1c1f] font-medium" 
                    placeholder="········" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>

              {/* CTA Cluster */}
              <div className="space-y-4">
                <button 
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full h-16 bg-[#030714] text-white font-headline font-bold text-lg rounded-2xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <>
                      Sign In
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </>
                  )}
                </button>

                <div className="relative py-2 flex items-center">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">or</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-16 bg-white text-[#1a1c1f] font-body font-bold text-sm rounded-2xl border border-gray-100 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 hover:bg-[#f3f3f8] disabled:opacity-70"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  Continue with Google
                </button>
              </div>

              {/* Footer Text */}
              <div className="text-center">
                <p className="text-[#46464c]/60 text-xs font-medium">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-[#030714] font-extrabold underline underline-offset-8 ml-2 hover:text-[#030714]/70 transition-colors">
                    Sign up free
                  </Link>
                </p>
              </div>
            </div> 
            </div>
        </main>
      </div>
    </div>
  )
}