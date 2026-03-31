'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import LessonUpload from './LessonUpload'
import LessonSummarizer from './LessonSummarizer'
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
  summary?: string[]
}

interface LessonManagerProps {
  trainingId: string
}

// Lesson management interface for trainings
export default function LessonManager({ trainingId }: { trainingId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false)
  const addToast = useAppStore((state) => state.addToast)

  useEffect(() => {
    if (!trainingId) return
    fetchLessons()
    checkGoogleAuth()
  }, [trainingId])

  async function checkGoogleAuth() {
    try {
      const response = await fetch('/api/auth/google/check')
      if (!response.ok) { setIsGoogleAuthenticated(false); return }
      const data = await response.json()
      setIsGoogleAuthenticated(data.success)
    } catch {
      setIsGoogleAuthenticated(false)
    }
  }

  async function disconnectGoogle() {
    try {
      await fetch('/api/auth/google/disconnect', { method: 'DELETE' })
      setIsGoogleAuthenticated(false)
      addToast('Google Drive disconnected. You can reconnect to grant updated permissions.', 'success')
    } catch {
      addToast('Failed to disconnect Google Drive', 'error')
    }
  }

  async function fetchLessons(autoTrigger = false) {
    setLoading(true)
    setFetchError(false)
    try {
      const response = await fetch(`/api/trainings/${trainingId}/lessons`)
      if (!response.ok) {
        console.warn(`[LessonManager] Lessons fetch returned ${response.status}`)
        setFetchError(true)
        return
      }
      const data = await response.json()
      if (data.success) {
        const newLessons = data.lessons as Lesson[]
        
        // Auto-summary logic: Find if there's a new lesson not in current state
        if (autoTrigger && newLessons.length > lessons.length) {
          const newLesson = newLessons.find(nl => !lessons.some(l => l.id === nl.id))
          if (newLesson && !newLesson.summary) {
            setSummaryTrigger(newLesson.id)
            setActiveSummaryId(newLesson.id)
            addToast(`Processing summary for ${newLesson.name}`, 'info')
          }
        }
        
        setLessons(newLessons)
      }
    } catch {
      console.warn('[LessonManager] Failed to fetch lessons — network or server issue')
      setFetchError(true)
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
    // Optimistic update so that the summarizer has immediate access to the latest typed notes
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, notes } : l))
    try {
      const response = await fetch(`/api/trainings/${trainingId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      if (!response.ok) {
        // Handle error by fetching real state
        fetchLessons()
      }
    } catch {
      console.warn('[LessonManager] Error updating notes')
      fetchLessons()
    }
  }

  async function updateLessonName(lessonId: string, name: string) {
    if (!name.trim() || name === lessons.find(l => l.id === lessonId)?.name) return
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, name } : l))
    try {
      const response = await fetch(`/api/trainings/${trainingId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (!response.ok) fetchLessons()
    } catch {
      console.warn('[LessonManager] Error updating name')
      fetchLessons()
    }
  }

  async function updateSummary(lessonId: string, summary: string[], newTitle?: string) {
    try {
      // The API endpoint handles saving the summary to DB. 
      // If we trigger this strictly from the UI updates (drawer interactions), we might need to actually PUT. 
      // Luckily, the backend already saves it during generation!
      const payload: any = { summary }
      
      const response = await fetch(`/api/trainings/${trainingId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, summary, ...(newTitle ? { name: newTitle } : {}) } : l))
      }
    } catch {
      console.warn('[LessonManager] Error updating summary')
    }
  }

  const [summaryTrigger, setSummaryTrigger] = useState<string | null>(null)
  const [activeSummaryId, setActiveSummaryId] = useState<string | null>(null)
  const [notesDrawerId, setNotesDrawerId] = useState<string | null>(null)

  const handleLessonInteraction = (id: string) => {
    if (activeSummaryId && activeSummaryId !== id) setActiveSummaryId(null)
    if (notesDrawerId && notesDrawerId !== id) setNotesDrawerId(null)
  }

  // Effect to close summary if notes drawer opens for same/other lesson
  useEffect(() => {
    if (notesDrawerId) {
       setActiveSummaryId(null)
    }
  }, [notesDrawerId])

  // Auto-activate summary when summarizing
  useEffect(() => {
    if (summaryTrigger) {
      handleLessonInteraction(summaryTrigger)
      setActiveSummaryId(summaryTrigger)
    }
  }, [summaryTrigger])

  if (loading) {
    return <div className="text-center py-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">Syncing Lessons...</div>
  }

  if (fetchError) {
    return (
      <div className="text-center py-8 bg-white border border-slate-100 rounded-2xl">
        <span className="material-symbols-outlined text-2xl text-slate-300 block mb-2">cloud_off</span>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Couldn't load lessons</p>
        <button
          onClick={() => fetchLessons()}
          className="mt-3 px-4 py-1.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <LessonUpload 
        trainingId={trainingId} 
        onUploadComplete={() => fetchLessons(true)}
        isGoogleAuthenticated={isGoogleAuthenticated}
        onAuthSuccess={() => checkGoogleAuth()}
      />
      
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Training Media</h4>
        </div>
        
        {lessons.length > 0 && (
          <div className="space-y-1.5">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="flex flex-col gap-1">
                <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all">
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
                      onClick={() => {
                        handleLessonInteraction(lesson.id)
                        setNotesDrawerId(notesDrawerId === lesson.id ? null : lesson.id)
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-sm ${
                        lesson.notes || notesDrawerId === lesson.id ? 'bg-[#1a1f2e] text-white' : 'bg-slate-50 text-slate-400 hover:text-[#1a1f2e]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">sticky_note_2</span>
                    </button>
                    
                    {/* NEW AI Summary Icon - Now toggles activeSummaryId as well */}
                    <button 
                      onClick={() => {
                        handleLessonInteraction(lesson.id)
                        const isSummarizing = summaryTrigger === lesson.id
                        const hasSummary = lesson.summary && lesson.summary.length > 0
                        if (!hasSummary && !isSummarizing) {
                           setSummaryTrigger(lesson.id)
                        } else {
                           setActiveSummaryId(activeSummaryId === lesson.id ? null : lesson.id)
                        }
                      }}
                      disabled={summaryTrigger === lesson.id}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-sm ${
                        lesson.summary ? (activeSummaryId === lesson.id ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-blue-50 text-blue-400 hover:bg-blue-100') : 'bg-slate-50 text-slate-300 hover:bg-blue-50 hover:text-blue-400'
                      }`}
                    >
                      {summaryTrigger === lesson.id ? (
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                      )}
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
                {/* Summary Preview Inline (Only shows if active lesson) */}
                <div className="mx-2">
                  {(activeSummaryId === lesson.id || summaryTrigger === lesson.id) && (
                    <LessonSummarizer 
                      lesson={lesson} 
                      onSave={(sum, title) => updateSummary(lesson.id, sum, title)} 
                      triggerGenerate={summaryTrigger === lesson.id}
                      onGenerateEnd={() => setSummaryTrigger(null)}
                      isActive={activeSummaryId === lesson.id}
                      onOpenDrawer={() => setNotesDrawerId(null)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notesDrawerId && (
        <NotesDrawer 
          key={notesDrawerId}
          lesson={lessons.find(l => l.id === notesDrawerId)!} 
          onClose={() => setNotesDrawerId(null)}
          onSave={updateNotes}
          onUpdateName={(name) => updateLessonName(notesDrawerId, name)}
        />
      )}
    </div>
  )
}

function NotesDrawer({ lesson, onClose, onSave, onUpdateName }: { lesson: Lesson, onClose: () => void, onSave: (id: string, notes: string) => Promise<void>, onUpdateName: (name: string) => Promise<void> }) {
  const [notes, setNotes] = useState(lesson.notes || '')
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(lesson.name)

  const handleSave = async () => {
    setSaving(true)
    await onSave(lesson.id, notes)
    setSaving(false)
    setHasChanges(false)
  }

  const handleNameSave = async (e?: React.FocusEvent) => {
    if (e?.relatedTarget && (e.relatedTarget.id === 'cancel-btn' || e.relatedTarget.id === 'close-btn')) {
      setEditName(lesson.name)
      setIsEditingName(false)
      return
    }
    setIsEditingName(false)
    if (editName.trim() && editName !== lesson.name) {
      await onUpdateName(editName)
    } else {
      setEditName(lesson.name)
    }
  }

  return (
    <div className="fixed top-0 bottom-0 md:right-[500px] right-0 z-[130] pointer-events-none h-full">
      <div className="relative w-screen max-w-sm sm:max-w-md bg-[#fdfdfd] shadow-2xl flex flex-col rounded-none pointer-events-auto h-full animate-in slide-in-from-right-8 duration-300">
        
        <div className="p-3.5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm gap-2">
          <div className="flex-1 overflow-hidden">
            {isEditingName ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave()
                  if (e.key === 'Escape') {
                    setEditName(lesson.name)
                    setIsEditingName(false)
                  }
                }}
                className="w-full text-[13px] font-black text-[#1a1f2e] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            ) : (
              <h2 
                onClick={() => setIsEditingName(true)}
                className="text-[13px] font-black text-[#1a1f2e] truncate leading-tight cursor-pointer hover:bg-slate-50 px-1 py-0.5 -ml-1 rounded transition-colors"
                title="Click to rename"
              >
                {lesson.name}
              </h2>
            )}
          </div>
          <button
            id="close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#1a1f2e] hover:bg-slate-100 transition-all outline-none"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col pb-24 scrollbar-hide relative bg-[linear-gradient(#f1f5f9_1px,transparent_1px)] bg-[size:100%_1.5rem]">
             <textarea
               autoFocus
               value={notes}
               onChange={(e) => {
                 setNotes(e.target.value)
                 setHasChanges(e.target.value !== (lesson.notes || ''))
               }}
               onBlur={async (e) => {
                 if (e.relatedTarget && (e.relatedTarget.id === 'cancel-btn' || e.relatedTarget.id === 'close-btn')) {
                   return // do not auto save if cancelling
                 }
                 if (hasChanges) {
                   await handleSave()
                 }
               }}
               placeholder="Write notes"
               className="flex-1 w-full bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[12px] font-semibold text-slate-700 resize-none p-0 leading-[1.5rem] tracking-tight placeholder:text-slate-300 placeholder:font-normal"
             />
        </div>

        <div className="p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-between gap-3 absolute bottom-0 left-0 right-0 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
          <button
            id="cancel-btn"
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border border-slate-200 text-[#1a1f2e] text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all outline-none"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 outline-none bg-[#1a1f2e] text-white shadow-slate-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Update Lesson Notes ✓</>}
          </button>
        </div>

      </div>
    </div>
  )
}
