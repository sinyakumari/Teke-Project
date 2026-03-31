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

interface Question {
  id: string
  worksheetId: string
  question: string
  answer: string
  order?: number
}

interface Worksheet {
  id: string
  name: string
  training_id: string
  lesson_id: string
  created_at: string
  lessons?: { id: string; name: string }
  questions: Question[]
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
  is_read: boolean
  type: 'in-app' | 'push'
  category: 'info' | 'success' | 'warning' | 'error'
  link?: string
  related_task_ids?: string[]
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

  // Worksheets
  worksheets: Record<string, Worksheet[]> // trainingId -> worksheets
  worksheetsLoading: boolean
  fetchWorksheets: (trainingId: string) => Promise<void>
  addWorksheet: (trainingId: string, worksheet: Worksheet) => void
  updateWorksheetQuestion: (trainingId: string, worksheetId: string, question: Question) => void
  deleteWorksheetQuestion: (trainingId: string, worksheetId: string, questionId: string) => void
  deleteWorksheet: (trainingId: string, worksheetId: string) => void

  // Tasks
  tasks: Task[]
  tasksLoading: boolean
  tasksError: string | null
  fetchTasks: () => Promise<void>
  addTask: (task: Task) => void
  addBulkTasks: (tasks: Task[], trainingName?: string) => void
  updateTask: (task: Task) => void
  deleteTask: (id: string) => void
  toggleTaskStatus: (id: string) => Promise<void>
  deleteTaskAction: (id: string) => Promise<void>

