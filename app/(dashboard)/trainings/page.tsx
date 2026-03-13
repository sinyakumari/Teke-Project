'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TrainingCard from '@/components/ui/TrainingCard'

interface Training {
  _id: string
  title: string
  instructor: string
  locationType: string
  locationName?: string
  startDate?: string
  endDate?: string
  category: string
  status: string
}

interface TaskCount {
  trainingId: string
  total: number
  completed: number
}

export default function TrainingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [trainings, setTrainings] = useState<Training[]>([])
  const [taskCounts, setTaskCounts] = useState<TaskCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrainings()
  }, [activeTab])

  async function fetchTrainings() {
    setLoading(true)
    try {
      const [trainingsRes, tasksRes] = await Promise.all([
        fetch(`/api/trainings?status=${activeTab}`),
        fetch('/api/tasks'),
      ])

      const trainingsData = await trainingsRes.json()
      const tasksData = await tasksRes.json()

      setTrainings(trainingsData.trainings || [])

      const counts: TaskCount[] = (trainingsData.trainings || []).map(
        (t: Training) => {
          const trainingTasks = (tasksData.tasks || []).filter(
            (task: { trainingId: { _id: string } }) =>
              task.trainingId?._id === t._id
          )
          const completed = trainingTasks.filter(
            (task: { status: string }) => task.status === 'Complete'
          ).length
          return {
            trainingId: t._id,
            total: trainingTasks.length,
            completed,
          }
        }
      )

      setTaskCounts(counts)
    } catch (error) {
      console.error('Error fetching trainings:', error)
    } finally {
      setLoading(false)
    }
  }

  function getTaskCount(trainingId: string) {
    return taskCounts.find((t) => t.trainingId === trainingId) || {
      total: 0,
      completed: 0,
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pt-6 pb-32">
          {/* Header */}
          <h1 className="text-xl font-bold text-center text-[#1a1f2e] mb-4">
            Trainings
          </h1>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4 sticky top-0 bg-[#f2f2f7] z-10 pt-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                activeTab === 'active'
                  ? 'text-[#1a1f2e] border-b-2 border-[#1a1f2e]'
                  : 'text-gray-400'
              }`}
            >
              Active ({trainings.length > 0 && activeTab === 'active' ? trainings.length : 0})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                activeTab === 'archived'
                  ? 'text-[#1a1f2e] border-b-2 border-[#1a1f2e]'
                  : 'text-gray-400'
              }`}
            >
              Archived ({trainings.length > 0 && activeTab === 'archived' ? trainings.length : 0})
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : trainings.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3L22 8.5V10H2V8.5L12 3Z"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 10V17M10 10V17M14 10V17M18 10V17"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3 17H21"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-bold text-[#1a1f2e] text-base">
                  No trainings here
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Create your first training to start tracking
                </p>
              </div>
              <button
                onClick={() => router.push('/trainings/new')}
                className="bg-[#1a1f2e] text-white px-8 py-3 rounded-2xl font-semibold text-sm"
              >
                Create Training
              </button>
            </div>
          ) : (
            /* Training Cards */
            <div className="flex flex-col gap-3">
              {trainings.map((training) => {
                const counts = getTaskCount(training._id)
                return (
                  <TrainingCard
                    key={training._id}
                    training={training}
                    taskCount={counts.total}
                    completedCount={counts.completed}
                    onClick={() => router.push(`/trainings/${training._id}`)}
                    onMenuClick={(e) => {
                      e.stopPropagation()
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating + Button */}
      <button
        onClick={() => router.push('/trainings/new')}
        className="fixed bottom-24 right-6 bg-[#1a1f2e] w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg z-20"
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