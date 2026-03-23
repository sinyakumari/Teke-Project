'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

const INACTIVITY_LIMIT = 5 * 60 * 1000 // 5 minutes in ms
const CHECK_INTERVAL = 60 * 1000 // 1 minute in ms

export default function NotificationManager() {
  const addNotification = useAppStore((state) => state.addNotification)
  const lastActivityRef = useRef<number>(Date.now())
  const hasNotifiedInactivity = useRef<boolean>(false)

  // 1. Service Worker & Push Permissions
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker Registered'))
        .catch(err => console.error('SW Error:', err))
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // 2. Inactivity Tracking
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now()
      hasNotifiedInactivity.current = false
    }

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach(event => window.addEventListener(event, handleActivity))

    const interval = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current

      if (timeSinceLastActivity > INACTIVITY_LIMIT && !hasNotifiedInactivity.current) {
        hasNotifiedInactivity.current = true
        
        // In-App Notification
        addNotification({
          title: "Still there?",
          message: "You haven't been active for 5 minutes. Take a break or check your pending tasks!",
          type: 'info'
        })

        // Push Notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const n = new Notification('TEKE: Inactivity Detected', {
              body: "You've been idle for a while. Let's finish those tasks!",
              icon: '/favicon.ico'
            })
            n.onclick = () => window.focus()
          } catch (e) {
            console.error('Push notification failed', e)
          }
        }
      }
    }, CHECK_INTERVAL)

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity))
      clearInterval(interval)
    }
  }, [addNotification])

  return null // This component handles side-effects only
}
