'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import TaskCard from '@/components/ui/TaskCard'
import TaskTable from '@/components/ui/TaskTable'
import { useAppStore } from '@/store/useAppStore'
import NotificationDropdown from '@/components/ui/NotificationDropdown'

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
  const { searchParams } = new URL(typeof window !== 'undefined' ? window.location.href : 'http://localhost')
  const initialFilter = searchParams.get('filter') || 'All'
  const filterIds = searchParams.get('ids')?.split(',') || []

  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const [view, setView] = useState<'grid' | 'table'>('grid')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setView('table')
    }
  }, [])

  const tasks = useAppStore((state) => state.tasks)
  const loading = useAppStore((state) => state.tasksLoading)
  const openTaskDrawer = useAppStore((state) => state.openTaskDrawer)

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'All') return true
    return task.status === activeFilter
  })

  // Sort tasks such that tasks from the notification appear at the top
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aInFilter = filterIds.includes(a.id)
    const bInFilter = filterIds.includes(b.id)

    if (aInFilter && !bInFilter) return -1
    if (!aInFilter && bInFilter) return 1

    if (aInFilter && bInFilter) {
      return filterIds.indexOf(a.id) - filterIds.indexOf(b.id)
    }

    return 0
  })

  // Grouping logic
  const { todayTasks, thisWeekTasks, otherTasks, noDeadlineTasks } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    const endOfWeek = new Date()
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()))
    endOfWeek.setHours(23, 59, 59, 999)

    return {
      todayTasks: filteredTasks.filter(t => t.deadline && new Date(t.deadline) <= endOfToday),
      thisWeekTasks: filteredTasks.filter(t => t.deadline && new Date(t.deadline) > endOfToday && new Date(t.deadline) <= endOfWeek),
      otherTasks: filteredTasks.filter(t => t.deadline && new Date(t.deadline) > endOfWeek),
      noDeadlineTasks: filteredTasks.filter(t => !t.deadline)
    }
  }, [filteredTasks])

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-1 pb-32 lg:px-6 lg:pt-3">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1f2e] tracking-tight shrink-0">Tasks</h1>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="bg-white p-1 rounded-xl border border-slate-100 flex items-center gap-1">
                <button onClick={() => setView('grid')} className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-[#1a1f2e] text-white' : 'text-slate-400'}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </button>
                <button onClick={() => setView('table')} className={`p-1.5 rounded-lg transition-all ${view === 'table' ? 'bg-[#1a1f2e] text-white' : 'text-slate-400'}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
              </div>
              <NotificationDropdown />
              <button
                onClick={() => router.push('/tasks/extract')}
                className="bg-white border border-slate-200 p-2 sm:px-4 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                <span className="hidden sm:inline text-sm">Extract</span>
              </button>
              <button
                onClick={() => openTaskDrawer('new')}
                className="bg-[#1a1f2e] text-white p-2 sm:px-4 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="hidden sm:inline text-sm">New Task</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide sticky top-0 bg-[#f2f2f7] z-10">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === filter ? 'bg-[#1a1f2e] text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'
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
              <div className="bg-white w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl">📎</div>
              <div className="text-center">
                <p className="font-bold text-[#1a1f2e] text-lg">No tasks found</p>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">Try a different filter or create a new task</p>
              </div>
            </div>
          ) : view === 'table' ? (
            <TaskTable
              tasks={sortedTasks}
              onTaskClick={(id) => openTaskDrawer(id)}
              onEditClick={(id) => openTaskDrawer(id)}
              highlightedIds={filterIds}
            />
          ) : (
            <div className="flex flex-col gap-8">
              {[{ title: 'Today', list: todayTasks, color: 'bg-red-50 text-red-500' },
                { title: 'This Week', list: thisWeekTasks, color: 'bg-indigo-50 text-indigo-500' },
                { title: 'Upcoming', list: otherTasks, color: 'bg-blue-50 text-blue-500' },
                { title: 'No Deadline', list: noDeadlineTasks, color: 'bg-slate-100 text-slate-500' }
              ].map(section => section.list.length > 0 && (
                <div key={section.title}>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{section.title}</p>
                    <div className="h-[1px] flex-1 bg-slate-200" />
                    <span className={`${section.color} px-2 py-0.5 rounded-lg text-[10px] font-bold`}>{section.list.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.list.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        compact={true}
                        onClick={() => openTaskDrawer(task.id)}
                        onEditClick={() => openTaskDrawer(task.id)}
                        highlighted={filterIds.includes(task.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => openTaskDrawer('new')}
        className="lg:hidden fixed bottom-24 right-6 bg-[#1a1f2e] w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg z-20"
      >
        <span className="material-symbols-outlined text-white text-3xl">add</span>
      </button>
    </div>
  )
}