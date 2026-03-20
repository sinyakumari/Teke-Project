'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'

export default function NewTaskPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTrainingId = searchParams.get('training_id')
  const editId = searchParams.get('id')

  const allTrainings = useAppStore((state) => state.trainings)
  const allTasks = useAppStore((state) => state.tasks)
  const addTask = useAppStore((state) => state.addTask)
  const updateStoreTask = useAppStore((state) => state.updateTask)
  const tasksLoading = useAppStore((state) => state.tasksLoading)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [taskName, setTaskName] = useState('')
  const [trainingId, setTrainingId] = useState(initialTrainingId || '')
  const [blockedBy, setBlockedBy] = useState<string>('')
  const [deadline, setDeadline] = useState('')
  const [showBlockedDropdown, setShowBlockedDropdown] = useState(false)

  // Filter tasks for blockers - only show tasks from the same training
  const filteredTasksForBlockers = allTasks.filter(t => t.training_id === trainingId && t.id !== editId)

  useEffect(() => {
    if (editId) {
      fetchTaskDetails(editId)
    }
  }, [editId])

  async function fetchTaskDetails(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${id}`)
      if (!res.ok) throw new Error('Failed to fetch task')
      const { task } = await res.json()
      
      setTaskName(task.name || '')
      setTrainingId(task.training_id || '')
      setBlockedBy(task.blocked_by_task_id || '')
      setDeadline(task.deadline ? task.deadline.split('T')[0] : '')
    } catch (err) {
      setError('Failed to load task details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1)

  const steps = [
    { id: 1, label: 'Objective' },
    { id: 2, label: 'Logistics' },
    { id: 3, label: 'Review' },
  ]

  const handleNext = () => {
    if (currentStep === 1) {
      if (!taskName.trim()) {
        setError('Task name is required')
        return
      }
      if (!trainingId) {
        setError('Please select a training')
        return
      }
    }
    setError('')
    setCurrentStep((prev) => Math.min(prev + 1, steps.length))
  }

  const handleBack = () => {
    setError('')
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  async function handleSubmit() {
    if (!taskName.trim()) {
      setError('Task name is required')
      setCurrentStep(1)
      return
    }
    if (!trainingId) {
      setError('Please select a training')
      setCurrentStep(1)
      return
    }

    setLoading(true)
    setError('')

    try {
      const url = editId ? `/api/tasks/${editId}` : '/api/tasks'
      const method = editId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName,
          training_id: trainingId,
          blocked_by_task_id: blockedBy || null,
          deadline: deadline || null,
          ...(editId ? {} : { status: 'pending' }),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || `Failed to ${editId ? 'update' : 'create'} task`)
        return
      }

      const savedData = await res.json()
      if (editId) {
        updateStoreTask(savedData.task)
      } else {
        addTask(savedData.task)
      }

      router.push('/tasks')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const selectedBlockedName = allTasks.find((t) => t.id === blockedBy)?.name

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="w-full max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <h1 className="text-sm font-bold text-[#1a1f2e]">{editId ? 'Edit Task' : 'New Task'}</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-2 px-6">
        <div className="max-w-4xl mx-auto">
          
          {/* STEP INDICATOR */}
          <div className="flex items-center justify-center gap-8 mb-3">
            {steps.map((step) => (
              <button 
                key={step.id} 
                onClick={() => {
                  if (step.id > 1 && !taskName.trim()) {
                    setError('Task name is required')
                    return
                  }
                  setCurrentStep(step.id)
                  setError('')
                }}
                className="group flex flex-col items-center gap-2"
              >
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                    currentStep === step.id 
                      ? 'bg-[#1a1f2e] border-[#1a1f2e] text-white shadow-xl scale-110' 
                      : currentStep > step.id
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-400 group-hover:border-[#1a1f2e] group-hover:text-[#1a1f2e]'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-[0.1em] transition-colors ${
                  currentStep === step.id ? 'text-[#1a1f2e]' : 'text-gray-400 group-hover:text-[#1a1f2e]'
                }`}>
                  {step.label}
                </span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[1.5rem] shadow-2xl shadow-navy-900/10 border border-gray-100 p-5 pt-7 relative overflow-hidden">
            {/* Target Icon - Hero Element */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400/10 rounded-3xl flex items-center justify-center text-4xl animate-in zoom-in duration-500 delay-300">
              🎯
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-red-500 text-sm font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  {error}
                </p>
              </div>
            )}

            <div className="min-h-[200px] flex flex-col">
              {/* STEP 1: OBJECTIVE */}
              {currentStep === 1 && (
                <div className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] uppercase font-bold tracking-widest mb-2">Step 01 / 03</span>
                    <h2 className="text-xl font-bold outfit text-[#1a1f2e] mb-0.5">What are you working on?</h2>
                    <p className="text-gray-400 text-[11px]">Define your task and select the training project.</p>
                  </div>

                  <div className="w-full max-w-md space-y-4 mt-1">
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="e.g. Design the user profile screen"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        className="w-full text-center text-2xl font-bold outfit border-b-2 border-gray-100 outline-none focus:border-[#1a1f2e] pb-6 transition-all placeholder-gray-200 bg-transparent text-[#1a1f2e]"
                      />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#1a1f2e] transition-all group-focus-within:w-full" />
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center block">Related Training</label>
                      <div className="relative group">
                        <select
                          value={trainingId}
                          onChange={(e) => setTrainingId(e.target.value)}
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-center text-sm font-bold text-[#1a1f2e] appearance-none outline-none focus:border-[#1a1f2e] focus:bg-white transition-all cursor-pointer shadow-sm"
                        >
                          <option value="">Choose a Training Project...</option>
                          {allTrainings.map((t) => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#1a1f2e]">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: LOGISTICS */}
              {currentStep === 2 && (
                <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-center mb-4">
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] uppercase font-bold tracking-widest mb-2">Step 02 / 03</span>
                    <h2 className="text-xl font-bold outfit text-[#1a1f2e] mb-0.5">Timing & Dependencies</h2>
                    <p className="text-gray-400 text-[11px]">Set your finish line and any critical blockers.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Deadline</label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-all shadow-sm"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Blocked By</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowBlockedDropdown(!showBlockedDropdown)}
                          className={`w-full bg-white border-2 rounded-2xl px-5 py-3.5 text-sm text-left outline-none transition-all flex items-center justify-between shadow-sm group ${
                            showBlockedDropdown ? 'border-[#1a1f2e]' : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-300 group-hover:text-[#1a1f2e] transition-colors">
                              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                            </svg>
                            <span className={`font-bold truncate ${selectedBlockedName ? 'text-[#1a1f2e]' : 'text-gray-300'}`}>
                              {selectedBlockedName || 'Add Prerequisites...'}
                            </span>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-300 ${showBlockedDropdown ? 'rotate-180 text-[#1a1f2e]' : 'text-gray-300'}`}>
                            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>

                        {showBlockedDropdown && (
                          <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 mt-2 z-50 max-h-[220px] overflow-y-auto overflow-x-hidden animate-in slide-in-from-top-2">
                            <button
                              onClick={() => { setBlockedBy(''); setShowBlockedDropdown(false); }}
                              className="w-full text-left px-6 py-4 hover:bg-gray-50 text-sm font-semibold border-b border-gray-50 text-gray-400"
                            >
                              None (No Blocker)
                            </button>
                            {filteredTasksForBlockers.length > 0 ? (
                              filteredTasksForBlockers.map((task) => (
                                <button
                                  key={task.id}
                                  onClick={() => { setBlockedBy(task.id); setShowBlockedDropdown(false); }}
                                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 text-sm font-semibold border-b border-gray-50 last:border-0 transition-colors"
                                >
                                  <span className="text-[#1a1f2e]">{task.name}</span>
                                  {blockedBy === task.id && (
                                    <div className="bg-[#1a1f2e] text-white p-1 rounded-md">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                  )}
                                </button>
                              ))
                            ) : (
                              <div className="p-10 text-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No previous tasks</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW */}
              {currentStep === 3 && (
                <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-center mb-4">
                    <span className="inline-block px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] uppercase font-bold tracking-widest mb-2">Step 03 / 03</span>
                    <h2 className="text-xl font-bold outfit text-[#1a1f2e] mb-0.5">Final Confirmation</h2>
                    <p className="text-gray-400 text-[11px]">Review your task details before committing.</p>
                  </div>

                  <div className="max-w-3xl mx-auto space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#1a1f2e] p-5 rounded-[1.5rem] text-white shadow-xl flex flex-col justify-center">
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mb-1">Action Name</p>
                        <h3 className="text-lg font-bold outfit truncate">{taskName}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-3.5 rounded-[1.2rem] border border-gray-100 shadow-sm">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Project</p>
                          <p className="font-bold text-[#1a1f2e] text-xs truncate">{allTrainings.find(t => t.id === trainingId)?.title || '—'}</p>
                        </div>
                        <div className="bg-gray-50 p-3.5 rounded-[1.2rem] border border-gray-100 shadow-sm">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Deadline</p>
                          <p className="font-bold text-blue-600 text-xs">{deadline || '—'}</p>
                        </div>
                      </div>

                      <div className="col-span-2 bg-gray-50 p-4 rounded-[1.2rem] border border-gray-100 shadow-sm">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Dependencies</p>
                        {selectedBlockedName ? (
                          <span className="bg-white border border-gray-200 px-2 py-1 rounded-lg text-[10px] font-bold text-[#1a1f2e] shadow-sm flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-blue-500 rounded-full" />
                            {selectedBlockedName}
                          </span>
                        ) : (
                          <p className="text-[10px] font-semibold text-gray-400 italic">No prerequisites — Ready for action.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NAVIGATION FOOTER */}
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-50">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`group flex items-center gap-3 font-bold text-sm px-6 py-3.5 rounded-2xl transition-all shadow-lg active:scale-95 ${
                  currentStep === 1 
                    ? 'bg-gray-50 text-gray-200 cursor-not-allowed shadow-none' 
                    : 'bg-[#1a1f2e] text-white hover:bg-[#2d3548]'
                }`}
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Back
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="bg-[#1a1f2e] text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:translate-x-1 transition-all shadow-2xl active:scale-95 flex items-center gap-3 group"
                >
                  Continue 
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-blue-600 text-white px-10 py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-2xl active:scale-95 flex items-center gap-3 disabled:opacity-70"
                >
                  {loading ? 'Processing...' : editId ? 'Update Task ✓' : 'Create Task ✓'}
                </button>
              )}
            </div>
          </div>
          
          <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-12 opacity-50">TeKe Task Management Engine</p>
        </div>
      </div>
    </div>
  )
}