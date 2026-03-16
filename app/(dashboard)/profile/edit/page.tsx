'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  name: string
  email: string
  profilePicture?: string
}

export default function EditProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchUser() }, [])

  async function fetchUser() {
    try {
      const res = await fetch('/api/user')
      const data = await res.json()
      setUser(data.user)
      if (data.user) {
        setName(data.user.name || '')
        setEmail(data.user.email || '')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      if (res.ok) {
        router.push('/profile')
      } else {
        alert('Failed to save profile.')
      }
    } catch (error) {
      console.error('Save error', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f2f2f7]">
        <div className="w-6 h-6 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      <div className="flex-1 overflow-y-auto scrollbar-hide flex justify-center">
        <div className="w-full max-w-5xl px-4 lg:px-8 py-6 pb-20">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden relative pb-8 w-full">
            
            {/* Top Banner Gradient */}
            <div className="h-24 w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-[#1a1f2e]/10"></div>

        {/* Header Actions (Back / Title) */}
        <div className="absolute top-4 left-4 flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white shadow-sm transition"
          >
            <span className="material-symbols-outlined text-[#1a1f2e] text-[20px]">arrow_back</span>
          </button>
        </div>

        {/* Profile Info Overlay section */}
        <div className="px-6 sm:px-10 relative -mt-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          
          <div className="flex items-end gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full border-[3px] border-white bg-[#1a1f2e] text-white flex items-center justify-center text-2xl font-bold shadow-sm overflow-hidden bg-cover bg-center">
                  {uploadingImage ? (
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  ) : user?.profilePicture ? (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                     user?.name?.charAt(0).toUpperCase() || 'S'
                  )}
              </div>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#1a1f2e] text-white rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:bg-slate-800 transition shadow-sm z-10"
              >
                  <span className="material-symbols-outlined text-[14px]">add_a_photo</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload} 
              />
            </div>

            <div className="mb-2">
              <h2 className="text-xl font-bold text-[#1a1f2e] leading-tight">{user?.name || 'Sinya kumari'}</h2>
              <p className="text-xs text-slate-500">{user?.email || 'sk24@gmail.com'}</p>
            </div>
          </div>
        </div>

        {/* Main Form Area */}
        <form onSubmit={handleSave} className="px-6 sm:px-10 max-w-3xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8">
            
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">Full Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:bg-white transition"
                required
              />
            </div>

            {/* Nick Name (Placeholder) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">Nick Name</label>
              <input 
                type="text"
                placeholder="Your Nick Name"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:bg-white transition"
              />
            </div>

            {/* Gender (Placeholder) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">Gender</label>
              <div className="relative">
                <select className="appearance-none w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 outline-none focus:border-[#1a1f2e] focus:bg-white transition cursor-pointer">
                  <option>Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Non-Binary</option>
                  <option>Prefer not to say</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>

            {/* Country (Placeholder) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">Country</label>
              <div className="relative">
                <select className="appearance-none w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 outline-none focus:border-[#1a1f2e] focus:bg-white transition cursor-pointer">
                  <option>Select Country</option>
                  <option>United States</option>
                  <option>India</option>
                  <option>United Kingdom</option>
                  <option>Canada</option>
                  <option>Australia</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>

            {/* Language (Placeholder) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">Language</label>
              <div className="relative">
                <select className="appearance-none w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 outline-none focus:border-[#1a1f2e] focus:bg-white transition cursor-pointer">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Hindi</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>

            {/* Time Zone (Placeholder) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">Time Zone</label>
              <div className="relative">
                <select className="appearance-none w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 outline-none focus:border-[#1a1f2e] focus:bg-white transition cursor-pointer">
                  <option>GMT+05:30 (India Standard)</option>
                  <option>GMT-08:00 (Pacific)</option>
                  <option>GMT-05:00 (Eastern)</option>
                  <option>GMT+00:00 (UTC)</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>

          </div>

          {/* Email Section */}
          <div className="border-t border-gray-100 pt-6 mb-8">
            <h3 className="text-[#1a1f2e] font-bold text-[13px] mb-4">My Email Address</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">mail</span>
              </div>
              <div className="flex-1">
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-semibold text-[13px] text-[#1a1f2e] bg-transparent outline-none w-full"
                  required
                />
                <p className="text-[11px] text-slate-400">Primary email</p>
              </div>
            </div>
            
            <button type="button" className="text-blue-500 font-bold text-[11px] flex items-center gap-1 hover:text-blue-600 transition">
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add Email Address
            </button>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3">
            <button 
              type="submit" 
              disabled={saving}
              className="px-8 py-3 bg-[#1a1f2e] text-white rounded-xl text-[13px] font-bold shadow-md hover:bg-[#2d3548] transition disabled:opacity-70 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
            <button 
              type="button"
              onClick={() => router.push('/profile')}
              className="px-8 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition sm:hidden"
            >
              Cancel
            </button>
          </div>

        </form>

          </div>
        </div>
      </div>
    </div>
  )
}
