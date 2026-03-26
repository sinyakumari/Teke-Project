'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import LessonUpload from './LessonUpload'
import { useAppStore } from '@/store/useAppStore'

interface Lesson {
  id: string
  name: string
  file_url: string
  file_id: string
  file_name: string
  file_size: number
  mime_type: string
  order_index: number
  notes?: string
}

interface LessonManagerProps {
  trainingId: string
}

export default function LessonManager({ trainingId }: LessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false)
  const addToast = useAppStore((state) => state.addToast)

  useEffect(() => {
    fetchLessons()
    checkGoogleAuth()
  }, [trainingId])

  async function checkGoogleAuth() {
    try {
      const response = await fetch('/api/auth/google/check')
      const data = await response.json()
      setIsGoogleAuthenticated(data.success)
    } catch (error) {
      setIsGoogleAuthenticated(false)
    }
  }

  async function fetchLessons() {
    setLoading(true)
    try {
      const response = await fetch(`/api/trainings/${trainingId}/lessons`)
      const data = await response.json()
      if (data.success) {
        setLessons(data.lessons)
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm('Are you sure you want to delete this lesson?')) return

    try {
      const response = await fetch(`/api/trainings/${trainingId}/lessons/${lessonId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        setLessons(prev => prev.filter(l => l.id !== lessonId))
        addToast('Lesson deleted successfully', 'success')
      } else {
        addToast(data.error || 'Failed to delete lesson', 'error')
      }
    } catch (error) {
      addToast('Error deleting lesson', 'error')
    }
  }

  async function updateOrder(lessonId: string, newOrder: number) {
    try {
      const response = await fetch(`/api/trainings/${trainingId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: newOrder })
      })
      if (response.ok) {
        setLessons(prev => 
          prev.map(l => l.id === lessonId ? { ...l, order_index: newOrder } : l)
          .sort((a, b) => a.order_index - b.order_index)
        )
      }
    } catch (error) {
    }
  }

  async function updateNotes(lessonId: string, notes: string) {
    try {
      const response = await fetch(`/api/trainings/${trainingId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      if (response.ok) {
        setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, notes } : l))
      }
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)

  if (loading) {
    return <div className="text-center py-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">Syncing Lessons...</div>
  }

  return (
    <div className="space-y-3">
      <LessonUpload 
        trainingId={trainingId} 
        onUploadComplete={fetchLessons}
        isGoogleAuthenticated={isGoogleAuthenticated}
        onAuthSuccess={() => setIsGoogleAuthenticated(true)}
      />

      <div className="space-y-2">
        {lessons.length > 1 && (
          <div className="flex items-center justify-between px-1">
             <h4 className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Training Media</h4>
          </div>
        )}
        
        {lessons.length > 0 && (
          <div className="space-y-1.5">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="flex flex-col gap-1">
                <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-[#1a1f2e] transition-all">
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 flex-shrink-0">
                      <span className="material-symbols-outlined text-[14px]">
                        {lesson.mime_type?.includes('pdf') ? 'picture_as_pdf' : 
                         lesson.mime_type?.includes('video') ? 'video_library' : 
                         lesson.mime_type?.includes('image') ? 'image' : 'description'}
                      </span>
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-[10px] font-extrabold text-[#1a1f2e] truncate leading-tight">{lesson.name}</p>
                      <p className="text-[7px] text-slate-400 font-bold truncate uppercase tracking-tighter">
                        {(lesson.file_size / (1024 * 1024)).toFixed(2)} MB • {lesson.mime_type?.split('/')[1] || 'FILE'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button 
                      onClick={() => setExpandedNotes(expandedNotes === lesson.id ? null : lesson.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-sm ${
                        lesson.notes || expandedNotes === lesson.id ? 'bg-[#1a1f2e] text-white' : 'bg-slate-50 text-slate-400 hover:text-[#1a1f2e]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">sticky_note_2</span>
                    </button>
                    <a 
                      href={lesson.file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-[#1a1f2e] hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[13px]">visibility</span>
                    </a>
                    <button 
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-red-300 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                    </button>
                  </div>
                </div>
                {expandedNotes === lesson.id && (
                  <div className="mx-2 bg-slate-50 border border-slate-200 border-t-0 rounded-b-lg p-2 animate-in slide-in-from-top-1 duration-200">
                    <textarea
                      placeholder="Add private notes for this lesson..."
                      defaultValue={lesson.notes || ''}
                      onBlur={(e) => updateNotes(lesson.id, e.target.value)}
                      className="w-full bg-transparent border-none text-[9px] font-medium text-slate-600 placeholder:text-slate-300 focus:ring-0 resize-none p-0 min-h-[40px]"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
