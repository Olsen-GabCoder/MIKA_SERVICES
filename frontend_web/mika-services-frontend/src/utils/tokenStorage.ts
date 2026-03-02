/**
 * Gestion du stockage du token d'accès : localStorage (persistant) ou sessionStorage
 * (effacé à la fermeture de l'onglet), selon la préférence "Déconnexion à la fermeture du navigateur".
 */

const TOKEN_KEY = 'accessToken'
const STORAGE_MODE_KEY = 'mika_token_storage'

export type TokenStorageMode = 'local' | 'session'

function getMode(): TokenStorageMode {
  if (typeof window === 'undefined') return 'local'
  const v = localStorage.getItem(STORAGE_MODE_KEY)
  return v === 'session' ? 'session' : 'local'
}

function getStorage(): Storage {
  return getMode() === 'session' ? sessionStorage : localStorage
}

/** Retourne le token d'accès (depuis le stockage actif selon la préférence). */
export function getAccessToken(): string | null {
  return getStorage().getItem(TOKEN_KEY)
}

/** Enregistre le token dans le stockage actif. */
export function setAccessToken(token: string): void {
  getStorage().setItem(TOKEN_KEY, token)
}

/** Supprime le token des deux stockages (déconnexion). */
export function removeAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

/**
 * Définit le mode de stockage (session = déconnexion à la fermeture de l'onglet)
 * et migre le token éventuel vers le bon stockage.
 */
export function setTokenStorageMode(logoutOnBrowserClose: boolean): void {
  const newMode: TokenStorageMode = logoutOnBrowserClose ? 'session' : 'local'
  getMode()
  localStorage.setItem(STORAGE_MODE_KEY, newMode)

  const tokenFromLocal = localStorage.getItem(TOKEN_KEY)
  const tokenFromSession = sessionStorage.getItem(TOKEN_KEY)
  const currentToken = tokenFromLocal ?? tokenFromSession

  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)

  if (currentToken) {
    if (newMode === 'session') {
      sessionStorage.setItem(TOKEN_KEY, currentToken)
    } else {
      localStorage.setItem(TOKEN_KEY, currentToken)
    }
  }
}
