'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import SegmentedControl from '@/components/ui/SegmentedControl'
import Link from 'next/link'

interface TaskDrawerProps {
  taskId: string | null
  onClose: () => void
}

export default function TaskDrawer({ taskId, onClose }: TaskDrawerProps) {
  const router = useRouter()
  const tasks = useAppStore((state) => state.tasks)
  const updateTaskInStore = useAppStore((state) => state.updateTask)
  const deleteTaskInStore = useAppStore((state) => state.deleteTask)
  
  const [activeTab, setActiveTab] = useState<'Details' | 'Notes' | 'Dependencies'>('Details')
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 1. Data Selection
  const task = useMemo(() => 
    tasks.find(t => t.id === taskId), 
    [tasks, taskId]
  )

  // 2. Handlers
  async function handleStatusToggle() {
    if (!task) return
    const newStatus = task.status === 'complete' ? 'pending' : 'complete'
    setActionLoading(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        updateTaskInStore({ ...task, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!taskId) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (res.ok) {
        deleteTaskInStore(taskId)
        onClose()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setActionLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  // 3. Accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) setShowDeleteConfirm(false)
        else onClose()
      }
    }
    if (taskId) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [taskId, onClose, showDeleteConfirm])

  if (!taskId || !task) return null

  const statusColors: Record<string, string> = {
    'pending': 'bg-slate-100 text-slate-500',
    'in_progress': 'bg-blue-50 text-blue-600',
    'complete': 'bg-green-50 text-green-600',
    'delayed': 'bg-orange-50 text-orange-600',
    'canceled': 'bg-red-50 text-red-600',
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 opacity-100"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className="fixed top-0 right-0 h-full z-[101] bg-[#f9fafb] shadow-2xl transition-transform duration-300 ease-out flex flex-col
          w-full sm:w-[500px] translate-x-0"
      >
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex-1 min-w-0 pr-4">
             <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${statusColors[task.status]}`}>
                  {task.status.replace('_', ' ')}
                </span>
             </div>
             <h2 className="text-xl font-black text-[#1a1f2e] truncate leading-tight">
               {task.name}
             </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-100"
              title="Delete Task"
            >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
            <button 
              onClick={() => router.push(`/tasks/new?id=${taskId}`)}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-100"
              title="Edit Task"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6 pb-12">
          
          {/* Main Action Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
             {/* Details Grid */}
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                   <p className={`text-sm font-black ${(task as any).priority === 'High' ? 'text-red-500' : (task as any).priority === 'Medium' ? 'text-orange-500' : 'text-blue-500'}`}>
                     {(task as any).priority || 'Medium'}
                   </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Deadline</p>
                   <p className="text-sm font-black text-[#1a1f2e]">
                     {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Date'}
                   </p>
                </div>
             </div>

             <button
               onClick={handleStatusToggle}
               disabled={actionLoading}
               className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                 task.status === 'complete'
                   ? 'bg-slate-100 text-slate-500'
                   : 'bg-[#1a1f2e] text-white shadow-xl shadow-slate-200'
               }`}
             >
               <span className="material-symbols-outlined text-[18px]">
                 {task.status === 'complete' ? 'undo' : 'check_circle'}
               </span>
               {task.status === 'complete' ? 'Mark Incomplete' : 'Mark Complete'}
             </button>

             {task.training && (
               <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">school</span>
                    <p className="text-xs font-bold text-slate-500">Related Training</p>
                  </div>
                  <p className="text-xs font-black text-indigo-600 truncate max-w-[180px] text-right">{task.training.title}</p>
               </div>
             )}
          </div>

          <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <SegmentedControl
              options={[
                { label: 'Details', value: 'Details' },
                { label: 'Notes', value: 'Notes' },
                { label: 'Dependencies', value: 'Dependencies' }
              ]}
              value={activeTab}
              onChange={(v) => setActiveTab(v as any)}
            />
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[200px]">
             {activeTab === 'Details' && (
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</h3>
                    <p className="text-[10px] font-bold text-slate-400 italic">Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                     <p className="text-sm text-slate-600 leading-relaxed">
                       {(task as any).description || 'No detailed description provided for this task.'}
                     </p>
                  </div>
               </div>
             )}

             {activeTab === 'Notes' && (
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Notes</h3>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[120px]">
                     { (task as any).notes ? (
                       <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{(task as any).notes}</p>
                     ) : (
                       <div className="flex flex-col items-center justify-center py-4 text-slate-300">
                          <span className="material-symbols-outlined text-3xl mb-2">stylus_note</span>
                          <p className="text-[10px] font-black uppercase tracking-widest">No notes yet</p>
                       </div>
                     )}
                  </div>
               </div>
             )}

             {activeTab === 'Dependencies' && (
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Blocked By</h3>
                  {task.blocked_by_task_id ? (
                     <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-orange-200 transition-all">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                              <span className="material-symbols-outlined text-[18px]">lock</span>
                           </div>
                           <p className="text-xs font-black text-slate-700">Blocked by Task ID: {task.blocked_by_task_id}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                     </div>
                  ) : (
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                       <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-3">
                          <span className="material-symbols-outlined">check_circle</span>
                       </div>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">No blocking dependencies</p>
                    </div>
                  )}
               </div>
             )}
          </div>
        </div>

        {/* Delete Modal Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full rounded-[2.5rem] p-8 shadow-2xl space-y-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-slate-900">Delete Task?</h3>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">This action will permanently remove this task from your training roadmap.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setShowDeleteConfirm(false)} className="py-4 bg-white border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl">Cancel</button>
                 <button onClick={handleDelete} className="py-4 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-red-100">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
