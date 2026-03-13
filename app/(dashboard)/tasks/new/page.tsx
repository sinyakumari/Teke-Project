'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Training {
  _id: string
  title: string
}

interface Task {
  _id: string
  name: string
}

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [trainings, setTrainings] = useState<Training[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const [taskName, setTaskName] = useState('')
  const [trainingId, setTrainingId] = useState('')
  const [blockedBy, setBlockedBy] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [showBlockedDropdown, setShowBlockedDropdown] = useState(false)

  useEffect(() => {
    fetchTrainings()
  }, [])

  useEffect(() => {
    if (trainingId) fetchTasks(trainingId)
    else setTasks([])
  }, [trainingId])

  async function fetchTrainings() {
    try {
      const res = await fetch('/api/trainings?status=active')
      const data = await res.json()
      setTrainings(data.trainings || [])
    } catch (error) {
      console.error('Error fetching trainings:', error)
    }
  }

  async function fetchTasks(tId: string) {
    try {
      const res = await fetch(`/api/tasks?trainingId=${tId}`)
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  function toggleBlockedBy(taskId: string) {
    setBlockedBy((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    )
  }

  async function handleCreate() {
    if (!taskName.trim()) {
      setError('Task name is required')
      return
    }
    if (!trainingId) {
      setError('Please select a training')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName,
          trainingId,
          blockedBy,
          deadline: deadline || undefined,
          source: 'manual',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create task')
        return
      }

      router.push('/tasks')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const selectedBlockedNames = tasks
    .filter((t) => blockedBy.includes(t._id))
    .map((t) => t.name)

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="#1a1f2e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <h1 className="text-base font-bold text-[#1a1f2e]">New Task</h1>
            <div className="w-9" />
          </div>

          <div className="px-4 py-6 pb-10">
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
                placeholder="e.g. Build the login screen"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors"
              />
            </div>

            {/* Training */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
                Training <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={trainingId}
                  onChange={(e) => setTrainingId(e.target.value)}
                  className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors appearance-none"
                >
                  <option value="">Select a training</option>
                  {trainings.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Blocked By */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-1 block">
                Blocked By
              </label>
              <p className="text-xs text-gray-400 mb-2">
                This task cannot start until the selected task(s) are complete.
              </p>
              <div className="relative">
                <button
                  onClick={() => setShowBlockedDropdown(!showBlockedDropdown)}
                  className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-left outline-none focus:border-[#1a1f2e] transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {selectedBlockedNames.length > 0 ? (
                    <span className="text-[#1a1f2e]">
                      {selectedBlockedNames.join(', ')}
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      No prerequisites — tap to add
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {showBlockedDropdown && tasks.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-lg border border-gray-100 mt-1 z-10 overflow-hidden">
                    {tasks.map((task) => (
                      <button
                        key={task._id}
                        onClick={() => toggleBlockedBy(task._id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm text-[#1a1f2e] border-b border-gray-50 last:border-0"
                      >
                        <span className="text-left">{task.name}</span>
                        {blockedBy.includes(task._id) && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M20 6L9 17L4 12"
                              stroke="#1a1f2e"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {showBlockedDropdown && tasks.length === 0 && trainingId && (
                  <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-lg border border-gray-100 mt-1 z-10 p-4">
                    <p className="text-sm text-gray-400 text-center">
                      No other tasks in this training
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
                Deadline <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] outline-none focus:border-[#1a1f2e] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Button - Sticky */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-10 shadow-sm">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-[#1a1f2e] text-white rounded-2xl py-4 font-semibold text-base hover:bg-[#2d3548] transition-colors disabled:opacity-70"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </div>
            ) : (
              'Create Task'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}