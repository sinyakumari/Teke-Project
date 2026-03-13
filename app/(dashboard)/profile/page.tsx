'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

  useEffect(() => { fetchUser() }, [])

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
    } catch (_) {}
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="w-6 h-6 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-lg mx-auto w-full flex flex-col gap-3 px-4 pt-6 pb-20">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-[#1a1f2e]">Profile</h1>
            <div className="flex items-center gap-4 text-slate-500">
              <span className="material-symbols-outlined text-[20px] cursor-pointer hover:text-[#1a1f2e]">notifications</span>
              <span className="material-symbols-outlined text-[20px] cursor-pointer hover:text-[#1a1f2e]">settings</span>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm border border-slate-100">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-[#1a1f2e] flex items-center justify-center text-white text-xl font-bold ring-2 ring-white shadow">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full shadow border border-slate-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[10px] text-[#1a1f2e]">photo_camera</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-[#1a1f2e]">{user?.name || 'Sinya kumari'}</p>
              <p className="text-xs text-slate-400">{user?.email || 'sk24@gmail.com'}</p>
            </div>
            <button
              onClick={() => router.push('/profile/edit')}
              className="bg-[#1a1f2e] text-white rounded-full px-6 py-2 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 active:scale-95 transition-all shadow"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              Edit Profile
            </button>
          </div>

          {/* Security */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Security</p>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* App Lock */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#1a1f2e] text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1a1f2e]">App Lock</span>
                </div>
                <Toggle enabled={appLock} onChange={setAppLock} />
              </div>
              <div className="h-px bg-slate-50 mx-4" />
              {/* Change Password */}
              <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#1a1f2e] text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1a1f2e]">Change Password</span>
                </div>
                <span className="material-symbols-outlined text-slate-300 text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Notifications</p>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#1a1f2e] text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1f2e]">Review Reminders</p>
                  <p className="text-[10px] text-slate-400">Get notified to rate your purchases</p>
                </div>
              </div>
              <Toggle enabled={reviewReminders} onChange={setReviewReminders} />
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 rounded-2xl py-3.5 flex items-center justify-center gap-2 hover:bg-red-100 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-red-500 text-[18px]">logout</span>
            <span className="text-red-500 font-bold text-sm">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}