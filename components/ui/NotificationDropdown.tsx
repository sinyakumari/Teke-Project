'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import Link from 'next/link'

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const notifications = useAppStore((state) => state.notifications)
  const unreadCount = useAppStore((state) => state.unreadCount)
  const markAsRead = useAppStore((state) => state.markAsRead)
  const clearNotifications = useAppStore((state) => state.clearNotifications)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const timeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const diff = Date.now() - date.getTime()
      const seconds = Math.floor(diff / 1000)
      if (seconds < 60) return 'just now'
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `${minutes}m ago`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}h ago`
      const days = Math.floor(hours / 24)
      return `${days}d ago`
    } catch {
      return ''
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-[#1a1f2e] hover:bg-slate-50 active:scale-95 transition-all shadow-sm group"
      >
        <span className="material-symbols-outlined text-[24px] group-hover:rotate-12 transition-transform">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[320px] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-black text-[#1a1f2e]">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{unreadCount} Unread</p>
            </div>
            {notifications.length > 0 && (
              <button 
                onClick={clearNotifications}
                className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto scrollbar-hide py-2">
            {notifications.length === 0 ? (
              <div className="py-12 px-8 text-center flex flex-col items-center">
                <span className="text-4xl mb-3">🎐</span>
                <p className="text-slate-500 text-xs font-bold">All caught up! No new notifications.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                  className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group relative flex gap-3 ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                    notif.type === 'error' ? 'bg-red-50 text-red-600' :
                    notif.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {notif.type === 'success' ? 'check_circle' :
                       notif.type === 'error' ? 'error' :
                       notif.type === 'warning' ? 'warning' :
                       'info'}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h4 className={`text-xs font-black truncate ${!notif.isRead ? 'text-[#1a1f2e]' : 'text-slate-500'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                        {timeAgo(notif.timestamp)}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed line-clamp-2 ${!notif.isRead ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                      {notif.message}
                    </p>
                  </div>

                  {!notif.isRead && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 group-hover:scale-125 transition-transform" />
                  )}
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 bg-slate-50/50 border-t border-slate-50">
              <Link href="/home" className="block text-center text-[10px] font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest">
                View all history
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
