'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import AddTaskDrawer from '@/components/scheduler/AddTaskDrawer'
import { differenceInCalendarDays, isSameDay } from 'date-fns'

export default function SchedulerPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const studyTasks = useAppStore((state) => state.studyTasks)
  const boardTasks = useAppStore((state) => state.tasks)
  const loading = useAppStore((state) => state.studyTasksLoading || state.tasksLoading)
  
  const fetchStudyTasks = useAppStore((state) => state.fetchStudyTasks)
  const fetchTasks = useAppStore((state) => state.fetchTasks)
  
  const toggleStudyTaskStatus = useAppStore((state) => state.toggleStudyTaskStatus)
  const toggleBoardTaskStatus = useAppStore((state) => state.toggleTaskStatus)
  const deleteStudyTask = useAppStore((state) => state.deleteStudyTask)
  const deleteBoardTask = useAppStore((state) => state.deleteTaskAction)
  const user = useAppStore((state) => state.user)

  // Daily study limit (fallback to 4 if not in user settings)
  const dailyLimit = (user as any)?.daily_study_limit || 4

  useEffect(() => {
    fetchStudyTasks()
    fetchTasks()
  }, [])

  // ── Unified Scheduling Logic ──
  const { todayPlan, upcomingDeadlines, completedTasks } = useMemo(() => {
    const now = new Date()
    const unifiedPending: any[] = []
    const unifiedCompletedToday: any[] = []
    const unifiedCompletedOlder: any[] = []

    // 1. Process Native Study Tasks
    studyTasks.forEach(st => {
      const item = {
        id: st.id,
        title: st.title,
        deadline: st.deadline,
        status: st.status,
        type: 'study_task',
        effortLabel: `${st.effort_level} (${st.effort_hours}h)`,
        effortHours: st.effort_hours,
        updatedAt: st.updated_at
      }
      
      if (st.status === 'complete') {
        if (isSameDay(new Date(st.updated_at || new Date()), now)) {
          unifiedCompletedToday.push(item)
        } else {
          unifiedCompletedOlder.push(item)
        }
      } else {
        unifiedPending.push(item)
      }
    })

    // 2. Process Auto-Imported Board Tasks
    boardTasks.forEach(t => {
      if (!t.deadline) return // Only tasks with deadlines can be scheduled!
      
      let hours = 2 // Medium
      if (t.priority === 'High') hours = 4
      if (t.priority === 'Low') hours = 1

      const item = {
        id: t.id,
        title: t.name,
        deadline: t.deadline,
        status: t.status,
        type: 'board_task',
        effortLabel: `Board: ${t.priority || 'Medium'}`,
        effortHours: hours,
        updatedAt: null // We don't reliably track completion time for board tasks in this view yet
      }

      if (t.status === 'complete') {
        // Skip adding older completed board tasks to scheduler
      } else {
        unifiedPending.push(item)
      }
    })

    const plan: typeof unifiedPending = []
    const upcoming: typeof unifiedPending = []
    let currentHours = 0

    // 3. Add Study Tasks Completed Today to plan (to show progress)
    unifiedCompletedToday.forEach(task => {
      plan.push(task)
      currentHours += task.effortHours
    })

    // 4. Sort pending tasks by deadline proximity, then effort (priority)
    const sortedPending = [...unifiedPending].sort((a, b) => {
      const diff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      if (diff !== 0) return diff
      return b.effortHours - a.effortHours // Higher effort/priority first
    })

    // 5. Distribute pending tasks
    sortedPending.forEach(task => {
      const daysLeft = differenceInCalendarDays(new Date(task.deadline), now)
      const isUrgent = daysLeft <= 0 // Due today or overdue
      
      // Forcefully include urgent tasks even if it exceeds the daily limit
      if (isUrgent || currentHours + task.effortHours <= dailyLimit) {
        plan.push(task)
        currentHours += task.effortHours
      } else {
        upcoming.push(task)
      }
    })

    // 6. Final sort for the Today Plan:
    plan.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
      const aDays = differenceInCalendarDays(new Date(a.deadline), now)
      const bDays = differenceInCalendarDays(new Date(b.deadline), now)
      if (aDays !== bDays) return aDays - bDays
      return b.effortHours - a.effortHours
    })

    return { 
      todayPlan: plan, 
      upcomingDeadlines: upcoming,
      completedTasks: unifiedCompletedOlder.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }
  }, [studyTasks, boardTasks, dailyLimit])

  if (loading && studyTasks.length === 0 && boardTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimizing Schedule...</p>
        </div>
      </div>
    )
  }

  const handleToggle = (task: any) => {
    if (task.type === 'study_task') toggleStudyTaskStatus(task.id)
    else toggleBoardTaskStatus(task.id)
  }

  const handleDelete = (task: any) => {
    if (task.type === 'study_task') deleteStudyTask(task.id)
    else {
      if(confirm('Are you sure you want to permanently delete this task from the TEKE board?')) {
        deleteBoardTask(task.id)
      }
    }
  }

  const topPriority = todayPlan.find(t => t.status === 'pending') || todayPlan[0]
  const now = new Date()

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-[#1a1f2e] tracking-tight">Focus Scheduler</h1>
          <div className="flex items-center gap-2">
            <span className="bg-white border border-slate-100 rounded-full px-2.5 py-1 text-[8px] font-black tracking-widest text-slate-500 uppercase">
              Limit: {dailyLimit}H / DAY
            </span>
            <span className="text-[9px] font-bold text-slate-400">• Dynamic AI Planning</span>
          </div>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="w-12 h-12 bg-[#1a1f2e] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Today's Plan (Main Section) ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              Today's Recommended Plan
            </h2>
            <span className="text-[8px] font-bold text-slate-300 uppercase">{todayPlan.length} Active Today</span>
          </div>

          <div className="space-y-4">
            {todayPlan.length === 0 ? (
              <div className="py-16 text-center bg-white border border-slate-100 rounded-[32px] space-y-3">
                <span className="material-symbols-outlined text-4xl text-slate-100 block">event_note</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  No matching tasks for today
                </p>
                <p className="text-[8px] text-slate-300 px-12">
                  All caught up! Add a new task or adjust your daily limit.
                </p>
              </div>
            ) : (
              todayPlan.map((task, idx) => {
                const daysLeft = differenceInCalendarDays(new Date(task.deadline), now)
                const isTop = topPriority && task.id === topPriority.id
                return (
                  <div 
                    key={`${task.type}-${task.id}`}
                    className={`group bg-white p-5 rounded-[28px] border border-slate-100 transition-all flex items-center justify-between gap-4 ${
                      isTop ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-slate-50 bg-gradient-to-br from-white to-indigo-50/10' : 'hover:border-slate-200 shadow-sm shadow-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <button 
                        onClick={() => handleToggle(task)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          task.status === 'complete' ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-400'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {task.status === 'complete' ? 'check_circle' : 'circle'}
                        </span>
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-black text-slate-800 truncate ${task.status === 'complete' ? 'line-through opacity-40' : ''}`}>
                            {task.title}
                          </p>
                          {isTop && (
                            <span className="bg-indigo-600 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">Top Priority</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 mt-1">
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest ${
                            task.type === 'board_task' ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {task.effortLabel}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${
                            task.status === 'complete' ? 'text-slate-300' :
                            daysLeft < 0 ? 'text-rose-500' : daysLeft === 0 ? 'text-amber-500' : 'text-slate-300'
                          }`}>
                            {task.status === 'complete' ? 'COMPLETED TODAY' : daysLeft < 0 ? 'OVERDUE' : daysLeft === 0 ? 'DUE TODAY' : `${daysLeft} DAYS LEFT`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(task)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-100 hover:text-rose-400 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* AI Suggestion */}
          {topPriority && (
            <div className="bg-indigo-900/5 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-700">
              <span className="material-symbols-outlined text-indigo-500 text-[18px]">auto_awesome</span>
              <p className="text-[10px] font-bold text-indigo-900/70 uppercase tracking-widest leading-relaxed">
                Focus on <span className="text-indigo-600 underline underline-offset-4">{topPriority.title}</span> first. It has the highest priority-to-deadline ratio for today.
              </p>
            </div>
          )}
        </div>

        {/* ── Upcoming & Completed (Sidebar) ── */}
        <div className="space-y-8">
          {/* Upcoming Section */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
              Upcoming Deadlines
            </h2>

            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="py-8 text-center bg-white border border-slate-100 border-dashed rounded-[28px]">
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Safe territory</p>
                </div>
              ) : (
                upcomingDeadlines.map((task) => {
                  const daysLeft = differenceInCalendarDays(new Date(task.deadline), now)
                  return (
                    <div 
                      key={`${task.type}-${task.id}`}
                      className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between hover:border-slate-200 transition-all opacity-70 hover:opacity-100 group"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-[11px] font-black text-slate-700 truncate max-w-[120px]">{task.title}</p>
                        <p className={`text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 ${daysLeft <= 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                          {task.type === 'board_task' && <span className="w-1 h-1 bg-blue-400 rounded-full" />}
                          {daysLeft < 0 ? 'OVERDUE' : daysLeft === 0 ? 'DUE TODAY' : `${daysLeft} Days`}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDelete(task)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-100 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Completed Today Section */}
          {completedTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Recently Completed
                </h2>
                <button 
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="text-[8px] font-black text-indigo-500 uppercase tracking-widest hover:underline"
                >
                  {showCompleted ? 'Hide' : `Show (${completedTasks.length})`}
                </button>
              </div>

              {showCompleted && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                  {completedTasks.length === 0 ? (
                    <p className="text-[8px] text-center text-slate-300 py-4 uppercase tracking-widest">No completed tasks yet</p>
                  ) : (
                    completedTasks.map((task) => (
                      <div 
                        key={`${task.type}-${task.id}`}
                        className="bg-green-50/50 p-3 rounded-2xl border border-green-100 flex items-center gap-3 group"
                      >
                        <button 
                          onClick={() => handleToggle(task)}
                          className="w-6 h-6 rounded-lg bg-white border border-green-200 text-green-500 flex items-center justify-center shrink-0"
                        >
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        </button>
                        <p className="text-[10px] font-bold text-green-700 line-through truncate flex-1">{task.title}</p>
                        <button 
                          onClick={() => handleDelete(task)}
                          className="w-5 h-5 text-green-200 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <span className="material-symbols-outlined text-[12px]">delete</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AddTaskDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  )
}
