'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import Toggle from '@/components/ui/Toggle'

export default function SettingsPage() {
  const router = useRouter()
  const user = (useAppStore((state) => state.user) as any)
  const setUser = useAppStore((state) => state.setUser)
  const [saving, setSaving] = useState(false)

  // Notification Preferences
  const [notifExpanded, setNotifExpanded] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState({
    all: true,
    trainingUpdates: true,
    unblockedTaskUpdates: true,
    taskUpdates: true
  })

  // Security
  const [appLock, setAppLock] = useState(user?.appLock || false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState('')

  // Connections
  const [googleAccount, setGoogleAccount] = useState<string | null>(null)
  
  useEffect(() => {
    if (user) {
      setAppLock(user.appLock || false)
      if (user.notification_prefs) {
        setNotifPrefs({
           all: user.notification_prefs.all ?? true,
           trainingUpdates: user.notification_prefs.trainingUpdates ?? true,
           unblockedTaskUpdates: user.notification_prefs.unblockedTaskUpdates ?? true,
           taskUpdates: user.notification_prefs.taskUpdates ?? true
        })
      }
    }
  }, [user])

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

  async function handleSaveSettings() {
    setSaving(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appLock,
          notification_prefs: notifPrefs 
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        alert('Settings saved successfully!')
      }
    } catch (error) {
       console.error(error)
    } finally {
       setSaving(false)
    }
  }

  async function handleSwitchGoogleAccount() {
    try {
        const res = await fetch('/api/auth/google?prompt=select_account')
        const data = await res.json()
        if (data.authUrl) {
            window.location.href = data.authUrl
        }
    } catch (e) {}
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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[#1a1f2e] tracking-tight uppercase">Settings</h1>
        </div>
        
        <button 
           onClick={handleSaveSettings}
           disabled={saving}
           className="bg-[#1a1f2e] text-white px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
        >
           {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-hide">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Section: Notifications with Dropdown */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
             <button 
                onClick={() => setNotifExpanded(!notifExpanded)}
                className="w-full h-full flex items-center justify-between p-8 hover:bg-slate-50/50 transition-colors"
             >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-amber-500">notifications_active</span>
                   </div>
                   <div className="text-left">
                      <h2 className="text-base font-bold text-[#1a1f2e] uppercase tracking-widest">Notification Channels</h2>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Custom alerts & system updates</p>
                   </div>
                </div>
                <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${notifExpanded ? 'rotate-180' : ''}`}>
                   keyboard_arrow_down
                </span>
             </button>

             {notifExpanded && (
                <div className="px-8 pb-8 space-y-4 animate-in slide-in-from-top-2 duration-300">
                   <div className="h-[1px] bg-slate-50 w-full mb-6" />
                   {[
                      { key: 'all', label: 'All Notifications', desc: 'Enable or disable all app notifications' },
                      { key: 'trainingUpdates', label: 'Training Updates', desc: 'New lessons, worksheets, and instructor notes' },
                      { key: 'unblockedTaskUpdates', label: 'Unblocked Task Updates', desc: 'Alerts when dependencies for your tasks are cleared' },
                      { key: 'taskUpdates', label: 'Task Updates', desc: 'Status changes and assignments' }
                   ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-2">
                         <div>
                            <h4 className="text-xs font-bold text-[#1a1f2e] uppercase tracking-tight">{item.label}</h4>
                            <p className="text-[10px] font-medium text-slate-500 leading-tight">{item.desc}</p>
                         </div>
                         <Toggle 
                            enabled={(notifPrefs as any)[item.key]} 
                            onChange={(val) => setNotifPrefs(prev => ({ ...prev, [item.key]: val }))} 
                         />
                      </div>
                   ))}
                </div>
             )}
          </div>

          {/* Section: Google Drive Switch Email */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center p-2.5 shadow-sm">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google" className="w-full h-full object-contain" />
                </div>
                <div>
                   <h2 className="text-sm font-bold text-[#1a1f2e] uppercase tracking-widest">Connected Storage</h2>
                   <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest truncate max-w-[150px] sm:max-w-none">
                      {googleAccount || 'No account linked'}
                   </p>
                </div>
             </div>
             <button 
                onClick={handleSwitchGoogleAccount}
                className="px-5 py-3 bg-slate-50 hover:bg-slate-100 text-[#1a1f2e] rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-slate-200 transition-all flex items-center gap-2"
             >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                Switch Email
             </button>
          </div>

          {/* Section: Security / Password */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                   <span className="material-symbols-outlined">security</span>
                </div>
                <div>
                   <h2 className="text-sm font-bold text-[#1a1f2e] uppercase tracking-widest">Security Credentials</h2>
                   <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1.5">
                         <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">App Lock:</span>
                         <Toggle enabled={appLock} onChange={setAppLock} />
                      </div>
                   </div>
                </div>
             </div>
             <button 
                onClick={() => setShowPasswordModal(true)}
                className="px-5 py-3 bg-[#1a1f2e] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
             >
                Change Password
             </button>
          </div>

        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
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
