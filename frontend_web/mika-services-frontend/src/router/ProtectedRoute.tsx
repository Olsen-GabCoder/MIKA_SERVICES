import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { Loading } from '@/components/ui/Loading'
import { isTerrainOnlyEffective } from '@/utils/authRoles'

/**
 * Cible terrain pour un utilisateur mobile-only : si l'URL vient d'un scan QR engin
 * (/materiel/engins/{id}, encodée dans les QR), on conserve l'engin
 * pour ouvrir directement sa fiche dans l'app mobile.
 */
const terrainTarget = (pathname: string, search = ''): string => {
  if (pathname.startsWith('/terrain')) return `${pathname}${search}`
  const m = pathname.match(/^\/materiel\/engins\/(\d+)/)
  return m ? `/terrain?engin=${m[1]}` : '/terrain'
}

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireAdmin = false,
}: ProtectedRouteProps) => {
  const location = useLocation()
  const { isAuthenticated, user, isLoading, accessToken } = useAppSelector((state) => state.auth)
  const terrainOnly = isTerrainOnlyEffective(user, accessToken)

  // Plein écran de chargement uniquement sur les routes protégées quand on charge l'utilisateur (token présent, getMe en cours).
  // Sur la page de connexion (requireAuth=false), on garde le formulaire visible avec le spinner du bouton.
  if (requireAuth && isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  // Route protégée nécessitant une authentification
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Confinement mobile-only (aucun rôle web) : accès exclusif à l'application terrain (/terrain)
  if (isAuthenticated && terrainOnly && !location.pathname.startsWith('/terrain')) {
    return <Navigate to={terrainTarget(location.pathname)} replace />
  }

  // Route nécessitant les droits admin
  if (requireAdmin) {
    const isAdmin = user?.roles?.some(
      (role: { code: string }) => role.code === 'ADMIN' || role.code === 'SUPER_ADMIN'
    )
    
    if (!isAdmin) {
      return <Navigate to="/" replace />
    }
  }

  // Route publique mais redirection si déjà authentifié
  if (!requireAuth && isAuthenticated) {
    const fromLoc = (location.state as any)?.from
    const fromPath: string = fromLoc?.pathname || ''
    const fromSearch: string = fromLoc?.search || ''
    if (terrainOnly) {
      // Conserver l'engin scanné avant login (QR → /login → /terrain?engin=...)
      return <Navigate to={terrainTarget(fromPath, fromSearch)} replace />
    }
    return <Navigate to={fromPath ? `${fromPath}${fromSearch}` : '/'} replace />
  }

  return <>{children}</>
}
