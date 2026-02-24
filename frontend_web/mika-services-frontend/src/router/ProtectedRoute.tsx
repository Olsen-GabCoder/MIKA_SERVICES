import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { Loading } from '@/components/ui/Loading'

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
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth)

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

  // Route nécessitant les droits admin
  if (requireAdmin) {
    const isAdmin = user?.roles?.some(
      (role) => role.code === 'ADMIN' || role.code === 'SUPER_ADMIN'
    )
    
    if (!isAdmin) {
      return <Navigate to="/" replace />
    }
  }

  // Route publique mais redirection si déjà authentifié
  if (!requireAuth && isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}
