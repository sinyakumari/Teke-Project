import SidebarNav from '@/components/ui/SidebarLink'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f2f2f7] flex">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#1a1f2e] fixed h-full z-50">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-7">
          <div className="bg-white w-9 h-9 rounded-xl flex items-center justify-center">
            <span className="text-[#1a1f2e] text-base font-bold">T</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">TEKE</span>
        </div>

        {/* Nav Links */}
        <div className="px-3 flex-1">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest px-3 mb-2">
            Menu
          </p>
          <SidebarNav />
        </div>

        {/* Bottom */}
        <div className="px-6 py-5 border-t border-white/10">
          <p className="text-gray-500 text-xs">TEKE v1.0.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen">
        {/* Top bar - desktop only */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
          <div />
          <p className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Page Content */}
        <div className="px-4 lg:px-8 pt-6 pb-24 lg:pb-10">
          {children}
        </div>
      </main>

      {/* Bottom Nav - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white border-t border-gray-200">
          <MobileNav />
        </div>
      </div>
    </div>
  )
}

// Inline mobile nav import
import MobileNav from '@/components/ui/BottomNav'