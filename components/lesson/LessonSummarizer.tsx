'use client'

import React, { useState, useEffect } from 'react'
import { extractTextFromPdf } from '@/lib/pdf-utils'
import SummaryDrawer from './SummaryDrawer'
import { useAppStore } from '@/store/useAppStore'

interface Lesson {
  id: string
  name: string
  file_url: string
  file_id?: string
  mime_type?: string
  training_id?: string
  notes?: string
  summary?: string[] // jsonb
  summary_raw?: string
}

interface LessonSummarizerProps {
  lesson: Lesson
  onSave: (summary: string[], title?: string) => Promise<void>
  triggerGenerate?: boolean
  onGenerateEnd?: () => void
  isActive?: boolean
  onOpenDrawer?: () => void
}

export default function LessonSummarizer({ lesson, onSave, triggerGenerate, onGenerateEnd, isActive, onOpenDrawer }: LessonSummarizerProps) {
  const [summary, setSummary] = useState<string[]>(lesson.summary || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const addToast = useAppStore((state) => state.addToast)

  // Listen for external trigger
  useEffect(() => {
    if (triggerGenerate && !loading) {
      generateSummary()
    }
  }, [triggerGenerate])

  // Sync state if lesson summary changes
  useEffect(() => {
    if (lesson.summary) setSummary(lesson.summary)
  }, [lesson.summary])

  const generateSummary = async () => {
    if (loading || !lesson?.id || !lesson?.training_id) return
    setLoading(true)
    setError(null)

    try {
      setLoadingMsg('Analyzing...')
      const response = await fetch(`/api/trainings/${lesson.training_id}/lessons/${lesson.id}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: lesson.notes || '', existingBullets: summary })
      })

      const data = await response.json().catch(() => ({}))

      // OCR Fallback logic remains unchanged
      if (!response.ok && data.error?.includes('No readable text') && lesson.file_id) {
         setLoadingMsg('OCR Fallback...')
         const ocrText = await extractTextFromPdf(`/api/proxy/google-drive/${lesson.file_id}`)
         if (ocrText && ocrText.trim().length > 10) {
            const retryRes = await fetch(`/api/trainings/${lesson.training_id}/lessons/${lesson.id}/summarize`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ manualContent: ocrText, notes: lesson.notes || '', existingBullets: summary })
            })
            const retryData = await retryRes.json();
            if (retryRes.ok) {
              if (retryData.noNewContent) addToast('No new content found', 'info')
              else addToast('Summary ready (OCR)', 'success')
              setSummary(retryData.finalBullets || summary); await onSave(retryData.finalBullets || summary, retryData.newTitle)
              return
            }
         }
      }

      if (!response.ok) throw new Error(data.error || 'Failed to generate summary.')
      
      if (data.noNewContent) addToast('No new content found', 'info')
      else addToast('Summary generated', 'success')
      setSummary(data.finalBullets || summary); await onSave(data.finalBullets || summary, data.newTitle)

    } catch (err: any) {
      setError(err.message || 'Error occurred.')
      addToast(err.message, 'error')
    } finally {
      setLoading(false); setLoadingMsg(''); if (onGenerateEnd) onGenerateEnd()
    }
  }

  const handleUpdateBullets = async (updated: string[]) => {
    setSummary(updated); await onSave(updated)
  }

  // MINIMAL UI Components
  const SummaryList = ({ bullets }: { bullets: string[] }) => (
    <ul className="space-y-1 mt-1 list-none">
      {bullets.map((bullet, idx) => (
        <li key={idx} className="flex gap-2 items-start py-0.5">
          <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
          <p className="text-[10px] text-slate-600 font-medium leading-tight">{bullet}</p>
        </li>
      ))}
    </ul>
  )

  if (!isActive && summary.length === 0 && !loading) return null

  return (
    <div className="mt-0.5">
      {loading ? (
        <div className="bg-white border-l-2 border-blue-500 py-2 px-3 animate-pulse">
           <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">{loadingMsg || 'Thinking...'}</p>
        </div>
      ) : summary.length > 0 ? (
        <div className="bg-white border-b border-slate-50 p-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
              {lesson.name} Outline
            </h3>
            <button
              onClick={() => {
                if (onOpenDrawer) onOpenDrawer()
                setDrawerOpen(true)
              }}
              className="flex items-center gap-0.5 text-blue-500 hover:text-blue-700 text-[8px] font-bold uppercase tracking-widest transition-colors"
            >
              <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              View More
            </button>
          </div>

          <SummaryList bullets={summary.slice(0, 3)} />

          {drawerOpen && (
            <SummaryDrawer
              lessonName={lesson.name}
              summary={summary}
              onClose={() => setDrawerOpen(false)}
              onUpdate={handleUpdateBullets}
              loading={loading}
              onRegenerate={generateSummary}
            />
          )}
        </div>
      ) : error ? (
         <div className="py-2"><p className="text-[8px] text-red-400 font-bold uppercase">{error}</p></div>
      ) : null}
    </div>
  )
}
