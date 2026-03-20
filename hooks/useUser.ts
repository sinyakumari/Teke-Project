import { useAppStore } from '@/store/useAppStore'

export function useUser() {
  const user = useAppStore((state) => state.user)
  const loading = useAppStore((state) => state.userLoading)
  const error = useAppStore((state) => state.userError)

  return { user, loading, error }
}

