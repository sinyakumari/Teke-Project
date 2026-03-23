'use client'

import SidebarNav from '@/components/ui/SidebarLink'
import MobileNav from '@/components/ui/BottomNav'
import { SyncStore } from '@/components/SyncStore'
import TaskDrawer from '@/components/task/TaskDrawer'
import { useAppStore } from '@/store/useAppStore'
import ToastContainer from '@/components/ui/ToastContainer'
import NotificationManager from '@/components/NotificationManager'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const activeTaskId = useAppStore((state) => state.activeTaskId)
  const closeTaskDrawer = useAppStore((state) => state.closeTaskDrawer)

  return (
    <SyncStore>
      <ToastContainer />
      <NotificationManager />
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
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-white border-t border-gray-200">
            <MobileNav />
          </div>
        </div>

        {/* Global Task Drawer */}
        <TaskDrawer 
          taskId={activeTaskId} 
          onClose={closeTaskDrawer} 
        />
      </div>
    </SyncStore>
  )
}