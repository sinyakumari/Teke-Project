'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import SegmentedControl from '@/components/ui/SegmentedControl'
import TaskCard from '@/components/ui/TaskCard'

interface TrainingDrawerProps {
  trainingId: string | null
  onClose: () => void
  initialMode?: 'view' | 'edit'
}

export default function TrainingDrawer({ trainingId, onClose }: TrainingDrawerProps) {
  const trainings = useAppStore((state) => state.trainings)
  const allTasks = useAppStore((state) => state.tasks)
  const updateTrainingStore = useAppStore((state) => state.updateTraining)
  const deleteTrainingStore = useAppStore((state) => state.deleteTraining)
  
  const [activeTab, setActiveTab] = useState<'Overview' | 'Tasks' | 'Materials'>('Overview')
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    category: '',
    locationType: 'offline',
    locationDetail: '',
    startDate: '',
    endDate: '',
    objective: ''
  })

  const [hasChanges, setHasChanges] = useState(false)

  const training = useMemo(() => 
    trainings.find(t => t.id === trainingId), 
    [trainings, trainingId]
  )

  useEffect(() => {
    if (training) {
      const data = {
        title: training.title || '',
        instructor: training.instructor || '',
        category: training.category || '',
        locationType: (training as any).location_type || 'offline',
        locationDetail: (training as any).location_detail || (training as any).location_name || '',
        startDate: (training as any).start_date || '',
        endDate: (training as any).end_date || '',
        objective: (training as any).mission || (training as any).description || ''
      }
      setFormData(data)
      setHasChanges(false)
    }
  }, [training])

  useEffect(() => {
    if (training) {
      const isDifferent = 
        formData.title !== (training.title || '') ||
        formData.instructor !== (training.instructor || '') ||
        formData.category !== (training.category || '') ||
        formData.locationType !== ((training as any).location_type || 'offline') ||
        formData.locationDetail !== ((training as any).location_detail || (training as any).location_name || '') ||
        formData.startDate !== ((training as any).start_date || '') ||
        formData.endDate !== ((training as any).end_date || '') ||
        formData.objective !== ((training as any).mission || (training as any).description || '')
      setHasChanges(isDifferent)
    }
  }, [formData, training])

  const openTaskDrawer = useAppStore((state) => state.openTaskDrawer)
  const relatedTasks = useMemo(() => 
    allTasks.filter(task => task.training_id === trainingId),
    [allTasks, trainingId]
  )

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
      if (res.ok) updateTrainingStore({ ...training, is_archived: newArchived })
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
        deleteTrainingStore(trainingId)
        onClose()
      }
    } catch (error) {
      console.error('Error deleting training:', error)
    } finally {
      setActionLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  async function handleSave() {
    if (!trainingId || !formData.title) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/trainings/${trainingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        const result = await res.json()
        updateTrainingStore(result.training)
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setActionLoading(false)
    }
  }

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
      <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full z-[111] bg-[#f9fafb] shadow-2xl transition-transform duration-300 ease-out flex flex-col w-full sm:w-[500px] translate-x-0">
        
        {/* Header */}
        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 min-h-[56px]">
          <div className="flex-1 min-w-0 pr-2">
             <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider ${
                      training.is_archived ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {training.is_archived ? 'Archived' : 'Active'}
                    </span>
                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Editing Mode</span>
                 </div>
                 <input 
                   value={formData.title}
                   onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                   className="text-lg font-black text-[#1a1f2e] bg-transparent outline-none w-full"
                 />
             </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowDeleteConfirm(true)} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-red-200 hover:text-red-500 border border-slate-100 transition-all">
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 border border-slate-100 transition-all">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4 pb-24">
          {/* Progress Overview */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-end justify-between">
               <div>
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Course Progress</h3>
                  <p className="text-xs font-bold text-slate-900 leading-none mt-1">{stats.completed}/{stats.total} Tasks Completed</p>
               </div>
               <span className="text-xl font-black text-[#1a1f2e]">{stats.progress}%</span>
            </div>
            <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden flex border border-slate-100 shadow-inner">
               <div className={`h-full transition-all duration-1000 ${stats.progress === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-[#1a1f2e]'}`} style={{ width: `${stats.progress}%` }} />
            </div>
          </div>

          {/* Form Fields - Grid 2x2 */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[12px]">person</span> Instructor
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-[#1a1f2e] transition-all"
                  placeholder="Instructor Name"
                />
             </div>
             <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[12px]">location_on</span> Location
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={formData.locationType}
                    onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                    className="bg-slate-50 border-none rounded-lg px-0.5 py-1 text-[9px] font-black text-slate-500 focus:ring-1 focus:ring-[#1a1f2e]"
                  >
                    <option value="offline">OFF</option>
                    <option value="online">ON</option>
                  </select>
                  <input
                    type="text"
                    value={formData.locationDetail}
                    onChange={(e) => setFormData({ ...formData, locationDetail: e.target.value })}
                    className="flex-1 bg-slate-50 border-none rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700"
                    placeholder="Details"
                  />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[12px]">calendar_today</span> Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                />
             </div>
             <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[12px]">event</span> End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                />
             </div>
          </div>

          <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
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

          <div className="animate-in fade-in duration-300">
             {activeTab === 'Overview' && (
               <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">description</span> Course Objective
                  </label>
                  <textarea
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    rows={6}
                    className="w-full bg-transparent border-none p-0 text-xs font-semibold text-slate-600 leading-relaxed outline-none resize-none italic"
                    placeholder="Describe the course mission..."
                  />
               </div>
             )}

             {activeTab === 'Tasks' && (
               <div className="space-y-1.5">
                  {relatedTasks.length === 0 ? (
                    <div className="py-10 text-center bg-white border border-slate-100 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No tasks linked</p>
                    </div>
                  ) : (
                    relatedTasks.map((task) => (
                      <TaskCard 
                        key={task.id} 
                        compact={true}
                        task={{...task, training: { id: training.id, title: training.title }}}
                        onClick={() => openTaskDrawer(task.id)}
                      />
                    ))
                  )}
               </div>
             )}

             {activeTab === 'Materials' && (
               <div className="py-12 text-center bg-white border border-slate-100 rounded-3xl">
                  <span className="text-4xl block mb-3 opacity-50">📁</span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Knowledge Base Empty</p>
               </div>
             )}
          </div>
        </div>

        {/* Unified Action Footer - Everything in Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3 sticky bottom-0 z-10 shadow-[0_-4px_25px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2">
             <button 
               onClick={handleArchive} 
               disabled={actionLoading} 
               title={training.is_archived ? 'Restore' : 'Archive'}
               className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#1a1f2e] hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm"
             >
                <span className="material-symbols-outlined text-[20px]">
                  {training.is_archived ? 'unarchive' : 'archive'}
                </span>
             </button>
             <button 
               onClick={() => openTaskDrawer('new', trainingId)} 
               className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-[#1a1f2e] hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm"
             >
                <span className="material-symbols-outlined text-[20px]">add_task</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Task</span>
             </button>
          </div>
          
          <div className="flex items-center gap-2.5 flex-1 justify-end">
            <button 
              onClick={onClose} 
              className="px-5 py-3 rounded-xl text-[#1a1f2e] font-black text-[10px] uppercase tracking-widest bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={!hasChanges || actionLoading || !formData.title} 
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl min-w-[120px] ${
                hasChanges && !actionLoading && formData.title 
                  ? 'bg-[#1a1f2e] text-white shadow-slate-200 active:scale-95' 
                  : 'bg-slate-100 text-slate-300 border border-slate-100 cursor-not-allowed shadow-none'
              }`}
            >
              {actionLoading ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
               <span className="material-symbols-outlined text-3xl">delete_forever</span>
             </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Purge Training?</h3>
              <p className="text-[12px] text-slate-500 font-bold px-4 leading-relaxed">This will permanently delete the course and all associated tasks.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setShowDeleteConfirm(false)} className="py-3.5 bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
               <button onClick={handleDelete} className="py-3.5 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95 hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
