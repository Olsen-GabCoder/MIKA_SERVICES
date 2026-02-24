import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { fetchUserFromToken } from './store/slices/authSlice'
import { Layout } from './components/layout/Layout'
import { applyThemeToDocument } from './utils/themeStorage'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const theme = useAppSelector((state) => state.ui.theme)

  // Appliquer le thème dès le rendu (avant que les enfants, ex. formulaires, ne se peignent) pour éviter tout flash
  applyThemeToDocument(theme)

  // Au chargement : si on a un token mais pas l'objet user, restaurer l'utilisateur via /users/me
  useEffect(() => {
    if (location.pathname === '/login' || location.pathname.startsWith('/forgot-password') || location.pathname.startsWith('/reset-password')) return
    if (!isAuthenticated || user) return
    const token = localStorage.getItem('accessToken')
    if (!token) return

    dispatch(fetchUserFromToken()).then((result) => {
      if (fetchUserFromToken.rejected.match(result)) {
        navigate('/login', { replace: true })
      }
    })
  }, [dispatch, isAuthenticated, user, location.pathname, navigate])

  // Si l'utilisateur doit changer son mot de passe (première connexion), rediriger vers le profil
  useEffect(() => {
    if (!user?.mustChangePassword) return
    if (location.pathname === '/profile' || location.pathname === '/parametres') return
    navigate('/profile', { replace: true })
  }, [user?.mustChangePassword, location.pathname, navigate])

  // Ne pas afficher le Layout sur la page de login
  if (location.pathname === '/login') {
    return <Outlet />
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

export default App
