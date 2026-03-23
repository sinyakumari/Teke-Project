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

interface TaskTableProps {
  tasks: Task[]
  onTaskClick: (id: string) => void
  onEditClick: (id: string) => void
  onStatusChange: (id: string, newStatus: string) => void
  onTaskUpdate?: () => void
}

export default function TaskTable({ tasks: visibleTasks, onTaskClick, onEditClick, onStatusChange, onTaskUpdate }: TaskTableProps) {
  const allTasks = useAppStore((state) => state.tasks)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  async function toggleStatus(e: React.MouseEvent, task: Task) {
    e.stopPropagation()
    if (updatingId || editingId) return

    const isComplete = task.status === 'complete'
    const newStatus = isComplete ? 'pending' : 'complete'
    setUpdatingId(task.id)

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        onStatusChange(task.id, newStatus)
      }
    } catch (error) {
      console.error('Error toggling task status:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  async function saveName(task: Task) {
    if (!editName.trim() || editName.trim() === task.name) {
      setEditingId(null)
      return
    }

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
      setEditingId(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, task: Task) {
    if (e.key === 'Enter') {
      saveName(task)
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center text-center">Done</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Name</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Training</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {visibleTasks.map((task) => {
              const blockerTask = task.blocked_by_task_id ? allTasks.find(t => t.id === task.blocked_by_task_id) : null
              const isBlocked = !!blockerTask && blockerTask.status !== 'complete'
              const isComplete = task.status === 'complete'
              return (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick(task.id)}
                  className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => toggleStatus(e, task)}
                      disabled={updatingId === task.id || isBlocked}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all mx-auto ${isComplete
                          ? 'bg-[#1a1f2e] border-[#1a1f2e]'
                          : isBlocked 
                            ? 'bg-slate-50 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-200 group-hover:border-slate-300'
                        }`}
                      title={isBlocked ? `Requires: ${blockerTask?.name}` : undefined}
                    >
                      {isComplete && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {!isComplete && isBlocked && (
                        <span className="material-symbols-outlined text-[10px] text-slate-400">lock</span>
                      )}
                      {updatingId === task.id && (
                        <div className="w-2 h-2 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === task.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={editName}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => saveName(task)}
                        onKeyDown={(e) => handleKeyDown(e, task)}
                        className="w-full bg-white border-2 border-[#1a1f2e] rounded-lg px-2 py-1 text-[14px] font-semibold outline-none"
                      />
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(task.id)
                          setEditName(task.name)
                        }}
                        className={`text-[14px] font-semibold transition-colors ${isComplete ? 'text-slate-400 line-through' : 'text-[#1a1f2e]'}`}
                      >
                        {task.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {task.training || (task as any).trainings ? (
                      <span className="text-[13px] font-bold text-slate-700 pointer-events-none">
                        {task.training?.title || (task as any).trainings?.title}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-300">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[12px] font-bold text-slate-500 whitespace-nowrap">
                      {task.deadline ? formatDate(task.deadline) : 'No date'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-green-500' : isBlocked ? 'bg-slate-300' : 'bg-orange-500'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${isComplete ? 'text-green-600' : isBlocked ? 'text-slate-400' : 'text-orange-500'}`}>
                        {isComplete ? 'complete' : isBlocked ? 'blocked' : task.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(task.id);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-[#1a1f2e] transition-colors"
                      title="Edit Task"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
