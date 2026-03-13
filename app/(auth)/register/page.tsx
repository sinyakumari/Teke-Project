'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }
      router.push('/home')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        {/* Back + Title */}
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center mb-6 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <h1 className="text-2xl font-bold text-[#1a1f2e] mb-1">Create account</h1>
        <p className="text-gray-400 text-sm mb-6">Start tracking your training journey</p>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Full Name */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Full name</label>
          <input
            type="text"
            placeholder="Rahul Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors"
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="········"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors pr-12"
            />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
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

        {/* Confirm Password */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="········"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors pr-12"
            />
            <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
              {showConfirmPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
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

        {/* Terms */}
        <div className="flex items-start gap-3 mb-6">
          <button
            onClick={() => setAgreedToTerms(!agreedToTerms)}
            className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
              agreedToTerms ? 'bg-[#1a1f2e] border-[#1a1f2e]' : 'border-gray-300 bg-white'
            }`}
          >
            {agreedToTerms && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <p className="text-sm text-gray-500">
            I agree to the{' '}
            <span className="underline text-[#1a1f2e] font-medium cursor-pointer">Terms of Service</span>
            {' '}and{' '}
            <span className="underline text-[#1a1f2e] font-medium cursor-pointer">Privacy Policy</span>
          </p>
        </div>

        {/* Create Account Button */}
        <button
          onClick={handleRegister}
          disabled={!isFormValid || loading}
          className={`w-full rounded-2xl py-3.5 font-semibold text-base mb-4 transition-colors ${
            isFormValid && !loading
              ? 'bg-[#1a1f2e] text-white hover:bg-[#2d3548]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </div>
          ) : 'Create Account'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google */}
        <button className="w-full bg-white border-2 border-gray-200 rounded-2xl py-3.5 font-semibold text-sm text-[#1a1f2e] flex items-center justify-center gap-3 mb-6 hover:bg-gray-50 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1a1f2e] font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}