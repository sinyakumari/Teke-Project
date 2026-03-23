'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Toggle from '@/components/ui/Toggle'
import { useAppStore } from '@/store/useAppStore'

interface Training {
  id: string
  title: string
  instructor: string
  start_date?: string
  is_archived: boolean
}

interface User {
  id: string
  name: string
  email: string
  profilePicture?: string
  phone?: string
  address?: string
  bio?: string
  appLock?: boolean
  reviewReminders?: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  
  const storeUser = useAppStore((state) => state.user) as User | null
  const storeUserLoading = useAppStore((state) => state.userLoading)
  const storeTrainings = useAppStore((state) => state.trainings)
  const storeTrainingsLoading = useAppStore((state) => state.trainingsLoading)
  const setUser = useAppStore((state) => state.setUser)
  
  const [saving, setSaving] = useState(false)
  
  // Settings States
  const [appLock, setAppLock] = useState(false)
  const [reviewReminders, setReviewReminders] = useState(true)
  
  // Form States
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [bio, setBio] = useState('')

  // UI States
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize form states from store user
  useEffect(() => {
    if (storeUser) {
      setName(storeUser.name || '')
      setEmail(storeUser.email || '')
      setPhone(storeUser.phone || '')
      setAddress(storeUser.address || '')
      setBio(storeUser.bio || '')
      setAppLock(storeUser.appLock || false)
      if (storeUser.reviewReminders !== undefined) {
        setReviewReminders(storeUser.reviewReminders)
      }
    }
  }, [storeUser])

