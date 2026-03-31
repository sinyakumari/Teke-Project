'use client'

import React, { useState } from 'react'

interface WorksheetQuestionCardProps {
  question: any
  lessons: any[]
  onDelete: () => void
}

export default function WorksheetQuestionCard({ question: q, lessons, onDelete }: WorksheetQuestionCardProps) {
  const [answer, setAnswer] = useState(q.answer_text || '')
  const [isEditingAnswer, setIsEditingAnswer] = useState(!q.answer_text)
  const [updating, setUpdating] = useState(false)
  const [deleted, setDeleted] = useState(false)
  
  const [newDoubt, setNewDoubt] = useState('')
  const [doubts, setDoubts] = useState<any[]>(q.worksheet_comments || [])
  const [addingDoubt, setAddingDoubt] = useState(false)
  const [showDoubts, setShowDoubts] = useState(false)

  const lesson = lessons.find(l => l.id === q.lesson_id)

  async function handleSaveAnswer() {
    if (updating) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/worksheet-questions/${q.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: q.question_text,
          answerText: answer,
          lessonId: q.lesson_id
        })
      })
      if (res.ok) {
        setIsEditingAnswer(false)
      }
    } catch (error) {
       console.error('Error saving answer:', error)
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Remove this question?')) return
    try {
       const res = await fetch(`/api/worksheet-questions/${q.id}`, {
         method: 'DELETE'
       })
       if (res.ok) {
         setDeleted(true)
         onDelete()
       }
    } catch (error) {
       console.error('Delete error:', error)
    }
  }

  async function handleAddDoubt() {
     if (!newDoubt.trim() || addingDoubt) return
     setAddingDoubt(true)
     try {
        const res = await fetch(`/api/worksheet-questions/${q.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newDoubt })
        })
        const data = await res.json()
        if (data.success) {
           setDoubts(prev => [...prev, data.comment])
           setNewDoubt('')
        }
     } catch (error) {
        console.error('Error adding doubt:', error)
     } finally {
        setAddingDoubt(false)
     }
  }

  async function handleDeleteDoubt(id: string) {
     try {
       const res = await fetch(`/api/worksheet-comments/${id}`, {
         method: 'DELETE'
       })
       if (res.ok) {
         setDoubts(prev => prev.filter(d => d.id !== id))
       }
     } catch (error) {
        console.error('Delete doubt error:', error)
     }
  }

  if (deleted) return null

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-2 shadow-sm space-y-2 transition-all hover:border-[#1a1f2e] group relative">
      <button 
        onClick={handleDelete}
        className="absolute top-2 right-2 w-5 h-5 rounded-lg text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-[12px]">delete</span>
      </button>

      {/* Header: Question Text + Lesson Tag */}
      <div className="pr-6">
         <div className="flex items-center justify-between mb-1">
           <span className="text-slate-300 text-[7px] font-black uppercase tracking-widest">QUESTION</span>
           {lesson && (
             <span className="text-indigo-500 text-[8px] font-black uppercase tracking-tighter">
               {lesson.name}
             </span>
           )}
         </div>
         <p className="text-[11px] font-bold text-[#1a1f2e] leading-tight">{q.question_text}</p>
      </div>

      {/* Answer Section - More Integrated */}
      <div className="space-y-1 pt-1 border-t border-slate-50">
         <div className="flex items-center justify-between">
            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest pl-0.5">My Answer</span>
            {!isEditingAnswer && (
              <button 
                onClick={() => setIsEditingAnswer(true)}
                className="text-[8px] font-black text-indigo-400 hover:text-indigo-600 uppercase tracking-tighter transition-colors"
              >
                EDIT
              </button>
            )}
         </div>

         {isEditingAnswer ? (
           <div className="space-y-1.5 mt-1">
             <textarea 
               value={answer}
               onChange={(e) => {
                 setAnswer(e.target.value);
                 e.target.style.height = 'auto';
                 e.target.style.height = e.target.scrollHeight + 'px';
               }}
               placeholder="Write practice answer..."
               rows={1}
               className="w-full bg-slate-50 border border-transparent focus:border-indigo-100 rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#1a1f2e] outline-none min-h-[28px] max-h-[120px] resize-none transition-all placeholder:text-slate-300"
             />
             <div className="flex justify-end gap-1.5 pb-1">
                <button 
                  onClick={() => setIsEditingAnswer(false)}
                  className="px-2 py-1 bg-slate-50 text-slate-400 rounded-md text-[7px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveAnswer}
                  disabled={updating || !answer.trim()}
                  className="px-3 py-1 bg-[#1a1f2e] text-white rounded-md text-[7px] font-black uppercase tracking-widest shadow-sm active:scale-95 disabled:opacity-30 transition-all"
                >
                  {updating ? '...' : 'SAVE'}
                </button>
             </div>
           </div>
         ) : (
           <p className="text-[10px] font-semibold text-slate-600 px-0.5 leading-snug">
             {answer || 'No answer recorded.'}
           </p>
         )}
      </div>

      {/* Doubts / Comments Footer - Highly Compact */}
      <div className="pt-1.5 border-t border-slate-50">
        <button 
          onClick={() => setShowDoubts(!showDoubts)}
          className="flex items-center gap-1.5 px-0.5 rounded-lg transition-colors group/btn"
        >
           <span className="material-symbols-outlined text-[12px] text-slate-300 group-hover/btn:text-indigo-400 transition-colors">forum</span>
           <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest group-hover/btn:text-slate-400">
              {doubts.length > 0 ? `${doubts.length} Doubts` : 'No Doubts'}
           </span>
           <span className="material-symbols-outlined text-[10px] text-slate-200">
              {showDoubts ? 'expand_less' : 'expand_more'}
           </span>
        </button>

        {showDoubts && (
           <div className="mt-1.5 space-y-1.5 animate-in slide-in-from-top-1 duration-200">
              {doubts.map((d) => (
                <div key={d.id} className="bg-slate-50 px-2 py-1 rounded-lg text-[9px] text-slate-500 font-bold leading-tight flex items-start justify-between gap-1 border border-transparent group/doubt">
                   <p className="flex-1 py-0.5">{d.content}</p>
                   <button 
                     onClick={() => handleDeleteDoubt(d.id)}
                     className="material-symbols-outlined text-[12px] text-slate-200 hover:text-red-400 transition-all shrink-0 mt-0.5"
                   >
                     delete
                   </button>
                </div>
              ))}
              
              <div className="flex items-end gap-1 bg-white p-1 rounded-lg border border-slate-100 focus-within:border-indigo-100 transition-colors">
                 <textarea
                   value={newDoubt}
                   onChange={(e) => {
                     setNewDoubt(e.target.value);
                     e.target.style.height = 'auto';
                     e.target.style.height = e.target.scrollHeight + 'px';
                   }}
                   placeholder="Add doubt..."
                   rows={1}
                   className="flex-1 text-[9px] font-bold text-[#1a1f2e] outline-none min-h-[16px] max-h-[60px] resize-none bg-transparent py-1 px-1.5 placeholder-slate-300"
                 />
                 <button 
                   onClick={handleAddDoubt}
                   disabled={addingDoubt || !newDoubt.trim()}
                   className="w-5 h-5 flex items-center justify-center bg-[#1a1f2e] text-white rounded-md active:scale-95 transition-all disabled:opacity-30 disabled:bg-slate-200 shrink-0 mb-0.5"
                 >
                   <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                 </button>
              </div>
           </div>
        )}
      </div>
    </div>
  )
}
