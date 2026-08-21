/**
 * Configuration Firebase — uniquement Cloud Messaging (push notifications).
 *
 * Règles UX :
 * - requestFcmToken() déclenche Notification.requestPermission() → UNIQUEMENT derrière un clic.
 * - silentRegisterFcmToken() récupère le token SANS demander la permission (pour le cas
 *   où elle est déjà 'granted' depuis une session précédente) → appelable au montage.
 * - pushSupported() garde iOS/Safari hors PWA (pas d'objet Notification).
 */
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'AIzaSyBF1hDYrmHC37wa9qhyYqSe5fFX-TiAq5k',
  authDomain: 'mika-services.firebaseapp.com',
  projectId: 'mika-services',
  storageBucket: 'mika-services.firebasestorage.app',
  messagingSenderId: '598453909387',
  appId: '1:598453909387:web:43e34d7af5a9e73ea8218e',
  measurementId: 'G-TS6N6E3QG8',
}

const app = initializeApp(firebaseConfig)

let messagingInstance: ReturnType<typeof getMessaging> | null = null

function getMessagingInstance() {
  if (!messagingInstance) {
    messagingInstance = getMessaging(app)
  }
  return messagingInstance
}

/**
 * Enregistre le service worker FCM en lui passant la config via query params.
 * Source unique de la config = ce fichier ; le SW la lit depuis son URL
 * (evite de dupliquer firebaseConfig dans public/firebase-messaging-sw.js).
 */
let swRegistrationPromise: Promise<ServiceWorkerRegistration | undefined> | null = null

// Scope dedie de FCM (celui utilise par defaut par le SDK Firebase). L'enregistrer ici
// evite toute collision avec le SW Workbox (vite-plugin-pwa) qui possede le scope racine '/'.
// Deux scripts SW differents sur le meme scope se remplacent en boucle comme controleur,
// ce qui declenchait des rechargements en cascade (updateServiceWorker auto).
const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope'

/**
 * Desenregistre tout SW Firebase reste sur le scope racine '/' (etat corrompu laisse
 * par une version anterieure enregistrant sans scope explicite) — sinon la guerre de
 * controleur avec Workbox persiste et provoque la boucle de rechargement.
 */
async function unregisterConflictingFcmSw(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map(async (reg) => {
      const script = reg.active?.scriptURL ?? reg.waiting?.scriptURL ?? reg.installing?.scriptURL ?? ''
      if (script.includes('firebase-messaging-sw.js') && new URL(reg.scope).pathname === '/') {
        await reg.unregister()
      }
    }))
  } catch { /* ignore */ }
}

function getSwRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (swRegistrationPromise) return swRegistrationPromise
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(undefined)
  }
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  })
  swRegistrationPromise = unregisterConflictingFcmSw()
    .then(() => navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${params.toString()}`,
      { scope: FCM_SW_SCOPE },
    ))
    .catch((e) => { console.warn('[FCM] Enregistrement SW echoue:', e); return undefined })
  return swRegistrationPromise
}

const FCM_TOKEN_KEY = 'mika-terrain-fcm-token'

/** Le navigateur supporte-t-il les push ? (false sur Safari hors PWA installée, IE, etc.) */
export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
}

/** État actuel de la permission push ('granted' | 'denied' | 'default' | 'unsupported'). */
export function pushPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!pushSupported()) return 'unsupported'
  return Notification.permission
}

/** Récupère le dernier token FCM enregistré (pour le désactiver au logout). */
export function getStoredFcmToken(): string | null {
  try { return localStorage.getItem(FCM_TOKEN_KEY) } catch { return null }
}

/**
 * Demande la permission push (popup native) puis récupère le token FCM.
 * À appeler UNIQUEMENT derrière un clic utilisateur (bouton "Activer").
 */
export async function requestFcmToken(vapidKey: string): Promise<string | null> {
  try {
    if (!pushSupported()) return null

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const messaging = getMessagingInstance()
    const serviceWorkerRegistration = await getSwRegistration()
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration })
    if (token) {
      try { localStorage.setItem(FCM_TOKEN_KEY, token) } catch { /* quota */ }
    }
    return token
  } catch (e) {
    console.warn('[FCM] Erreur token:', e)
    return null
  }
}

/**
 * Si la permission est déjà 'granted', récupère le token sans popup.
 * Appelable au montage (pas de prompt navigateur).
 */
export async function silentRegisterFcmToken(vapidKey: string): Promise<string | null> {
  try {
    if (!pushSupported()) return null
    if (Notification.permission !== 'granted') return null

    const messaging = getMessagingInstance()
    const serviceWorkerRegistration = await getSwRegistration()
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration })
    if (token) {
      try { localStorage.setItem(FCM_TOKEN_KEY, token) } catch { /* quota */ }
    }
    return token
  } catch (e) {
    console.warn('[FCM] Erreur silent token:', e)
    return null
  }
}

/**
 * Écoute les messages push reçus quand l'app est au premier plan.
 * Si push non supporté, retourne un no-op.
 */
export function onForegroundMessage(callback: (payload: MessagePayload) => void): () => void {
  if (!pushSupported()) return () => {}
  try {
    const messaging = getMessagingInstance()
    return onMessage(messaging, callback)
  } catch {
    return () => {}
  }
}
