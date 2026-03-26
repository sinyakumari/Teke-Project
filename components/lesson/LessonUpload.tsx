'use client'

import React, { useState, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface LessonUploadProps {
  trainingId: string
  onUploadComplete: () => void
  isGoogleAuthenticated: boolean
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

  if (!isGoogleAuthenticated) {
    return (
      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-slate-400">cloud_off</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Connect Drive</span>
        </div>
        <button 
          onClick={handleGoogleAuth}
          className="px-3 py-1.5 bg-[#1a1f2e] text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[12px]">add_to_drive</span>
          CONNECT
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-2.5 shadow-sm space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Connect Drive</span>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1">
             <span className="material-symbols-outlined text-[12px] text-green-500">cloud_done</span>
             <span className="text-[7px] font-black text-green-600 uppercase tracking-widest mt-0.5">ACTIVE</span>
           </div>
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
             title="Attach Media"
           >
             <span className="material-symbols-outlined text-[16px]">attach_file</span>
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
