import { useAppStore } from '@/store/useAppStore'
import { useShallow } from 'zustand/react/shallow'

export function useUser() {
  return useAppStore(useShallow((state) => ({
    user: state.user,
    loading: state.userLoading,
    error: state.userError
  })))
}

