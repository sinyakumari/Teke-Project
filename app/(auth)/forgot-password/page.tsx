'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Password reset link sent to your email')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#1a1f2e] w-12 h-12 rounded-2xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">T</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1f2e]">Reset Password</h1>
            <p className="text-gray-400 text-sm">We&apos;ll send a link to your email</p>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="material-symbols-rounded text-lg">check_circle</span>
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResetRequest}>
          <div className="mb-6">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!message}
            className="w-full bg-[#1a1f2e] text-white rounded-2xl py-3.5 font-semibold text-base mb-6 hover:bg-[#2d3548] transition-colors disabled:opacity-70 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : 'Send Reset Link'}
          </button>
        </form>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/login" className="text-sm text-gray-400 hover:text-[#1a1f2e] transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
