'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    // We should check if the user is arrived with a valid context
    // This could be checking for a session OR the URL params
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        // If no session found immediately, the link might be invalid or expired
        setError('Your reset link is invalid or has expired. Please request a new one.')
      }
      setVerifying(false)
    }
    
    checkSession()
  }, [])

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    
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
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
      } else {
        alert('Password updated successfully!')
        router.push('/login')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center px-4">
        <div className="w-6 h-6 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
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
            <h1 className="text-2xl font-bold text-[#1a1f2e]">Set New Password</h1>
            <p className="text-gray-400 text-sm">Please choose a strong password</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleUpdatePassword}>
          <div className="mb-4">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <span className="material-symbols-outlined text-gray-400 text-[18px]">visibility_off</span>
                ) : (
                  <span className="material-symbols-outlined text-gray-400 text-[18px]">visibility</span>
                )}
              </button>
            </div>
          </div>

          <div className="mb-8">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword ? (
                  <span className="material-symbols-outlined text-gray-400 text-[18px]">visibility_off</span>
                ) : (
                  <span className="material-symbols-outlined text-gray-400 text-[18px]">visibility</span>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1f2e] text-white rounded-2xl py-3.5 font-semibold text-base hover:bg-[#2d3548] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                Update Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
