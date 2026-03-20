'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import SegmentedControl from '@/components/ui/SegmentedControl'
import TaskCard from '@/components/ui/TaskCard'

interface TrainingDrawerProps {
  trainingId: string | null
  onClose: () => void
}

export default function TrainingDrawer({ trainingId, onClose }: TrainingDrawerProps) {
  const router = useRouter()
  const trainings = useAppStore((state) => state.trainings)
  const allTasks = useAppStore((state) => state.tasks)
  const updateTraining = useAppStore((state) => state.updateTraining)
  const deleteTraining = useAppStore((state) => state.deleteTraining)
  
  const [activeTab, setActiveTab] = useState<'Overview' | 'Tasks' | 'Materials'>('Overview')
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 1. Data Selection
  const training = useMemo(() => 
    trainings.find(t => t.id === trainingId), 
    [trainings, trainingId]
  )

  const openTaskDrawer = useAppStore((state) => state.openTaskDrawer)

  const relatedTasks = useMemo(() => 
    allTasks.filter(task => task.training_id === trainingId),
    [allTasks, trainingId]
  )

  // 2. Stats
  const stats = useMemo(() => {
    if (!relatedTasks.length) return { total: 0, completed: 0, progress: 0 }
    const total = relatedTasks.length
    const completed = relatedTasks.filter(t => t.status === 'complete').length
    return {
      total,
      completed,
      progress: Math.round((completed / total) * 100)
    }
  }, [relatedTasks])

  // 3. Handlers
  async function handleArchive() {
    if (!training) return
    setActionLoading(true)
    try {
      const newArchived = !training.is_archived
      const res = await fetch(`/api/trainings/${training.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: newArchived }),
      })
      if (res.ok) {
        updateTraining({ ...training, is_archived: newArchived })
      }
    } catch (error) {
      console.error('Error archiving:', error)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!trainingId) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/trainings/${trainingId}`, { method: 'DELETE' })
      if (res.ok) {
        deleteTraining(trainingId)
        onClose()
      }
    } catch (error) {
      console.error('Error deleting training:', error)
    } finally {
      setActionLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  // 4. Accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (trainingId) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [trainingId, onClose])

  if (!trainingId || !training) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 opacity-100"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className="fixed top-0 right-0 h-full z-[111] bg-[#f9fafb] shadow-2xl transition-transform duration-300 ease-out flex flex-col
          w-full sm:w-[500px] translate-x-0"
      >
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex-1 min-w-0 pr-4">
             <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                  training.is_archived ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-700'
                }`}>
                  {training.is_archived ? 'Archived' : 'Active'}
                </span>
             </div>
             <h2 className="text-xl font-black text-[#1a1f2e] truncate leading-tight">
               {training.title}
             </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-100"
              title="Delete Training"
            >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
            <button 
              onClick={() => router.push(`/trainings/new?id=${trainingId}`)}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-100"
              title="Edit Training"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.4142 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-5 pb-12">
          
          {/* Progress Overview */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-end justify-between">
               <div>
                  <h3 className="text-sm font-black text-[#1a1f2e]">Course Completion</h3>
                  <p className="text-xs font-bold text-slate-400">{stats.completed} of {stats.total} tasks completed</p>
               </div>
               <span className="text-2xl font-black text-[#1a1f2e]">{stats.progress}%</span>
            </div>
            <div className="h-4 bg-slate-50 rounded-full overflow-hidden flex border border-slate-100 shadow-inner">
               <div 
                 className={`h-full transition-all duration-1000 ease-out shadow-lg ${
                    stats.progress === 100 ? 'bg-green-500 shadow-green-200' : 'bg-blue-600 shadow-blue-200'
                 }`} 
                 style={{ width: `${stats.progress}%` }}
               />
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-2 gap-2">
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Instructor</p>
                <p className="text-xs font-black text-[#1a1f2e]">{training.instructor}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                <p className="text-xs font-black text-slate-700">{training.location_type} • {training.location_name || 'N/A'}</p>
             </div>
          </div>

          {/* Segmented Control */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <SegmentedControl
              options={[
                { label: 'Overview', value: 'Overview' },
                { label: 'Tasks', value: 'Tasks' },
                { label: 'Materials', value: 'Materials' }
              ]}
              value={activeTab}
              onChange={(v) => setActiveTab(v as any)}
            />
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             {activeTab === 'Overview' && (
               <div className="space-y-4">
                 <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">About this Course</h3>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                       <p className="text-sm text-slate-600 leading-relaxed italic">
                         {training.description || 'No detailed description provided for this training.'}
                       </p>
                    </div>
                 </div>

                 {/* Action Row */}
                 <div className="flex justify-center gap-4 pt-4 border-t border-slate-100">
                    <button 
                      onClick={handleArchive}
                      disabled={actionLoading}
                      className="px-6 py-3.5 bg-white border-2 border-[#1a1f2e] text-[#1a1f2e] font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      {actionLoading ? '...' : training.is_archived ? 'Restore' : 'Archive'}
                    </button>
                    <button 
                      onClick={() => openTaskDrawer('new', trainingId)}
                      className="px-6 py-3.5 bg-[#1a1f2e] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      <span>Add New Task</span>
                    </button>
                 </div>
               </div>
             )}

              {activeTab === 'Tasks' && (
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Task List</h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                      {relatedTasks.length} ITEMS
                    </span>
                  </div>

                  <button 
                    onClick={() => router.push(`/tasks/extract?training_id=${trainingId}`)}
                    className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl border-2 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-colors font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    Auto-Extract from Syllabus
                  </button>
                  {relatedTasks.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center shadow-inner">
                      <span className="text-4xl block mb-4">📋</span>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                        Your task board is empty.<br/>Add a task to start tracking.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {relatedTasks.map((task) => (
                        <TaskCard 
                          key={task.id} 
                          compact={true}
                          task={{
                            ...task,
                            training: { id: training.id, title: training.title }
                          }}
                          onClick={() => openTaskDrawer(task.id)}
                          onEditClick={() => openTaskDrawer(task.id)}
                        />
                      ))}
                    </div>
                  )}
               </div>
             )}

             {activeTab === 'Materials' && (
               <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Course Resources</h3>
                  {training.pdfs && (training as any).pdfs.length > 0 ? (
                    <div className="grid gap-3">
                      {(training as any).pdfs.map((pdf: any, idx: number) => (
                        <a
                          key={idx}
                          href={pdf.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 font-bold group-hover:scale-110 transition-transform">
                              PDF
                            </div>
                            <p className="text-xs font-black text-[#1a1f2e]">{pdf.name}</p>
                          </div>
                          <span className="text-blue-500 text-xs font-bold uppercase tracking-widest">Download</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
                       <span className="text-4xl block mb-4">📁</span>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No resources uploaded yet.</p>
                    </div>
                  )}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Delete Modal Overlay - Centered on Screen */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">Delete Course?</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed px-2">This action will permanently remove this training and its associated tasks.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
               <button onClick={() => setShowDeleteConfirm(false)} className="py-3.5 bg-white border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-colors">Cancel</button>
               <button onClick={handleDelete} disabled={actionLoading} className="py-3.5 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-red-100 hover:bg-red-600 transition-colors active:scale-95">{actionLoading ? '...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
