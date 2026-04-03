'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface Task {
  id: string
  name: string
  status: string
  deadline?: string
  blocked_by_task_id?: string
  training?: { id: string; title: string }
}

interface TaskCardProps {
  task: Task
  onClick?: () => void
  onEditClick?: (e: React.MouseEvent) => void
  onTaskUpdate?: () => void
  compact?: boolean
  highlighted?: boolean
}

export default function TaskCard({ task, onClick, onEditClick, onTaskUpdate, compact = false, highlighted = false }: TaskCardProps) {
  const tasks = useAppStore((state) => state.tasks)
  const toggleTaskStatus = useAppStore((state) => state.toggleTaskStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(task.name)

  const blockerTask = task.blocked_by_task_id ? tasks.find(t => t.id === task.blocked_by_task_id) : null
  const isBlocked = !!blockerTask && blockerTask.status !== 'complete'
  const isComplete = task.status === 'complete'

  async function toggleStatus(e: React.MouseEvent) {
    if (isEditing) return
    e.stopPropagation()
    if (isUpdating || isBlocked) return

    setIsUpdating(true)
    try {
      await toggleTaskStatus(task.id)
    } catch (error) {
      console.error('Error toggling status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  async function saveName() {
    if (!editName.trim() || editName.trim() === task.name) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })

      if (res.ok && onTaskUpdate) {
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Error updating task name:', error)
    } finally {
      setIsUpdating(false)
      setIsEditing(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      saveName()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditName(task.name)
    }
  }

  return (
    <div
      onClick={isEditing ? undefined : onClick}
      className={`bg-white rounded-xl shadow-sm border cursor-pointer hover:shadow-md active:scale-[0.98] transition-all relative group h-full flex flex-col justify-center
        ${compact ? 'p-2.5' : 'p-4'}
        ${isBlocked ? 'opacity-80' : ''}
        ${highlighted ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-100'}
      `}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Functional Checkbox */}
        <button
          onClick={toggleStatus}
          disabled={isUpdating || isEditing || isBlocked}
          className={`rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${compact ? 'w-5 h-5' : 'w-6 h-6'
            } ${isComplete
              ? 'bg-[#1a1f2e] border-[#1a1f2e] shadow-md shadow-slate-200'
              : isBlocked
                ? 'bg-slate-50 border-slate-200 cursor-not-allowed'
                : 'bg-white border-slate-200 group-hover:border-slate-300'
            }`}
          title={isBlocked ? `Blocked by: ${blockerTask?.name}` : undefined}
        >
          {isComplete && (
            <svg width={compact ? "10" : "12"} height={compact ? "10" : "12"} viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {!isComplete && isBlocked && (
            <span className="material-symbols-outlined text-[10px] text-slate-400">lock</span>
          )}
          {isUpdating && (
            <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            {isEditing ? (
              <input
                type="text"
                autoFocus
                value={editName}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => saveName()}
                onKeyDown={handleKeyDown}
                className={`w-full bg-white border-2 border-[#1a1f2e] rounded-lg px-2 py-1 font-semibold outline-none ${compact ? 'text-[14px]' : 'text-[17px]'
                  }`}
              />
            ) : (
              <h3
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
                className={`flex-1 font-semibold truncate transition-colors ${compact ? 'text-[13px]' : 'text-[15px]'
                  } ${isComplete ? 'text-slate-400 line-through' : 'text-[#1a1f2e]'
                  }`}
              >
                {task.name}
              </h3>
            )}

            {!isEditing && (
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {isBlocked && (
                  <div className="text-orange-400 flex items-center mr-0.5" title={`Blocked by ${blockerTask?.name || 'another task'}`}>
                    <span className="material-symbols-outlined text-[13px]">lock</span>
                  </div>
                )}
                <div className="relative flex items-center group">
                  <select
                    value={isComplete ? 'complete' : isBlocked ? 'blocked' : task.status || 'pending'}
                    disabled={isBlocked || isUpdating}
                    onChange={async (e) => {
                      const newVal = e.target.value
                      if (newVal === 'blocked') return
                      setIsUpdating(true)
                      try {
                        const res = await fetch(`/api/tasks/${task.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: newVal })
                        })
                        if (res.ok && onTaskUpdate) onTaskUpdate()
                      } catch (err) {
                        console.error(err)
                      } finally {
                        setIsUpdating(false)
                      }
                    }}
                    className={`bg-transparent outline-none cursor-pointer appearance-none pr-3.5 py-0.5 ${compact ? 'text-[10px]' : 'text-[11px]'} font-bold capitalize leading-normal ${isComplete ? 'text-green-600' : isBlocked ? 'text-slate-400' : 'text-slate-500 hover:text-slate-700'} transition-colors`}
                  >
                    {isBlocked && <option value="blocked">Blocked</option>}
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                    <option value="delayed">Delayed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-[12px] text-slate-300 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">expand_more</span>
                </div>
                {onEditClick && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditClick(e); }}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-300 hover:text-indigo-500 transition-colors"
                    title="Edit Task"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {task.training && (
              <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/50">
                <span className={`text-indigo-600 material-symbols-outlined font-medium ${compact ? 'text-[12px]' : 'text-[14px]'}`}>school</span>
                <span className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-medium text-indigo-600 tracking-tight`}>
                  {task.training.title}
                </span>
              </div>
            )}

            {task.deadline && (
              <p className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-medium text-slate-400`}>
                {formatDate(task.deadline)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}