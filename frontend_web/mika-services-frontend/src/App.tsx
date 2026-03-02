import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { fetchUserFromToken, refreshToken } from './store/slices/authSlice'
import { fetchProjets } from './store/slices/projetSlice'
import { fetchUsers } from './store/slices/userSlice'
import { getAccessToken, setTokenStorageMode } from './utils/tokenStorage'
import { Layout } from './components/layout/Layout'
import { applyThemeToDocument } from './utils/themeStorage'
import { applyFontSizeToDocument, applyFontFamilyToDocument } from './utils/fontPreferences'
import { applyDensityToDocument } from './utils/densityPreferences'
import { applyCardSizeToDocument } from './utils/cardSizePreferences'
import { applyHighContrastToDocument } from './utils/highContrastPreferences'

/** Période de refresh proactif : avant expiration du JWT (15 min) pour maintenir la session sans attendre un 401. */
const PROACTIVE_REFRESH_INTERVAL_MS = 14 * 60 * 1000

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const { theme, fontSize, fontFamily, density, cardSize, highContrastText, highContrastCards, preloadDataEnabled, itemsPerPage } = useAppSelector((state) => state.ui)

  // Appliquer thème, typo, densité, contraste et taille des cartes dès le rendu (évite tout flash)
  applyThemeToDocument(theme)
  applyFontSizeToDocument(fontSize)
  applyHighContrastToDocument(highContrastText, highContrastCards)
  applyFontFamilyToDocument(fontFamily)
  applyDensityToDocument(density)
  applyCardSizeToDocument(cardSize)

  // Au chargement : si on a un token mais pas l'objet user, restaurer l'utilisateur via /users/me
  useEffect(() => {
    if (location.pathname === '/login' || location.pathname.startsWith('/forgot-password') || location.pathname.startsWith('/reset-password')) return
    if (!isAuthenticated || user) return
    const token = getAccessToken()
    if (!token) return

    dispatch(fetchUserFromToken()).then((result: unknown) => {
      if (fetchUserFromToken.fulfilled.match(result)) {
        setTokenStorageMode(result.payload.logoutOnBrowserClose ?? false)
      }
      if (fetchUserFromToken.rejected.match(result)) {
        navigate('/login', { replace: true })
      }
    })
  }, [dispatch, isAuthenticated, user, location.pathname, navigate])

  // Refresh proactif du token : toutes les 14 min tant que l'utilisateur est connecté (cookie httpOnly renvoyé)
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (!isAuthenticated || location.pathname === '/login') return
    const runRefresh = () => {
      dispatch(refreshToken()).catch(() => {
        // En échec (ex. cookie absent), l'intercepteur 401 ou le prochain fetchUserFromToken gèrera la déconnexion
      })
    }
    refreshIntervalRef.current = setInterval(runRefresh, PROACTIVE_REFRESH_INTERVAL_MS)
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }, [isAuthenticated, location.pathname, dispatch])

  // Si l'utilisateur doit changer son mot de passe (première connexion), rediriger vers le profil
  useEffect(() => {
    if (!user?.mustChangePassword) return
    if (location.pathname === '/profile' || location.pathname === '/parametres') return
    navigate('/profile', { replace: true })
  }, [user?.mustChangePassword, location.pathname, navigate])

  // Précharger les listes (projets, utilisateurs) en arrière-plan si l'option est activée.
  // Liste utilisateurs en 200 pour messagerie/sélecteurs ; projets selon itemsPerPage.
  const preloadDoneRef = useRef(false)
  useEffect(() => {
    if (!isAuthenticated || !user || !preloadDataEnabled || location.pathname === '/login') return
    if (preloadDoneRef.current) return
    preloadDoneRef.current = true
    const projetSize = Math.max(1, Math.min(100, itemsPerPage))
    const userSize = 200
    const t = setTimeout(() => {
      void dispatch(fetchProjets({ page: 0, size: projetSize }))
      void dispatch(fetchUsers({ page: 0, size: userSize }))
    }, 400)
    return () => clearTimeout(t)
  }, [isAuthenticated, user, preloadDataEnabled, itemsPerPage, dispatch, location.pathname])

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
