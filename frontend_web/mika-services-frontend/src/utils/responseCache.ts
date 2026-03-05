/**
 * Cache universel des réponses HTTP GET dans localStorage.
 * Chaque réponse GET réussie est automatiquement mise en cache.
 * En cas d'erreur réseau, le cache est utilisé comme fallback.
 */

const CACHE_PREFIX = 'mika-rc-'
const INDEX_KEY = 'mika-rc-index'
const MAX_ENTRIES = 200
const MAX_TOTAL_BYTES = 8 * 1024 * 1024 // 8 Mo max

function buildKey(url: string, params?: string): string {
  const raw = params ? `${url}?${params}` : url
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0
  }
  return `${CACHE_PREFIX}${hash.toString(36)}`
}

function getIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveIndex(keys: string[]): void {
  try { localStorage.setItem(INDEX_KEY, JSON.stringify(keys)) } catch { /* full */ }
}

function evictOldest(needed: number): void {
  const keys = getIndex()
  let removed = 0
  while (keys.length > 0 && removed < needed) {
    const oldest = keys.shift()!
    try { localStorage.removeItem(oldest) } catch { /* ignore */ }
    removed++
  }
  saveIndex(keys)
}

export function cacheResponse(url: string, params: string | undefined, data: unknown): void {
  if (typeof window === 'undefined') return
  const key = buildKey(url, params)
  try {
    const payload = JSON.stringify({ d: data, t: Date.now() })
    if (payload.length > MAX_TOTAL_BYTES / 4) return

    const keys = getIndex()
    const existingIdx = keys.indexOf(key)
    if (existingIdx !== -1) keys.splice(existingIdx, 1)

    if (keys.length >= MAX_ENTRIES) evictOldest(keys.length - MAX_ENTRIES + 1)

    localStorage.setItem(key, payload)
    keys.push(key)
    saveIndex(keys)
  } catch {
    evictOldest(10)
    try {
      localStorage.setItem(key, JSON.stringify({ d: data, t: Date.now() }))
      const keys = getIndex()
      keys.push(key)
      saveIndex(keys)
    } catch { /* abandon */ }
  }
}

export function getCachedResponse(url: string, params?: string): unknown | null {
  if (typeof window === 'undefined') return null
  const key = buildKey(url, params)
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.d ?? null
  } catch { return null }
}

export function clearResponseCache(): void {
  if (typeof window === 'undefined') return
  const keys = getIndex()
  keys.forEach((k) => { try { localStorage.removeItem(k) } catch { /* ignore */ } })
  try { localStorage.removeItem(INDEX_KEY) } catch { /* ignore */ }
}