  async function toggleSetting(key: 'appLock' | 'reviewReminders', value: boolean) {
    if (key === 'appLock') setAppLock(value)
    if (key === 'reviewReminders') setReviewReminders(value)
    try {
      await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          [key]: value,
          name,
          email
        }),
      })
      // Update store locally too
      if (storeUser) {
        setUser({ ...storeUser, [key]: value })
      }
    } catch (error) {
      console.error('Error updating setting:', error)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, address, bio }),
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        alert('Profile updated successfully!')
      } else {
        alert('Failed to update profile.')
      }
    } catch (error) {
      console.error('Save error', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (_) {}
    router.push('/login')
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string
        const res = await fetch('/api/user', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profilePicture: base64String }),
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('Upload error', error)
      } finally {
        setUploadingImage(false)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdLoading(true)
    setPwdError('')
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        setPwdError(data.error || 'Failed to change password')
      } else {
        setShowPasswordModal(false)
        setCurrentPassword('')
        setNewPassword('')
        alert('Password changed successfully')
      }
    } catch (error) {
      setPwdError('An error occurred')
    } finally {
      setPwdLoading(false)
    }
  }

  function handleClearCache() {
    localStorage.clear()
    sessionStorage.clear()
    alert('Cache cleared successfully!')
  }

  // Only show the main loader if we don't have user data AND it's loading
  if (storeUserLoading && !storeUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f2f2f7]">
        <div className="w-6 h-6 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      {/* 1. Header Section */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button 
            onClick={() => router.back()}
            className="text-[#1a1f2e] hover:bg-slate-50 p-2 rounded-full transition shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-[#1a1f2e] truncate">Profile Dashboard</h1>
            <div className="hidden sm:flex items-center gap-1.5 ml-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="text-xs font-semibold text-red-500 hover:text-red-600 transition flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 hover:bg-red-50 rounded-xl shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Main Content Area - Balanced Pro-Compact Spacing */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-3.5 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col lg:flex-row gap-5">
            
            {/* 2. Left Column: Profile Card */}
            <div className="lg:w-[320px] shrink-0">
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col items-center lg:sticky lg:top-20">
                    <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-full bg-[#1a1f2e] text-white flex items-center justify-center text-4xl font-bold overflow-hidden shadow-xl border-4 border-white">
                            {uploadingImage ? (
                                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            ) : storeUser?.profilePicture ? (
                                <img src={storeUser.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                storeUser?.name?.charAt(0).toUpperCase() || 'S'
                            )}
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-1 right-1 w-9 h-9 bg-white rounded-full border border-gray-100 flex items-center justify-center shadow-lg hover:bg-gray-50 transition text-[#1a1f2e]"
                        >
                            <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>

                    <h2 className="text-xl font-bold text-[#1a1f2e] mb-1 text-center">{storeUser?.name}</h2>
                    <p className="text-xs text-slate-400 mb-6 text-center">{storeUser?.email}</p>

                    <div className="w-full space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">person</span>
                              <input 
                                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition"
                              />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">mail</span>
                                <input 
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">phone</span>
                                <input 
                                    type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 000 000 000"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Address</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">location_on</span>
                                <input 
                                    type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City, Country"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Right Section */}
            <div className="flex-1 flex flex-col gap-6">
                
                {/* Top Row: Two Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                   
                    {/* Card 1: Account & Performance - Natural Height */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 bg-[#1a1f2e]/5 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#1a1f2e] text-[20px]">settings</span>
                            </div>
                            <h3 className="text-base font-bold text-[#1a1f2e]">Account Settings</h3>
                        </div>
                        <div className="flex-1 flex flex-col space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Professional Bio</label>
                                <textarea 
                                    value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Share a few words about your journey..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition resize-none min-h-[80px]"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[#1a1f2e] text-[16px]">lock</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#1a1f2e]">Privacy Lock</p>
                                        </div>
                                    </div>
                                    <Toggle enabled={appLock} onChange={(val) => toggleSetting('appLock', val)} />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[#1a1f2e] text-[16px]">notifications</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#1a1f2e]">Notifications</p>
                                        </div>
                                    </div>
                                    <Toggle enabled={reviewReminders} onChange={(val) => toggleSetting('reviewReminders', val)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Enrollments Dashboard - Natural Height */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-[#1a1f2e]/5 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#1a1f2e] text-[20px]">auto_stories</span>
                                </div>
                                <h3 className="text-base font-bold text-[#1a1f2e]">Joined</h3>
                            </div>
                            <span className="text-[10px] bg-[#1a1f2e] text-white px-2 py-0.5 rounded-full font-bold">{storeTrainings.length}</span>
                        </div>

                        <div className="flex-1 flex flex-col gap-2">
                            {storeTrainingsLoading && storeTrainings.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : storeTrainings.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-100 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-400">No active trainings.</p>
                                </div>
                            ) : (
                                storeTrainings.slice(0, 3).map((t) => (
                                    <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group cursor-pointer" onClick={() => router.push(`/trainings/${t.id}`)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-[#1a1f2e]">
                                                <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#1a1f2e] group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">{t.title}</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-[#1a1f2e] transition-colors text-[18px]">chevron_right</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <button 
                            onClick={() => router.push('/trainings')}
                            className="w-full mt-4 py-2.5 text-[10px] font-semibold text-[#1a1f2e] hover:bg-slate-50 border border-slate-100 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            Explore Catalog
                            <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Control Center */}
                {/* 4. Professional Control Center v3: Final Polish */}
                <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-3 flex flex-col sm:flex-row items-center justify-center gap-4 shadow-xl border border-slate-100 mt-8 relative z-10 w-full max-w-xl mx-auto ring-1 ring-slate-900/[0.05]">
                    <button 
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="w-44 bg-[#1a1f2e] text-white py-3.5 rounded-2xl font-semibold text-[10px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-[#2a2f3e] transition-all active:scale-[0.98] shadow-lg shadow-slate-200 disabled:opacity-50 ring-1 ring-white/10"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                        )}
                        {saving ? 'Syncing...' : 'Save Profile'}
                    </button>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowPasswordModal(true)}
                            className="px-5 h-11 bg-white text-[#1a1f2e] rounded-2xl hover:bg-slate-50 transition-all border border-slate-200 active:scale-[0.98] flex items-center justify-center gap-2 group shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-[#1a1f2e] transition-colors">lock_person</span>
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#1a1f2e]">Update Password</span>
                        </button>
                        <button 
                            onClick={handleClearCache}
                            title="Purge App Cache"
                            className="h-11 w-11 bg-white text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all border border-slate-200 active:scale-[0.98] flex items-center justify-center group shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">cached</span>
                        </button>
                    </div>
                </div>

            </div>
          </div>
        </div>
      </div>

      {/* Modern Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-[#1a1f2e]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#1a1f2e] text-[24px]">lock_reset</span>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-[#1a1f2e]">Security Update</h3>
                    <p className="text-xs text-slate-400">Protect your account access</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-8 pt-6 space-y-6">
              {pwdError && (
                <div className="bg-red-50 border border-red-100 text-red-500 text-xs p-4 rounded-2xl font-bold flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {pwdError}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Current Password</label>
                  <input 
                    type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:bg-white transition"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">New Secure Password</label>
                  <input 
                    type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:bg-white transition"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <Link 
                    href="/forgot-password" 
                    title="Go to forgot password flow" 
                    className="text-[10px] font-semibold text-slate-400 hover:text-[#1a1f2e] transition-all uppercase tracking-widest"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>
              <button 
                type="submit" disabled={pwdLoading}
                className="w-full bg-[#1a1f2e] text-white font-semibold py-5 rounded-2xl hover:shadow-xl hover:scale-[1.01] transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-3 mt-4"
              >
                {pwdLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <span className="material-symbols-outlined text-[20px]">shield_check</span>
                )}
                {pwdLoading ? 'Verifying...' : 'Authenticate & Update'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}