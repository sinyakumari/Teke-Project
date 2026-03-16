'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import SegmentedControl from '@/components/ui/SegmentedControl'
import TaskCard from '@/components/ui/TaskCard'

interface Task {
  id: string
  name: string
  status: string
  deadline?: string
}

interface Training {
  id: string
  title: string
  instructor?: string
  description?: string
  duration?: string
  lessons?: string[]
  is_archived: boolean
  pdfs?: { name: string; url: string }[]
  start_date?: string
  end_date?: string
}

export default function TrainingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [training, setTraining] = useState<Training | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'Overview' | 'Tasks' | 'Materials'>('Overview')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    try {
      const [trainingRes, tasksRes] = await Promise.all([
        fetch(`/api/trainings/${id}`),
        fetch(`/api/tasks?training_id=${id}`),
      ])
      const trainingData = await trainingRes.json()
      const tasksData = await tasksRes.json()
      setTraining(trainingData.training)
      setTasks(tasksData.tasks || [])
    } catch (error) {
      console.error('Error fetching training details:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleArchive() {
    setActionLoading(true)
    try {
      const newArchived = !training?.is_archived
      const res = await fetch(`/api/trainings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: newArchived }),
      })
      if (res.ok) {
        setTraining(prev => prev ? { ...prev, is_archived: newArchived } : null)
      }
    } catch (error) {
      console.error('Error archiving training:', error)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/trainings/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/trainings')
      }
    } catch (error) {
      console.error('Error deleting training:', error)
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

  if (!training) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-400">Training not found</p>
        <button onClick={() => router.push('/trainings')} className="text-[#1a1f2e] font-semibold">
          Go back
        </button>
      </div>
    )
  }

  const completedCount = tasks.filter(t => t.status === 'complete').length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

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
              onClick={() => router.push(`/trainings/${id}/edit`)}
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
            {/* Training Card Details */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                  !training.is_archived ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {training.is_archived ? 'archived' : 'active'}
                </div>
              </div>

              <h1 className="text-2xl font-bold text-[#1a1f2e] mb-2">{training.title}</h1>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                By {training.instructor || 'Unknown Instructor'} • {training.lessons?.length || 0} Lessons
              </p>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-[#1a1f2e]">Progress</span>
                  <span className="text-sm font-bold text-[#1a1f2e]">{progress}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1a1f2e] rounded-full transition-all duration-500 ease-out shadow-sm"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tasks</p>
                  <p className="text-lg font-bold text-[#1a1f2e]">{tasks.length}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Completed</p>
                  <p className="text-lg font-bold text-green-600">
                    {tasks.filter(t => t.status === 'complete').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Segmented Control */}
            <div className="mb-6">
              <SegmentedControl
                options={[
                  { label: 'Overview', value: 'Overview' },
                  { label: 'Tasks', value: 'Tasks' },
                  { label: 'Materials', value: 'Materials' }
                ]}
                value={activeTab}
                onChange={(tab) => setActiveTab(tab as any)}
              />
            </div>

            {/* Tab Content */}
            {activeTab === 'Overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Description */}
                <div>
                  <h2 className="text-lg font-bold text-[#1a1f2e] mb-3">About this Training</h2>
                  <p className="text-slate-600 leading-relaxed bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    {training.description || 'No description available for this training.'}
                  </p>
                </div>

                {/* Details List */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                      </div>
                      <span className="text-sm font-bold text-[#1a1f2e]">Duration</span>
                    </div>
                    <span className="text-sm text-slate-500">{training.duration || 'N/A'}</span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                        <span className="material-symbols-outlined text-[18px]">school</span>
                      </div>
                      <span className="text-sm font-bold text-[#1a1f2e]">Target Level</span>
                    </div>
                    <span className="text-sm text-slate-500">Intermediate</span>
                  </div>
                </div>

                {/* Archive Button */}
                <button
                  onClick={handleArchive}
                  disabled={actionLoading}
                  className="w-full py-4 bg-white text-[#1a1f2e] font-bold rounded-2xl border-2 border-[#1a1f2e] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group shadow-sm active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">
                    {training.is_archived ? 'unarchive' : 'archive'}
                  </span>
                  {!training.is_archived ? 'Archive Training' : 'Restore Training'}
                </button>
              </div>
            )}

            {activeTab === 'Tasks' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#1a1f2e]">Course Tasks</h2>
                  <button
                    onClick={() => router.push(`/tasks/new?training_id=${id}`)}
                    className="text-indigo-600 text-sm font-bold hover:underline"
                  >
                    + Add Task
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📋</span>
                    </div>
                    <p className="text-slate-500 font-bold mb-4">No tasks added yet</p>
                    <button
                      onClick={() => router.push(`/tasks/new?training_id=${id}`)}
                      className="bg-[#1a1f2e] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm"
                    >
                      Create First Task
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={{
                          ...task,
                          training_id: id,
                          training: { id, title: training.title }
                        }}
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Materials' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-lg font-bold text-[#1a1f2e]">Resources</h2>
                {training.pdfs && training.pdfs.length > 0 ? (
                  <div className="grid gap-3">
                    {training.pdfs.map((pdf, idx) => (
                      <a
                        key={idx}
                        href={pdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-red-50 w-10 h-10 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">picture_as_pdf</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1a1f2e] truncate max-w-[200px]">{pdf.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">PDF Document</p>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 group-hover:text-[#1a1f2e] transition-colors">download</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📁</span>
                    </div>
                    <p className="text-slate-500 font-bold">No materials uploaded</p>
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
            <h3 className="text-xl font-bold text-[#1a1f2e] text-center mb-2">Delete Training?</h3>
            <p className="text-slate-500 text-center mb-6 leading-relaxed">
              This will permanently remove <span className="font-bold text-[#1a1f2e]">&quot;{training.title}&quot;</span> and all its associated tasks. This action cannot be undone.
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