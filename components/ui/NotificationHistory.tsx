'use client'

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
    const d = Math.floor(h / 24)
    if (d < 30) return `${d}d ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function NotificationHistory() {
  const isOpen = useAppStore((s) => s.isNotificationHistoryOpen)
  const toggleHistory = useAppStore((s) => s.toggleNotificationHistory)
  const notifications = useAppStore((s) => s.notifications)
  const markAsRead = useAppStore((s) => s.markAsRead)
  const markAllAsRead = useAppStore((s) => s.markAllAsRead)
  const deleteNotification = useAppStore((s) => s.deleteNotification)
  const clearNotifications = useAppStore((s) => s.clearNotifications)
  const openTaskDrawer = useAppStore((s) => s.openTaskDrawer)
  const router = useRouter()

  if (!isOpen) return null

  function handleNotifClick(notif: any) {
    if (!notif.is_read) markAsRead(notif.id)

    const ids: string[] = notif.related_task_ids ?? []
    if (ids.length === 1) {
      toggleHistory(false)
      openTaskDrawer(ids[0])
    } else if (ids.length > 1) {
      toggleHistory(false)
      router.push(`/tasks?ids=${ids.join(',')}`)
    } else if (notif.link) {
      toggleHistory(false)
      router.push(notif.link)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[110] animate-in fade-in duration-200"
        onClick={() => toggleHistory(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[400px] bg-white shadow-2xl z-[120] animate-in slide-in-from-right duration-300 flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-[#1a1f2e]">Notification History</h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
              {notifications.length} total · {notifications.filter(n => !n.is_read).length} unread
            </p>
          </div>
          <button
            onClick={() => toggleHistory(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Actions Row (Filtered to just "Read all" and "Clear all") */}
        <div className="px-5 py-3 flex items-center justify-end gap-3 border-b border-slate-50 flex-shrink-0">
          {notifications.some(n => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-wider transition-colors whitespace-nowrap"
            >
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-wider transition-colors whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-slate-50">
          {notifications.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Nothing here</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const cat = (notif.category ?? 'info') as Category
              const clickable = (notif.related_task_ids?.length ?? 0) > 0 || !!notif.link
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`group relative flex items-start gap-3 px-5 py-3.5 transition-colors
                    ${!notif.is_read ? 'bg-indigo-50/20' : ''}
                    ${clickable ? 'cursor-pointer hover:bg-slate-50' : ''}
                  `}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${CATEGORY_COLOR[cat]}`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {CATEGORY_ICON[cat]}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-xs font-black truncate ${!notif.is_read ? 'text-[#1a1f2e]' : 'text-slate-500'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[9px] text-slate-400 whitespace-nowrap flex-shrink-0">
                        {timeAgo(notif.timestamp)}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${!notif.is_read ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                        {notif.type}
                      </span>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!notif.is_read && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  )}

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-300 hover:text-red-500 transition-all"
                    aria-label="Delete notification"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
