'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import StatCard from '@/components/ui/StatCard'
import TaskCard from '@/components/ui/TaskCard'
import TaskTable from '@/components/ui/TaskTable'
import { getGreeting } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'

interface User {
  name: string
  email: string
  profilePicture?: string
}

interface Task {
  id: string
  name: string
  status: string
  deadline?: string
  blocked_by_task_id?: string
  training_id?: string
  training?: { id: string; title: string }
}

export default function HomePage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const allTasks = useAppStore((state) => state.tasks)
  const trainings = useAppStore((state) => state.trainings)
  const loading = useAppStore((state) => state.tasksLoading || state.trainingsLoading)
  const fetchTasks = useAppStore((state) => state.fetchTasks)
  
  const dashboardTasks = allTasks.slice(0, 10)

  const greeting = getGreeting()
  const now = new Date()
  const todayDate = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()

  // Derived stats
  const completedTotal = allTasks.filter(t => t.status === 'complete').length

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
  
  const weekCompleted = weekTasksDue.filter(t => t.status === 'complete').length
  const pendingThisWeek = weekTasksDue.filter(t => t.status !== 'complete').length

  const stats = {
    activeTrainings: trainings.length,
    tasksDone: completedTotal,
    pending: pendingThisWeek,
    weekTotal: weekTasksDue.length,
    weekCompleted: weekCompleted
  }

  const openTaskDrawer = useAppStore((state) => state.openTaskDrawer)

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
          <div className="flex items-start justify-between mb-4 gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                 <h1 className="text-2xl sm:text-3xl font-black text-[#1a1f2e] tracking-tight">
                    {greeting}, {user?.name}
                 </h1>
                 <span className="text-2xl sm:text-3xl">👋</span>
              </div>
              <p className="text-[#10b981] text-sm font-black">
                {stats.pending} tasks due this week
              </p>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
               <div className="hidden lg:block text-right">
                  <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">
                    {dayName}
                  </p>
                  <p className="text-[#1a1f2e] text-sm font-black">
                     {todayDate}
                  </p>
               </div>
               <Link href="/profile" className="hover:scale-110 active:scale-95 transition-all cursor-pointer">
                 <Avatar name={user?.name || '?'} src={user?.profilePicture} size="md" />
               </Link>
            </div>
          </div>

          {/* Stat Grid (4 Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-stretch">
            <StatCard
              label="Active Trainings"
              value={stats.activeTrainings}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 8V21H3V8" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 3H1V8H23V3Z" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              iconBg="bg-blue-50"
            />
            <StatCard
              label="Tasks Done"
              value={stats.tasksDone}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              iconBg="bg-emerald-50"
            />
            <StatCard
              label="Pending Tasks"
              value={stats.pending}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" strokeDasharray="4 4"/>
                  <path d="M12 7V12L15 15"/>
                </svg>
              }
              iconBg="bg-amber-50"
            />
            <StatCard
              label="Monthly Progress"
              value={`${progressPercentage}%`}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10M18 20V4M6 20V16"/>
                </svg>
              }
              iconBg="bg-indigo-50"
            />
          </div>

          {/* Combined Task Area Layout */}
          <div className="space-y-6">
            
            {/* All Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-[#1a1f2e]">All Tasks</h2>
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
                      onTaskClick={(id) => openTaskDrawer(id)}
                      onEditClick={(id) => openTaskDrawer(id)}
                      onStatusChange={() => fetchTasks()}
                      onTaskUpdate={() => fetchTasks()}
                    />
                  </div>
                  {/* Mobile view: Cards grid */}
                  <div className="grid grid-cols-1 md:hidden gap-3">
                    {dashboardTasks.map((task) => (
                      <div key={task.id} className="h-[140px]">
                          <TaskCard
                            task={task}
                            onEditClick={() => openTaskDrawer(task.id)}
                            onClick={() => openTaskDrawer(task.id)}
                            onStatusChange={() => fetchTasks()}
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