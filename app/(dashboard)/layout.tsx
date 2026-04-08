'use client'

import SidebarNav from '@/components/ui/SidebarLink'
import MobileNav from '@/components/ui/BottomNav'
import TaskDrawer from '@/components/task/TaskDrawer'
import { useAppStore } from '@/store/useAppStore'
import ToastContainer from '@/components/ui/ToastContainer'
import NotificationManager from '@/components/NotificationManager'

import NotificationHistory from '@/components/ui/NotificationHistory'
import TrainingDrawer from '@/components/training/TrainingDrawer'
import { SyncStore } from '@/components/SyncStore'
import { RealtimeSync } from '@/components/RealtimeSync'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const activeTaskId = useAppStore((state) => state.activeTaskId)
  const activeTrainingId = useAppStore((state) => state.activeTrainingId)
  const trainingDrawerMode = useAppStore((state) => state.trainingDrawerMode)
  const closeTaskDrawer = useAppStore((state) => state.closeTaskDrawer)
  const closeTrainingDrawer = useAppStore((state) => state.closeTrainingDrawer)

  return (
    <SyncStore>
      <RealtimeSync />
      <ToastContainer />
      <NotificationManager />
      <NotificationHistory />
      <div className="h-screen bg-[#f2f2f7] flex transition-all duration-300 overflow-hidden">
        {/* Desktop Sidebar */}
        <SidebarNav />

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 flex flex-col h-full overflow-hidden pb-[64px] lg:pb-0">

          <div className="flex-1 font-sans overflow-hidden flex flex-col relative min-h-0">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <MobileNav />

        {/* Global Task Drawer */}
        <TaskDrawer 
          taskId={activeTaskId} 
          onClose={closeTaskDrawer} 
        />
        <TrainingDrawer 
          trainingId={activeTrainingId} 
          onClose={closeTrainingDrawer} 
          initialMode={trainingDrawerMode}
        />
      </div>
    </SyncStore>
  )
}