'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TaskCard from '@/components/ui/TaskCard'
import TaskTable from '@/components/ui/TaskTable'

interface Task {
  id: string
  name: string
  status: string
  deadline?: string
  blocked_by_task_id?: string
  training_id?: string
  training?: { id: string; title: string }
}

const filterOptions = [
  'All',
  'pending',
  'in_progress',
  'complete',
  'delayed',
  'canceled',
]

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'table'>('grid')

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

  function handleStatusChange(id: string, newStatus: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'All') return true
    return task.status === activeFilter
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const endOfWeek = new Date()
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()))
  endOfWeek.setHours(23, 59, 59, 999)

  // Sectioning logic for Grid View
  const todayTasks = filteredTasks.filter((task) => {
    if (!task.deadline) return false
    const d = new Date(task.deadline)
    return d >= today && d <= endOfToday
  })

  const thisWeekTasks = filteredTasks.filter((task) => {
    if (!task.deadline) return false
    const d = new Date(task.deadline)
    return d > endOfToday && d <= endOfWeek
  })

  const otherTasks = filteredTasks.filter((task) => {
    if (!task.deadline) return false
    const d = new Date(task.deadline)
    return d < today || d > endOfWeek
  })

  const noDeadlineTasks = filteredTasks.filter((task) => !task.deadline)

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-1 pb-32 lg:px-6 lg:pt-3">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-black text-[#1a1f2e] tracking-tight">Tasks</h1>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="bg-white p-1 rounded-xl border border-slate-100 flex items-center gap-1">
                 <button 
                  onClick={() => setView('grid')}
                  className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-[#1a1f2e] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                 >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1"/>
                        <rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/>
                        <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                 </button>
                 <button 
                  onClick={() => setView('table')}
                  className={`p-1.5 rounded-lg transition-all ${view === 'table' ? 'bg-[#1a1f2e] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                 >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                 </button>
              </div>

              <button
                onClick={() => router.push('/tasks/new')}
                className="bg-[#1a1f2e] text-white px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M12 5V19M5 12H19"/>
                </svg>
                New Task
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide sticky top-0 bg-[#f2f2f7] z-10">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                  activeFilter === filter
                    ? 'bg-[#1a1f2e] text-white shadow-md'
                    : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                {filter === 'All' ? filter : filter.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="bg-white w-20 h-20 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center">
                <span className="text-4xl">📎</span>
              </div>
              <div className="text-center">
                  <p className="font-black text-[#1a1f2e] text-lg">No tasks found</p>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">
                    {activeFilter === 'All'
                      ? 'Create your first task to get started'
                      : `No ${activeFilter.replace('_', ' ')} tasks`}
                  </p>
              </div>
            </div>
          ) : view === 'table' ? (
            <TaskTable 
                tasks={filteredTasks} 
                onTaskClick={(id) => router.push(`/tasks/${id}`)}
                onEditClick={(id) => router.push(`/tasks/new?id=${id}`)}
                onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="flex flex-col gap-8">
              {/* TODAY */}
              {todayTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Today</p>
                    <div className="h-[1px] flex-1 bg-slate-200" />
                    <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-lg text-[10px] font-black">{todayTasks.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {todayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => router.push(`/tasks/${task.id}`)}
                        onEditClick={() => router.push(`/tasks/new?id=${task.id}`)}
                        onStatusChange={() => fetchTasks()}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* THIS WEEK */}
              {thisWeekTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">This Week</p>
                    <div className="h-[1px] flex-1 bg-slate-200" />
                    <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg text-[10px] font-black">{thisWeekTasks.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {thisWeekTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => router.push(`/tasks/${task.id}`)}
                        onEditClick={() => router.push(`/tasks/new?id=${task.id}`)}
                        onStatusChange={() => fetchTasks()}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* OTHER DEADLINES */}
              {otherTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Other Deadlines</p>
                    <div className="h-[1px] flex-1 bg-slate-200" />
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg text-[10px] font-black">{otherTasks.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {otherTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => router.push(`/tasks/${task.id}`)}
                        onEditClick={() => router.push(`/tasks/new?id=${task.id}`)}
                        onStatusChange={() => fetchTasks()}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* NO DEADLINE */}
              {noDeadlineTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No Deadline</p>
                    <div className="h-[1px] flex-1 bg-slate-200" />
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[10px] font-black">{noDeadlineTasks.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {noDeadlineTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => router.push(`/tasks/${task.id}`)}
                        onEditClick={() => router.push(`/tasks/new?id=${task.id}`)}
                        onStatusChange={() => fetchTasks()}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating + Button (Mobile Only) */}
      <button
        onClick={() => router.push('/tasks/new')}
        className="lg:hidden fixed bottom-24 right-6 bg-[#1a1f2e] w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg z-20"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}