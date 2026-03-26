'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { createClient } from '@/lib/supabase'

// 3 days in milliseconds for inactivity tracking
const INACTIVITY_LIMIT_MS = 3 * 24 * 60 * 60 * 1000
const INACTIVITY_CHECK_INTERVAL_MS = 60 * 60 * 1000 // check every hour
const LAST_ACTIVE_KEY = 'teke_last_active_ts'

export default function NotificationManager() {
  const addNotification = useAppStore((state) => state.addNotification)
  const fetchNotifications = useAppStore((state) => state.fetchNotifications)
  const user = useAppStore((state) => state.user)
  const hasNotifiedInactivity = useRef<boolean>(false)

  // — Service Worker registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('[SW] Registered'))
        .catch(err => console.warn('[SW] Error:', err))
    }
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // — Supabase Realtime: listen for DB inserts on the history table.
  //   We only refresh the local list; we don't call addNotification to avoid infinite loops.
  useEffect(() => {
    if (!user?.id) return

    const supabase = createClient()
    const channel = supabase
      .channel(`history:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'history',
          filter: `user_id=eq.${user.id}`,
        },
        (_payload) => {
          // Refresh from DB so UI stays in sync (handles multi-tab & server triggers)
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, fetchNotifications])

  // — Activity tracking: update localStorage on each interaction
  useEffect(() => {
    const touch = () => {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString())
      hasNotifiedInactivity.current = false
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, touch, { passive: true }))
    touch() // initialise on mount

    return () => events.forEach(e => window.removeEventListener(e, touch))
  }, [])

  // — Inactivity check: runs every hour, fires notification after 3 days idle
  useEffect(() => {
    const check = () => {
      const lastActive = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) ?? '0', 10)
      if (!lastActive) return

      const idleMs = Date.now() - lastActive

      if (idleMs >= INACTIVITY_LIMIT_MS && !hasNotifiedInactivity.current) {
        hasNotifiedInactivity.current = true
        const idleDays = Math.floor(idleMs / (24 * 60 * 60 * 1000))

        const isHidden = document.visibilityState === 'hidden'

        if (!isHidden) {
          addNotification({
            title: "We miss you! 👋",
            message: `You haven't been active for ${idleDays} day${idleDays > 1 ? 's' : ''}. Check your pending tasks and trainings.`,
            category: 'info',
            type: 'in-app',
          })
        }

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('TEKE: Long time no see!', {
              body: `You've been idle for ${idleDays} day${idleDays > 1 ? 's' : ''}. Let's get back on track!`,
              icon: '/favicon.ico',
              tag: 'inactivity-nudge',
            })
          } catch (e) {
            console.warn('[Push] Native notification failed:', e)
          }
        }
      }
    }

    check() // check on mount
    const interval = setInterval(check, INACTIVITY_CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [addNotification])

  return null
}
