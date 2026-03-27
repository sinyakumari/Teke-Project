'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const isFormValid = name && email && password && confirmPassword && agreedToTerms

  async function handleRegister() {
    if (!isFormValid) return
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      })
      if (error) {
        setError(error.message)
        return
      }
      setRegistered(true)
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
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#1a1f2e] mb-3 tracking-tight">Check your inbox! ✨</h1>
          <p className="text-gray-500 leading-relaxed mb-10">
            We sent a secure confirmation link to<br/>
            <span className="font-bold text-[#1a1f2e] bg-[#f2f2f7] px-2 py-1 rounded-lg mt-1 inline-block">{email}</span>.
            <br/><br/>
            Please click it to activate your account.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-[#1a1f2e] text-white rounded-2xl py-4 font-bold text-lg hover:bg-[#2d3548] active:scale-[0.98] transition-all shadow-lg shadow-[#1a1f2e]/10"
          >
            Got it, take me to Login
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="h-screen flex bg-white lg:bg-[#1a1f2e] overflow-hidden">
      {/* Left Panel - Signup Form */}
      <div className="flex-1 h-full bg-[#f2f2f7] lg:bg-white flex items-center justify-center px-4 lg:rounded-r-[40px] relative z-20 animate-in fade-in slide-in-from-left duration-700">
        <div className="w-full max-w-md bg-white lg:bg-transparent rounded-3xl shadow-xl lg:shadow-none p-8 lg:p-10">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center mb-6 bg-gray-100 lg:bg-transparent hover:bg-gray-200 rounded-2xl transition-all active:scale-90"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1f2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
            </svg>
          </button>

          <h1 className="text-3xl lg:text-3xl font-bold text-[#1a1f2e] mb-1 tracking-tight">Create account ✨</h1>
          <p className="text-gray-400 mb-6 font-medium text-sm">Start your high-performance journey today</p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-5 flex items-center gap-3 animate-shake">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-red-600 text-[13px] font-medium leading-tight">{error}</p>
            </div>
          )}

          {/* Full Name */}
          <div className="mb-3.5">
            <label className="text-xs font-bold text-[#1a1f2e] mb-1.5 block px-1 uppercase tracking-wider opacity-60">Full name</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a1f2e] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl pl-12 pr-4 py-2.5 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] focus:bg-white transition-all shadow-sm focus:shadow-md"
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-3.5">
            <label className="text-xs font-bold text-[#1a1f2e] mb-1.5 block px-1 uppercase tracking-wider opacity-60">Email address</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a1f2e] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl pl-12 pr-4 py-2.5 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] focus:bg-white transition-all shadow-sm focus:shadow-md"
              />
            </div>
          </div>

          {/* Password Fields Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
            <div>
              <label className="text-xs font-bold text-[#1a1f2e] mb-1.5 block px-1 uppercase tracking-wider opacity-60">Password</label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="········"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-2.5 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] focus:bg-white transition-all shadow-sm focus:shadow-md pr-10"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a1f2e] transition-colors">
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#1a1f2e] mb-1.5 block px-1 uppercase tracking-wider opacity-60">Confirm</label>
              <div className="relative group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="········"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-2.5 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] focus:bg-white transition-all shadow-sm focus:shadow-md pr-10"
                />
                <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a1f2e] transition-colors">
                  {showConfirmPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 mb-6 bg-[#f2f2f7] p-3.5 rounded-2xl group cursor-pointer border border-transparent hover:border-[#1a1f2e]/10 transition-all" onClick={() => setAgreedToTerms(!agreedToTerms)}>
            <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-300 ${
              agreedToTerms ? 'bg-[#1a1f2e] border-[#1a1f2e] scale-105' : 'border-gray-300 bg-white group-hover:border-[#1a1f2e]'
            }`}>
              {agreedToTerms && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </div>
            <p className="text-[12px] text-gray-500 leading-tight font-medium">
              Join TEKE Terms of Service and Privacy Policy. I understand my data is secure.
            </p>
          </div>

          {/* Create Account Button */}
          <button
            onClick={handleRegister}
            disabled={!isFormValid || loading}
            className={`w-full rounded-2xl py-3.5 font-semibold text-base mb-5 shadow-lg transition-all active:scale-[0.98] ${
              isFormValid && !loading
                ? 'bg-[#1a1f2e] text-white hover:bg-[#2d3548] shadow-[#1a1f2e]/10'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating...</span>
              </div>
            ) : 'Create Account →'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest opacity-60">or join with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 font-semibold text-[13px] text-[#1a1f2e] flex items-center justify-center gap-3 mb-6 hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-70 shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          <p className="text-center text-[13px] text-gray-400 font-medium tracking-tight">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1a1f2e] font-semibold hover:underline transition-all">
              Sign in now
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-[55%] h-full flex-col justify-between p-12 bg-[#1a1f2e] relative overflow-hidden text-right animate-in fade-in slide-in-from-right duration-700">
        {/* Subtle Decorative Rings */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] border-[40px] border-white rounded-full" />
          <div className="absolute bottom-[0%] left-[-5%] w-[35%] h-[35%] border-[25px] border-white rounded-full" />
        </div>

        {/* Brand Header */}
        <div className="relative z-10 animate-in fade-in duration-1000 delay-200">
          <div className="flex items-center gap-3 justify-end opacity-80">
            <div className="bg-white/10 backdrop-blur-md w-10 h-10 rounded-xl flex items-center justify-center border border-white/20">
              <span className="text-white text-xl">🚀</span>
            </div>
            <div>
              <span className="text-white text-2xl font-bold tracking-tight">TEKE</span>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 max-w-lg self-end mt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <h2 className="text-white text-5xl lg:text-6xl font-bold leading-[1.1] mb-12">
            One platform.<br />
            Infinite <span className="text-white/40">Potential.</span>
          </h2>
          
          <div className="flex flex-col gap-5">
            {[
              { title: 'Task Management', desc: 'Organize and track tasks effortlessly.', icon: '📋' },
              { title: 'Training Tracker', desc: 'Monitor sessions and measure growth.', icon: '🎓' },
              { title: 'Expert Analytics', desc: 'Get deep insights into performance.', icon: '📊' }
            ].map((feature, i) => (
              <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-[20px] p-4 flex items-center gap-4 text-left group hover:bg-white/10 transition-all duration-300">
                <div className="bg-[#1a1f2e] w-10 h-10 rounded-lg flex items-center justify-center text-lg border border-white/10 shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-white text-base font-bold mb-0.5">{feature.title}</h3>
                  <p className="text-white/40 text-xs leading-none">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Credit */}
        <div className="relative z-10">
          <p className="text-white/20 text-[10px] italic tracking-widest lowercase">Elevating teams with TEKE Project Manager</p>
        </div>
      </div>
    </div>
  )
}