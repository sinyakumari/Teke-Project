'use client'

import { useEffect, useState, useMemo } from 'react'
import TrainingCard from '@/components/ui/TrainingCard'
import TrainingTable from '@/components/ui/TrainingTable'
import { useAppStore } from '@/store/useAppStore'
import NotificationDropdown from '@/components/ui/NotificationDropdown'
import Pagination from '@/components/ui/Pagination'
import { useRouter } from 'next/navigation'

interface Training {
  id: string
  title: string
  instructor: string
  location_type: string
  location_name?: string
  start_date?: string
  end_date?: string
  category: string
  is_archived: boolean
}

interface TaskCount {
  training_id: string
  total: number
  completed: number
}

import { useShallow } from 'zustand/react/shallow'

export default function TrainingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const { 
    openTrainingDrawer, 
    allTrainings, 
    fetchTrainings, 
    loading, 
    taskCountsSummary, 
    fetchTaskCounts 
  } = useAppStore(useShallow((state) => ({
    openTrainingDrawer: state.openTrainingDrawer,
    allTrainings: state.trainings,
    fetchTrainings: state.fetchTrainings,
    loading: state.trainingsLoading,
    taskCountsSummary: state.taskCountsSummary,
    fetchTaskCounts: state.fetchTaskCounts,
  })))

  useEffect(() => {
    fetchTrainings(activeTab === 'archived')
    fetchTaskCounts()
  }, [activeTab, fetchTrainings, fetchTaskCounts])

  const trainings = useMemo(() => allTrainings.filter(t => 
    activeTab === 'archived' ? t.is_archived : !t.is_archived
  ), [allTrainings, activeTab])

  // Slice trainings for pagination
  const paginatedTrainings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return trainings.slice(start, end)
  }, [trainings, currentPage])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setView('table')
    }
  }, [])

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  useEffect(() => {
    console.log('[DEBUG - FRONTEND] All Trainings from Zustand:', allTrainings.length);
    console.log('[DEBUG - FRONTEND] Displayed Trainings (filtered):', trainings.length);
  }, [allTrainings, trainings.length])

  // Convert taskCountsSummary map to TaskCount[] array for the table component
  const taskCountsArray: TaskCount[] = useMemo(() => 
    paginatedTrainings.map(t => ({
      training_id: t.id,
      total: taskCountsSummary[t.id]?.total || 0,
      completed: taskCountsSummary[t.id]?.completed || 0
    })), [paginatedTrainings, taskCountsSummary])

  function getTaskCount(training_id: string) {
    return taskCountsSummary[training_id] || { total: 0, completed: 0 }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-1  lg:px-6 lg:pt-3">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1f2e] tracking-tight shrink-0">Trainings</h1>
            <div className="flex items-center gap-1.5 sm:gap-2">
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

              <NotificationDropdown />
              <button
                onClick={() => openTrainingDrawer('new')}
                className="bg-[#1a1f2e] text-white p-2 sm:px-4 sm:py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[40px]"
                title="New Training"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M12 5V19M5 12H19"/>
                </svg>
                <span className="hidden sm:inline text-sm">New Training</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'active'
                  ? 'bg-[#1a1f2e] text-white shadow-md shadow-slate-100'
                  : 'bg-white text-slate-400 border border-slate-200'
              }`}
            >
              ACTIVE ({allTrainings.filter(t => !t.is_archived).length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'archived'
                  ? 'bg-slate-500 text-white shadow-md shadow-slate-100'
                  : 'bg-white text-slate-400 border border-slate-200'
              }`}
            >
              ARCHIVED ({allTrainings.filter(t => t.is_archived).length})
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : trainings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="bg-white w-20 h-20 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center">
                <span className="text-4xl">🎓</span>
              </div>
              <div className="text-center">
                <p className="font-bold text-[#1a1f2e] text-lg">No trainings found</p>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">
                  Create your first training to start tracking
                </p>
              </div>
              <button
                onClick={() => openTrainingDrawer('new')}
                className="bg-[#1a1f2e] text-white px-8 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-slate-200 mt-2"
              >
                Create Training
              </button>
            </div>
          ) : (
            <>
              {view === 'table' ? (
                <TrainingTable 
                    trainings={paginatedTrainings} 
                    taskCounts={taskCountsArray}
                    onTrainingClick={(id) => openTrainingDrawer(id, 'view')}
                    onEditClick={(id) => openTrainingDrawer(id, 'edit')}
                    onTrainingUpdate={() => fetchTrainings(activeTab === 'archived')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paginatedTrainings.map((training) => {
                    const counts = getTaskCount(training.id)
                    return (
                      <TrainingCard
                        key={training.id}
                        training={training}
                        taskCount={counts.total}
                        completedCount={counts.completed}
                        onClick={() => openTrainingDrawer(training.id, 'view')}
                        onEditClick={(e) => {
                          e.stopPropagation();
                          openTrainingDrawer(training.id, 'edit');
                        }}
                        onMenuClick={(e) => {
                          e.stopPropagation()
                        }}
                        onTrainingUpdate={() => fetchTrainings(activeTab === 'archived')}
                      />
                    )
                  })}
                </div>
              )}
              
              {/* Pagination */}
              <div className="mt-8 mb-12">
                <Pagination 
                  totalItems={trainings.length}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => setCurrentPage(page)}
                  isLoading={loading}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating + Button (Mobile) */}
      <button
        onClick={() => openTrainingDrawer('new')}
        className="lg:hidden fixed bottom-24 right-6 bg-[#1a1f2e] w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg z-20"
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