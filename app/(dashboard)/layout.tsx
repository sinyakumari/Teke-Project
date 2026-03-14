import SidebarNav from '@/components/ui/SidebarLink'
import MobileNav from '@/components/ui/BottomNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-[#f2f2f7] flex transition-all duration-300 overflow-hidden">
      {/* Desktop Sidebar */}
      <SidebarNav />

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 flex flex-col h-full overflow-hidden">

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
    </div>
  )
}