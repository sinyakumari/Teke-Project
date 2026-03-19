'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import StatCard from '@/components/ui/StatCard'
import TaskCard from '@/components/ui/TaskCard'
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

  const todayTasks = todayList
  const weekTasks = weekList


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
                {todayTasks.length} task(s) due today
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
               <Link href="/profile" className="hover:scale-110 active:scale-95 transition-all cursor-pointer">
                 <Avatar name={user?.name || '?'} src={user?.profilePicture} size="md" />
               </Link>
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
            
            {/* Today's Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-[#1a1f2e]">Today&apos;s Tasks</h2>
                  <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {todayTasks.length} DUE
                  </span>
                </div>
                <Link 
                  href="/tasks" 
                  className="text-indigo-600 text-[13px] font-black flex items-center gap-1 group"
                >
                  See All
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">chevron_right</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayTasks.length === 0 ? (
                  <div className="col-span-full bg-green-50/50 border border-green-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl mb-2">🎉</span>
                    <p className="text-green-600 font-black">You&apos;re all caught up for today!</p>
                  </div>
                ) : (
                  todayTasks.slice(0, 2).map((task) => (
                    <div key={task.id} className="h-[140px]">
                        <TaskCard
                          task={task}
                          onEditClick={() => router.push(`/tasks/new?id=${task.id}`)}
                          onClick={() => router.push(`/tasks/${task.id}`)}
                          onStatusChange={() => fetchTasks()}
                        />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* This Week Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-[#1a1f2e]">This Week</h2>
                  <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {weekTasks.length} TASKS
                  </span>
                </div>
                <Link 
                  href="/tasks" 
                  className="text-indigo-600 text-[13px] font-black flex items-center gap-1 group"
                >
                  See All
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">chevron_right</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {weekTasks.length === 0 ? (
                  <p className="text-slate-300 font-black text-xs uppercase tracking-widest col-span-full">No other tasks this week</p>
                ) : (
                  weekTasks.slice(0, 2).map((task) => (
                    <div key={task.id} className="h-[140px]">
                        <TaskCard
                          task={task}
                          onEditClick={() => router.push(`/tasks/new?id=${task.id}`)}
                          onClick={() => router.push(`/tasks/${task.id}`)}
                          onStatusChange={() => fetchTasks()}
                        />
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}