'use client'

import React, { useState, useEffect } from 'react'
import WorksheetQuestionCard from './WorksheetQuestionCard'

interface WorksheetManagerProps {
  trainingId: string
}

export default function WorksheetManager({ trainingId }: WorksheetManagerProps) {
  const [questions, setQuestions] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [selectedLessonId, setSelectedLessonId] = useState('')

  useEffect(() => {
    fetchWorksheetData()
    fetchLessons()
  }, [trainingId])

  async function fetchWorksheetData() {
    try {
      const res = await fetch(`/api/trainings/${trainingId}/worksheet`)
      const data = await res.json()
      if (data.success) {
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error fetching worksheet:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchLessons() {
    try {
      const res = await fetch(`/api/trainings/${trainingId}/lessons`)
      const data = await res.json()
      if (data.success) {
        setLessons(data.lessons || [])
      }
    } catch (error) {
       console.error('Error fetching lessons:', error)
    }
  }

  async function handleAddQuestion() {
    if (!newQuestionText.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/trainings/${trainingId}/worksheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: newQuestionText,
          lessonId: selectedLessonId || null
        })
      })
      const data = await res.json()
      if (data.success) {
        setQuestions(prev => [...prev, { ...data.question, worksheet_comments: [] }])
        setNewQuestionText('')
        setSelectedLessonId('')
      }
    } catch (error) {
      console.error('Error adding question:', error)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="py-10 text-center animate-pulse">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Syncing Worksheet...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-1">
      {/* Add Question Box - Highly Compact */}
      <div className="bg-white border border-slate-100 rounded-xl p-1.5 shadow-sm flex flex-col gap-1.5">
        <textarea
          value={newQuestionText}
          onChange={(e) => {
            setNewQuestionText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          placeholder="New practice question..."
          rows={1}
          className="w-full text-[10px] font-bold text-[#1a1f2e] outline-none min-h-[24px] max-h-[120px] resize-none bg-slate-50 rounded-lg px-2 py-1.5 placeholder-slate-400 border border-transparent focus:border-indigo-100 transition-all leading-relaxed"
        />
        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-1.5">
            <select 
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="bg-transparent border-none rounded-lg p-0 text-[9px] font-black text-slate-500 outline-none max-w-[150px] truncate uppercase tracking-tighter cursor-pointer hover:text-indigo-600 transition-colors"
            >
              <option value="">No Lesson Linked</option>
              {lessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>{lesson.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddQuestion}
            disabled={adding || !newQuestionText.trim()}
            className="px-2.5 py-1 bg-[#1a1f2e] text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-30 flex items-center gap-1 shadow-sm"
          >
            {adding ? '...' : (
              <>
                <span className="material-symbols-outlined text-[10px]">add</span>
                ADD
              </>
            )}
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-2 pb-20">
        {questions.length === 0 ? (
          <div className="py-10 bg-white border border-dashed border-slate-100 rounded-[1.5rem] flex flex-col items-center justify-center text-slate-200">
            <span className="material-symbols-outlined text-2xl mb-1">quiz</span>
            <p className="text-[8px] font-black uppercase tracking-widest">No questions</p>
          </div>
        ) : (
          questions.map((q) => (
            <WorksheetQuestionCard 
              key={q.id} 
              question={q} 
              lessons={lessons}
              onDelete={() => setQuestions(prev => prev.filter(item => item.id !== q.id))}
            />
          ))
        )}
      </div>
    </div>
  )
}
