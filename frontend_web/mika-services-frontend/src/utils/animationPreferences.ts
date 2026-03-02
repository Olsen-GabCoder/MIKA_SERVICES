/**
 * Préférence d'animations de l'interface (Paramètres > Affichage).
 * Persistance localStorage ; application au document via data-animations pour le CSS.
 */

export const MIKA_ANIMATIONS_KEY = 'mika-animations'

export type AnimationPreference = 'full' | 'reduced' | 'none'

const VALID_VALUES: AnimationPreference[] = ['full', 'reduced', 'none']

export function getStoredAnimationPreference(): AnimationPreference {
  if (typeof window === 'undefined') return 'full'
  const stored = localStorage.getItem(MIKA_ANIMATIONS_KEY)
  if (stored && VALID_VALUES.includes(stored as AnimationPreference)) return stored as AnimationPreference
  return 'full'
}

export function applyAnimationsToDocument(preference: AnimationPreference): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-animations', preference)
}
