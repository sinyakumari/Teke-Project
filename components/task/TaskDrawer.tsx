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
  const addNotification = useAppStore((state) => state.addNotification)
  const addToast = useAppStore((state) => state.addToast)
  const allTasks = useAppStore((state) => state.tasks)

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

  const [activeTab, setActiveTab] = useState<'Dependencies' | 'Comments'>('Dependencies')
  const [comments, setComments] = useState<any[]>([])
  const [commentContent, setCommentContent] = useState('')
  const [commentMedia, setCommentMedia] = useState<string | null>(null)
  const [uploadingCommentMedia, setUploadingCommentMedia] = useState(false)
  const [fetchingComments, setFetchingComments] = useState(false)
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

  useEffect(() => {
    if (taskId && taskId !== 'new' && activeTab === 'Comments') {
      fetchComments()
    }
  }, [taskId, activeTab])

  async function fetchComments() {
    if (!taskId || taskId === 'new') return
    setFetchingComments(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`)
      const data = await res.json()
      if (res.ok) {
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setFetchingComments(false)
    }
  }

  async function handleAddComment() {
    if (!commentContent.trim() || !taskId) return
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent, mediaUrl: commentMedia })
      })
      const data = await res.json()
      if (res.ok) {
        setComments(prev => [...prev, data.comment])
        setCommentContent('')
        setCommentMedia(null)
        addToast('Comment added', 'success')
      }
    } catch (error) {
       console.error('Error adding comment:', error)
    }
  }

  async function handleCommentMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !taskId) return

    setUploadingCommentMedia(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `comments/${taskId}/${fileName}`

      const { data, error } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(data.path)

      setCommentMedia(publicUrl)
      addToast('Media attached', 'success')
    } catch (error) {
      console.error('Comment media upload failed:', error)
      addToast('Upload failed', 'error')
    } finally {
      setUploadingCommentMedia(false)
    }
  }

  async function handleDeleteComment(id: string) {
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== id))
        addToast('Comment removed', 'info')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

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
          addToast('Task created successfully!', 'success')
          onClose()
        } else {
          console.error('Create task error details:', data.error)
          addToast(data.error || 'Failed to create task', 'error')
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
          addToast('Changes saved', 'success')
          onClose()
        } else {
          console.error('Update task error details:', data.error)
          addToast(data.error || 'Failed to save changes', 'error')
        }
      }
    } catch (error: any) {
      console.error('Save operation failed:', error)
      addToast('A network error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  const deleteTaskAction = useAppStore((state) => state.deleteTaskAction)

  async function handleDelete() {
    if (!taskId || isCreateMode) return
    setLoading(true)
    try {
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

        {/* Header */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 min-h-[56px] shadow-sm">
          <div className="flex-1 min-w-0 pr-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Task Name"
              className="text-[15px] font-black text-[#1a1f2e] bg-transparent outline-none w-full placeholder-slate-300 transition-all focus:text-[16px]"
            />
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="relative group">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`text-[9px] font-black uppercase tracking-wider rounded-lg pl-2 pr-6 py-0.5 outline-none border-none cursor-pointer appearance-none ${statusColors[status]}`}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3 pb-32">

          {/* Blocked Warning Banner */}
          {(() => {
            const blocker = blockedBy ? tasks.find(t => t.id === blockedBy) : null;
            if (blocker && blocker.status !== 'complete') {
              return (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                  <span className="material-symbols-outlined text-orange-400 text-[20px] shrink-0 mt-0.5">lock</span>
                  <div className="flex-1">
                    <p className="text-[#1a1f2e] text-[11px] font-black uppercase tracking-tight leading-none mb-1">TASK IS BLOCKED</p>
                    <p className="text-orange-600 text-[10px] font-bold leading-tight">
                      This task depends on <span className="underline italic">&quot;{blocker.name}&quot;</span> being completed first.
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-sm flex flex-col">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                Priority
              </label>
              <div className="flex gap-1 justify-between">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPriority(opt as any)}
                    className={`flex-1 py-1 rounded-lg text-[9px] font-black transition-all ${priority === opt ? 'bg-[#1a1f2e] text-white shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-sm">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                Deadline
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
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              Linked Training
            </label>
            <select
              value={trainingId}
              onChange={(e) => setTrainingId(e.target.value)}
              className="w-full text-xs font-black text-[#1a1f2e] bg-slate-50 p-2 rounded-xl border-none outline-none appearance-none cursor-pointer"
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
                { label: 'Dependency', value: 'Dependencies' },
                { label: 'Comments', value: 'Comments' }
              ]}
              value={activeTab}
              onChange={(v) => setActiveTab(v as any)}
            />
          </div>

          <div className="min-h-[180px]">
            {activeTab === 'Dependencies' && (
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[11px]">device_hub</span> Dependency
                </label>
                <select
                  value={blockedBy}
                  onChange={(e) => setBlockedBy(e.target.value)}
                  className="w-full text-xs font-black text-[#1a1f2e] bg-slate-50 p-2 rounded-xl border-none outline-none appearance-none cursor-pointer"
                >
                  <option value="">NOT BLOCKED</option>
                  {tasks.filter(t => t.id !== taskId).map(t => (
                    <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 font-bold italic leading-tight bg-blue-50/50 p-2 rounded-lg border border-blue-50">
                  If this task depends on another, it will be marked as &apos;Blocked&apos; in the system until the dependency is completed.
                </p>
              </div>
            )}

            {activeTab === 'Comments' && (
              <div className="space-y-4">
                <div className="bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm flex items-end gap-1.5 focus-within:border-indigo-200 transition-colors">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    onInput={(e) => {
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                    }}
                    placeholder="Write a comment..."
                    rows={1}
                    className="flex-1 text-[11px] font-medium text-[#1a1f2e] outline-none min-h-[16px] max-h-[100px] resize-none overflow-y-auto bg-transparent py-1.5 px-2 placeholder-slate-400"
                  />
                  <div className="flex items-center gap-1 shrink-0 pb-0.5 pr-0.5">
                    <button 
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.onchange = (e) => handleCommentMediaUpload(e as any)
                        input.click()
                      }}
                      disabled={uploadingCommentMedia}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      title="Attach Media"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {uploadingCommentMedia ? 'hourglass_top' : 'attach_file'}
                      </span>
                    </button>
                    <button 
                      onClick={handleAddComment}
                      disabled={(!commentContent.trim() && !commentMedia) || uploadingCommentMedia}
                      className="w-6 h-6 flex items-center justify-center bg-[#1a1f2e] text-white rounded-lg shadow-sm active:scale-95 transition-all disabled:opacity-30 disabled:bg-slate-200"
                      title="Send Comment"
                    >
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
                {commentMedia && (
                  <div className="relative mt-3 p-1.5 w-fit bg-slate-50 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 pr-4 group transition-all">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-slate-100 shadow-inner">
                       <img src={commentMedia} alt="Media preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center">
                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[11px] text-indigo-400">check_circle</span>
                          Media Attached
                       </span>
                    </div>
                    <button 
                      onClick={() => setCommentMedia(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-full flex items-center justify-center shadow-sm hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
                    >
                       <span className="material-symbols-outlined text-[11px] font-bold">close</span>
                    </button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-3 mt-4">
                  {fetchingComments ? (
                    <div className="text-center py-6 text-slate-300 font-black text-[8px] uppercase tracking-widest animate-pulse">Syncing Thread...</div>
                  ) : comments.length === 0 ? null : (
                    comments.map((c) => (
                      <div key={c.id} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm group hover:border-slate-200 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                             <div className="w-5 h-5 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                               <span className="material-symbols-outlined text-[10px] text-slate-400">person</span>
                             </div>
                             <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-[13px]">delete</span>
                          </button>
                        </div>
                        <p className="text-[11px] font-medium text-slate-700 leading-relaxed">{c.content}</p>
                        {c.media_url && (
                          <div className="mt-2.5">
                            <a href={c.media_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors w-fit group/media">
                              <span className="material-symbols-outlined text-[12px] text-indigo-400 group-hover/media:text-indigo-500">photo_library</span>
                              View Attachment
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-md border-t border-slate-100 flex items-center justify-between gap-3 z-20 min-h-[72px]">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || loading || !name}
            className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${hasChanges && !loading && name
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
              <button onClick={() => setShowDeleteConfirm(false)} className="py-3.5 bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl">Cancel</button>
              <button onClick={handleDelete} className="py-3.5 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
