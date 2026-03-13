'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import StatCard from '@/components/ui/StatCard'
import TaskCard from '@/components/ui/TaskCard'
import { getGreeting } from '@/lib/utils'

interface User {
  name: string
  email: string
}

interface Task {
  _id: string
  name: string
  status: string
  deadline?: string
  blockedBy?: { _id: string; name: string }[]
  trainingId?: { _id: string; title: string }
}

interface Training {
  _id: string
  title: string
  startDate?: string
}

interface ReviewReminder {
  trainingId: string
  title: string
  dayLabel: string
  daysOverdue: number
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTrainings, setActiveTrainings] = useState(0)
  const [tasksDone, setTasksDone] = useState(0)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [weekTasks, setWeekTasks] = useState<Task[]>([])
  const [reviewReminders, setReviewReminders] = useState<ReviewReminder[]>([])
  const [loading, setLoading] = useState(true)

  const greeting = getGreeting()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [userRes, trainingsRes, tasksRes] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/trainings?status=active'),
        fetch('/api/tasks'),
      ])

      const userData = await userRes.json()
      const trainingsData = await trainingsRes.json()
      const tasksData = await tasksRes.json()

      setUser(userData.user)
      setActiveTrainings(trainingsData.trainings?.length || 0)

      const allTasks: Task[] = tasksData.tasks || []
      const completed = allTasks.filter((t) => t.status === 'Complete')
      setTasksDone(completed.length)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)

      const endOfWeek = new Date()
      endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()))
      endOfWeek.setHours(23, 59, 59, 999)

      const todayList = allTasks.filter((t) => {
        if (!t.deadline) return false
        const d = new Date(t.deadline)
        return d >= today && d <= endOfDay
      })

      const weekList = allTasks.filter((t) => {
        if (!t.deadline) return false
        const d = new Date(t.deadline)
        return d > endOfDay && d <= endOfWeek
      })

      setTodayTasks(todayList)
      setWeekTasks(weekList)

      const trainings: Training[] = trainingsData.trainings || []
      const reminders: ReviewReminder[] = []

      trainings.forEach((training) => {
        if (!training.startDate) return
        const start = new Date(training.startDate)
        const daysSinceStart = Math.floor(
          (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        )
        const reviewDays = [3, 7, 14, 30]
        reviewDays.forEach((day) => {
          if (daysSinceStart >= day) {
            reminders.push({
              trainingId: training._id,
              title: training.title,
              dayLabel: `Day ${day} Review`,
              daysOverdue: daysSinceStart - day,
            })
          }
        })
      })

      setReviewReminders(reminders.slice(0, 5))
    } catch (error) {
      console.error('Error fetching home data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const allTasksOnTrack = todayTasks.length === 0

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1a1f2e]">
            {greeting}, {user?.name} 👋
          </h1>
          <p className="text-green-600 text-sm font-medium mt-0.5">
            {allTasksOnTrack ? 'All tasks on track 👍' : `${todayTasks.length} task(s) due today`}
          </p>
        </div>
        <Avatar name={user?.name || '?'} size="md" />
      </div>

      {/* Stat Cards */}
      <div className="flex gap-3 mb-6">
        <StatCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L22 8.5V10H2V8.5L12 3Z" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 10V17M10 10V17M14 10V17M18 10V17" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 17H21" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
          count={activeTrainings}
          label="Active Trainings"
          iconBg="bg-gray-100"
          countColor="text-[#1a1f2e]"
        />
        <StatCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#16a34a" strokeWidth="2"/>
              <path d="M8 12L11 15L16 9" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          count={tasksDone}
          label="Tasks Done"
          iconBg="bg-green-50"
          countColor="text-green-600"
        />
      </div>

      {/* Today's Tasks */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#1a1f2e] text-base">Today&apos;s Tasks</h2>
          <Link href="/tasks" className="text-sm text-gray-400">
            See All
          </Link>
        </div>

        {todayTasks.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <p className="text-green-600 font-medium text-sm">
              All caught up for today! 🎉
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onClick={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Review Reminders */}
      {reviewReminders.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-[#1a1f2e] text-base mb-3">
            Review Reminders
          </h2>
          <div className="flex flex-col gap-2">
            {reviewReminders.map((reminder, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm"
              >
                <div className="bg-orange-100 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🔔</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#1a1f2e]">
                    {reminder.title}
                  </p>
                  <p className="text-orange-500 text-xs font-medium">
                    {reminder.dayLabel}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {reminder.daysOverdue} days overdue
                  </p>
                </div>
                <Link
                  href={`/trainings/${reminder.trainingId}`}
                  className="text-sm font-semibold text-[#1a1f2e] flex items-center gap-1"
                >
                  Review
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* This Week */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#1a1f2e] text-base">This Week</h2>
          <Link href="/tasks" className="text-sm text-gray-400">
            See All
          </Link>
        </div>

        {weekTasks.length === 0 ? (
          <p className="text-gray-400 text-sm">No upcoming tasks this week</p>
        ) : (
          <div className="flex flex-col gap-2">
            {weekTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onClick={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}