'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import SegmentedControl from '@/components/ui/SegmentedControl'

interface Task {
  _id: string
  name: string
  status: string
  deadline?: string
  description?: string
  notes?: string
  priority?: 'Low' | 'Medium' | 'High'
  blockedBy?: { _id: string; name: string }[]
  trainingId?: { _id: string; title: string }
}

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'Details' | 'Notes' | 'Dependencies'>('Details')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchTask()
  }, [id])

  async function fetchTask() {
    try {
      const res = await fetch(`/api/tasks/${id}`)
      const data = await res.json()
      setTask(data.task)
    } catch (error) {
      console.error('Error fetching task details:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setTask(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/tasks')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setActionLoading(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-400">Task not found</p>
        <button onClick={() => router.push('/tasks')} className="text-[#1a1f2e] font-semibold">
          Go back
        </button>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    'To Do': 'bg-slate-100 text-slate-500',
    'In Progress': 'bg-blue-50 text-blue-600',
    'Complete': 'bg-green-50 text-green-600',
    'Pending': 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Top Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-4 bg-[#f2f2f7]/80 backdrop-blur-md">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 text-red-500"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => router.push(`/tasks/${id}/edit`)}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="px-4 pb-20">
          <div className="max-w-lg mx-auto lg:max-w-none">
            {/* Task Main Card */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center text-xl">
                  {task.status === 'Complete' ? '✅' : '📝'}
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${statusColors[task.status] || 'bg-slate-100 text-slate-500'}`}>
                  {task.status}
                </div>
              </div>

              <h1 className="text-2xl font-bold text-[#1a1f2e] mb-2">{task.name}</h1>
              {task.trainingId && (
                <Link
                  href={`/trainings/${task.trainingId._id}`}
                  className="inline-flex items-center gap-1.5 text-indigo-600 text-sm font-bold mb-6 hover:underline"
                >
                  <span className="material-symbols-outlined text-[18px]">school</span>
                  {task.trainingId.title}
                </Link>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => handleStatusChange(task.status === 'Complete' ? 'To Do' : 'Complete')}
                  disabled={actionLoading}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all active:scale-95 ${
                    task.status === 'Complete'
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-[#1a1f2e] text-white shadow-lg shadow-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {task.status === 'Complete' ? 'undo' : 'check_circle'}
                  </span>
                  {task.status === 'Complete' ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
                <button
                  className="flex items-center justify-center gap-2 py-3.5 bg-white text-[#1a1f2e] border-2 border-[#1a1f2e] rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                  Set Deadline
                </button>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                  <p className={`text-sm font-bold ${
                    task.priority === 'High' ? 'text-red-500' :
                    task.priority === 'Medium' ? 'text-orange-500' : 'text-blue-500'
                  }`}>
                    {task.priority || 'Medium'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Deadline</p>
                  <p className="text-sm font-bold text-[#1a1f2e]">
                    {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date'}
                  </p>
                </div>
              </div>
            </div>

            {/* Segmented Control */}
            <div className="mb-6">
              <SegmentedControl
                options={[
                  { label: 'Details', value: 'Details' },
                  { label: 'Notes', value: 'Notes' },
                  { label: 'Dependencies', value: 'Dependencies' }
                ]}
                value={activeTab}
                onChange={(tab) => setActiveTab(tab as any)}
              />
            </div>

            {/* Tab Content */}
            {activeTab === 'Details' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-lg font-bold text-[#1a1f2e] mb-3">Description</h2>
                  <p className="text-slate-600 leading-relaxed bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    {task.description || 'No description provided for this task.'}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1a1f2e]">Created On</span>
                    <span className="text-sm text-slate-500">Mar 10, 2024</span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1a1f2e]">Last Updated</span>
                    <span className="text-sm text-slate-500">2 hours ago</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Notes' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#1a1f2e]">Personal Notes</h2>
                  <button className="text-indigo-600 text-sm font-bold hover:underline">Edit</button>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm min-h-[150px]">
                  {task.notes ? (
                    <p className="text-slate-600 whitespace-pre-wrap">{task.notes}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                      <span className="material-symbols-outlined text-[32px] mb-2">stylus_note</span>
                      <p className="text-sm">Tap to add your thoughts or findings</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Dependencies' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-lg font-bold text-[#1a1f2e]">Blocked By</h2>
                {task.blockedBy && task.blockedBy.length > 0 ? (
                  <div className="space-y-3">
                    {task.blockedBy.map((dep) => (
                      <Link
                        key={dep._id}
                        href={`/tasks/${dep._id}`}
                        className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-50 w-10 h-10 rounded-xl flex items-center justify-center text-orange-500">
                            <span className="material-symbols-outlined">warning</span>
                          </div>
                          <span className="text-sm font-bold text-[#1a1f2e]">{dep.name}</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 group-hover:text-[#1a1f2e] transition-colors">chevron_right</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                      <span className="material-symbols-outlined text-3xl">check_circle</span>
                    </div>
                    <p className="text-slate-500 font-bold">No dependencies found</p>
                    <p className="text-xs text-slate-400 mt-1">This task is ready to be worked on!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-500 text-3xl">delete_forever</span>
            </div>
            <h3 className="text-xl font-bold text-[#1a1f2e] text-center mb-2">Delete Task?</h3>
            <p className="text-slate-500 text-center mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-[#1a1f2e]">&quot;{task.name}&quot;</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-200 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
