'use client'

import React, { useState, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface LessonUploadProps {
  trainingId: string
  onUploadComplete: () => void
  isGoogleAuthenticated: boolean | null
  onAuthSuccess: () => void
}

export default function LessonUpload({ trainingId, onUploadComplete, isGoogleAuthenticated, onAuthSuccess }: LessonUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [lessonNames, setLessonNames] = useState<{ [key: string]: string }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addToast = useAppStore((state) => state.addToast)

  async function handleGoogleAuth() {
    try {
      const response = await fetch('/api/auth/google')
      const data = await response.json()
      if (data.success) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      addToast('Error initiating Google auth', 'error')
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
    
    // Auto-generate lesson names based on file names
    const names: { [key: string]: string } = {}
    files.forEach((file, index) => {
      names[index] = file.name.split('.')[0]
    })
    setLessonNames(names)
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return
    setUploading(true)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('name', lessonNames[i] || file.name)
        formData.append('trainingId', trainingId)
        formData.append('order', (10 + i * 10).toString())

        const response = await fetch(`/api/trainings/${trainingId}/lessons`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }
      }

      addToast('Upload successful! 🎉', 'success')
      setSelectedFiles([])
      setLessonNames({})
      onUploadComplete()
    } catch (error: any) {
      console.error('Upload failed:', error)
      addToast(error.message || 'Failed to upload some lessons', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (isGoogleAuthenticated === null) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl mb-2 text-center animate-pulse">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-2">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="space-y-1 mb-4 opacity-50">
          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">Verifying Access...</span>
        </div>
      </div>
    )
  }

  if (isGoogleAuthenticated === false) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl mb-2 text-center">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-2">
          <span className="material-symbols-outlined text-2xl text-slate-300">cloud_off</span>
        </div>
        <div className="space-y-1 mb-4">
          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">Connect Google Drive</span>
          <p className="text-[8px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider px-4">Secure your media & notes by syncing with your drive account</p>
        </div>
        <button 
          onClick={handleGoogleAuth}
          className="px-6 py-2.5 bg-[#1a1f2e] text-white rounded-xl text-[9px] font-black uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 group"
        >
          <span className="material-symbols-outlined text-[14px] group-hover:rotate-12 transition-transform">add_to_drive</span>
          CONNECT NOW
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-1 shadow-sm space-y-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">Connect Drive</span>
        <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-50/50 rounded-md group">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[9px] text-green-500">cloud_done</span>
                <span className="text-[6.5px] font-bold text-green-600 uppercase tracking-widest mt-0.5">ACTIVE</span>
              </div>
              <button 
                onClick={async () => {
                  try {
                    await fetch('/api/auth/google/disconnect', { method: 'DELETE' })
                    onAuthSuccess() // Reset state to check auth again
                    addToast('Google Drive disconnected', 'success')
                  } catch (e) {
                    addToast('Failed to disconnect', 'error')
                  }
                }}
                className="w-3 h-3 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                title="Disconnect Google Drive"
              >
                <span className="material-symbols-outlined text-[10px]">link_off</span>
              </button>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-6 h-6 bg-[#1a1f2e] text-white rounded-md flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm"
              title="Attach Media"
            >
              <span className="material-symbols-outlined text-[14px]">attach_file</span>
            </button>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        multiple 
        className="hidden" 
      />

      {selectedFiles.length > 0 ? (
        <div className="space-y-3">
          {selectedFiles.map((file, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px]">description</span>
                </div>
                <input 
                  type="text" 
                  value={lessonNames[i] || ''}
                  onChange={(e) => setLessonNames({ ...lessonNames, [i]: e.target.value })}
                  placeholder="Lesson name..."
                  className="flex-1 bg-white border border-slate-100 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#1a1f2e] outline-none"
                />
              </div>
              <p className="text-[8px] text-slate-400 font-medium truncate uppercase pl-11">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type.split('/')[1] || 'FILE'}
              </p>
            </div>
          ))}

          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedFiles([])}
              className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 py-3 bg-[#1a1f2e] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-100 active:scale-95 disabled:opacity-50"
            >
              {uploading ? 'UPLOADING...' : 'START UPLOAD'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
