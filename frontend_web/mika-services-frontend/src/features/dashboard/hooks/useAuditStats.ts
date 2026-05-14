import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/userApi'
import type { GlobalAuditStats } from '@/api/userApi'
import { useIsOnline } from '@/hooks/useConnectivity'
import { useIsAdmin } from './useIsAdmin'

const STALE = 15 * 60 * 1000

export type { GlobalAuditStats }

export function useAuditStats(): {
  data: GlobalAuditStats | null
  loading: boolean
  error: Error | null
} {
  const isOnline = useIsOnline()
  const isAdmin = useIsAdmin()

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'audit-stats'] as const,
    queryFn: () => userApi.getGlobalStats(),
    staleTime: STALE,
    refetchInterval: STALE,
    enabled: isOnline && isAdmin,
  })

  return {
    data: data ?? null,
    loading: isLoading,
    error: (error as Error) ?? null,
  }
}
