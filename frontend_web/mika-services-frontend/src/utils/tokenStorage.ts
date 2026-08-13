/**
 * Gestion des tokens :
 * - Access token : en MEMOIRE uniquement (protection XSS)
 * - Refresh token : cookie httpOnly geré par le backend (jamais accessible en JS)
 * - Le mode "session" (déconnexion à la fermeture) reste supporté via un flag.
 */

const STORAGE_MODE_KEY = 'mika_token_storage'

export type TokenStorageMode = 'local' | 'session'

/** Access token en mémoire uniquement — jamais dans localStorage/sessionStorage */
let inMemoryAccessToken: string | null = null

export function getAccessToken(): string | null {
  return inMemoryAccessToken
}

export function setAccessToken(token: string): void {
  inMemoryAccessToken = token
}

export function removeAccessToken(): void {
  inMemoryAccessToken = null
}

/**
 * Le refresh token est désormais géré exclusivement par le cookie httpOnly du backend.
 * Ces fonctions sont conservées pour compatibilité mais n'utilisent plus le storage navigateur.
 */
export function getRefreshToken(): string | null {
  // Le refresh token est dans le cookie httpOnly, pas en JS.
  // On retourne un marqueur non-null pour que le flux de refresh sache qu'il peut tenter un appel.
  // Le backend lira le cookie automatiquement (withCredentials: true).
  return 'httponly-cookie'
}

export function setRefreshToken(_token: string): void {
  // No-op : le backend gère le cookie httpOnly
}

export function removeRefreshToken(): void {
  // No-op : le cookie est supprimé par le backend au logout
}

export function removeAllTokens(): void {
  removeAccessToken()
  // Nettoyage legacy : supprimer les anciens tokens si présents dans le storage
  try {
    localStorage.removeItem('accessToken')
    sessionStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    sessionStorage.removeItem('refreshToken')
  } catch { /* ignore */ }
}

export function setTokenStorageMode(logoutOnBrowserClose: boolean): void {
  const newMode: TokenStorageMode = logoutOnBrowserClose ? 'session' : 'local'
  localStorage.setItem(STORAGE_MODE_KEY, newMode)
}
