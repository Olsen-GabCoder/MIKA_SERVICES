/**
 * Authentification hors ligne.
 * Après un login réussi, un hash des credentials est stocké localement.
 * Si le serveur est injoignable, le login est vérifié contre ce hash
 * et l'utilisateur est restauré depuis le cache.
 */

const CREDENTIALS_KEY = 'mika-offline-auth'
const OFFLINE_TOKEN = 'offline-session-token'

interface StoredCredentials {
  email: string
  hash: string
  user: unknown
  storedAt: number
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function storeOfflineCredentials(email: string, password: string, user: unknown): Promise<void> {
  try {
    const hash = await sha256(`${email.toLowerCase()}:${password}`)
    const entry: StoredCredentials = { email: email.toLowerCase(), hash, user, storedAt: Date.now() }
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(entry))
  } catch { /* crypto not available or storage full */ }
}

export async function verifyOfflineCredentials(email: string, password: string): Promise<unknown | null> {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY)
    if (!raw) return null
    const stored: StoredCredentials = JSON.parse(raw)
    if (stored.email !== email.toLowerCase()) return null
    const hash = await sha256(`${email.toLowerCase()}:${password}`)
    if (hash !== stored.hash) return null
    return stored.user
  } catch { return null }
}

export function getOfflineToken(): string {
  return OFFLINE_TOKEN
}

export function clearOfflineCredentials(): void {
  try { localStorage.removeItem(CREDENTIALS_KEY) } catch { /* ignore */ }
}

export function hasOfflineCredentials(): boolean {
  return !!localStorage.getItem(CREDENTIALS_KEY)
}
