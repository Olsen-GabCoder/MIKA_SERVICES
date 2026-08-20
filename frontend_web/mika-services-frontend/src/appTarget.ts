// Cible de build : 'terrain' (app mobile seule), 'pilotage' (web sans /terrain), 'full' (dev local = tout).
export type AppTarget = 'terrain' | 'pilotage' | 'full'

const raw = import.meta.env.VITE_APP_TARGET as string | undefined
export const APP_TARGET: AppTarget = raw === 'terrain' || raw === 'pilotage' ? raw : 'full'

export const IS_TERRAIN_BUILD = APP_TARGET === 'terrain'

// URL externe de l'app terrain (utilisée par le build pilotage pour rediriger les rôles mobile-only).
export const TERRAIN_APP_BASE: string | null =
  APP_TARGET === 'pilotage' ? ((import.meta.env.VITE_TERRAIN_APP_URL as string | undefined) || null) : null

/** Redirige vers l'app terrain externe si configurée. Retourne true si la redirection a été lancée. */
export function externalTerrainRedirect(target: string): boolean {
  if (!TERRAIN_APP_BASE) return false
  window.location.replace(TERRAIN_APP_BASE.replace(/\/$/, '') + target)
  return true
}
