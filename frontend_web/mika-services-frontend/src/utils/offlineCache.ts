/**
 * Cache localStorage pour le mode hors ligne et pour le cache "Réseau et performances".
 * - Mode hors ligne : lecture du cache sans vérification de durée (fallback coupure réseau).
 * - Activer le cache : en ligne, réutilisation des données si encore valides (TTL 5 / 30 / 60 min).
 */

const PROJETS_CACHE_KEY = 'mika-offline-cache-projets'
const USERS_CACHE_KEY = 'mika-offline-cache-users'
const DASHBOARD_CACHE_KEY = 'mika-offline-cache-dashboard'
const CURRENT_USER_CACHE_KEY = 'mika-offline-cache-current-user'

/** Réponse paginée générique (projets ou users). */
export interface CachedPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first?: boolean
  last?: boolean
}

/** Format stocké : données + timestamp pour TTL. */
interface StoredCache<T> {
  data: CachedPage<T>
  cachedAt: number
}

function parseStored<T>(raw: string): CachedPage<T> | null {
  try {
    const parsed = JSON.parse(raw) as StoredCache<unknown> | CachedPage<unknown>
    const data = 'cachedAt' in parsed && parsed.data ? (parsed as StoredCache<unknown>).data : (parsed as CachedPage<unknown>)
    if (!data || !Array.isArray(data.content)) return null
    return data as CachedPage<T>
  } catch {
    return null
  }
}

function getCachedAt(raw: string): number | null {
  try {
    const parsed = JSON.parse(raw) as StoredCache<unknown>
    if (parsed && typeof parsed.cachedAt === 'number') return parsed.cachedAt
    return null
  } catch {
    return null
  }
}

export function setProjetsCache(data: CachedPage<unknown>): void {
  if (typeof window === 'undefined') return
  try {
    const stored: StoredCache<unknown> = { data, cachedAt: Date.now() }
    localStorage.setItem(PROJETS_CACHE_KEY, JSON.stringify(stored))
  } catch {
    // quota exceeded or disabled
  }
}

/** Retourne le cache projets sans vérifier l’âge (mode hors ligne). */
export function getProjetsCache(): CachedPage<unknown> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PROJETS_CACHE_KEY)
    if (!raw) return null
    return parseStored(raw)
  } catch {
    return null
  }
}

/** Retourne le cache projets seulement s’il a moins de maxAgeMs (cache « Réseau »). */
export function getProjetsCacheIfValid(maxAgeMs: number): CachedPage<unknown> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PROJETS_CACHE_KEY)
    if (!raw) return null
    const cachedAt = getCachedAt(raw)
    if (cachedAt == null) return null
    if (Date.now() - cachedAt > maxAgeMs) return null
    return parseStored(raw)
  } catch {
    return null
  }
}

export function setUsersCache(data: CachedPage<unknown>): void {
  if (typeof window === 'undefined') return
  try {
    const stored: StoredCache<unknown> = { data, cachedAt: Date.now() }
    localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(stored))
  } catch {
    // quota exceeded or disabled
  }
}

/** Retourne le cache users sans vérifier l’âge (mode hors ligne). */
export function getUsersCache(): CachedPage<unknown> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USERS_CACHE_KEY)
    if (!raw) return null
    return parseStored(raw)
  } catch {
    return null
  }
}

/** Retourne le cache users seulement s’il a moins de maxAgeMs (cache « Réseau »). */
export function getUsersCacheIfValid(maxAgeMs: number): CachedPage<unknown> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USERS_CACHE_KEY)
    if (!raw) return null
    const cachedAt = getCachedAt(raw)
    if (cachedAt == null) return null
    if (Date.now() - cachedAt > maxAgeMs) return null
    return parseStored(raw)
  } catch {
    return null
  }
}

/** Invalide le cache projets (à appeler après create / update / delete). */
export function clearProjetsCache(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(PROJETS_CACHE_KEY)
  } catch { /* ignore */ }
}

/** Invalide le cache users (à appeler après create / update / delete). */
export function clearUsersCache(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(USERS_CACHE_KEY)
  } catch { /* ignore */ }
}

// --- Dashboard cache ---

export function setDashboardCache(data: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() }))
  } catch { /* quota exceeded */ }
}

export function getDashboardCache(): unknown | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DASHBOARD_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.data ?? null
  } catch { return null }
}

export function getDashboardCacheIfValid(maxAgeMs: number): unknown | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DASHBOARD_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.cachedAt || Date.now() - parsed.cachedAt > maxAgeMs) return null
    return parsed.data ?? null
  } catch { return null }
}

// --- Current user cache (for session restoration without server) ---

export function setCurrentUserCache(user: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CURRENT_USER_CACHE_KEY, JSON.stringify({ data: user, cachedAt: Date.now() }))
  } catch { /* quota exceeded */ }
}

export function getCurrentUserCache(): unknown | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CURRENT_USER_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.data ?? null
  } catch { return null }
}

export function clearCurrentUserCache(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(CURRENT_USER_CACHE_KEY) } catch { /* ignore */ }
}

/** Durées en ms pour le cache « Réseau » (5 min, 30 min, 1 h). */
export const CACHE_DURATION_MS = {
  short: 5 * 60 * 1000,
  medium: 30 * 60 * 1000,
  long: 60 * 60 * 1000,
} as const
