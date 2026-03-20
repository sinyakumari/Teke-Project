'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function SyncStore({ children }: { children: React.ReactNode }) {
  const syncAll = useAppStore((state) => state.syncAll)
  const isInitialized = useAppStore((state) => state.isInitialized)

  useEffect(() => {
    if (!isInitialized) {
      syncAll()
    }
  }, [syncAll, isInitialized])

  return <>{children}</>
}
