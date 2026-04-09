'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TaskCard from '@/components/ui/TaskCard'
import TaskTable from '@/components/ui/TaskTable'
import { useAppStore } from '@/store/useAppStore'
import NotificationDropdown from '@/components/ui/NotificationDropdown'
import Pagination from '@/components/ui/Pagination'

const filterOptions = [
  'All',
  'pending',
  'in_progress',
  'complete',
  'delayed',
  'canceled',
]

function TasksPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get('filter') || 'All'
  const filterIds = searchParams.get('ids')?.split(',') || []

  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setView('table')
    }
  }, [])

  const tasks = useAppStore((state) => state.tasks)
  const loading = useAppStore((state) => state.tasksLoading)
  const fetchTasks = useAppStore((state) => state.fetchTasks)
  const openTaskDrawer = useAppStore((state) => state.openTaskDrawer)

  useEffect(() => {
    fetchTasks(activeFilter)
  }, [activeFilter, fetchTasks])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter])

  const filteredTasks = tasks

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const aInFilter = filterIds.includes(a.id)
      const bInFilter = filterIds.includes(b.id)
      if (aInFilter && !bInFilter) return -1
      if (!aInFilter && bInFilter) return 1
      if (aInFilter && bInFilter) return filterIds.indexOf(a.id) - filterIds.indexOf(b.id)
      return 0
    })
  }, [filteredTasks, filterIds])

  // 1. Reorder the full filtered list: "This Week" tasks first, then everything else.
  const reorderedTasks = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const urgent = sortedTasks.filter(t => {
      if (!t.deadline) return false
      const d = new Date(t.deadline)
      return d >= startOfWeek && d <= endOfWeek
    })
    const others = sortedTasks.filter(t => {
      if (!t.deadline) return true
      const d = new Date(t.deadline)
      return d < startOfWeek || d > endOfWeek
    })

    return [...urgent, ...others]
  }, [sortedTasks])

  // 2. Paginate from the REORDERED list
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return reorderedTasks.slice(start, start + itemsPerPage)
  }, [reorderedTasks, currentPage])

  // 3. For the CURRENT PAGE slice, split them for visual headers
  const { weekUrgent, restOfPage } = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const weekUrgent = paginatedTasks.filter(t => {
      if (!t.deadline) return false
      const d = new Date(t.deadline)
      return d >= startOfWeek && d <= endOfWeek
    })
    const restOfPage = paginatedTasks.filter(t => {
      if (!t.deadline) return true
      const d = new Date(t.deadline)
      return d < startOfWeek || d > endOfWeek
    })

    return { weekUrgent, restOfPage }
  }, [paginatedTasks])

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-3 pb-4 lg:px-6 lg:pt-3">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1f2e] tracking-tight shrink-0">Tasks</h1>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden lg:flex bg-white p-1 rounded-xl border border-slate-100 items-center gap-1">
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
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
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
          {loading && tasks.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reorderedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="bg-white w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl">📎</div>
              <div className="text-center">
                <p className="font-bold text-[#1a1f2e] text-lg">No tasks found</p>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">Try a different filter or create a new task</p>
              </div>
            </div>
          ) : view === 'table' ? (
            <TaskTable
              tasks={paginatedTasks}
              onTaskClick={(id) => openTaskDrawer(id)}
              onEditClick={(id) => openTaskDrawer(id)}
              onTaskUpdate={fetchTasks}
              highlightedIds={filterIds}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {/* This Week */}
              {weekUrgent.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">This Week</p>
                    <div className="h-[1px] flex-1 bg-slate-200" />
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[10px] font-bold">{weekUrgent.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {weekUrgent.map((task: any) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        compact={true}
                        onClick={() => openTaskDrawer(task.id)}
                        onEditClick={() => openTaskDrawer(task.id)}
                        onTaskUpdate={fetchTasks}
                        highlighted={filterIds.includes(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {restOfPage.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tasks</p>
                    <div className="h-[1px] flex-1 bg-slate-200" />
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[10px] font-bold">{restOfPage.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {restOfPage.map((task: any) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        compact={true}
                        onClick={() => openTaskDrawer(task.id)}
                        onEditClick={() => openTaskDrawer(task.id)}
                        onTaskUpdate={fetchTasks}
                        highlighted={filterIds.includes(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {reorderedTasks.length > 0 && (
            <div className="mt-8">
              <Pagination
                totalItems={reorderedTasks.length}
                currentPage={currentPage}
                itemsPerPage={10}
                onPageChange={(page) => setCurrentPage(page)}
                isLoading={loading}
              />
            </div>
          )}
        </div>
      </div>


    </div>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7] items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TasksPageContent />
    </Suspense>
  )
}