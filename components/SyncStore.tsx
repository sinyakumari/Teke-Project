'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { createClient } from '@/lib/supabase'

export function SyncStore({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient()
    const store = useAppStore.getState()

    // 1. Initial Session Load (Multi-tab Rehydration)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const { user, fetchUser } = useAppStore.getState()
      if (session?.user && !user) {
        fetchUser()
      }
    })

    // 2. Listen to Auth Events to Keep Tabs in Sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
      const { user, fetchUser, setUser } = useAppStore.getState()
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (!user && _session?.user) fetchUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        localStorage.removeItem('teke-app-storage')
      }
    })

    // 3. Initial App Sync (Only once)
    if (!store.isInitialized) {
      store.syncAll().then(() => {
        const currentUser = useAppStore.getState().user
        if (currentUser) {
          useAppStore.getState().addToast(`Welcome back, ${currentUser.name}! 🎉`, 'success')
        }
      })
    }

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Mount-only: stable auth listener and initial sync

  return <>{children}</>
}
