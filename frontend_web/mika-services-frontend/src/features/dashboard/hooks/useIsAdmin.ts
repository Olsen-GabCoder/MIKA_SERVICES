import { useAppSelector } from '@/store/hooks'

export function useIsAdmin(): boolean {
  const roles = useAppSelector(s => s.auth.user?.roles ?? [])
  return roles.some(r => r.code === 'ADMIN' || r.code === 'SUPER_ADMIN')
}
