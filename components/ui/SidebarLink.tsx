'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'

const navItems = [
  {
    href: '/home',
    label: 'Dashboard',
    icon: 'dashboard',
  },
  {
    href: '/trainings',
    label: 'Trainings',
    icon: 'work',
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: 'check_box',
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: 'group',
  },
]

export default function SidebarNav() {
  const pathname = usePathname()
  const { user, loading } = useUser()

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-[#1a1f2e] fixed h-full z-50 border-r border-slate-800/20 text-white font-sans">

      {/* Logo */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1a1f2e] shadow-lg shadow-white/5">
          <span className="material-symbols-outlined font-bold text-2xl">
            rocket_launch
          </span>
        </div>

        <div>
          <h1 className="font-bold text-white text-lg leading-tight tracking-tight">
            TEKE
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold opacity-80">
            PROJECT MANAGER
          </p>
        </div>
      </div>

      {/* Menu Title */}
      <div className="px-8 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
        Menu
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-white text-[#1a1f2e] shadow-xl shadow-white/10'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >

              <span
                className="material-symbols-outlined text-[22px]"
                style={
                  active
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>

              <span
                className={`text-sm tracking-wide ${
                  active ? 'font-bold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>

            </Link>
          )
        })}
      </nav>

      {/* Footer User */}
      <div className="p-6 border-t border-slate-800/40">

        <div className="flex items-center gap-4 p-2">
          {loading ? (
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-800 rounded w-24" />
                <div className="h-2 bg-slate-800 rounded w-12" />
              </div>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-[#1a1f2e] overflow-hidden shrink-0 border border-slate-700/50 shadow-inner flex items-center justify-center text-xs font-bold text-slate-400">
                {user?.name ? (
                  user.name.charAt(0).toUpperCase()
                ) : (
                  <span className="material-symbols-outlined text-xl">person</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate tracking-tight">
                  {user?.name || 'Guest User'}
                </p>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  v1.0.0
                </p>
              </div>
            </>
          )}
        </div>

      </div>

    </aside>
  )
}
