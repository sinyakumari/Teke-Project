'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import SegmentedControl from '@/components/ui/SegmentedControl'
import TaskCard from '@/components/ui/TaskCard'
import LessonManager from '@/components/lesson/LessonManager'
import WorksheetManager from '@/components/worksheet/WorksheetManagerNew'

interface TrainingDrawerProps {
  trainingId: string | null
  onClose: () => void
  initialMode?: 'view' | 'edit'
}

const EMPTY_FORM = {
  title: '',
  instructor: '',
  category: '',
  locationType: 'offline',
  locationDetail: '',
  endDate: ''
}

export default function TrainingDrawer({ trainingId, onClose }: TrainingDrawerProps) {
  const router = useRouter()
  const trainings = useAppStore((state) => state.trainings)
  const allTasks = useAppStore((state) => state.tasks)
  const addTrainingStore = useAppStore((state) => state.addTraining)
  const updateTrainingStore = useAppStore((state) => state.updateTraining)
  const deleteTrainingStore = useAppStore((state) => state.deleteTraining)
  const addNotification = useAppStore((state) => state.addNotification)
  const addToast = useAppStore((state) => state.addToast)
  const openTaskDrawer = useAppStore((state) => state.openTaskDrawer)

  // Mode
  const isCreate = trainingId === 'new'

  // Find training from store (null in create mode)
  const training = useMemo(() =>
    isCreate ? null : trainings.find(t => t.id === trainingId) ?? null,
    [trainings, trainingId, isCreate]
  )

  // UI state
  const [activeTab, setActiveTab] = useState<'Lessons' | 'Tasks' | 'Worksheet'>('Lessons')
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [hasChanges, setHasChanges] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (isCreate) {
      setFormData(EMPTY_FORM)
      setHasChanges(false)
      setActiveTab('Lessons')
    } else if (training) {
      setFormData({
        title: training.title || '',
        instructor: training.instructor || '',
        category: training.category || '',
        locationType: (training as any).location_type || 'offline',
        locationDetail: (training as any).location_detail || (training as any).location_name || '',
        endDate: (training as any).end_date || ''
      })
      setHasChanges(false)
    }
  }, [training, isCreate])

  // Track changes in edit mode
  useEffect(() => {
    if (!isCreate && training) {
      const isDifferent =
        formData.title !== (training.title || '') ||
        formData.instructor !== (training.instructor || '') ||
        formData.category !== (training.category || '') ||
        formData.locationType !== ((training as any).location_type || 'offline') ||
        formData.locationDetail !== ((training as any).location_detail || (training as any).location_name || '') ||
        formData.endDate !== ((training as any).end_date || '')
      setHasChanges(isDifferent)
    }
  }, [formData, training, isCreate])

  const relatedTasks = useMemo(() =>
    allTasks.filter(task => task.training_id === trainingId),
    [allTasks, trainingId]
  )

  // Keyboard close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (trainingId) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [trainingId, onClose])

  // ── Actions ──────────────────────────────────────────────

  async function handleSave() {
    if (!formData.title.trim()) {
      addToast('Training title is required', 'error')
      return
    }
    setActionLoading(true)
    try {
      const url = isCreate ? '/api/trainings' : `/api/trainings/${trainingId}`
      const method = isCreate ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed')
      if (isCreate) {
        addTrainingStore(result.training)
        addToast('Training created!', 'success')
        onClose()
      } else {
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
    } catch (err: any) {
      addToast(err.message || 'Failed to save training', 'error')
    } finally {
      setActionLoading(false)
    }
  }

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
        addToast(newArchived ? 'Training archived' : 'Training restored', 'info')
      }
    } catch {
      console.error('Archive error')
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
    } catch {
      console.error('Delete error')
    } finally {
      setActionLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  async function handleAddTask() {
    if (!isCreate) {
      // Edit mode: just open task drawer directly
      openTaskDrawer('new', trainingId!)
      return
    }
    // Create mode: auto-save training first, then open task drawer
    if (!formData.title.trim()) {
      addToast('Enter a training title first', 'error')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed')
      const result = await res.json()
      addTrainingStore(result.training)
      addToast('Training saved! Opening task...', 'success')
      // Close create drawer, then open the task drawer for the new training
      onClose()
      setTimeout(() => {
        openTaskDrawer('new', result.training.id)
      }, 300)
    } catch {
      addToast('Failed to save training', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Don't render if no id
  if (!trainingId) return null
  // In edit mode, wait for training data
  if (!isCreate && !training) return null

  // ── Render ───────────────────────────────────────────────

  const canSave = isCreate ? formData.title.trim().length > 0 : hasChanges && formData.title.trim().length > 0

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full z-[111] bg-[#f9fafb] shadow-2xl flex flex-col w-full sm:w-[500px]">

        {/* ── Header ── */}
        <div className="p-2.5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 min-h-[50px]">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex flex-col">
              <input
                value={formData.title}
                placeholder="Training Title..."
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-[17px] font-bold text-[#000000] bg-transparent outline-none w-full placeholder:text-slate-300 mb-1"
              />
              <div className="flex items-center gap-1.5">
                {isCreate ? (
                  <span className="px-1.5 py-0 rounded text-[7px] font-normal text-white bg-black uppercase tracking-wider flex items-center h-[14px]">
                    NEW
                  </span>
                ) : (
                  <div className={`relative flex items-center px-1.5 py-0 rounded h-[14px] text-black w-max ${
                    training?.is_archived ? 'bg-slate-100' : 'bg-blue-50'
                  }`}>
                    <select
                      value={training?.is_archived ? 'archived' : 'active'}
                      onChange={() => handleArchive()}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                    <span className="text-[7px] font-normal uppercase tracking-wider mt-px">
                      {training?.is_archived ? 'Archived' : 'Active'}
                    </span>
                    <span className="material-symbols-outlined text-[8px] ml-0.5 pointer-events-none opacity-80">expand_more</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isCreate && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-red-200 hover:text-red-500 border border-slate-100 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 border border-slate-100 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3 pb-24">

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
              <label className="text-[7px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 block">Instructor</label>
              <input
                type="text"
                value={formData.instructor}
                placeholder="e.g. Jane Doe"
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:ring-1 focus:ring-[#000000] outline-none placeholder:font-normal placeholder:text-slate-300"
              />
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
              <label className="text-[7px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 block">Location</label>
              <div className="flex gap-1">
                <select
                  value={formData.locationType}
                  onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                  className="bg-slate-50 border-none rounded-lg px-0.5 py-1 text-[8px] font-bold text-slate-500 outline-none"
                >
                  <option value="offline">OFF</option>
                  <option value="online">ON</option>
                </select>
                <input
                  type="text"
                  value={formData.locationDetail}
                  placeholder="e.g. Zoom"
                  onChange={(e) => setFormData({ ...formData, locationDetail: e.target.value })}
                  className="flex-1 bg-slate-50 border-none rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none placeholder:font-normal placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
              <label className="text-[7px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 block">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="" disabled>Select Category</option>
                <option value="tech">Tech</option>
                <option value="business">Business</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
              <label className="text-[7px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 block">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none"
              />
            </div>
          </div>

          {/* Lessons / Tasks Tabs — same in both modes */}
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
            {/* CREATE MODE — empty placeholders */}
            {isCreate && (
              <div className="py-10 text-center bg-white border border-slate-100 rounded-2xl">
                <span className="material-symbols-outlined text-3xl text-slate-200 block mb-2">
                  {activeTab === 'Lessons' ? 'menu_book' : 'task_alt'}
                </span>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {activeTab === 'Lessons' ? 'No lessons yet' : 'No tasks yet'}
                </p>
                <p className="text-[8px] text-slate-300 mt-1">Create the training first</p>
              </div>
            )}

            {/* EDIT MODE — Lessons */}
            {!isCreate && activeTab === 'Lessons' && (
              <div className="space-y-3 pt-1">
                <LessonManager trainingId={trainingId!} />
              </div>
            )}

            {/* EDIT MODE — Tasks */}
            {!isCreate && activeTab === 'Tasks' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Full Task List</h3>
                    <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                      {relatedTasks.length} ITEMS
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onClose()
                      router.push(`/tasks/extract?training_id=${trainingId}`)
                    }}
                    className="flex items-center justify-center p-1.5 bg-black text-white rounded-lg border border-black hover:bg-slate-900 transition-colors group"
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
                      task={{ ...task, training: { id: training!.id, title: training!.title } }}
                      onClick={() => openTaskDrawer(task.id)}
                    />
                  ))
                )}
              </div>
            )}

            {!isCreate && activeTab === 'Worksheet' && (
              <div className="pt-1">
                 <WorksheetManager trainingId={trainingId!} trainingTitle={training?.title || ''} />
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="hidden lg:flex p-3.5 bg-white border-t border-slate-100 items-center justify-between gap-2.5 sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] min-h-[60px]">
          {/* Left actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleArchive}
              disabled={actionLoading || isCreate}
              title={isCreate ? 'Save training first' : (training?.is_archived ? 'Restore' : 'Archive')}
              className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#000000] transition-all shadow-sm ${isCreate ? 'opacity-25 cursor-not-allowed' : 'hover:bg-slate-100'}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {training?.is_archived ? 'unarchive' : 'archive'}
              </span>
            </button>
            <button
              onClick={() => handleAddTask()}
              disabled={actionLoading}
              title={isCreate ? 'Auto-save training & add task' : 'Add Task'}
              className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-1.5 text-[#000000] hover:bg-slate-100 transition-all shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">add_task</span>
              <span className="text-[9px] font-bold uppercase tracking-widest">Task</span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-[#000000] font-bold text-[9px] uppercase tracking-widest border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || actionLoading}
              className={`px-5 py-2.5 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all min-w-[130px] ${
                canSave && !actionLoading
                  ? 'bg-black text-white shadow-lg active:scale-95'
                  : 'bg-slate-100 text-slate-300 border border-slate-100 cursor-not-allowed'
              }`}
            >
              {actionLoading
                ? 'Saving...'
                : isCreate
                ? 'Create Training'
                : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Delete Training?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed px-2">This will permanently remove this training and its associated tasks.</p>
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
