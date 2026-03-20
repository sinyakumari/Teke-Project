'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import StatCard from '@/components/ui/StatCard'
import TaskCard from '@/components/ui/TaskCard'
import TaskTable from '@/components/ui/TaskTable'
import { getGreeting } from '@/lib/utils'
import { useRouter } from 'next/navigation'

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

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState({
    activeTrainings: 0,
    tasksDone: 0,
    pending: 0,
    weekTotal: 0,
    weekCompleted: 0
  })
  const [dashboardTasks, setDashboardTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const greeting = getGreeting()
  const now = new Date()
  const todayDate = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()

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
      
      const allTasks: Task[] = tasksData.tasks || []
      const completedTotal = allTasks.filter(t => t.status === 'Complete').length

      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      
      const dayOfWeek = now.getDay()
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const startOfWeek = new Date(startOfDay)
      startOfWeek.setDate(startOfDay.getDate() + diffToMonday)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      const todayList = allTasks.filter(t => {
        if (!t.deadline) return false
        const d = new Date(t.deadline)
        return d >= startOfDay && d <= endOfDay
      })

      const weekList = allTasks.filter(t => {
        if (!t.deadline) return false
        const d = new Date(t.deadline)
        return d >= startOfDay && d <= endOfWeek
      })

      const weekTasksDue = allTasks.filter(t => {
        if (!t.deadline) return false
        const d = new Date(t.deadline)
        return d >= startOfWeek && d <= endOfWeek
      })
      
      const weekCompleted = weekTasksDue.filter(t => t.status === 'Complete').length
      const pendingThisWeek = weekTasksDue.filter(t => t.status !== 'Complete').length

      setStats({
        activeTrainings: trainingsData.trainings?.length || 0,
        tasksDone: completedTotal,
        pending: pendingThisWeek,
        weekTotal: weekTasksDue.length,
        weekCompleted: weekCompleted
      })

      // Show top 10 most recent/relevant tasks (e.g. allTasks already sorted from API)
      setDashboardTasks(allTasks.slice(0, 10))

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

  const progressPercentage = stats.weekTotal > 0 
    ? Math.round((stats.weekCompleted / stats.weekTotal) * 100) 
    : 0

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-1 pb-16 lg:px-6 lg:pt-3">
        <div className="max-w-7xl mx-auto">
          
          {/* Exact Header Layout */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <h1 className="text-3xl font-black text-[#1a1f2e] tracking-tight">
                    {greeting}, {user?.name}
                 </h1>
                 <span className="text-3xl">👋</span>
              </div>
              <p className="text-[#10b981] text-sm font-black">
                {stats.pending} tasks due this week
              </p>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="hidden lg:block text-right">
                  <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">
                    {dayName}
                  </p>
                  <p className="text-[#1a1f2e] text-sm font-black">
                     {todayDate}
                  </p>
               </div>
               <Avatar name={user?.name || '?'} size="md" />
            </div>
          </div>

          {/* Stat Grid (4 Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 items-stretch">
            <StatCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M21 8V21H3V8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 3H1V8H23V3Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 12H14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              count={stats.activeTrainings}
              label="Active Trainings"
              iconBg="bg-blue-500"
            />
            <StatCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              count={stats.tasksDone}
              label="Tasks Done"
              iconBg="bg-green-500"
            />
            <StatCard
              variant="dual"
              pending={stats.pending}
              weekCount={stats.weekTotal}
            />
            <StatCard
              variant="progress"
              percentage={progressPercentage}
              fraction={`${stats.weekCompleted}/${stats.weekTotal}`}
            />
          </div>

          {/* Combined Task Area Layout */}
          <div className="space-y-6">
            
            {/* All Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-[#1a1f2e]">All Tasks</h2>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {dashboardTasks.length} SHOWN
                  </span>
                </div>
                <Link 
                  href="/tasks" 
                  className="text-indigo-600 text-[13px] font-black flex items-center gap-1 group"
                >
                  See All Tasks
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">chevron_right</span>
                </Link>
              </div>

              {dashboardTasks.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl mb-2">🚀</span>
                  <p className="text-slate-500 font-bold">No tasks to display yet!</p>
                </div>
              ) : (
                <>
                  {/* Desktop view: Table (Limited to 10 tasks already logic-wise) */}
                  <div className="hidden md:block">
                    <TaskTable 
                      tasks={dashboardTasks}
                      onTaskClick={(id) => router.push(`/tasks/${id}`)}
                      onStatusChange={() => fetchData()}
                      onTaskUpdate={() => fetchData()}
                    />
                  </div>

                  {/* Mobile view: Cards grid */}
                  <div className="grid grid-cols-1 md:hidden gap-3">
                    {dashboardTasks.map((task) => (
                      <div key={task._id} className="h-[140px]">
                          <TaskCard
                            task={task}
                            onClick={() => router.push(`/tasks/${task._id}`)}
                            onStatusChange={() => fetchData()}
                          />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}