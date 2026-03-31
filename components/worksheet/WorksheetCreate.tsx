'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface WorksheetCreateProps {
  trainingId: string
  trainingTitle: string
  onWorksheetCreated?: (worksheet: any) => void
  onClose?: () => void
}

export default function WorksheetCreate({ trainingId, trainingTitle, onWorksheetCreated, onClose }: WorksheetCreateProps) {
  const [worksheetName, setWorksheetName] = useState('')
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchLessons()
  }, [trainingId])

  async function fetchLessons() {
    try {
      setLoading(true)
      const response = await fetch(`/api/trainings/${trainingId}/lessons`)
      const data = await response.json()
      
      if (data.success) {
        setLessons(data.lessons || [])
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateWorksheet() {
    if (!worksheetName.trim() || !selectedLessonId) {
      alert('Please enter a worksheet name and select a lesson')
      return
    }

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

      if (response.ok) {
        const result = await response.json()
        onWorksheetCreated?.(result.worksheet)
        setWorksheetName('')
        setSelectedLessonId('')
        onClose?.()
      } else {
        alert('Failed to create worksheet')
      }
    } catch (error) {
      console.error('Error creating worksheet:', error)
      alert('Failed to create worksheet')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-[#1a1f2e] mb-2">Create Worksheet</h3>
        <p className="text-sm text-slate-600">
          Create a worksheet for "{trainingTitle}"
        </p>
      </div>

      {/* Worksheet Name */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <label className="block text-sm font-semibold text-[#1a1f2e] mb-2">
          Worksheet Name
        </label>
        <input
          type="text"
          value={worksheetName}
          onChange={(e) => setWorksheetName(e.target.value)}
          placeholder="Enter worksheet name..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1f2e] focus:border-transparent"
        />
      </div>

      {/* Lesson Selection */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <label className="block text-sm font-semibold text-[#1a1f2e] mb-2">
          Select Lesson
        </label>
        
        {lessons.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">No lessons available</p>
            <button
              onClick={() => router.push(`/trainings/${trainingId}`)}
              className="mt-2 text-sm text-[#1a1f2e] hover:underline"
            >
              Add lessons first
            </button>
          </div>
        ) : (
          <select
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1f2e] focus:border-transparent"
          >
            <option value="">Select a lesson...</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onClose}
          disabled={creating}
          className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateWorksheet}
          disabled={creating || !worksheetName.trim() || !selectedLessonId}
          className="flex-1 px-4 py-2 bg-[#1a1f2e] text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating...' : 'Create Worksheet'}
        </button>
      </div>
    </div>
  )
}
