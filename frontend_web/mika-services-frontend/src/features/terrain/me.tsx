/**
 * Contexte utilisateur terrain — rôles, permissions et chantiers affectés.
 * Miroir front de la matrice backend (TerrainController @PreAuthorize + services).
 * Les helpers sont permissifs quand `me` n'est pas encore chargé (le backend reste le juge).
 */
import { createContext, useContext } from 'react'
import type { TerrainMe } from '@/api/terrainApi'

const Ctx = createContext<TerrainMe | null>(null)
export const TerrainMeProvider = Ctx.Provider
export const useTerrainMe = (): TerrainMe | null => useContext(Ctx)

const has = (me: TerrainMe | null, codes: string[]): boolean =>
  me === null || me.roles.some((r) => codes.includes(r))

const ADMINS = ['ADMIN', 'SUPER_ADMIN']

/** Voit tout le parc (les autres sont limités aux engins de leurs chantiers). */
export const hasParcComplet = (me: TerrainMe | null): boolean =>
  me !== null && me.roles.some((r) => r === 'LOGISTIQUE' || ADMINS.includes(r))

/** Créer une demande de matériel (miroir ROLES_DMA_CREATE backend). */
export const canCreateDma = (me: TerrainMe | null): boolean =>
  has(me, ['USER', 'CHEF_CHANTIER', 'CHEF_PROJET', 'LOGISTIQUE', ...ADMINS])

/** Initier / traiter un transfert d'engin (miroir ROLES_TRANSFERT backend). */
export const canTransfert = (me: TerrainMe | null): boolean =>
  has(me, ['CHEF_CHANTIER', 'CHEF_PROJET', 'LOGISTIQUE', ...ADMINS])

/** Valider / rejeter une demande de transfert (logistique et admins uniquement). */
export const canValiderTransfert = (me: TerrainMe | null): boolean =>
  me !== null && me.roles.some((r) => r === 'LOGISTIQUE' || ADMINS.includes(r))

/** Réceptionner un engin : chef de chantier destination + logistique (le CP consulte seulement). */
export const canReceptionnerTransfert = (me: TerrainMe | null): boolean =>
  has(me, ['CHEF_CHANTIER', 'LOGISTIQUE', ...ADMINS])

/** Opérations machine : inspection, relevé compteur, ravitaillement (miroir ROLES_OPERATEUR). */
export const isOperateur = (me: TerrainMe | null): boolean =>
  has(me, ['CONDUCTEUR', 'CHEF_CHANTIER', 'CHEF_PROJET', 'LOGISTIQUE', ...ADMINS])

// ── Workflow DMA (miroir DemandeMaterielService) ───────────────

/** Trio à pleins pouvoirs sur le workflow DMA (miroir isLogistiqueOuAdmin backend). */
export const isLogistiqueOuAdmin = (me: TerrainMe | null): boolean =>
  has(me, ['LOGISTIQUE', ...ADMINS])

/** Renvoyer après complément / confirmer livraison : logistique, admin ou créateur de la demande. */
export const canCompleterOuLivrer = (me: TerrainMe | null, createurUserId: number): boolean =>
  me === null || me.id === createurUserId || isLogistiqueOuAdmin(me)

/** Libellés d'affichage des rôles globaux (écran Profil). */
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ADMIN: 'Administrateur',
  USER: 'Ouvrier',
  CONDUCTEUR: 'Conducteur d\u2019engins',
  CHEF_PROJET: 'Chef de projet',
  LOGISTIQUE: 'Logistique',
  CHEF_CHANTIER: 'Chef de chantier',
  DIRECTEUR_TECHNIQUE: 'Directeur technique',
  RESPONSABLE_QUALITE: 'Responsable qualité',
  INGENIEUR_QUALITE: 'Ingénieur qualité',
  CONTROLEUR_TECHNIQUE: 'Contrôleur technique',
  ASSISTANT_QUALITE: 'Assistant qualité',
  TECHNICIEN_LABORATOIRE: 'Technicien laboratoire',
  TECHNICIEN_TOPOGRAPHIE: 'Technicien topographie',
}
export const roleLabel = (code: string): string => ROLE_LABELS[code] ?? code.replace(/_/g, ' ')
