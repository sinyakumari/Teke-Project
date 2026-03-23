'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { useAppStore } from '@/store/useAppStore'

function NewTrainingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  
  const addTraining = useAppStore((state) => state.addTraining)
  const updateTraining = useAppStore((state) => state.updateTraining)
  const addNotification = useAppStore((state) => state.addNotification)
  const addToast = useAppStore((state) => state.addToast)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [title, setTitle] = useState('')
  const [instructor, setInstructor] = useState('')
  const [locationType, setLocationType] = useState('Online')
  const [structure, setStructure] = useState('Single Session')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [duration, setDuration] = useState('')
  const [unit, setUnit] = useState('')
  const [category, setCategory] = useState('Tech')
  const [vision, setVision] = useState('')
  const [objective, setObjective] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (editId) {
      fetchTrainingDetails(editId)
    }
  }, [editId])

  async function fetchTrainingDetails(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/trainings/${id}`)
      if (!res.ok) throw new Error('Failed to fetch training')
      const { training } = await res.json()
      
      setTitle(training.title || '')
      setInstructor(training.instructor || '')
      setLocationType(training.location_type === 'online' ? 'Online' : 'In Person')
      setStructure(training.structure === 'multi-lesson' ? 'Multi-Lesson' : 'Single Session')
      setStartDate(training.start_date || '')
      setEndDate(training.end_date || '')
      setDuration(training.duration_value?.toString() || '')
      setUnit(training.duration_unit || '')
      setCategory(training.category ? training.category.charAt(0).toUpperCase() + training.category.slice(1) : 'Tech')
      setVision(training.vision || '')
      setObjective(training.mission || '')
      setNotes(training.notes_delta?.text || '')
    } catch (err) {
      setError('Failed to load training details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1)

  const steps = [
    { id: 1, label: 'Basics' },
    { id: 2, label: 'Vision' },
    { id: 3, label: 'Materials' },
    { id: 4, label: 'Schedule' },
    { id: 5, label: 'Review' },
  ]

  const handleNext = () => {
    if (currentStep === 1 && !title.trim()) {
      setError('Training title is required')
      return
    }
    setError('')
    setCurrentStep((prev) => Math.min(prev + 1, steps.length))
  }

  const handleBack = () => {
    setError('')
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Training title is required')
      setCurrentStep(1)
      return
    }
    setLoading(true)
    setError('')
    try {
      const mappedLocationType = locationType === 'Online' ? 'online' : 'offline'
      const mappedStructure = structure === 'Multi-Lesson' ? 'multi-lesson' : 'single'

      const url = editId ? `/api/trainings/${editId}` : '/api/trainings';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          instructor,
          locationType: mappedLocationType,
          structure: mappedStructure,
          startDate: startDate || null,
          endDate: endDate || null,
          duration: duration ? duration.toString() : null,
          unit: unit || null,
          category: category.toLowerCase(),
          vision,
          objective,
          notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || `Failed to ${editId ? 'update' : 'create'} training`)
        return
      }

      const savedData = await res.json()
      if (editId) {
        updateTraining(savedData.training)
        addToast('Training updated successfully', 'success')
        addNotification({
          title: 'Training Updated',
          message: `The training "${title}" has been updated.`,
          type: 'success',
          link: `/trainings/${editId}`
        })
      } else {
        addTraining(savedData.training)
        addToast('New training created!', 'success')
        addNotification({
          title: 'New Training Created',
          message: `You started a new training: "${title}". Good luck!`,
          type: 'success',
          link: `/trainings/${savedData.training.id}`
        })
      }
      
      router.push('/trainings')
    } catch {
      setError('Something went wrong')
      addToast('Failed to save training', 'error')
    } finally {
      setLoading(false)
    }
  }

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#f2f2f7] animate-pulse">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 h-14" />
        <div className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
          <div className="bg-white rounded-2xl h-[500px]" />
        </div>
      </div>
    )
  }

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
            <h1 className="text-sm font-bold text-[#1a1f2e]">{editId ? 'Edit Training' : 'New Training'}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="bg-white border border-gray-200 text-[#1a1f2e] rounded-lg px-3 py-1.5 font-semibold text-xs hover:bg-gray-50 transition-colors">
              Save as Draft
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
        <div className="max-w-5xl mx-auto px-6">
          
          {/* STEP INDICATOR - Horizontal Stepper */}
          <div className="flex items-center justify-between mb-8 px-4 relative">
            {/* Background Line */}
            <div className="absolute top-4 left-0 right-0 h-[2px] bg-gray-200 z-0 mx-10" />
            
            {steps.map((step) => (
              <div 
                key={step.id} 
                className="relative z-10 flex flex-col items-center gap-2 flex-1 cursor-pointer group"
                onClick={() => {
                  if (step.id > 1 && currentStep === 1 && !title.trim()) {
                    setError('Training title is required before moving forward')
                    return
                  }
                  setCurrentStep(step.id)
                  setError('')
                }}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                    currentStep === step.id 
                      ? 'bg-[#1a1f2e] border-[#1a1f2e] text-white shadow-lg scale-110' 
                      : currentStep > step.id
                      ? 'bg-blue-600 border-blue-600 text-white group-hover:bg-blue-700'
                      : 'bg-white border-gray-200 text-gray-400 group-hover:border-[#1a1f2e] group-hover:text-[#1a1f2e]'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  currentStep === step.id ? 'text-[#1a1f2e]' : 'text-gray-400 group-hover:text-[#1a1f2e]'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* CONTENT AREA */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 px-12 min-h-[400px] flex flex-col">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 animate-in fade-in slide-in-from-top-1">
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="flex-1">
              {/* STEP 1: BASICS */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#1a1f2e]">General Information</h2>
                    <p className="text-sm text-gray-500">Let&apos;s start with the basic details of your training.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-[#1a1f2e] mb-1.5 block">
                        Training Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Flutte Bootcamp 2025"
                        value={title}
                        onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:ring-1 focus:ring-[#1a1f2e] transition-all"
                      />
                      <p className="text-right text-[10px] text-gray-400 mt-1">{title.length}/100</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-[#1a1f2e] mb-1.5 block">
                          Instructor / Provider
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Udemy, Coursera, or Jane Doe"
                          value={instructor}
                          onChange={(e) => setInstructor(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:ring-1 focus:ring-[#1a1f2e] transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-[#1a1f2e] mb-1.5 block">
                          Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:ring-1 focus:ring-[#1a1f2e] transition-all"
                        >
                          <option value="Tech">Tech</option>
                          <option value="Business">Business</option>
                          <option value="Health">Health</option>
                          <option value="Finance">Finance</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: VISION */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#1a1f2e]">Vision & Objectives</h2>
                    <p className="text-sm text-gray-500">What is the ultimate goal of this training?</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-[#1a1f2e] mb-1.5 block">
                        Training Vision
                      </label>
                      <textarea
                        placeholder="What transformation do you want to see? (e.g. Become a UI/UX expert)"
                        value={vision}
                        onChange={(e) => setVision(e.target.value)}
                        rows={4}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:ring-1 focus:ring-[#1a1f2e] transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-[#1a1f2e] mb-1.5 block">
                        Primary Objective
                      </label>
                      <textarea
                        placeholder="e.g. Master React hooks and state management"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        rows={4}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:ring-1 focus:ring-[#1a1f2e] transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: MATERIALS */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#1a1f2e]">Materials & Notes</h2>
                    <p className="text-sm text-gray-500">Keep track of your study materials and notes.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-semibold text-[#1a1f2e] mb-1.5 block">
                        Learning Notes
                      </label>
                      <textarea
                        placeholder="Jot down important points or curriculum highlights..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={6}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:ring-1 focus:ring-[#1a1f2e] transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* PDF Extraction Card */}
                      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <h3 className="text-sm font-bold text-[#1a1f2e] mb-1">Upload Syllabus PDF</h3>
                        <p className="text-[10px] text-gray-400 mb-4">Auto-extract learning tasks</p>
                        <button 
                          onClick={() => router.push(`/tasks/extract${editId ? `?training_id=${editId}` : ''}`)}
                          className="bg-white border border-gray-200 text-[#1a1f2e] px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                        >
                          Choose File
                        </button>
                      </div>

                      {/* Generic Attachments Card */}
                      <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                        </div>
                        <h3 className="text-sm font-bold text-[#1a1f2e] mb-1">Other Attachments</h3>
                        <p className="text-[10px] text-gray-400 mb-4">Images, Docs, or Sheets</p>
                        <button className="bg-white border border-gray-200 text-[#1a1f2e] px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors">
                          Attach Files
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: SCHEDULE */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#1a1f2e]">Schedule & Format</h2>
                    <p className="text-sm text-gray-500">How and when will you be learning?</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-semibold text-[#1a1f2e] mb-1.5 block">
                          Location
                        </label>
                        <SegmentedControl
                          options={[
                            { label: '✓ Online', value: 'Online' },
                            { label: '📍 In Person', value: 'In Person' },
                          ]}
                          value={locationType}
                          onChange={setLocationType}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-[#1a1f2e] mb-1.5 block">
                          Structure
                        </label>
                        <SegmentedControl
                          options={[
                            { label: '✓ Single Session', value: 'Single Session' },
                            { label: 'Multi-Lesson', value: 'Multi-Lesson' },
                          ]}
                          value={structure}
                          onChange={setStructure}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-semibold text-[#1a1f2e] mb-1.5 block">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:ring-1 focus:ring-[#1a1f2e] transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-[#1a1f2e] mb-1.5 block">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:ring-1 focus:ring-[#1a1f2e] transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-semibold text-[#1a1f2e] mb-1.5 block">
                          Duration
                        </label>
                        <input
                          type="number"
                          placeholder="4"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:ring-1 focus:ring-[#1a1f2e] transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-[#1a1f2e] mb-1.5 block">
                          Unit
                        </label>
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] focus:ring-1 focus:ring-[#1a1f2e] transition-all"
                        >
                          <option value="">Select</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                          <option value="hours">Hours</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#1a1f2e]">Review & Confirm</h2>
                    <p className="text-sm text-gray-500">Quickly double-check everything before saving.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Title</p>
                        <p className="text-sm font-semibold text-[#1a1f2e]">{title || '—'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Instructor</p>
                        <p className="text-sm font-semibold text-[#1a1f2e]">{instructor || '—'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Location / Format</p>
                        <p className="text-sm font-semibold text-[#1a1f2e]">{locationType} • {structure}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Duration</p>
                        <p className="text-sm font-semibold text-[#1a1f2e]">{duration ? `${duration} ${unit}` : '—'}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Dates</p>
                      <p className="text-sm font-semibold text-[#1a1f2e]">
                        {startDate || '—'} to {endDate || '—'}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Vision Summary</p>
                      <p className="text-sm text-[#1a1f2e] line-clamp-2">{vision || 'No vision provided'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NAVIGATION BUTTONS */}
            <div className="mt-12 flex items-center justify-between pt-6 border-t border-gray-50">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 ${
                  currentStep === 1 
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none' 
                    : 'bg-[#1a1f2e] text-white hover:bg-[#2d3548]'
                }`}
              >
                ← Back
              </button>

              {currentStep < 5 ? (
                <button
                  onClick={handleNext}
                  className="bg-[#1a1f2e] text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:translate-x-1 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-blue-600 text-white px-10 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  {loading ? 'Finalizing...' : editId ? 'Update & Save ✓' : 'Complete & Save ✓'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default function NewTrainingPage() {
  return (
    <Suspense fallback={<div className='flex-1 animate-pulse' />}>
      <NewTrainingForm />
    </Suspense>
  )
}
