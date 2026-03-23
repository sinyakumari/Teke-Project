'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import SegmentedControl from '@/components/ui/SegmentedControl'
import TaskCard from '@/components/ui/TaskCard'
import { createClient } from '@/lib/supabase'
import { useRef } from 'react'

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

  useEffect(() => {
    if (trainingId && activeTab === 'Materials') {
      fetchMaterials()
    }
  }, [trainingId, activeTab])

  async function fetchMaterials() {
    if (!trainingId) return
    setFetchingMaterials(true)
    try {
      const res = await fetch(`/api/trainings/${trainingId}/materials`)
      if (res.ok) {
        const data = await res.json()
        setMaterials(data.materials || [])
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setFetchingMaterials(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !trainingId) return

    setUploadingMaterial(true)
    try {
      const supabase = createClient()
      
      // Get User ID for storage policy requirement
      let userId = user?.id
      if (!userId) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        userId = authUser?.id
      }
      
      if (!userId) throw new Error('User not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const storagePath = `${userId}/trainings/${trainingId}/${fileName}`

      const { data, error } = await supabase.storage
        .from('training-media')
        .upload(storagePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('training-media')
        .getPublicUrl(data.path)

      const res = await fetch(`/api/trainings/${trainingId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_type: 'pdf',
          storage_path: publicUrl,
          file_name: file.name,
          file_size: file.size
        }),
      })

      if (res.ok) {
        const result = await res.json()
        setMaterials(prev => [result.material, ...prev])
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed.')
    } finally {
      setUploadingMaterial(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteMaterial(id: string) {
    if (!trainingId) return
    try {
      const res = await fetch(`/api/trainings/${trainingId}/materials?id=${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setMaterials(prev => prev.filter(m => m.id !== id))
      }
    } catch (error) {
       console.error('Delete failed:', error)
    }
  }

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
          {/* Progress Overview */}
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm space-y-1.5">
            <div className="flex items-end justify-between">
               <div>
                  <h3 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status</h3>
                  <p className="text-[11px] font-bold text-slate-900 leading-none mt-1">{stats.completed}/{stats.total} Tasks</p>
               </div>
               <span className="text-lg font-bold text-[#1a1f2e]">{stats.progress}%</span>
            </div>
            <div className="h-2 bg-slate-50 rounded-full overflow-hidden flex border border-slate-100 shadow-inner">
               <div className={`h-full transition-all duration-1000 ${stats.progress === 100 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.2)]' : 'bg-[#1a1f2e]'}`} style={{ width: `${stats.progress}%` }} />
            </div>
          </div>

          {/* Form Fields - Compact Grid */}
          <div className="grid grid-cols-2 gap-2">
             <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[10px]">person</span> Instructor
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:ring-1 focus:ring-[#1a1f2e]"
                />
             </div>
             <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[10px]">location_on</span> Location
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
                </div>ev
             </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[10px]">calendar_today</span> Start
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700"
                />
             </div>
             <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[10px]">event</span> End
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
                { label: 'Overview', value: 'Overview' },
                { label: 'Tasks', value: 'Tasks' },
                { label: 'Files', value: 'Materials' }
              ]}
              value={activeTab}
              onChange={(v) => setActiveTab(v as any)}
            />
          </div>

          <div className="animate-in fade-in duration-300">
             {activeTab === 'Overview' && (
               <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[12px]">description</span> Objective
                  </label>
                  <textarea
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    rows={3}
                    className="w-full bg-transparent border-none p-0 text-[11px] font-semibold text-slate-600 leading-relaxed outline-none resize-none italic"
                    placeholder="Describe mission..."
                  />
               </div>
             )}

             {activeTab === 'Tasks' && (
               <div className="space-y-1">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <h3 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Full Task List</h3>
                    <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                      {relatedTasks.length} ITEMS
                    </span>
                  </div>

                  <button 
                    onClick={() => router.push(`/tasks/extract?training_id=${trainingId}`)}
                    className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors font-semibold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 mb-3"
                  >
                    <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                    Auto-Extract from Syllabus
                  </button>

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

             {activeTab === 'Materials' && (
               <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                     <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Resources</h4>
                     <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingMaterial}
                          title="Upload more"
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1f2e] text-white rounded-lg text-[8px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                        >
                           <span className="material-symbols-outlined text-[12px]">add</span>
                           Add Notes
                        </button>
                     </div>
                  </div>

                  <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileUpload} />

                  {fetchingMaterials ? (
                    <div className="py-10 text-center bg-white border border-slate-100 rounded-2xl">
                       <p className="text-[9px] font-bold text-slate-400 animate-pulse uppercase tracking-widest">Syncing...</p>
                    </div>
                  ) : materials.length === 0 ? (
                    <div className="py-12 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         disabled={uploadingMaterial}
                         className="flex items-center gap-2 px-6 py-3 bg-[#1a1f2e] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                       >
                         <span className="material-symbols-outlined text-[18px]">upload_file</span>
                         {uploadingMaterial ? 'Uploading...' : 'Upload Notes'}
                       </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                       {materials.map((mat) => (
                         <div key={mat.id} className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-[#1a1f2e] transition-all">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                               <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0">
                                  <span className="material-symbols-outlined text-[16px]">description</span>
                               </div>
                               <div className="overflow-hidden">
                                  <p className="text-[11px] font-bold text-[#1a1f2e] truncate leading-tight pr-2">{mat.file_name}</p>
                               </div>
                            </div>
                             <div className="flex items-center gap-1 flex-shrink-0">
                               <a href={mat.storage_path} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-[#1a1f2e] hover:bg-[#1a1f2e] hover:text-white transition-all">
                                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                               </a>
                               <button onClick={() => handleDeleteMaterial(mat.id)} className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-red-300 hover:bg-red-500 hover:text-white transition-all">
                                  <span className="material-symbols-outlined text-[14px]">delete</span>
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
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
