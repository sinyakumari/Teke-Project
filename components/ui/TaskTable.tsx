'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'

interface Task {
  _id: string
  name: string
  status: string
  deadline?: string
  blockedBy?: { _id: string; name: string }[]
  trainingId?: { _id: string; title: string }
}

interface TaskTableProps {
  tasks: Task[]
  onTaskClick: (id: string) => void
  onStatusChange: (id: string, newStatus: string) => void
  onTaskUpdate?: () => void
}

export default function TaskTable({ tasks, onTaskClick, onStatusChange, onTaskUpdate }: TaskTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  async function toggleStatus(e: React.MouseEvent, task: Task) {
    e.stopPropagation()
    if (updatingId || editingId) return

    const isComplete = task.status === 'Complete'
    const newStatus = isComplete ? 'Pending' : 'Complete'
    setUpdatingId(task._id)
    
    try {
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (res.ok) {
        onStatusChange(task._id, newStatus)
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
      const res = await fetch(`/api/tasks/${task._id}`, {
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
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center text-center">Done</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Name</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Training</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tasks.map((task) => {
              const isComplete = task.status === 'Complete'
              return (
                <tr 
                  key={task._id}
                  onClick={() => onTaskClick(task._id)}
                  className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => toggleStatus(e, task)}
                      disabled={updatingId === task._id}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all mx-auto ${
                        isComplete
                          ? 'bg-[#1a1f2e] border-[#1a1f2e]'
                          : 'bg-white border-slate-200 group-hover:border-slate-300'
                      }`}
                    >
                      {isComplete && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {updatingId === task._id && (
                        <div className="w-2 h-2 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === task._id ? (
                      <input
                        type="text"
                        autoFocus
                        value={editName}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => saveName(task)}
                        onKeyDown={(e) => handleKeyDown(e, task)}
                        className="w-full bg-white border-2 border-[#1a1f2e] rounded-lg px-2 py-1 text-[14px] font-bold outline-none"
                      />
                    ) : (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(task._id)
                          setEditName(task.name)
                        }}
                        className={`text-[14px] font-bold border-b border-transparent hover:border-slate-300 transition-colors ${isComplete ? 'text-slate-400 line-through hover:border-transparent' : 'text-[#1a1f2e]'}`}
                      >
                        {task.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {task.trainingId ? (
                      <span className="text-[11px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg uppercase tracking-tight">
                        {task.trainingId.title}
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
                      <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-green-500' : 'bg-orange-500'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${isComplete ? 'text-green-600' : 'text-orange-500'}`}>
                        {task.status}
                      </span>
                    </div>
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
