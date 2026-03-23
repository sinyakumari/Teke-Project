import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  profilePicture?: string
  phone?: string
  address?: string
  bio?: string
  appLock?: boolean
  reviewReminders?: boolean
}

interface Training {
  id: string
  title: string
  instructor: string
  location_type: string
  location_name?: string
  start_date?: string
  end_date?: string
  category: string
  is_archived: boolean
  description?: string
  pdfs?: { name: string; url: string }[]
}

interface Task {
  id: string
  name: string
  status: string
  description?: string
  notes?: string
  priority?: 'Low' | 'Medium' | 'High'
  deadline?: string
  blocked_by_task_id?: string
  training_id?: string
  training?: { id: string; title: string }
  attachments?: { name: string; url: string; type: string }[]
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface Notification {
  id: string
  title: string
  message: string
  timestamp: string
  isRead: boolean
  type: 'info' | 'success' | 'warning' | 'error'
  link?: string
}

interface AppState {
  // User
  user: User | null
  userLoading: boolean
  userError: string | null
  fetchUser: () => Promise<void>
  setUser: (user: User | null) => void

  // Trainings
  trainings: Training[]
  trainingsLoading: boolean
  trainingsError: string | null
  fetchTrainings: (isArchived?: boolean) => Promise<void>
  addTraining: (training: Training) => void
  updateTraining: (training: Training) => void
  deleteTraining: (id: string) => void

  // Tasks
  tasks: Task[]
  tasksLoading: boolean
  tasksError: string | null
  fetchTasks: () => Promise<void>
  addTask: (task: Task) => void
  addBulkTasks: (tasks: Task[], trainingName?: string) => void
  updateTask: (task: Task) => void
  deleteTask: (id: string) => void

  // UI State
  activeTaskId: string | null
  activeTrainingId: string | null
  isTaskDrawerOpen: boolean
  openTaskDrawer: (id: string | 'new', trainingId?: string) => void
  closeTaskDrawer: () => void

  // Notifications
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void
  markAsRead: (id: string) => void
  clearNotifications: () => void

  // Toasts
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void

  // Global Sync
  isInitialized: boolean
  syncAll: () => Promise<void>
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
      // User
      user: null,
      userLoading: false,
      userError: null,
      setUser: (user) => set({ user }, false, 'user/setUser'),
      fetchUser: async () => {
        set({ userLoading: true, userError: null }, false, 'user/fetch_start')
        try {
          const res = await fetch('/api/user')
          if (!res.ok) throw new Error('Failed to fetch user')
          const data = await res.json()
          set({ user: data.user, userLoading: false }, false, 'user/fetch_success')
        } catch (error: any) {
          set({ userError: error.message, userLoading: false }, false, 'user/fetch_error')
        }
      },

      // Trainings
      trainings: [],
      trainingsLoading: false,
      trainingsError: null,
      fetchTrainings: async (isArchived = false) => {
        set({ trainingsLoading: true, trainingsError: null }, false, 'trainings/fetch_start')
        try {
          const res = await fetch(`/api/trainings?is_archived=${isArchived}`)
          if (!res.ok) throw new Error('Failed to fetch trainings')
          const data = await res.json()
          set({ trainings: data.trainings || [], trainingsLoading: false }, false, 'trainings/fetch_success')
        } catch (error: any) {
          set({ trainingsError: error.message, trainingsLoading: false }, false, 'trainings/fetch_error')
        }
      },
      addTraining: (training) => set((state) => ({ trainings: [training, ...state.trainings] }), false, 'trainings/add'),
      updateTraining: (training) => set((state) => ({
        trainings: state.trainings.map(t => t.id === training.id ? training : t)
      }), false, 'trainings/update'),
      deleteTraining: (id) => set((state) => ({
        trainings: state.trainings.filter(t => t.id !== id)
      }), false, 'trainings/delete'),

