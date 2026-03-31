'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import SegmentedControl from '@/components/ui/SegmentedControl'
import TaskCard from '@/components/ui/TaskCard'
import { createClient } from '@/lib/supabase'
import { useRef } from 'react'
import LessonManager from '@/components/lesson/LessonManager'
import WorksheetManager from '@/components/worksheet/WorksheetManagerNew'

interface TrainingDrawerProps {
  trainingId: string | null
  onClose: () => void
  initialMode?: 'view' | 'edit'
}

export default function TrainingDrawer({ trainingId, onClose }: TrainingDrawerProps) {
  const router = useRouter()
  const trainings = useAppStore((state) => state.trainings)
  const allTasks = useAppStore((state) => state.tasks)
  const user = useAppStore((state) => state.user)
  const updateTrainingStore = useAppStore((state) => state.updateTraining)
  const deleteTrainingStore = useAppStore((state) => state.deleteTraining)
  const addNotification = useAppStore((state) => state.addNotification)
  const addToast = useAppStore((state) => state.addToast)
  
  const [activeTab, setActiveTab] = useState<'Lessons' | 'Tasks' | 'Worksheet'>('Lessons')
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
  const [materials, setMaterials] = useState<any[]>([])
  const [fetchingMaterials, setFetchingMaterials] = useState(false)
  const [uploadingMaterial, setUploadingMaterial] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      if (res.ok) {
        updateTrainingStore({ ...training, is_archived: newArchived })
        addNotification({
          title: newArchived ? 'Training Archived 📦' : 'Training Restored 📂',
          message: `"${training.title}" has been ${newArchived ? 'archived' : 'restored'}.`,
          category: newArchived ? 'warning' : 'info',
          type: 'in-app',
        })
        addToast(newArchived ? 'Training archived' : 'Training restored', 'info')
      }
    } catch (error) {
      console.error('Error archiving:', error)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!trainingId || !training) return
    setActionLoading(true)
    const trainingTitle = training.title
    try {
      const res = await fetch(`/api/trainings/${trainingId}`, { method: 'DELETE' })
      if (res.ok) {
        deleteTrainingStore(trainingId)
        addNotification({
          title: 'Training Deleted 🗑️',
          message: `"${trainingTitle}" has been permanently removed.`,
          category: 'warning',
          type: 'in-app',
        })
        addToast('Training deleted', 'warning')
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
        addNotification({
          title: 'Training Saved ✏️',
          message: `Changes to "${formData.title}" have been saved.`,
          category: 'info',
          type: 'in-app',
        })
        addToast('Training saved', 'success')
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
        
        {/* Compact Header */}
        <div className="p-2.5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 min-h-[50px]">
          <div className="flex-1 min-w-0 pr-2">
             <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-bold uppercase tracking-wider ${
                      training.is_archived ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {training.is_archived ? 'Archived' : 'Active'}
                    </span>
                 </div>
                 <input 
                   value={formData.title}
                   onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                   className="text-[17px] font-bold text-[#1a1f2e] bg-transparent outline-none w-full"
                 />
             </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowDeleteConfirm(true)} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-red-200 hover:text-red-500 border border-slate-100 transition-all">
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 border border-slate-100 transition-all">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3 pb-24">
          {/* Removed Progress Overview */}
          {/* Form Fields - Compact Grid */}
          <div className="grid grid-cols-2 gap-2">
             <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                <label className="text-[7px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  Instructor
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:ring-1 focus:ring-[#1a1f2e]"
                />
             </div>
             <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                <label className="text-[7px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  Location
                </label>
                <div className="flex gap-1">
                  <select
                    value={formData.locationType}
                    onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                    className="bg-slate-50 border-none rounded-lg px-0.5 py-1 text-[8px] font-bold text-slate-500"
                  >
                    <option value="offline">OFF</option>
                    <option value="online">ON</option>
                  </select>
                  <input
                    type="text"
                    value={formData.locationDetail}
                    onChange={(e) => setFormData({ ...formData, locationDetail: e.target.value })}
                    className="flex-1 bg-slate-50 border-none rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700"
                  />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                <label className="text-[7px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  Status
                </label>
                <select
                  value={training.is_archived ? 'archived' : 'active'}
                  onChange={(e) => handleArchive()}
                  className="w-full bg-slate-50 border-none rounded-lg px-2 py-1 text-[11px] font-black text-slate-800 outline-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
             </div>
             <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                <label className="text-[7px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700"
                />
             </div>
          </div>

          <div className="bg-white p-0.5 rounded-xl border border-slate-100 shadow-sm">
            <SegmentedControl
              options={[
                { label: 'Lessons', value: 'Lessons' },
                { label: 'Tasks', value: 'Tasks' },
                { label: 'Worksheet', value: 'Worksheet' }
              ]}
              value={activeTab}
              onChange={(v) => setActiveTab(v as any)}
            />
          </div>

          <div className="animate-in fade-in duration-300">
             {activeTab === 'Lessons' && (
               <div className="space-y-3 pt-1">
                  <LessonManager trainingId={trainingId} />
               </div>
             )}

             {activeTab === 'Tasks' && (
               <div className="space-y-1">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Full Task List</h3>
                      <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                        {relatedTasks.length} ITEMS
                      </span>
                    </div>

                    <button 
                      onClick={() => router.push(`/tasks/extract?training_id=${trainingId}`)}
                      className="flex items-center justify-center p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors group"
                      title="Auto-Extract from Syllabus"
                    >
                      <span className="material-symbols-outlined text-[14px] group-hover:rotate-180 transition-transform duration-500">auto_awesome</span>
                    </button>
                  </div>

                  {relatedTasks.length === 0 ? (
                    <div className="py-8 text-center bg-white border border-slate-100 rounded-2xl">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No tasks</p>
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

              {activeTab === 'Worksheet' && (
                <div className="pt-1">
                   <WorksheetManager trainingId={trainingId} />
                </div>
              )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2.5 sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] min-h-[60px]">
          <div className="flex items-center gap-1.5">
             <button 
               onClick={handleArchive} 
               disabled={actionLoading} 
               className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#1a1f2e] hover:bg-slate-100 transition-all shadow-sm"
             >
                <span className="material-symbols-outlined text-[18px]">
                  {training.is_archived ? 'unarchive' : 'archive'}
                </span>
             </button>
             <button 
               onClick={() => openTaskDrawer('new', trainingId)} 
               className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-1.5 text-[#1a1f2e] hover:bg-slate-100 transition-all shadow-sm"
             >
                <span className="material-symbols-outlined text-[18px]">add_task</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">Task</span>
             </button>
          </div>
          
          <div className="flex items-center gap-2 flex-1 justify-end">
            <button 
              onClick={onClose} 
              className="px-4 py-2.5 rounded-xl text-[#1a1f2e] font-bold text-[9px] uppercase tracking-widest border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm flex-shrink-0"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={!hasChanges || actionLoading || !formData.title} 
              className={`px-5 py-2.5 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all min-w-[110px] ${
                hasChanges && !actionLoading && formData.title 
                  ? 'bg-[#1a1f2e] text-white shadow-lg active:scale-95' 
                  : 'bg-slate-100 text-slate-300 border border-slate-100 cursor-not-allowed'
              }`}
            >
              {actionLoading ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Purge Training?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed px-2">This action will permanently remove this training and its associated tasks.</p>
            </div>
             <div className="grid grid-cols-2 gap-3 pt-2">
               <button onClick={() => setShowDeleteConfirm(false)} className="py-2.5 bg-slate-50 text-slate-400 font-semibold text-[9px] uppercase rounded-xl">Cancel</button>
               <button onClick={handleDelete} className="py-2.5 bg-red-500 text-white font-semibold text-[9px] uppercase rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
