'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import Toggle from '@/components/ui/Toggle'
import NotificationDropdown from '@/components/ui/NotificationDropdown'

const CATEGORIES = [
  { 
    id: 'deadline_reminders', 
    name: 'Deadline Reminders', 
    schedule: 'Sent 30 days, 7 days, 3 days, 1 day, and on the day of deadline' 
  },
  { 
    id: 'inactivity_alert', 
    name: 'Inactivity Alert', 
    schedule: 'Triggered when no updates on a task for 5, 7, or 14 days' 
  },
  { 
    id: 'dependency_unlocked', 
    name: 'Dependency Unlocked', 
    schedule: 'Triggered immediately when a prerequisite task is completed' 
  },
  { 
    id: 'overdue_task', 
    name: 'Overdue Task', 
    schedule: 'Triggered after deadline passes, with reminders every 3 days' 
  },
  { 
    id: 'weekly_digest', 
    name: 'Weekly Digest', 
    schedule: 'Sent every Monday with summary of tasks and deadlines' 
  }
]

export default function SettingsPage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const updateUser = useAppStore((state) => state.updateUser)
  const trainings = useAppStore((state) => state.trainings)
  const updateTraining = useAppStore((state) => state.updateTraining)
  const addToast = useAppStore((state) => state.addToast)
  
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [googleAccount, setGoogleAccount] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    async function checkGoogle() {
      try {
        const res = await fetch('/api/auth/google/check')
        const data = await res.json()
        if (data.success) {
           setGoogleAccount(data.email || 'Connected')
        }
      } catch (e) {}
    }
    checkGoogle()
  }, [])

  const handleToggleNotify = async (trainingId: string, currentStatus: boolean) => {
    setUpdatingId(trainingId)
    try {
      const response = await fetch(`/api/trainings/${trainingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications_enabled: !currentStatus }),
      })

      if (!response.ok) throw new Error('Failed to update preference')

      const data = await response.json()
      updateTraining(data.training)
      addToast(
        `Notifications for "${data.training.title}" turned ${!currentStatus ? 'ON' : 'OFF'}`,
        'info'
      )
    } catch (error) {
      console.error('Error updating notification preference:', error)
      addToast('Failed to update notification status', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleCategory = async (categoryId: string, type: 'in_app' | 'push') => {
    const currentPrefs = user?.notificationPrefs || {}
    const categoryPrefs = currentPrefs[categoryId] || { in_app: true, push: true }
    
    const newPrefs = {
      ...currentPrefs,
      [categoryId]: {
        ...categoryPrefs,
        [type]: !categoryPrefs[type]
      }
    }
    
    try {
      await updateUser({ notificationPrefs: newPrefs })
      const catName = CATEGORIES.find(c => c.id === categoryId)?.name
      addToast(
        `${type === 'in_app' ? 'In-app' : 'Push'} alerts for ${catName} updated`,
        'success'
      )
    } catch (error) {
      addToast('Failed to update preferences', 'error')
    }
  }

  const handleSwitchGoogleAccount = async () => {
    try {
      const res = await fetch('/api/auth/google?prompt=select_account')
      const data = await res.json()
      if (data.authUrl) window.location.href = data.authUrl
    } catch (e) {}
  }

  const handleChangePassword = async (e: React.FormEvent) => {
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
        addToast('Password changed successfully', 'success')
      }
    } catch (error) {
      setPwdError('An error occurred')
    } finally {
      setPwdLoading(false)
    }
  }

  const handleToggleAppLock = async (val: boolean) => {
    try {
      await updateUser({ appLock: val })
      addToast(`App Lock turned ${val ? 'ON' : 'OFF'}`, 'info')
    } catch (error) {
      addToast('Failed to update security settings', 'error')
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc]">
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-1 pb-32 lg:px-6 lg:pt-3">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 gap-2 pt-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors border border-transparent hover:border-slate-100"
              >
                <span className="material-symbols-outlined text-slate-600">arrow_back</span>
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1f2e] tracking-tight uppercase">Settings</h1>
            </div>
            <NotificationDropdown />
          </div>

          {/* Section: Training Notifications */}
          <div className="mb-4 mt-8 px-1">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
               Training Notifications
             </h2>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Training Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Category</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Notify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {trainings.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <span className="material-symbols-outlined text-4xl">school</span>
                          <p className="text-[10px] font-black uppercase tracking-widest">No trainings added</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    trainings.map((training) => (
                      <tr key={training.id} className="group hover:bg-slate-50/40 transition-all duration-200">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-semibold text-[#1a1f2e] leading-tight">{training.title}</span>
                            <span className="text-[12px] font-medium text-slate-400 mt-0.5 uppercase tracking-tighter">{training.instructor || 'No Instructor'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center">
                            <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-tight rounded-lg border border-slate-100">
                              {training.category || 'General'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-end items-center gap-3">
                            <span className={`text-[8px] font-black uppercase tracking-widest transition-opacity duration-300 ${training.notifications_enabled ? 'text-indigo-600 opacity-100' : 'text-slate-300 opacity-60'}`}>
                              {training.notifications_enabled ? 'ON' : 'OFF'}
                            </span>
                            <div className={updatingId === training.id ? 'opacity-50 pointer-events-none' : ''}>
                              <Toggle 
                                enabled={training.notifications_enabled ?? true} 
                                onChange={() => handleToggleNotify(training.id, training.notifications_enabled ?? true)}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Other Notifications and Alerts */}
          <div className="mb-4 mt-12 px-1">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
               Other Notifications and Alerts
             </h2>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedule</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">In-App</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Push</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {CATEGORIES.map((cat) => {
                    const prefs = user?.notificationPrefs?.[cat.id] || { in_app: true, push: true }
                    return (
                      <tr key={cat.id} className="group hover:bg-slate-50/40 transition-all duration-200">
                        <td className="px-8 py-5">
                          <span className="text-[14px] font-semibold text-[#1a1f2e] leading-tight block">{cat.name}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-[11px] font-medium text-slate-500 leading-tight block max-w-xs capitalize">
                            {cat.schedule}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center">
                            <Toggle 
                              enabled={prefs.in_app} 
                              onChange={() => handleToggleCategory(cat.id, 'in_app')}
                            />
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center">
                            <Toggle 
                              enabled={prefs.push} 
                              onChange={() => handleToggleCategory(cat.id, 'push')}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Combined Section: Storage & Security */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 mb-24">
             {/* Google Drive Account */}
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col justify-between group hover:border-blue-100 transition-colors">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center p-3 shadow-sm group-hover:scale-110 transition-transform">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google" className="w-full h-full object-contain" />
                   </div>
                   <div>
                      <h2 className="text-sm font-bold text-[#1a1f2e] uppercase tracking-widest">Connected Storage</h2>
                      <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest truncate max-w-[200px] mt-0.5">
                         {googleAccount || 'No account linked'}
                      </p>
                   </div>
                </div>
                <div className="mt-8">
                  <button 
                     onClick={handleSwitchGoogleAccount}
                     className="w-full px-5 py-4 bg-slate-50 hover:bg-slate-100 text-[#1a1f2e] rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-slate-100 transition-all flex items-center justify-center gap-3"
                  >
                     <span className="material-symbols-outlined text-[18px]">sync</span>
                     Switch Storage Account
                  </button>
                </div>
             </div>

             {/* Security Section */}
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col justify-between group hover:border-indigo-100 transition-colors">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined">security</span>
                   </div>
                   <div>
                      <h2 className="text-sm font-bold text-[#1a1f2e] uppercase tracking-widest">Security Credentials</h2>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">App Lock:</span>
                         <Toggle enabled={user?.appLock || false} onChange={handleToggleAppLock} />
                      </div>
                   </div>
                </div>
                <div className="mt-8">
                  <button 
                     onClick={() => setShowPasswordModal(true)}
                     className="w-full px-5 py-4 bg-[#1a1f2e] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                     <span className="material-symbols-outlined text-[18px]">key</span>
                     Change Password
                  </button>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#1a1f2e]">lock_reset</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-[#1a1f2e] uppercase tracking-tight text-lg">Update Password</h3>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Enter details below</p>
                    </div>
                </div>
                <button onClick={() => setShowPasswordModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-8 pt-4 space-y-6">
              {pwdError && (
                <div className="bg-red-50 text-red-500 text-[10px] font-bold p-4 rounded-2xl flex items-center gap-3 uppercase">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {pwdError}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                  <input 
                    type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-semibold text-[#1a1f2e] outline-none focus:bg-white focus:border-[#1a1f2e] transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <input 
                    type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-semibold text-[#1a1f2e] outline-none focus:bg-white focus:border-[#1a1f2e] transition"
                  />
                </div>
              </div>
              <button 
                type="submit" disabled={pwdLoading}
                className="w-full bg-[#1a1f2e] text-white font-bold py-5 rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
              >
                {pwdLoading ? 'UPDATING...' : 'CONFIRM CHANGE'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
