'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'

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
  onClick: () => void
  onEditClick?: (e: React.MouseEvent) => void
  onStatusChange?: (newStatus: string) => void
}

export default function TaskCard({ task, onClick, onEditClick, onStatusChange }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(task.status)

  const isComplete = currentStatus === 'complete'
  const isBlocked = !!task.blocked_by_task_id
  const blockerName = 'Another task'

  async function toggleStatus(e: React.MouseEvent) {
    e.stopPropagation()
    if (isUpdating) return

    const newStatus = isComplete ? 'pending' : 'complete'
    setIsUpdating(true)
    
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (res.ok) {
        setCurrentStatus(newStatus)
        if (onStatusChange) onStatusChange(newStatus)
      }
    } catch (error) {
      console.error('Error toggling task status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-50 cursor-pointer active:scale-[0.98] transition-all relative group h-full flex flex-col justify-center ${
        isBlocked ? 'opacity-80' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Functional Checkbox */}
        <button
          onClick={toggleStatus}
          disabled={isUpdating}
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 mt-1 ${
            isComplete
              ? 'bg-[#1a1f2e] border-[#1a1f2e] shadow-md shadow-slate-200'
              : 'bg-white border-slate-200 group-hover:border-slate-300'
          }`}
        >
          {isComplete && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {isUpdating && (
             <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-black truncate mb-2 transition-colors ${
            isComplete ? 'text-slate-400 line-through' : 'text-[#1a1f2e]'
          }`}>
            {task.name}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {task.training && (
              <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg">
                <span className="text-indigo-600 text-[14px] material-symbols-outlined font-black">school</span>
                <span className="text-[11px] font-black text-indigo-600 tracking-tight">
                  {task.training.title}
                </span>
              </div>
            )}

            {task.deadline && (
              <p className="text-[11px] font-black text-slate-400">
                {formatDate(task.deadline)}
              </p>
            )}
          </div>

          {/* Status Label (match screenshot) */}
          <div className="mt-3 flex items-center gap-1.5">
             <span className={`w-1.5 h-1.5 rounded-full ${
               isComplete ? 'bg-green-500' : 'bg-orange-500'
             }`} />
             <span className={`text-[11px] font-black ${
               isComplete ? 'text-green-600' : 'text-orange-500'
             }`}>
               {isComplete ? 'complete' : 'pending'}
             </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          {isBlocked && (
            <div className="text-orange-400" title={`Blocked by ${blockerName}`}>
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick?.(e);
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-[#1a1f2e] transition-colors"
            title="Edit Task"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}