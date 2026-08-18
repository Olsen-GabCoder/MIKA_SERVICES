import type { RoleProjet, FamilleRoleProjet } from '@/api/organisationApi'

/** Familles de rôles projet dans l'ordre hiérarchique (direction → support). */
export const FAMILLE_ORDER: FamilleRoleProjet[] = [
  'DIRECTION_PROJET',
  'ENCADREMENT_TRAVAUX',
  'ENCADREMENT_CHANTIER',
  'ETUDES_TECHNIQUE',
  'GROS_OEUVRE_TP',
  'SECOND_OEUVRE',
  'MATERIEL_ENGINS',
  'LOGISTIQUE_APPRO',
  'QSHE',
  'ADMINISTRATIF_SUPPORT',
]

/** Groupe les rôles par famille (ordre hiérarchique), triés alphabétiquement (locale fr). Les familles vides sont omises. */
export const groupRolesByFamille = (roles: RoleProjet[]): Map<FamilleRoleProjet, RoleProjet[]> => {
  const map = new Map<FamilleRoleProjet, RoleProjet[]>()
  for (const famille of FAMILLE_ORDER) {
    const list = roles
      .filter((r) => r.famille === famille)
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))
    if (list.length > 0) map.set(famille, list)
  }
  return map
}

/** Rang hiérarchique par nom de poste (clé normalisée en minuscules), inconnus absents. */
export const buildPosteRank = (rolesByFamille: Map<FamilleRoleProjet, RoleProjet[]>): Map<string, number> => {
  const map = new Map<string, number>()
  let i = 0
  for (const roles of rolesByFamille.values()) {
    for (const r of roles) map.set(r.nom.trim().toLowerCase(), i++)
  }
  return map
}
