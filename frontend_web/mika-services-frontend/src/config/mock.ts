/**
 * Mode mock et fallback :
 * - USE_MOCK = true : on n'appelle jamais le backend, on renvoie toujours les données mock.
 * - USE_MOCK = false : on appelle le backend ; en cas d'échec (réseau, 404, 500), on renvoie les données mock (fallback).
 * Ainsi les données s'affichent que le backend tourne ou non.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** Utiliser les données mock en secours quand le backend échoue (true par défaut). */
export const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_FALLBACK !== 'false'
