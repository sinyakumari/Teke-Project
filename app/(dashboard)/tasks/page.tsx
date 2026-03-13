'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TaskCard from '@/components/ui/TaskCard'

interface Task {
  _id: string
  name: string
  status: string
  deadline?: string
  blockedBy?: { _id: string; name: string }[]
  trainingId?: { _id: string; title: string }
}

const filterOptions = [
  'All',
  'Pending',
  'In Progress',
  'Complete',
  'Delayed',
  'Canceled',
]

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    setLoading(true)
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'All') return true
    return task.status === activeFilter
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endOfWeek = new Date()
  endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()))
  endOfWeek.setHours(23, 59, 59, 999)

  const thisWeekTasks = filteredTasks.filter((task) => {
    if (!task.deadline) return false
    const d = new Date(task.deadline)
    return d >= today && d <= endOfWeek
  })

  const noDeadlineTasks = filteredTasks.filter((task) => !task.deadline)

  const otherTasks = filteredTasks.filter((task) => {
    if (!task.deadline) return false
    const d = new Date(task.deadline)
    return d < today || d > endOfWeek
  })

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1a1f2e]">Tasks</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="#1a1f2e" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="#1a1f2e" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="#1a1f2e" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="#1a1f2e" strokeWidth="2"/>
            </svg>
          </button>
          <button
            onClick={() => router.push('/tasks/new')}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5V19M5 12H19"
                stroke="#1a1f2e"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-[#1a1f2e] text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="bg-gray-100 w-16 h-16 rounded-2xl flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="#9ca3af" strokeWidth="2"/>
              <path d="M9 7H15M9 11H15M9 15H12" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="font-bold text-[#1a1f2e]">No tasks found</p>
          <p className="text-gray-400 text-sm">
            {activeFilter === 'All'
              ? 'Create your first task to get started'
              : `No ${activeFilter} tasks`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* This Week Section */}
          {thisWeekTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  This Week
                </p>
                <span className="text-xs text-gray-400">
                  {thisWeekTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {thisWeekTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onClick={() => router.push(`/tasks/${task._id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Deadlines Section */}
          {otherTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Other Deadlines
                </p>
                <span className="text-xs text-gray-400">
                  {otherTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {otherTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onClick={() => router.push(`/tasks/${task._id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Deadline Section */}
          {noDeadlineTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  No Deadline
                </p>
                <span className="text-xs text-gray-400">
                  {noDeadlineTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {noDeadlineTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onClick={() => router.push(`/tasks/${task._id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating + Button */}
      <button
        onClick={() => router.push('/tasks/new')}
        className="fixed bottom-24 right-6 bg-[#1a1f2e] w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5V19M5 12H19"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}