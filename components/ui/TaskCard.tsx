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
      className={`bg-white rounded-2xl shadow-sm border cursor-pointer hover:shadow-md active:scale-[0.98] transition-all relative group h-full flex flex-col justify-center
        ${compact ? 'p-3.5' : 'p-5'}
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
          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={editName}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => saveName()}
              onKeyDown={handleKeyDown}
              className={`w-full bg-white border-2 border-[#1a1f2e] rounded-lg px-2 py-1 font-semibold outline-none ${compact ? 'text-[14px] mb-1.5' : 'text-[17px] mb-2'
                }`}
            />
          ) : (
            <h3
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              className={`font-semibold truncate transition-colors ${compact ? 'text-[14px] mb-1.5' : 'text-[17px] mb-2'
                } ${isComplete ? 'text-slate-400 line-through' : 'text-[#1a1f2e]'
                }`}
            >
              {task.name}
            </h3>
          )}

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

          {/* Status Label */}
          <div className={`${compact ? 'mt-2' : 'mt-3'} flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-green-500' : isBlocked ? 'bg-slate-300' : 'bg-orange-500'}`} />
            <span className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-semibold ${isComplete ? 'text-green-600' : isBlocked ? 'text-slate-400' : 'text-orange-500'}`}>
              {isComplete ? 'complete' : isBlocked ? 'BLOCKED' : task.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          {isBlocked && (
            <div className="text-orange-400" title={`Blocked by ${blockerTask?.name || 'another task'}`}>
              <span className="material-symbols-outlined text-[16px]">lock</span>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick?.(e);
            }}
            className="p-1 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-[#1a1f2e] transition-colors"
            title="Edit Task"
          >
            <svg width={compact ? "16" : "18"} height={compact ? "16" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}