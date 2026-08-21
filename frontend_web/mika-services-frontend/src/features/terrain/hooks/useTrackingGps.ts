/**
 * Hook de tracking GPS pour les transferts en transit.
 * - watchPosition capture la position toutes les ~30s
 * - Les positions sont bufferisées localement (mémoire + localStorage léger)
 * - Envoyées par batch au backend au retour du réseau
 * - Wake Lock API maintient l'écran allumé
 *
 * Usage : const tracking = useTrackingGps(transfertId, actif)
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { terrainApi } from '@/api/terrainApi'

interface GpsPoint {
  latitude: number
  longitude: number
  precisionMetres?: number
  vitesseKmh?: number
  cap?: number
  horodatage: number // epoch ms
}

const BUFFER_KEY_PREFIX = 'mika-tracking-buffer-'
const SEND_INTERVAL_MS = 30_000 // envoi toutes les 30s
const MAX_BUFFER = 2000 // sécurité : ~100 Ko JSON max, couvre ~16h de trajet

function loadBuffer(transfertId: number): GpsPoint[] {
  try {
    const raw = localStorage.getItem(`${BUFFER_KEY_PREFIX}${transfertId}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveBuffer(transfertId: number, points: GpsPoint[]): void {
  try {
    localStorage.setItem(`${BUFFER_KEY_PREFIX}${transfertId}`, JSON.stringify(points.slice(-MAX_BUFFER)))
  } catch { /* quota */ }
}

function clearBuffer(transfertId: number): void {
  try { localStorage.removeItem(`${BUFFER_KEY_PREFIX}${transfertId}`) } catch {}
}

export function useTrackingGps(transfertId: number, actif: boolean) {
  const [lastPosition, setLastPosition] = useState<GpsPoint | null>(null)
  const [wakeLockActive, setWakeLockActive] = useState(false)
  const bufferRef = useRef<GpsPoint[]>([])
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // Envoyer le buffer au backend
  const flushBuffer = useCallback(async () => {
    const points = bufferRef.current
    if (points.length === 0) return
    if (!navigator.onLine) return

    try {
      await terrainApi.envoyerPositionsTransfert(transfertId, points)
      bufferRef.current = []
      clearBuffer(transfertId)
    } catch {
      // Réseau instable : garder le buffer, réessayer au prochain tick
      saveBuffer(transfertId, bufferRef.current)
    }
  }, [transfertId])

  useEffect(() => {
    if (!actif) return

    // Charger le buffer persisté (zone blanche précédente)
    bufferRef.current = loadBuffer(transfertId)

    // Wake Lock : garder l'écran allumé
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
          setWakeLockActive(true)
          wakeLockRef.current.addEventListener('release', () => setWakeLockActive(false))
        }
      } catch { /* Wake Lock refusé ou non supporté */ }
    }
    void requestWakeLock()

    // Re-demander le wake lock quand la page redevient visible
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        void requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // Démarrer le tracking GPS
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const point: GpsPoint = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            precisionMetres: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : undefined,
            vitesseKmh: pos.coords.speed != null ? Math.round(pos.coords.speed * 3.6 * 10) / 10 : undefined,
            cap: pos.coords.heading ?? undefined,
            horodatage: Date.now(),
          }
          bufferRef.current = [...bufferRef.current, point].slice(-MAX_BUFFER)
          saveBuffer(transfertId, bufferRef.current)
          setLastPosition(point)
        },
        () => { /* erreur GPS silencieuse */ },
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
      )
    }

    // Timer d'envoi batch toutes les 30s
    const sendTimer = window.setInterval(() => { void flushBuffer() }, SEND_INTERVAL_MS)

    // Envoi immédiat au démarrage si buffer existant
    if (bufferRef.current.length > 0) void flushBuffer()

    return () => {
      // Cleanup
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      window.clearInterval(sendTimer)
      // Dernier flush avant démontage
      void flushBuffer()
      // Libérer le wake lock
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
      setWakeLockActive(false)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [actif, transfertId, flushBuffer])

  return { lastPosition, wakeLockActive, pointsEnAttente: bufferRef.current.length }
}
