'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import Toggle from '@/components/ui/Toggle'

interface User {
  name: string
  email: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [appLock, setAppLock] = useState(false)
  const [reviewReminders, setReviewReminders] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    try {
      const res = await fetch('/api/user')
      const data = await res.json()
      setUser(data.user)
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <h1 className="text-xl font-bold text-center text-[#1a1f2e] mb-6">
        Profile
      </h1>

      {/* Avatar + User Info */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <Avatar name={user?.name || '?'} size="lg" />
        <p className="font-bold text-[#1a1f2e] text-base">{user?.name}</p>
        <p className="text-gray-400 text-sm">{user?.email}</p>
        <button
          onClick={() => router.push('/profile/edit')}
          className="flex items-center gap-2 border border-gray-200 rounded-full px-5 py-2 text-sm font-medium text-[#1a1f2e] mt-1 hover:bg-gray-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 19V12"
              stroke="#1a1f2e"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
              stroke="#1a1f2e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Edit Profile
        </button>
      </div>

      {/* Security Section */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Security
      </p>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
        {/* App Lock */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 w-9 h-9 rounded-xl flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
                    stroke="#1a1f2e"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    stroke="#1a1f2e"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="16" r="1.5" fill="#1a1f2e" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[#1a1f2e]">
                App Lock (Biometric/PIN)
              </span>
            </div>
            <Toggle enabled={appLock} onChange={setAppLock} />
          </div>
          {appLock && (
            <p className="text-xs text-gray-400 mt-2 ml-12">
              No biometrics enrolled on this device. Go to device Settings
              to set up fingerprint or face unlock.
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-4" />

        {/* Change Password */}
        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 w-9 h-9 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="11"
                  rx="2"
                  stroke="#1a1f2e"
                  strokeWidth="2"
                />
                <path
                  d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
                  stroke="#1a1f2e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#1a1f2e]">
              Change Password
            </span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Notifications Section */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Notifications
      </p>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
        {/* Review Reminders */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 w-9 h-9 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                  stroke="#1a1f2e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#1a1f2e]">
              Review Reminders
            </span>
          </div>
          <Toggle enabled={reviewReminders} onChange={setReviewReminders} />
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-4" />

        {/* Notification Settings */}
        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 w-9 h-9 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6H20M4 12H20M4 18H20"
                  stroke="#1a1f2e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M16 6V4M16 20V18M8 12V10M8 14V12"
                  stroke="#1a1f2e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#1a1f2e]">
              Notification Settings
            </span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Data Section */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Data
      </p>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 w-9 h-9 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6H21M8 6V4H16V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6"
                  stroke="#1a1f2e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#1a1f2e]">
              Clear Local Cache
            </span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full border-2 border-red-500 rounded-2xl py-4 text-red-500 font-bold text-base mb-4 hover:bg-red-50"
      >
        Log Out
      </button>

      {/* Version */}
      <p className="text-center text-gray-400 text-sm mb-6">
        TEKE v1.0.0
      </p>
    </div>
  )
}