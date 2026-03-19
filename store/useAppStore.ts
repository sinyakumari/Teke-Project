import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

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
  updateTask: (task: Task) => void
  deleteTask: (id: string) => void

  // UI State
  activeTaskId: string | null
  activeTrainingId: string | null
  isTaskDrawerOpen: boolean
  openTaskDrawer: (id: string | 'new', trainingId?: string) => void
  closeTaskDrawer: () => void

  // Global Sync
  isInitialized: boolean
  syncAll: () => Promise<void>
}

export const useAppStore = create<AppState>()(
  devtools(
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
      addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] }), false, 'tasks/add'),
      updateTask: (task) => set((state) => ({
        tasks: state.tasks.map(t => t.id === task.id ? task : t)
      }), false, 'tasks/update'),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      }), false, 'tasks/delete'),

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
    { name: 'TeKe AppStore' }
  )
)
