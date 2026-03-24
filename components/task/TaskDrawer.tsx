'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { createClient } from '@/lib/supabase'

interface TaskDrawerProps {
  taskId: string | null
  onClose: () => void
}

const AVAILABLE_STATUSES = [
  'pending',
  'in_progress',
  'complete',
  'delayed',
  'canceled',
]

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

export default function TaskDrawer({ taskId, onClose }: TaskDrawerProps) {
  const tasks = useAppStore((state) => state.tasks)
  const trainings = useAppStore((state) => state.trainings)
  const updateTaskInStore = useAppStore((state) => state.updateTask)
  const addTaskInStore = useAppStore((state) => state.addTask)
  const deleteTaskInStore = useAppStore((state) => state.deleteTask)
  
  const isCreateMode = taskId === 'new'
  const task = useMemo(() => 
    isCreateMode ? null : tasks.find(t => t.id === taskId), 
    [tasks, taskId, isCreateMode]
  )

  // Local state for editing
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('pending')
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const [deadline, setDeadline] = useState('')
  const [trainingId, setTrainingId] = useState('')
  const [blockedBy, setBlockedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [attachments, setAttachments] = useState<{ name: string; url: string; type: string }[]>([])
  const [uploading, setUploading] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'Details' | 'Notes' | 'Dependencies' | 'Files'>('Details')
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const activeTrainingId = useAppStore((state) => state.activeTrainingId)
  
  // Initialize state when task or mode changes
  useEffect(() => {
    if (isCreateMode) {
      setName('')
      setDescription('')
      setStatus('pending')
      setPriority('Medium')
      setDeadline('')
      setTrainingId(activeTrainingId || '')
      setBlockedBy('')
      setNotes('')
      setAttachments([])
      setHasChanges(false)
    } else if (task) {
      setName(task.name || '')
      setDescription(task.description || '')
      setStatus(task.status || 'pending')
      setPriority(task.priority || 'Medium')
      setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '')
      setTrainingId(task.training_id || '')
      setBlockedBy(task.blocked_by_task_id || '')
      setNotes(task.notes || '')
      setAttachments(task.attachments || [])
      setHasChanges(false)
    }
  }, [task, isCreateMode])

  // Track changes
  useEffect(() => {
    if (isCreateMode) {
      setHasChanges(!!name)
    } else if (task) {
      const changed = 
        name !== task.name ||
        description !== (task.description || '') ||
        status !== task.status ||
        priority !== (task.priority || 'Medium') ||
        deadline !== (task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '') ||
        trainingId !== (task.training_id || '') ||
        blockedBy !== (task.blocked_by_task_id || '') ||
        attachments !== (task.attachments || []) ||
        notes !== (task.notes || '')
      setHasChanges(changed)
    }
  }, [name, description, status, priority, deadline, trainingId, blockedBy, notes, attachments, task, isCreateMode])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `tasks/${taskId || 'new'}/${fileName}`

      const { data, error } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(data.path)

      const newAttachment = {
        name: file.name,
        url: publicUrl,
        type: file.type
      }

      setAttachments(prev => [...prev, newAttachment])
      setHasChanges(true)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('File upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!name) return
    setLoading(true)
    try {
      const payload = {
        name,
        description,
        status,
        priority,
        deadline: deadline || null,
        training_id: trainingId || null,
        blocked_by_task_id: blockedBy || null,
        notes,
        attachments
      }

      if (isCreateMode) {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (res.ok) {
          addTaskInStore(data.task)
          onClose()
        }
      } else if (taskId) {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (res.ok) {
          updateTaskInStore(data.task)
          onClose()
        }
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteTaskAction = useAppStore((state) => state.deleteTaskAction)
 
  async function handleDelete() {
    if (!taskId || isCreateMode) return
    setLoading(true)
    try {
      // Step: Perform optimistic delete via store
      await deleteTaskAction(taskId)
      onClose()
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  // Handle outside clicks and ESC
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

  if (!taskId) return null

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
        className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 opacity-100"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className="fixed top-0 right-0 h-full z-[151] bg-[#f9fafb] shadow-2xl transition-transform duration-300 ease-out flex flex-col
          w-full sm:w-[480px] translate-x-0"
      >
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
        />

        {/* Header - More Compact */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 min-h-[64px]">
          <div className="flex-1 min-w-0 pr-2">
             <input 
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="Task Name"
               className="text-[17px] font-bold text-[#1a1f2e] bg-transparent outline-none w-full placeholder-slate-300"
             />
             <div className="flex items-center gap-1.5 mt-0.5">
               <div className="relative group">
                 <select 
                   value={status}
                   onChange={(e) => setStatus(e.target.value)}
                   className={`text-[9px] font-bold uppercase tracking-wider rounded-lg pl-2 pr-6 py-0.5 outline-none border-none cursor-pointer appearance-none ${statusColors[status]}`}
                 >
                   {AVAILABLE_STATUSES.map(s => (
                     <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                   ))}
                 </select>
                 <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
                   expand_more
                 </span>
               </div>
             </div>
          </div>
          <div className="flex items-center gap-1.5">
            {!isCreateMode && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-100"
              >
                 <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content - More Compact */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3 pb-32">
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-sm flex flex-col">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[11px]">flag</span> Priority
              </label>
              <div className="flex gap-1 justify-between">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button 
                    key={opt}
                    onClick={() => setPriority(opt as any)}
                    className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${
                      priority === opt ? 'bg-[#1a1f2e] text-white shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-sm">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[11px]">calendar_today</span> Deadline
              </label>
              <input 
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs font-bold text-[#1a1f2e] bg-transparent outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-sm">
             <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
               <span className="material-symbols-outlined text-[11px]">school</span> Linked Training
             </label>
             <select 
               value={trainingId}
               onChange={(e) => setTrainingId(e.target.value)}
               className="w-full text-xs font-bold text-[#1a1f2e] bg-slate-50 p-2 rounded-xl border-none outline-none appearance-none cursor-pointer"
             >
               <option value="">NO TRAINING</option>
               {trainings.map(t => (
                 <option key={t.id} value={t.id}>{t.title.toUpperCase()}</option>
               ))}
             </select>
          </div>

          <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            <SegmentedControl
              options={[
                { label: 'Details', value: 'Details' },
                { label: 'Files', value: 'Notes' },
                { label: 'Blocking', value: 'Dependencies' }
              ]}
              value={activeTab === 'Files' ? 'Notes' : activeTab}
              onChange={(v) => setActiveTab(v as any)}
            />
          </div>

          <div className="min-h-[180px]">
             {activeTab === 'Details' && (
               <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add detailed description..."
                    className="w-full min-h-[100px] text-xs font-medium text-slate-600 leading-relaxed outline-none resize-none bg-transparent"
                  />
               </div>
             )}

             {(activeTab === 'Notes' || activeTab === 'Files') && (
               <div className="space-y-3">
                  {/* Attachments Section Only */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1 mb-1">
                      <h3 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">ATTACHMENTS (PDF, IMG, VIDEO)</h3>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={`text-[9px] font-semibold text-indigo-500 hover:translate-y-[-1px] transition-transform ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading ? 'UPLOADING...' : 'ADD FILE'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       {attachments.length > 0 ? attachments.map((file, i) => (
                         <a 
                           key={i} 
                           href={file.url} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all block"
                         >
                            {file.type.startsWith('image/') ? (
                              <img src={file.url} alt={file.name} className="w-full h-20 object-cover rounded-xl mb-1.5" />
                            ) : (
                              <div className="w-full h-20 bg-slate-50 rounded-xl mb-1.5 flex flex-col items-center justify-center">
                                 <span className="material-symbols-outlined text-slate-300 text-xl">
                                   {file.type.includes('pdf') ? 'picture_as_pdf' : 'video_library'}
                                 </span>
                              </div>
                            )}
                            <p className="text-[9px] font-semibold text-slate-700 truncate px-1 uppercase tracking-tight">{file.name}</p>
                         </a>
                       )) : (
                         <div className="col-span-2 bg-slate-50 border border-dashed border-slate-200 rounded-[1.5rem] py-6 flex flex-col items-center justify-center text-slate-300">
                            <span className="material-symbols-outlined text-2xl mb-1">upload_file</span>
                            <p className="text-[8px] font-bold uppercase tracking-widest">No attachments</p>
                         </div>
                       )}
                    </div>
                  </div>
               </div>
             )}

             {activeTab === 'Dependencies' && (
               <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[11px]">lock</span> Blocked By
                  </label>
                  <select 
                    value={blockedBy}
                    onChange={(e) => setBlockedBy(e.target.value)}
                    className="w-full text-xs font-bold text-[#1a1f2e] bg-slate-50 p-2 rounded-xl border-none outline-none appearance-none cursor-pointer"
                  >
                    <option value="">NOT BLOCKED</option>
                    {tasks.filter(t => t.id !== taskId).map(t => (
                      <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                    ))}
                  </select>
                  <p className="text-[9px] text-slate-400 font-medium italic leading-tight bg-blue-50/50 p-2 rounded-lg border border-blue-50">
                    If this task depends on another, it will be marked as &apos;Blocked&apos; in the system until the dependency is completed.
                  </p>
               </div>
             )}
          </div>
        </div>

        {/* Fixed Footer Action - Most Compact */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-md border-t border-slate-100 flex items-center justify-between gap-3 z-20 min-h-[72px]">
           <button 
             onClick={onClose}
             className="px-5 py-3 rounded-2xl text-slate-400 font-semibold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
           >
             Cancel
           </button>
           <button 
             onClick={handleSave}
             disabled={!hasChanges || loading || !name}
             className={`flex-1 py-3 rounded-2xl font-semibold text-[10px] uppercase tracking-widest transition-all ${
               hasChanges && !loading && name
                 ? 'bg-[#1a1f2e] text-white shadow-xl shadow-slate-200 active:scale-[0.98]'
                 : 'bg-slate-100 text-slate-300 cursor-not-allowed'
             }`}
           >
             {loading ? 'Saving...' : isCreateMode ? 'Create Task' : 'Save Changes'}
           </button>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Delete Task?</h3>
              <p className="text-xs text-slate-500 font-medium px-2 leading-relaxed">This will permanently remove the task.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setShowDeleteConfirm(false)} className="py-3.5 bg-slate-50 text-slate-400 font-semibold text-xs uppercase tracking-widest rounded-2xl">Cancel</button>
               <button onClick={handleDelete} className="py-3.5 bg-red-500 text-white font-semibold text-xs uppercase tracking-widest rounded-2xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
