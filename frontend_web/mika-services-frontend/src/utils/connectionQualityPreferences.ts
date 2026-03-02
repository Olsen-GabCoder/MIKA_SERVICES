import type { ConnectionQuality } from '@/store/slices/uiSlice'

/** Qualité effective pour adapter le comportement (ex. intervalle d'auto-refresh). */
export type EffectiveConnectionQuality = 'normal' | 'slow'

/** Network Information API (non supportée partout). */
interface NetworkInformation {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g'
}

declare global {
  interface Navigator {
    connection?: NetworkInformation
  }
}

/**
 * Retourne la qualité effective à partir de la préférence utilisateur.
 * - auto : utilise navigator.connection si dispo (2g/slow-2g → slow), sinon normal
 * - normal | slow : retourne la valeur telle quelle
 */
export function getEffectiveConnectionQuality(preference: ConnectionQuality): EffectiveConnectionQuality {
  if (preference === 'normal') return 'normal'
  if (preference === 'slow') return 'slow'
  if (typeof navigator === 'undefined' || !navigator.connection) return 'normal'
  const et = navigator.connection.effectiveType
  if (et === '2g' || et === 'slow-2g') return 'slow'
  return 'normal'
}

/** Intervalle d'auto-refresh des listes (ms) : 60 s en normal, 120 s en slow. */
export const AUTO_REFRESH_INTERVAL_MS: Record<EffectiveConnectionQuality, number> = {
  normal: 60_000,
  slow: 120_000,
}
