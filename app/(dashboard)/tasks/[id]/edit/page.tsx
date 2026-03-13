'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Training {
  _id: string
  title: string
}

interface Task {
  _id: string
  name: string
  status: string
  deadline?: string
  trainingId?: { _id: string; title: string }
  blockedBy?: { _id: string; name: string }[]
}

const statusOptions = [
  { label: 'Pending', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { label: 'In Progress', color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { label: 'Complete', color: 'bg-green-100 text-green-600 border-green-200' },
  { label: 'Delayed', color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { label: 'Canceled', color: 'bg-red-100 text-red-500 border-red-200' },
]

export default function EditTaskPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [trainings, setTrainings] = useState<Training[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [showBlockedDropdown, setShowBlockedDropdown] = useState(false)

  const [taskName, setTaskName] = useState('')
  const [status, setStatus] = useState('Pending')
  const [trainingId, setTrainingId] = useState('')
  const [blockedBy, setBlockedBy] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    fetchAll()
  }, [id])

  async function fetchAll() {
    try {
      const [taskRes, trainingsRes] = await Promise.all([
        fetch(`/api/tasks/${id}`),
        fetch('/api/trainings?status=active'),
      ])
      const taskData = await taskRes.json()
      const trainingsData = await trainingsRes.json()

      const task = taskData.task
      setTaskName(task.name || '')
      setStatus(task.status || 'Pending')
      setTrainingId(task.trainingId?._id || '')
      setBlockedBy(task.blockedBy?.map((b: { _id: string }) => b._id) || [])
      setDeadline(task.deadline ? task.deadline.split('T')[0] : '')
      setTrainings(trainingsData.trainings || [])

      // fetch tasks for blocked by dropdown
      if (task.trainingId?._id) {
        const tasksRes = await fetch(`/api/tasks?trainingId=${task.trainingId._id}`)
        const tasksData = await tasksRes.json()
        setAllTasks((tasksData.tasks || []).filter((t: Task) => t._id !== id))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleTrainingChange(tId: string) {
    setTrainingId(tId)
    setBlockedBy([])
    if (tId) {
      const res = await fetch(`/api/tasks?trainingId=${tId}`)
      const data = await res.json()
      setAllTasks((data.tasks || []).filter((t: Task) => t._id !== id))
    } else {
      setAllTasks([])
    }
  }

  function toggleBlockedBy(taskId: string) {
    setBlockedBy((prev) =>
      prev.includes(taskId) ? prev.filter((i) => i !== taskId) : [...prev, taskId]
    )
  }

  async function handleSave() {
    if (!taskName.trim()) {
      setError('Task name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName,
          status,
          trainingId: trainingId || undefined,
          blockedBy,
          deadline: deadline || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save')
        return
      }
      router.push(`/tasks/${id}`)
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const selectedBlockedNames = allTasks
    .filter((t) => blockedBy.includes(t._id))
    .map((t) => t.name)

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
        <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <h1 className="text-base font-bold text-[#1a1f2e]">Edit Task</h1>
          <div className="w-9" />
        </div>

        <div className="px-4 py-6 pb-32">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Task Name */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors"
            />
          </div>

          {/* Status */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Status</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setStatus(s.label)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                    status === s.label
                      ? s.color + ' border-current'
                      : 'bg-white text-gray-400 border-gray-200'
                  }`}
                >
                  {status === s.label && '✓ '}{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Training */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Training</label>
            <div className="relative">
              <select
                value={trainingId}
                onChange={(e) => handleTrainingChange(e.target.value)}
                className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors appearance-none"
              >
                <option value="">Select a training</option>
                {trainings.map((t) => (
                  <option key={t._id} value={t._id}>{t.title}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9L12 15L18 9" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Blocked By */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-1 block">Blocked By</label>
            <p className="text-xs text-gray-400 mb-2">This task cannot start until selected tasks are complete.</p>
            <div className="relative">
              <button
                onClick={() => setShowBlockedDropdown(!showBlockedDropdown)}
                className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-left outline-none focus:border-[#1a1f2e] transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {selectedBlockedNames.length > 0 ? (
                  <span className="text-[#1a1f2e]">{selectedBlockedNames.join(', ')}</span>
                ) : (
                  <span className="text-gray-400">No prerequisites — tap to add</span>
                )}
              </button>

              {showBlockedDropdown && allTasks.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-lg border border-gray-100 mt-1 z-10 overflow-hidden">
                  {allTasks.map((task) => (
                    <button
                      key={task._id}
                      onClick={() => toggleBlockedBy(task._id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm text-[#1a1f2e] border-b border-gray-50 last:border-0"
                    >
                      <span>{task.name}</span>
                      {blockedBy.includes(task._id) && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="#1a1f2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {showBlockedDropdown && allTasks.length === 0 && trainingId && (
                <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-lg border border-gray-100 mt-1 z-10 p-4">
                  <p className="text-sm text-gray-400 text-center">No other tasks in this training</p>
                </div>
              )}
            </div>
          </div>

          {/* Deadline */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors"
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