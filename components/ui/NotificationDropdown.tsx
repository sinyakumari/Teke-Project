'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useRouter } from 'next/navigation'

type Category = 'info' | 'success' | 'warning' | 'error'

const CATEGORY_ICON: Record<Category, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
}
const CATEGORY_COLOR: Record<Category, string> = {
  success: 'bg-emerald-50 text-emerald-600',
  error: 'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-600',
  info: 'bg-blue-50 text-blue-600',
}

function timeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const s = Math.floor(diff / 1000)
    if (s < 60) return 'just now'
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch {
    return ''
  }
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const notifications = useAppStore((s) => s.notifications)
  const unreadCount = useAppStore((s) => s.unreadCount)
  const markAsRead = useAppStore((s) => s.markAsRead)
  const markAllAsRead = useAppStore((s) => s.markAllAsRead)
  const clearNotifications = useAppStore((s) => s.clearNotifications)
  const toggleHistory = useAppStore((s) => s.toggleNotificationHistory)
  const openTaskDrawer = useAppStore((s) => s.openTaskDrawer)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  function handleNotifClick(notif: any) {
    if (!notif.is_read) markAsRead(notif.id)
    setIsOpen(false)

    const ids: string[] = notif.related_task_ids ?? []
    if (ids.length === 1) {
      openTaskDrawer(ids[0])
    } else if (ids.length > 1) {
      router.push(`/tasks?ids=${ids.join(',')}`)
    } else if (notif.link) {
      router.push(notif.link)
    }
  }

  const recent = notifications.slice(0, 3)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell"
        onClick={() => setIsOpen((v) => !v)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-[#000000] hover:bg-slate-50 active:scale-95 transition-all shadow-sm group"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-[22px] group-hover:rotate-12 transition-transform">
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white shadow animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#000000]">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                {unreadCount} unread
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-black text-black hover:text-slate-700 uppercase tracking-wider transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-wider transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto scrollbar-hide divide-y divide-slate-50">
            {recent.length === 0 ? (
              <div className="py-10 text-center">
                <span className="text-3xl">🎐</span>
                <p className="text-slate-400 text-xs font-bold mt-2">All caught up!</p>
              </div>
            ) : (
              recent.map((notif) => {
                const cat = (notif.category ?? 'info') as Category
                const clickable = (notif.related_task_ids?.length ?? 0) > 0 || !!notif.link
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors relative
                      ${!notif.is_read ? 'bg-slate-100/40' : ''}
                      ${clickable ? 'cursor-pointer hover:bg-slate-50' : ''}
                    `}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${CATEGORY_COLOR[cat]}`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {CATEGORY_ICON[cat]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-black truncate ${!notif.is_read ? 'text-[#000000]' : 'text-slate-500'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[9px] text-slate-400 whitespace-nowrap flex-shrink-0">
                          {timeAgo(notif.timestamp)}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed line-clamp-2 mt-0.5 ${!notif.is_read ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                        {notif.message}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-50 bg-slate-50/50">
              <button
                onClick={() => { setIsOpen(false); toggleHistory(true) }}
                className="w-full text-center text-[10px] font-black text-black hover:underline uppercase tracking-widest transition-colors"
              >
                View all history ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
