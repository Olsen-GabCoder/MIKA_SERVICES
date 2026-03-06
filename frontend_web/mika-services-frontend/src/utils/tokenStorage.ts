/**
 * Gestion des tokens (accès + refresh) : localStorage ou sessionStorage
 * selon la préférence "Déconnexion à la fermeture du navigateur".
 */

const TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
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

export function getAccessToken(): string | null {
  return getStorage().getItem(TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  getStorage().setItem(TOKEN_KEY, token)
}

export function removeAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return getStorage().getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string): void {
  getStorage().setItem(REFRESH_TOKEN_KEY, token)
}

export function removeRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function removeAllTokens(): void {
  removeAccessToken()
  removeRefreshToken()
}

export function setTokenStorageMode(logoutOnBrowserClose: boolean): void {
  const newMode: TokenStorageMode = logoutOnBrowserClose ? 'session' : 'local'
  localStorage.setItem(STORAGE_MODE_KEY, newMode)

  const accessFromLocal = localStorage.getItem(TOKEN_KEY)
  const accessFromSession = sessionStorage.getItem(TOKEN_KEY)
  const currentAccess = accessFromLocal ?? accessFromSession

  const refreshFromLocal = localStorage.getItem(REFRESH_TOKEN_KEY)
  const refreshFromSession = sessionStorage.getItem(REFRESH_TOKEN_KEY)
  const currentRefresh = refreshFromLocal ?? refreshFromSession

  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)

  const target = newMode === 'session' ? sessionStorage : localStorage
  if (currentAccess) target.setItem(TOKEN_KEY, currentAccess)
  if (currentRefresh) target.setItem(REFRESH_TOKEN_KEY, currentRefresh)
}
