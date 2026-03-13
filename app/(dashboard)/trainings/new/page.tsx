'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SegmentedControl from '@/components/ui/SegmentedControl'

export default function NewTrainingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  async function handleSave() {
    if (!title.trim()) {
      setError('Training title is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          instructor,
          locationType,
          structure,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          duration: duration ? Number(duration) : undefined,
          unit,
          category,
          vision,
          objective,
          notes,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create training')
        return
      }
      router.push('/trainings')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7]">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <h1 className="text-base font-bold text-[#1a1f2e]">New Training</h1>
          <div className="w-9" />
        </div>

        <div className="px-4 py-4 pb-32">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* BASIC INFO */}
          <div className="bg-[#f2f2f7] px-1 py-2 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Basic Info
            </p>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
              Training Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Flutter Bootcamp 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{title.length}/100</p>
          </div>

          {/* Instructor */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
              Instructor / Provider
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe or Udemy"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors"
            />
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Location</label>
            <SegmentedControl
              options={[
                { label: '✓ Online', value: 'Online' },
                { label: '📍 In Person', value: 'In Person' },
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
                { label: '✓ Single Session', value: 'Single Session' },
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
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors"
                />
              </div>
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

          {/* Duration + Unit */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Duration</label>
              <input
                type="number"
                placeholder="4"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors"
              >
                <option value="">Select</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors"
            >
              <option value="Tech">Tech</option>
              <option value="Business">Business</option>
              <option value="Health">Health</option>
              <option value="Finance">Finance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* VISION & GOALS */}
          <div className="bg-[#f2f2f7] px-1 py-2 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Vision & Goals
            </p>
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Training Vision</label>
            <textarea
              placeholder="What transformation do you want from this training?"
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              rows={3}
              className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Primary Objective</label>
            <textarea
              placeholder="Use numbers for ROI tracking&#10;e.g. Generate 3 new leads in 30 days"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors resize-none"
            />
          </div>

          {/* LEARNING NOTES */}
          <div className="bg-[#f2f2f7] px-1 py-2 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Learning Notes
            </p>
          </div>

          <div className="mb-6">
            <textarea
              placeholder="Write your training notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Bottom Buttons - Fixed */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
          <div className="max-w-lg mx-auto flex flex-col gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#1a1f2e] text-white rounded-2xl py-4 font-semibold text-base hover:bg-[#2d3548] transition-colors disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : 'Save & Close'}
            </button>
            <button className="w-full bg-white border-2 border-gray-200 text-[#1a1f2e] rounded-2xl py-3 font-semibold text-sm hover:bg-gray-50 transition-colors">
              Add Action Items
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}