      // Tasks
      tasks: [],
      tasksLoading: false,
      tasksError: null,
      fetchTasks: async () => {
        set({ tasksLoading: true, tasksError: null }, false, 'tasks/fetch_start')
        try {
          const res = await fetch('/api/tasks')
          if (!res.ok) throw new Error('Failed to fetch tasks')
          const data = await res.json()
          const mappedTasks = (data.tasks || []).map((t: any) => ({
            ...t,
            training: Array.isArray(t.trainings) ? t.trainings[0] : (t.trainings || t.training)
          }))
          set({ tasks: mappedTasks, tasksLoading: false }, false, 'tasks/fetch_success')
        } catch (error: any) {
          set({ tasksError: error.message, tasksLoading: false }, false, 'tasks/fetch_error')
        }
      },
      addTask: (task) => {
        const state = get()
        state.addNotification({
          title: 'Task Created',
          message: `Task "${task.name}" has been added to your board.`,
          type: 'success'
        })
        set((state) => ({ tasks: [task, ...state.tasks] }), false, 'tasks/add')
      },
      addBulkTasks: (newTasks, trainingName) => {
        const state = get()
        state.addNotification({
          title: 'Syllabus Extracted! 📄',
          message: `Successfully extracted ${newTasks.length} tasks${trainingName ? ` for "${trainingName}"` : ''}. They are now on your board.`,
          type: 'success'
        })
        state.addToast(`${newTasks.length} tasks added`, 'success')
        set((state) => ({ tasks: [...newTasks, ...state.tasks] }), false, 'tasks/addBulk')
      },
      updateTask: (task) => {
        const state = get()
        const oldTask = state.tasks.find(t => t.id === task.id)
        if (!oldTask) return

        let wasNotified = false

        // Scenario 1: Unlocking OTHERS by completing THIS task
        if (task.status === 'complete' && oldTask.status !== 'complete') {
          const blockedTasks = state.tasks.filter(t => t.blocked_by_task_id === task.id)
          if (blockedTasks.length > 0) {
            const names = blockedTasks.map(t => t.name).join(', ')
            state.addNotification({
              title: 'Workflow Unlocked! 🚀',
              message: `By finishing "${task.name}", you've unblocked ${blockedTasks.length} task${blockedTasks.length > 1 ? 's' : ''}: ${names}.`,
              type: 'success'
            })
            wasNotified = true
          } else {
            state.addNotification({
              title: 'Task Completed! ✅',
              message: `Excellent! You've successfully finished "${task.name}".`,
              type: 'success'
            })
            wasNotified = true
          }
          state.addToast(`Task completed!`, 'success')
        }

        // Scenario 2: Unlocking THIS task by removing its blocker
        if (oldTask.blocked_by_task_id && !task.blocked_by_task_id) {
          state.addNotification({
            title: 'Task Unlocked! 🔓',
            message: `Task "${task.name}" is no longer blocked and ready to start.`,
            type: 'success'
          })
          wasNotified = true
        }

        // Generic Update if not unblocked/completed
        if (!wasNotified) {
          const hasSignificantChanges = 
            task.name !== oldTask.name || 
            task.status !== oldTask.status || 
            task.deadline !== oldTask.deadline ||
            (task as any).priority !== (oldTask as any).priority

          if (hasSignificantChanges) {
            state.addNotification({
              title: 'Task Updated',
              message: `The details for "${task.name}" have been updated.`,
              type: 'info'
            })
          }
        }

        set((state) => ({
          tasks: state.tasks.map(t => t.id === task.id ? { ...t, ...task } : t)
        }), false, 'tasks/update')
      },
      deleteTask: (id) => {
        const state = get()
        const task = state.tasks.find(t => t.id === id)
        if (task) {
          state.addNotification({
            title: 'Task Deleted',
            message: `The task "${task.name}" was removed.`,
            type: 'warning'
          })
          state.addToast('Task deleted', 'warning')
        }
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== id)
        }), false, 'tasks/delete')
      },

      // UI State
      activeTaskId: null,
      activeTrainingId: null,
      isTaskDrawerOpen: false,
      openTaskDrawer: (id, trainingId) => set({
        activeTaskId: id,
        isTaskDrawerOpen: true,
        activeTrainingId: trainingId || null
      }, false, 'ui/openTaskDrawer'),
      closeTaskDrawer: () => set({
        activeTaskId: null,
        isTaskDrawerOpen: false,
        activeTrainingId: null
      }, false, 'ui/closeTaskDrawer'),

      // Notifications
      notifications: [],
      unreadCount: 0,
      addNotification: (notif) => {
        const newNotif: Notification = {
          ...notif,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          isRead: false
        }
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }), false, 'notifications/add')
      },
      markAsRead: (id) => set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        )
        const unreadCount = notifications.filter((n) => !n.isRead).length
        return { notifications, unreadCount }
      }, false, 'notifications/markAsRead'),
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }, false, 'notifications/clear'),

      // Toasts
      toasts: [],
      addToast: (message, type = 'info') => {
        const id = Math.random().toString(36).substr(2, 9)
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }]
        }), false, 'toasts/add')

        // Auto-remove after 3 seconds
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
          }), false, 'toasts/remove')
        }, 3000)
      },
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }), false, 'toasts/remove'),

      // Global Sync
      isInitialized: false,
      syncAll: async () => {
        if (get().isInitialized) return
        set({ userLoading: true, trainingsLoading: true, tasksLoading: true }, false, 'sync/start')

        try {
          await Promise.all([
            get().fetchUser(),
            get().fetchTrainings(false),
            get().fetchTasks()
          ])
          set({ isInitialized: true }, false, 'sync/complete')
        } catch (error) {
          console.error('Initial sync failed:', error)
          set({ isInitialized: false }, false, 'sync/error')
        } finally {
          set({ userLoading: false, trainingsLoading: false, tasksLoading: false }, false, 'sync/end')
        }
      }
    }),
    {
      name: 'teke-app-storage',
      partialize: (state) => ({
        user: state.user,
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        trainings: state.trainings,
        tasks: state.tasks
      })
    }
    ),
    { name: 'TeKe AppStore' }
  )
)