  // Notifications
  notifications: Notification[]
  unreadCount: number
  notificationsLoading: boolean
  fetchNotifications: () => Promise<void>
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'is_read'>) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearNotifications: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>

  // UI State
  activeTaskId: string | null
  activeTrainingId: string | null
  isTaskDrawerOpen: boolean
  isNotificationHistoryOpen: boolean
  openTaskDrawer: (id: string | 'new', trainingId?: string) => void
  closeTaskDrawer: () => void
  toggleNotificationHistory: (open?: boolean) => void

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
        addTraining: (training) => {
          const state = get()
          state.addNotification({
            title: 'New Training Added 🎓',
            message: `"${training.title}" is now in your dashboard. Start planning your tasks!`,
            category: 'success',
            type: 'in-app',
          })
          set((state) => ({ trainings: [training, ...state.trainings] }), false, 'trainings/add')
        },
        updateTraining: (training) => {
          const state = get()
          state.addNotification({
            title: 'Training Updated ✏️',
            message: `"${training.title}" has been saved with the latest changes.`,
            category: 'info',
            type: 'in-app',
          })
          set((state) => ({
            trainings: state.trainings.map(t => t.id === training.id ? training : t)
          }), false, 'trainings/update')
        },
        deleteTraining: (id) => {
          const state = get()
          const training = state.trainings.find(t => t.id === id)
          if (training) {
            state.addNotification({
              title: 'Training Deleted 🗑️',
              message: `"${training.title}" and its associated data have been removed.`,
              category: 'warning',
              type: 'in-app',
            })
          }
          set((state) => ({
            trainings: state.trainings.filter(t => t.id !== id)
          }), false, 'trainings/delete')
        },

        // Worksheets
        worksheets: {},
        worksheetsLoading: false,
        fetchWorksheets: async (trainingId) => {
          if (!trainingId) return
          set({ worksheetsLoading: true }, false, 'worksheets/fetch_start')
          try {
            const res = await fetch(`/api/trainings/${trainingId}/worksheets`)
            if (!res.ok) throw new Error('Failed to fetch worksheets')
            const data = await res.json()
            set((state) => ({
              worksheets: {
                ...state.worksheets,
                [trainingId]: data.worksheets || []
              },
              worksheetsLoading: false
            }), false, 'worksheets/fetch_success')
          } catch (error) {
            console.error('Worksheets fetch error:', error)
            set({ worksheetsLoading: false }, false, 'worksheets/fetch_error')
          }
        },
        addWorksheet: (trainingId, worksheet) => {
          set((state) => ({
            worksheets: {
              ...state.worksheets,
              [trainingId]: [worksheet, ...(state.worksheets[trainingId] || [])]
            }
          }), false, 'worksheets/add')
        },
        updateWorksheetQuestion: (trainingId, worksheetId, question) => {
          set((state) => ({
            worksheets: {
              ...state.worksheets,
              [trainingId]: (state.worksheets[trainingId] || []).map(ws => 
                ws.id === worksheetId 
                  ? { ...ws, questions: [...ws.questions, question] }
                  : ws
              )
            }
          }), false, 'worksheets/update_question')
        },
        deleteWorksheetQuestion: (trainingId, worksheetId, questionId) => {
          set((state) => ({
            worksheets: {
              ...state.worksheets,
              [trainingId]: (state.worksheets[trainingId] || []).map(ws => 
                ws.id === worksheetId 
                  ? { ...ws, questions: (ws.questions || []).filter(q => q.id !== questionId) }
                  : ws
              )
            }
          }), false, 'worksheets/delete_question')
        },
        deleteWorksheet: (trainingId, worksheetId) => {
          set((state) => ({
            worksheets: {
              ...state.worksheets,
              [trainingId]: (state.worksheets[trainingId] || []).filter(ws => ws.id !== worksheetId)
            }
          }), false, 'worksheets/delete')
        },

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
            title: 'Task Created ✅',
            message: `"${task.name}" has been added to your board.`,
            category: 'success',
            type: 'in-app',
            related_task_ids: [task.id]
          })
          set((state) => ({ tasks: [task, ...state.tasks] }), false, 'tasks/add')
        },
        addBulkTasks: (newTasks, trainingName) => {
          const state = get()
          state.addNotification({
            title: 'Syllabus Extracted! 📄',
            message: `${newTasks.length} tasks extracted${trainingName ? ` for "${trainingName}"` : ''}. They are now on your board.`,
            category: 'success',
            type: 'in-app',
            related_task_ids: newTasks.map(t => t.id)
          })
          set((state) => ({ tasks: [...newTasks, ...state.tasks] }), false, 'tasks/addBulk')
        },
        updateTask: (task) => {
          const state = get()
          const oldTask = state.tasks.find(t => t.id === task.id)
          if (!oldTask) return

          // Update store first (optimistic)
          set((state) => ({
            tasks: state.tasks.map(t => t.id === task.id ? { ...t, ...task } : t)
          }), false, 'tasks/update')

          // Scenario 1: Completing a task that unblocks others
          if (task.status === 'complete' && oldTask.status !== 'complete') {
            const currentTasks = get().tasks
            const blockedTasks = currentTasks.filter(t => t.blocked_by_task_id === task.id)
            if (blockedTasks.length > 0) {
              const names = blockedTasks.map(t => t.name).join(', ')
              state.addNotification({
                title: 'Workflow Unlocked! 🚀',
                message: `Completing "${task.name}" unblocked ${blockedTasks.length} task(s): ${names}.`,
                category: 'success',
                type: 'in-app',
                related_task_ids: blockedTasks.map(t => t.id)
              })
            } else {
              state.addNotification({
                title: 'Task Completed! ✅',
                message: `Great work! "${task.name}" is marked as complete.`,
                category: 'success',
                type: 'in-app',
                related_task_ids: [task.id]
              })
            }
          }

          // Scenario 2: Unblocking THIS task (removing dependency)
          if (oldTask.blocked_by_task_id && !task.blocked_by_task_id) {
            state.addNotification({
              title: 'Task Unblocked! 🔓',
              message: `"${task.name}" no longer has blockers and is ready to start.`,
              category: 'success',
              type: 'in-app',
              related_task_ids: [task.id]
            })
          }

          // Scenario 3: Generic significant change (not a status/blocker change)
          const isCompletionChange = task.status === 'complete' && oldTask.status !== 'complete'
          const isBlockerChange = oldTask.blocked_by_task_id !== task.blocked_by_task_id
          if (!isCompletionChange && !isBlockerChange) {
            const hasSignificantChanges =
              task.name !== oldTask.name ||
              task.status !== oldTask.status ||
              task.deadline !== oldTask.deadline ||
              task.priority !== oldTask.priority
            if (hasSignificantChanges) {
              state.addNotification({
                title: 'Task Updated 📝',
                message: `Changes to "${task.name}" have been saved.`,
                category: 'info',
                type: 'in-app',
                related_task_ids: [task.id]
              })
            }
          }
        },
        toggleTaskStatus: async (id) => {
          const { tasks, updateTask } = get()
          const task = tasks.find(t => t.id === id)
          if (!task) return

          const oldStatus = task.status
          const newStatus = oldStatus === 'complete' ? 'pending' : 'complete'

          // 1. Optimistic UI update
          updateTask({ ...task, status: newStatus })

          try {
            const res = await fetch(`/api/tasks/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus }),
            })

            if (!res.ok) throw new Error('Failed to update status')

            const result = await res.json()
            // Ensure we have the latest server state (if any extra fields were updated)
            if (result.task) updateTask(result.task)
          } catch (error) {
            console.error('Task status toggle failed:', error)
            // 2. Rollback
            updateTask({ ...task, status: oldStatus })
          }
        },

        deleteTaskAction: async (id) => {
          const { tasks, deleteTask, addTask } = get()
          const task = tasks.find(t => t.id === id)
          if (!task) return

          // 1. Optimistic UI update
          deleteTask(id)

          try {
            const res = await fetch(`/api/tasks/${id}`, {
              method: 'DELETE'
            })

            if (!res.ok) throw new Error('Failed to delete task')
          } catch (error) {
            console.error('Task deletion failed:', error)
            // 2. Rollback
            if (task) addTask(task)
          }
        },
        deleteTask: (id) => {
          const state = get()
          const task = state.tasks.find(t => t.id === id)
          if (task) {
            state.addNotification({
              title: 'Task Deleted 🗑️',
              message: `"${task.name}" has been permanently removed.`,
              category: 'warning',
              type: 'in-app',
            })
          }
          set((state) => ({
            tasks: state.tasks.filter(t => t.id !== id)
          }), false, 'tasks/delete')
        },

        // Notifications
        notifications: [],
        unreadCount: 0,
        notificationsLoading: false,
        fetchNotifications: async () => {
          if (get().notificationsLoading) return
          set({ notificationsLoading: true }, false, 'notifications/fetch_start')
          try {
            const res = await fetch('/api/notifications')
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            const notifications: Notification[] = (data.notifications || []).map((n: any) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              timestamp: n.created_at, // canonical timestamp from DB
              is_read: n.is_read,
              type: n.type || 'in-app',
              category: n.category || 'info',
              link: n.link || undefined,
              related_task_ids: n.related_task_ids || [],
            }))
            set({
              notifications,
              unreadCount: notifications.filter(n => !n.is_read).length,
              notificationsLoading: false,
            }, false, 'notifications/fetch_success')
          } catch (error) {
            console.error('Fetch notifications failed:', error)
            set({ notificationsLoading: false }, false, 'notifications/fetch_error')
          }
        },
        addNotification: async (notif) => {
          // Trigger the Toast (Pop msg) at the top of the browser
          const state = get()
          state.addToast(notif.title, notif.category || 'info')

          // Optimistic add with a tempId
          const tempId = `tmp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
          const newNotif: Notification = {
            ...notif,
            id: tempId,
            timestamp: new Date().toISOString(),
            is_read: false,
            category: notif.category ?? 'info',
            type: notif.type ?? 'in-app',
          }

          set((state) => ({
            notifications: [newNotif, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }), false, 'notifications/add_optimistic')

          // Persist to DB then swap the tempId with the real one
          try {
            const res = await fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: notif.title,
                message: notif.message,
                type: notif.type ?? 'in-app',
                category: notif.category ?? 'info',
                link: notif.link,
                related_task_ids: notif.related_task_ids ?? [],
              }),
            })
            if (res.ok) {
              const data = await res.json()
              const saved = data.notification
              set((state) => ({
                notifications: state.notifications.map(n =>
                  n.id === tempId
                    ? { ...saved, timestamp: saved.created_at }
                    : n
                ),
              }), false, 'notifications/add_success')
            }
          } catch (error) {
            console.error('Failed to persist notification:', error)
          }
        },
        markAsRead: async (id) => {
          set((state) => {
            const notifications = state.notifications.map(n =>
              n.id === id ? { ...n, is_read: true } : n
            )
            return { notifications, unreadCount: notifications.filter(n => !n.is_read).length }
          }, false, 'notifications/markAsRead')

          try {
            await fetch('/api/notifications', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, is_read: true }),
            })
          } catch (error) {
            console.error('Failed to mark as read:', error)
          }
        },
        markAllAsRead: async () => {
          set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, is_read: true })),
            unreadCount: 0,
          }), false, 'notifications/markAllAsRead')

          try {
            await fetch('/api/notifications', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mark_all_read: true }),
            })
          } catch (error) {
            console.error('Failed to mark all as read:', error)
          }
        },
        clearNotifications: async () => {
          set({ notifications: [], unreadCount: 0 }, false, 'notifications/clear')
          try {
            await fetch('/api/notifications', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clear_all: true }),
            })
          } catch (error) {
            console.error('Failed to clear notifications:', error)
          }
        },
        deleteNotification: async (id) => {
          set((state) => {
            const notifications = state.notifications.filter(n => n.id !== id)
            return { notifications, unreadCount: notifications.filter(n => !n.is_read).length }
          }, false, 'notifications/delete')

          try {
            await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
          } catch (error) {
            console.error('Failed to delete notification:', error)
          }
        },

        // UI State
        activeTaskId: null,
        activeTrainingId: null,
        isTaskDrawerOpen: false,
        isNotificationHistoryOpen: false,
        openTaskDrawer: (id, trainingId) => set({
          activeTaskId: id,
          isTaskDrawerOpen: true,
          activeTrainingId: trainingId || null,
          isNotificationHistoryOpen: false,
        }, false, 'ui/openTaskDrawer'),
        closeTaskDrawer: () => set({
          activeTaskId: null,
          isTaskDrawerOpen: false,
          activeTrainingId: null,
        }, false, 'ui/closeTaskDrawer'),
        toggleNotificationHistory: (open) => set((state) => ({
          isNotificationHistoryOpen: typeof open === 'boolean' ? open : !state.isNotificationHistoryOpen,
          isTaskDrawerOpen: false,
        }), false, 'ui/toggleNotificationHistory'),

        // Toasts
        toasts: [],
        addToast: (message, type = 'info') => {
          const id = `toast_${Date.now()}`
          set((state) => ({
            toasts: [...state.toasts, { id, message, type }]
          }), false, 'toasts/add')
          setTimeout(() => {
            set((state) => ({
              toasts: state.toasts.filter(t => t.id !== id)
            }), false, 'toasts/remove')
          }, 3500)
        },
        removeToast: (id) => set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }), false, 'toasts/remove'),

        // Global Sync
        isInitialized: false,
        syncAll: async () => {
          if (get().isInitialized) return
          try {
            await Promise.all([
              get().fetchUser(),
              get().fetchTrainings(false),
              get().fetchTasks(),
              get().fetchNotifications(),
            ])
            set({ isInitialized: true }, false, 'sync/complete')
          } catch (error) {
            console.error('Initial sync failed:', error)
          }
        }
      }),
      {
        name: 'teke-app-storage',
        // Don't persist notifications - always fetch fresh from DB on load
        partialize: (state) => ({
          user: state.user,
          trainings: state.trainings,
          tasks: state.tasks,
          worksheets: state.worksheets,
        }),
      }
    ),
    { name: 'TeKe AppStore' }
  )
)
