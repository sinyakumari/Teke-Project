'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface AddTaskDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const EFFORT_LEVELS = [
  { label: 'Low', value: 'low', hours: 1 },
  { label: 'Medium', value: 'medium', hours: 2 },
  { label: 'High', value: 'high', hours: 4 }
]

export default function AddTaskDrawer({ isOpen, onClose }: AddTaskDrawerProps) {
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [effort, setEffort] = useState<(typeof EFFORT_LEVELS)[0]>(EFFORT_LEVELS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const addStudyTask = useAppStore((state) => state.addStudyTask)
  const addToast = useAppStore((state) => state.addToast)
  const tasks = useAppStore((state) => state.tasks)
  const fetchTasks = useAppStore((state) => state.fetchTasks)

  React.useEffect(() => {
    if (isOpen) fetchTasks()
  }, [isOpen])

  const handleSelectTask = (taskId: string) => {
    if (!taskId) return;
    const t = tasks.find(tsk => tsk.id === taskId);
    if (t) {
      setTitle(t.name);
      if (t.deadline) {
        try {
          setDeadline(new Date(t.deadline).toISOString().split('T')[0]);
        } catch(e) {}
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !deadline) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/study-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          deadline,
          effort_level: effort.value,
          effort_hours: effort.hours
        })
      })

      if (!res.ok) throw new Error('Failed to create task')
      const newTask = await res.json()
      addStudyTask(newTask)
      addToast('Task added to schedule!', 'success')
      
      // Reset & Close
      setTitle('')
      setDeadline('')
      setEffort(EFFORT_LEVELS[0])
      onClose()
    } catch (error) {
      addToast('Failed to add task', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-white z-[110] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Add New Task</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Quick Entry</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[8px] font-black text-indigo-500 uppercase tracking-widest px-1">Import from Board (Optional)</label>
            <div className="relative">
              <select 
                onChange={(e) => handleSelectTask(e.target.value)}
                className="w-full bg-indigo-50/50 border-2 border-indigo-50 focus:border-indigo-100 focus:bg-indigo-50/80 rounded-2xl px-5 py-4 text-sm font-bold text-indigo-900 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a task to auto-fill...</option>
                {tasks.filter(t => t.status !== 'complete').map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="h-px bg-slate-100 mx-2" />

          <div className="space-y-2">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Task Title</label>
            <input 
              autoFocus
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish React Audit"
              className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Deadline Date</label>
            <input 
              required
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Effort Level</label>
            <div className="grid grid-cols-3 gap-3">
              {EFFORT_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setEffort(level)}
                  className={`py-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 ${
                    effort.value === level.value 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{level.label}</span>
                  <span className="text-[9px] opacity-70">{level.hours}h</span>
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-3">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !deadline}
            className="w-full py-4 bg-[#1a1f2e] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Scheduling...' : 'Add to Schedule'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
