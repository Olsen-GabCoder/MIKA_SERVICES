/**
 * Logique push partagée entre les écrans terrain (onboarding, bandeau feed, paramètres).
 *
 * Règle : requestFcmToken n'est JAMAIS appelé automatiquement.
 * Toujours derrière un clic "Activer" de l'utilisateur.
 */
import { requestFcmToken, pushSupported, pushPermissionStatus } from '@/config/firebase'
import { terrainApi } from '@/api/terrainApi'

const PUSH_DISMISSED_PREFIX = 'mika-terrain-push-dismissed-'
const PUSH_ASKED_PREFIX = 'mika-terrain-push-asked-'

/** userId courant pour le préfixage des flags (fallback '' si inconnu). */
function currentUserId(): string {
  try { return localStorage.getItem('mika-terrain-current-user-id') ?? '' } catch { return '' }
}

/** Enregistrer le userId courant (appelé après login). */
export function setPushUserId(userId: string | number): void {
  try { localStorage.setItem('mika-terrain-current-user-id', String(userId)) } catch {}
}

/** L'utilisateur a-t-il déjà été sollicité (onboarding) ? */
export function pushAlreadyAsked(): boolean {
  try { return localStorage.getItem(`${PUSH_ASKED_PREFIX}${currentUserId()}`) === 'true' } catch { return false }
}

export function markPushAsked(): void {
  try { localStorage.setItem(`${PUSH_ASKED_PREFIX}${currentUserId()}`, 'true') } catch {}
}

/** Le bandeau feed a-t-il été dismissé cette session ? */
export function pushBannerDismissed(): boolean {
  try { return sessionStorage.getItem(`${PUSH_DISMISSED_PREFIX}${currentUserId()}`) === 'true' } catch { return false }
}

export function dismissPushBanner(): void {
  try { sessionStorage.setItem(`${PUSH_DISMISSED_PREFIX}${currentUserId()}`, 'true') } catch {}
}

/** Doit-on afficher le bandeau push sur le feed ? */
export function shouldShowPushBanner(): boolean {
  if (!pushSupported()) return false
  const status = pushPermissionStatus()
  if (status === 'granted' || status === 'denied') return false
  if (pushBannerDismissed()) return false
  return true
}

/**
 * Appelé quand l'utilisateur clique "Activer" (onboarding, bandeau, ou paramètres).
 * Déclenche la popup native, récupère le token, l'enregistre au backend.
 * Retourne true si réussi, false sinon.
 */
export async function activatePush(): Promise<boolean> {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined
  if (!vapidKey || !pushSupported()) return false

  markPushAsked()
  const token = await requestFcmToken(vapidKey)
  if (!token) return false

  try {
    await terrainApi.registerPushToken(
      token,
      navigator.userAgent.slice(0, 200),
      /iPhone|iPad/.test(navigator.userAgent) ? 'ios' : 'android',
    )
  } catch { /* silencieux */ }
  return true
}
