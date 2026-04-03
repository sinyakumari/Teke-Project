'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import Toggle from '@/components/ui/Toggle'
import NotificationDropdown from '@/components/ui/NotificationDropdown'
import Pagination from '@/components/ui/Pagination'

const CATEGORIES = [
  { 
    id: 'deadline_reminders', 
    name: 'Deadline Reminders', 
    schedule: 'Sent 30 days, 7 days, 3 days, 1 day, and on the day of deadline' 
  },
  { 
    id: 'inactivity_alert', 
    name: 'Inactivity Alert', 
    schedule: 'Triggered when no updates on a task for 5, 7, or 14 days' 
  },
  { 
    id: 'dependency_unlocked', 
    name: 'Dependency Unlocked', 
    schedule: 'Triggered immediately when a prerequisite task is completed' 
  },
  { 
    id: 'overdue_task', 
    name: 'Overdue Task', 
    schedule: 'Triggered after deadline passes, with reminders every 3 days' 
  },
  { 
    id: 'weekly_digest', 
    name: 'Weekly Digest', 
    schedule: 'Sent every Monday with summary of tasks and deadlines' 
  }
]

export default function SettingsPage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const updateUser = useAppStore((state) => state.updateUser)
  const trainings = useAppStore((state) => state.trainings)
  const updateTraining = useAppStore((state) => state.updateTraining)
  const addToast = useAppStore((state) => state.addToast)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Paginated trainings for the notifications list
  const paginatedTrainings = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return trainings.slice(start, start + itemsPerPage)
  }, [trainings, currentPage])

  const handleToggleNotify = async (trainingId: string, currentStatus: boolean) => {
    setUpdatingId(trainingId)
    try {
      const response = await fetch(`/api/trainings/${trainingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications_enabled: !currentStatus }),
      })

      if (!response.ok) throw new Error('Failed to update preference')

      const data = await response.json()
      updateTraining(data.training)
      addToast(
        `Notifications for "${data.training.title}" turned ${!currentStatus ? 'ON' : 'OFF'}`,
        'info'
      )
    } catch (error) {
      console.error('Error updating notification preference:', error)
      addToast('Failed to update notification status', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleCategory = async (categoryId: string, type: 'in_app' | 'push') => {
    const currentPrefs = user?.notificationPrefs || {}
    const categoryPrefs = currentPrefs[categoryId] || { in_app: true, push: true }
    
    const newPrefs = {
      ...currentPrefs,
      [categoryId]: {
        ...categoryPrefs,
        [type]: !categoryPrefs[type]
      }
    }
    
    try {
      await updateUser({ notificationPrefs: newPrefs })
      const catName = CATEGORIES.find(c => c.id === categoryId)?.name
      addToast(
        `${type === 'in_app' ? 'In-app' : 'Push'} alerts for ${catName} updated`,
        'success'
      )
    } catch (error) {
      addToast('Failed to update preferences', 'error')
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-1 pb-10 lg:px-6 lg:pt-3">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex items-start justify-between mb-4 gap-2 pt-1">
            <div className="flex items-center gap-4 min-w-0">
               <button 
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm hover:bg-slate-50 transition-all border border-slate-100 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-slate-600">arrow_back</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1f2e] tracking-tight truncate">Settings</h1>
              </div>
            </div>
            <NotificationDropdown />
          </div>

          {/* Section 1: Training Notifications */}
          <div className="mb-4 mt-8">
             <h2 className="text-lg font-semibold text-[#1a1f2e]">Training Notifications</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Training Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Notify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {trainings.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <span className="material-symbols-outlined text-4xl">school</span>
                          <p className="text-[10px] font-black uppercase tracking-widest">No trainings added</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTrainings.map((training) => (
                      <tr key={training.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-semibold text-[#1a1f2e] leading-tight">{training.title}</span>
                            <span className="text-[12px] font-medium text-slate-500 mt-0.5">{training.instructor || 'No Instructor'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-tight rounded-lg">
                            {training.category || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end items-center gap-3">
                            <span className={`text-[8px] font-black uppercase tracking-widest transition-opacity duration-300 ${training.notifications_enabled ? 'text-indigo-600 opacity-100' : 'text-slate-300 opacity-60'}`}>
                              {training.notifications_enabled ? 'ON' : 'OFF'}
                            </span>
                            <div className={updatingId === training.id ? 'opacity-50 pointer-events-none' : ''}>
                              <Toggle 
                                enabled={training.notifications_enabled ?? true} 
                                onChange={() => handleToggleNotify(training.id, training.notifications_enabled ?? true)}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination for Training Notifications */}
          {trainings.length > itemsPerPage && (
            <div className="flex justify-end mt-4 mb-4">
              <Pagination
                totalItems={trainings.length}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}

          {/* Section 2: Other Notifications and Alerts */}
          <div className="mb-4 mt-4">
             <h2 className="text-lg font-semibold text-[#1a1f2e]">Other Notifications and Alerts</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedule</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">In-App</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Push</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {CATEGORIES.map((cat) => {
                    const prefs = user?.notificationPrefs?.[cat.id] || { in_app: true, push: true }
                    return (
                      <tr key={cat.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                        <td className="px-6 py-4">
                          <span className="text-[14px] font-semibold text-[#1a1f2e] leading-tight block">{cat.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[12px] font-medium text-slate-500 leading-tight block max-w-xs capitalize">
                            {cat.schedule}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <Toggle 
                              enabled={prefs.in_app} 
                              onChange={() => handleToggleCategory(cat.id, 'in_app')}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <Toggle 
                              enabled={prefs.push} 
                              onChange={() => handleToggleCategory(cat.id, 'push')}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
