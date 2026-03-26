'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function SyncStore({ children }: { children: React.ReactNode }) {
  const syncAll = useAppStore((state) => state.syncAll)
  const isInitialized = useAppStore((state) => state.isInitialized)
  const addToast = useAppStore((state) => state.addToast)
  const user = useAppStore((state) => state.user)

  useEffect(() => {
    if (!isInitialized) {
      syncAll().then(() => {
        // Only toast if we actually have a user
        const currentUser = useAppStore.getState().user
        if (currentUser) {
          addToast(`Welcome back, ${currentUser.name}! 🎉`, 'success')
        }
      })
    }
  }, [syncAll, isInitialized, addToast])

  return <>{children}</>
}
