'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface Worksheet {
  id: string
  name: string
  training_id: string
  lesson_id: string
  trainingId?: string
  lessonId?: string
  lessonName?: string
  lessons?: { id: string; name: string }
  created_at: string
  createdAt?: string
  questions: any[]
}

interface WorksheetManagerProps {
  trainingId: string
  trainingTitle: string
}

export default function WorksheetManager({ trainingId, trainingTitle }: WorksheetManagerProps) {
  const [lessons, setLessons] = useState<any[]>([])
  const [worksheetName, setWorksheetName] = useState('')
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [creating, setCreating] = useState(false)

  // Drawer and selection state
  const [activeWorksheetId, setActiveWorksheetId] = useState<string | null>(null)
  
  // Question adding state
  const [addingQuestionFor, setAddingQuestionFor] = useState<string | null>(null)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newAnswerText, setNewAnswerText] = useState('')
  const [addingQuestion, setAddingQuestion] = useState(false)

  // App Store actions
  const worksheets = useAppStore((state) => state.worksheets[trainingId] || [])
  const fetchWorksheets = useAppStore((state) => state.fetchWorksheets)
  const addWorksheetStore = useAppStore((state) => state.addWorksheet)
  const deleteWorksheetStore = useAppStore((state) => state.deleteWorksheet)
  const updateQuestionStore = useAppStore((state) => state.updateWorksheetQuestion)
  const deleteQuestionStore = useAppStore((state) => state.deleteWorksheetQuestion)

  useEffect(() => {
    if (worksheets.length === 0) {
      fetchWorksheets(trainingId)
    }
    fetchLessons()
  }, [trainingId])

  async function fetchLessons() {
    try {
      const response = await fetch(`/api/trainings/${trainingId}/lessons`)
      const data = await response.json()
      if (data.success) {
        setLessons(data.lessons || [])
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
    }
  }

  async function handleCreateWorksheet() {
    if (!worksheetName.trim() || !selectedLessonId) return
    setCreating(true)
    try {
      const response = await fetch(`/api/trainings/${trainingId}/worksheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: worksheetName.trim(),
          lessonId: selectedLessonId
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        addWorksheetStore(trainingId, result.worksheet)
        setWorksheetName('')
        setSelectedLessonId('')
      } else {
        alert(result.error || 'Failed to create worksheet')
      }
    } catch (error: any) {
      console.error('Error creating worksheet:', error)
      alert(error.message || 'Error communicating with server')
    } finally {
      setCreating(false)
    }
  }

  async function submitQuestion(worksheetId: string) {
    if (!newQuestionText.trim()) return
    setAddingQuestion(true)
    try {
      const response = await fetch(`/api/trainings/${trainingId}/worksheets/${worksheetId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: newQuestionText.trim(),
          answer_text: newAnswerText.trim()
        })
      })
      const result = await response.json()
      if (response.ok && result.success) {
        updateQuestionStore(trainingId, worksheetId, result.question)
        setNewQuestionText('')
        setNewAnswerText('')
        setAddingQuestionFor(null)
      } else {
        alert(result.error || 'Failed to add question')
      }
    } catch (error) {
      console.error('Error adding question:', error)
    } finally {
      setAddingQuestion(false)
    }
  }

  async function handleDeleteQuestion(worksheetId: string, questionId: string) {
    try {
      const response = await fetch(`/api/trainings/${trainingId}/worksheets/${worksheetId}/questions?id=${questionId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (response.ok && result.success) {
        deleteQuestionStore(trainingId, worksheetId, questionId)
      } else {
        alert(result.error || 'Failed to delete question')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
    }
  }

  async function handleDeleteWorksheet(worksheetId: string) {
    if (!confirm('Are you sure you want to delete this worksheet?')) return
    try {
      const response = await fetch(`/api/trainings/${trainingId}/worksheets/${worksheetId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (response.ok && result.success) {
        deleteWorksheetStore(trainingId, worksheetId)
        if (activeWorksheetId === worksheetId) setActiveWorksheetId(null)
      } else {
        alert(result.error || 'Failed to delete worksheet')
      }
    } catch (error) {
      console.error('Error deleting worksheet:', error)
    }
  }

  const activeWorksheet = worksheets.find(w => w.id === activeWorksheetId)

  return (
    <div className="space-y-3">
      {/* Worksheet Creation Card */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm space-y-2 relative group overflow-hidden">
        <input
          type="text"
          placeholder="Worksheet Name"
          value={worksheetName}
          onChange={(e) => setWorksheetName(e.target.value)}
          className="w-full bg-slate-50 border-none rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-[#1a1f2e] placeholder:font-medium placeholder:text-slate-300 ring-0 h-[32px]"
        />
        <div className="flex items-center justify-between gap-3 h-[32px]">
          <div className="relative inline-block w-[140px]">
            <select
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-lg px-2.5 py-1.5 pr-8 text-[11px] font-bold text-slate-700 appearance-none outline-none focus:ring-1 focus:ring-[#1a1f2e] cursor-pointer h-[32px]"
            >
              <option value="">Select Lesson</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[14px] text-slate-400 pointer-events-none">
              expand_more
            </span>
          </div>
          
          <button
            onClick={handleCreateWorksheet}
            disabled={creating || !worksheetName.trim() || !selectedLessonId}
            className="text-[#1a1f2e] hover:text-slate-900 transition-all disabled:opacity-20 flex items-center justify-center p-1 bg-transparent shrink-0"
            title="Create Worksheet"
          >
            {creating ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
            )}
          </button>
        </div>
      </div>

      {/* Worksheets List */}
      <div className="space-y-2">
        {worksheets.map((worksheet: Worksheet) => (
          <div key={worksheet.id} className="space-y-1.5">
            <div
              className={`bg-white border transition-all rounded-xl shadow-sm cursor-pointer hover:border-slate-300 ${activeWorksheetId === worksheet.id ? 'border-[#1a1f2e] ring-1 ring-[#1a1f2e]/5' : 'border-slate-100'}`}
              onClick={() => setActiveWorksheetId(activeWorksheetId === worksheet.id ? null : worksheet.id)}
            >
                <div className="flex items-center justify-between p-3 flex-nowrap">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-xs font-bold text-[#1a1f2e] truncate">{worksheet.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {worksheet.lessonName || worksheet.lessons?.name || 'Unassigned'} • {(worksheet.questions || []).length} Qs
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setAddingQuestionFor(addingQuestionFor === worksheet.id ? null : worksheet.id); }}
                      className={`material-symbols-outlined text-[18px] transition-colors ${addingQuestionFor === worksheet.id ? 'text-[#1a1f2e]' : 'text-slate-200 hover:text-slate-500'}`}
                    >
                      add_circle
                    </button>
                    <button 
                       onClick={(e) => { e.stopPropagation(); handleDeleteWorksheet(worksheet.id); }}
                       className="material-symbols-outlined text-[18px] text-slate-200 hover:text-red-500 transition-colors"
                    >
                      delete
                    </button>
                  </div>
                </div>
            </div>

            {addingQuestionFor === worksheet.id && (
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2 mx-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  placeholder="Type Question..."
                  autoFocus
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-[12px] font-bold text-[#1a1f2e] outline-none placeholder:font-medium placeholder:text-slate-300 shadow-sm"
                />
                <div className="flex items-center gap-2">
                  <input
                    placeholder="Type Answer..."
                    value={newAnswerText}
                    onChange={(e) => setNewAnswerText(e.target.value)}
                    className="flex-1 bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-600 outline-none placeholder:text-slate-300 shadow-sm"
                  />
                  <button
                    onClick={() => submitQuestion(worksheet.id)}
                    disabled={addingQuestion || !newQuestionText.trim()}
                    className="material-symbols-outlined text-[20px] text-[#1a1f2e] hover:scale-110 active:scale-95 transition-all disabled:opacity-20"
                  >
                    arrow_forward
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SIDE-BY-SIDE SIDE-DRAWER - Matches TrainingDrawer Width (500px) */}
      <div 
        className={`fixed top-0 right-[500px] h-full transition-all duration-300 ease-in-out pointer-events-none z-[112] overflow-hidden ${
          activeWorksheetId ? 'w-[500px]' : 'w-0'
        }`}
      >
        <div 
          className={`absolute top-0 right-0 h-full w-[500px] bg-white border-r border-[#e2e8f0] shadow-[-20px_0_40px_rgba(0,0,0,0.01)] pointer-events-auto transform transition-transform duration-300 ease-in-out overflow-hidden ${
            activeWorksheetId ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {activeWorksheet && (
            <div className="h-full flex flex-col bg-white">
              {/* COMPACT CLEAN HEADER */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between min-h-[60px] shrink-0 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                 <div className="min-w-0 pr-4">
                    <h1 className="text-[17px] font-bold text-[#1a1f2e] leading-tight mb-0.5 truncate">{activeWorksheet.name}</h1>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest truncate">{activeWorksheet.lessonName || activeWorksheet.lessons?.name}</p>
                 </div>
                 <button 
                  onClick={() => setActiveWorksheetId(null)}
                  className="material-symbols-outlined text-slate-200 hover:text-slate-500 transition-colors p-1 -mr-1"
                >
                  close
                </button>
              </div>

              {/* DYNAMIC QUESTIONS LIST */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide bg-[#fcfcfc]">
                {activeWorksheet.questions?.map((question: any, idx: number) => (
                   <div key={question.id || idx} className="bg-white border border-slate-100 p-3.5 rounded-2xl relative group hover:border-slate-300 transition-all flex flex-col shadow-sm max-w-full">
                      <button 
                         onClick={() => handleDeleteQuestion(activeWorksheet.id, question.id)}
                         className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 material-symbols-outlined text-[15px] text-slate-300 hover:text-red-500 transition-all"
                      >
                        delete
                      </button>

                      <div className="space-y-2.5">
                        {/* QUESTION BLOCK */}
                        <div className="flex gap-2.5 items-start overflow-hidden">
                          <span className="text-[10px] font-black text-slate-200 uppercase mt-1 shrink-0 italic min-w-[20px]">Q{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-[#1a1f2e] leading-relaxed break-words whitespace-pre-wrap hyphens-auto antialiased">
                              {question.question}
                            </p>
                          </div>
                        </div>

                        {/* ANSWER BLOCK */}
                        {question.answer && (
                          <div className="flex gap-2.5 items-start pt-2.5 border-t border-slate-50 overflow-hidden">
                            <span className="text-[9px] font-black text-indigo-100 uppercase mt-1 shrink-0 italic min-w-[20px]">Ans</span>
                            <div className="flex-1 min-w-0">
                               <p className="text-[12px] font-medium text-slate-500 leading-relaxed break-words whitespace-pre-wrap hyphens-auto antialiased">
                                  {question.answer}
                               </p>
                            </div>
                          </div>
                        )}
                      </div>
                   </div>
                ))}
                
                {(!activeWorksheet.questions || activeWorksheet.questions.length === 0) && (
                   <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                      <span className="material-symbols-outlined text-5xl mb-2 font-light">sticky_note_2</span>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Questions Yet</p>
                   </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
