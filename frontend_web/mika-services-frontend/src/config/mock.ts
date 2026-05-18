/**
 * Mode mock :
 * - USE_MOCK = true : on n'appelle jamais le backend, on renvoie toujours les données mock (dev uniquement).
 * - USE_MOCK = false (défaut) : on appelle le backend. En cas d'échec, l'erreur remonte normalement.
 * - USE_MOCK_FALLBACK = true : en cas d'échec backend, on retombe sur les données mock (dev uniquement).
 * - USE_MOCK_FALLBACK = false (défaut) : en cas d'échec, l'erreur est affichée.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** Désactivé par défaut — activer explicitement avec VITE_USE_MOCK_FALLBACK=true en dev si besoin. */
export const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_FALLBACK === 'true'
