'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import SegmentedControl from '@/components/ui/SegmentedControl'

export default function EditTrainingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Basic Info
  const [title, setTitle] = useState('')
  const [instructor, setInstructor] = useState('')
  const [locationType, setLocationType] = useState('Online')
  const [structure, setStructure] = useState('Single Session')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [duration, setDuration] = useState('')
  const [unit, setUnit] = useState('Hours')
  const [category, setCategory] = useState('')

  // Vision & Goals
  const [vision, setVision] = useState('')
  const [objective, setObjective] = useState('')

  // Notes
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchTraining()
  }, [id])

  async function fetchTraining() {
    try {
      const res = await fetch(`/api/trainings/${id}`)
      const data = await res.json()
      const t = data.training

      setTitle(t.title || '')
      setInstructor(t.instructor || '')
      setLocationType(t.locationType || 'Online')
      setStructure(t.structure || 'Single Session')
      setStartDate(t.startDate ? t.startDate.split('T')[0] : '')
      setEndDate(t.endDate ? t.endDate.split('T')[0] : '')
      setDuration(t.duration || '')
      setUnit(t.unit || 'Hours')
      setCategory(t.category || '')
      setVision(t.vision || '')
      setObjective(t.objective || '')
      setNotes(t.notes || '')
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Training title is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/trainings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          instructor,
          locationType,
          structure,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          duration,
          unit,
          category,
          vision,
          objective,
          notes,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save')
        return
      }
      router.push(`/trainings/${id}`)
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7]">
      <div className="max-w-lg mx-auto lg:max-w-none">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <h1 className="text-base font-bold text-[#1a1f2e]">Edit Training</h1>
          <div className="w-9" />
        </div>

        <div className="px-4 py-6 pb-32">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* BASIC INFO */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Basic Info
          </p>

          {/* Title */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
              Training Title <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors pr-16"
                placeholder="e.g. Flutter Bootcamp"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {title.length}/100
              </span>
            </div>
          </div>

          {/* Instructor */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
              Instructor / Provider
            </label>
            <input
              type="text"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors"
              placeholder="e.g. Love Babbar"
            />
          </div>

          {/* Location Type */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Location</label>
            <SegmentedControl
              options={[
                { label: 'Online', value: 'Online' },
                { label: 'In Person', value: 'In Person' },
              ]}
              value={locationType}
              onChange={setLocationType}
            />
          </div>

          {/* Structure */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Structure</label>
            <SegmentedControl
              options={[
                { label: 'Single Session', value: 'Single Session' },
                { label: 'Multi-Lesson', value: 'Multi-Lesson' },
              ]}
              value={structure}
              onChange={setStructure}
            />
          </div>

          {/* Dates */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Duration</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors"
                placeholder="e.g. 10"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Unit</label>
              <div className="relative">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors appearance-none"
                >
                  <option>Hours</option>
                  <option>Days</option>
                  <option>Weeks</option>
                  <option>Months</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9L12 15L18 9" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors appearance-none"
              >
                <option value="">Select category</option>
                <option>Tech</option>
                <option>Business</option>
                <option>Health</option>
                <option>Finance</option>
                <option>Design</option>
                <option>Other</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9L12 15L18 9" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* VISION & GOALS */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Vision & Goals
          </p>

          <div className="mb-4">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Training Vision</label>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              rows={3}
              className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors resize-none"
              placeholder="What do you want to achieve with this training?"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Primary Objective</label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors resize-none"
              placeholder="What is the main goal of this training?"
            />
          </div>

          {/* LEARNING NOTES */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Learning Notes
          </p>

          <div className="mb-6">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors resize-none"
              placeholder="Write your notes, learnings, key takeaways..."
            />
          </div>

        </div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
          <div className="max-w-lg mx-auto lg:max-w-none">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#1a1f2e] text-white rounded-2xl py-4 font-semibold text-base hover:bg-[#2d3548] transition-colors disabled:opacity-70"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}