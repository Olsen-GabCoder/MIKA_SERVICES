import type { User } from '@/types'

export interface GreetingInfo {
  key: string
  name: string
}

/**
 * Calcule la cle i18n de greeting et le nom a afficher
 * selon la civilite de l'utilisateur.
 *
 * Logique extraite de DashboardPage.tsx L.118-128.
 */
export function computeGreeting(user: User | null, fallback = 'Utilisateur'): GreetingInfo {
  if (!user) return { key: 'db.greetingNeutral', name: fallback }

  const prenom = user.prenom?.trim() || ''
  const nom = user.nom?.trim() || ''
  if (!prenom && !nom) return { key: 'db.greetingNeutral', name: fallback }

  const sexeNorm = user.sexe
    ? String(user.sexe).replace(/^Sexe\./i, '').toUpperCase()
    : null

  if (sexeNorm === 'HOMME') return { key: 'db.greetingMale', name: nom || prenom || fallback }
  if (sexeNorm === 'FEMME') return { key: 'db.greetingFemale', name: nom || prenom || fallback }

  return { key: 'db.greetingNeutral', name: prenom || nom || fallback }
}
