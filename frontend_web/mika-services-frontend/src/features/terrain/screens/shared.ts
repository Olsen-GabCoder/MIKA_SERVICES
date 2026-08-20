/**
 * Données métier partagées entre les écrans terrain.
 */
import type { ComponentType, CSSProperties } from 'react'
import type { GraviteIncident, TypeIncidentEngin } from '@/types/materiel'
import { AMBER, BLUE, RED } from '../theme'
import { IconCog, IconDroplet, IconFlash, IconWrench, IconX, IconClock } from '../components/icons'

export type Screen =
  | 'accueil' | 'scan' | 'engin' | 'signalement' | 'inspection' | 'releve' | 'ravitaillement'
  | 'dma-list' | 'dma-form' | 'dma-detail'
  | 'transfert-list' | 'transfert-form' | 'transfert-detail' | 'transfert-bon' | 'transfert-reception'
  | 'sync'
  | 'alertes'
  | 'profil'

type IconCmp = ComponentType<{ size?: number; strokeWidth?: number; style?: CSSProperties }>

// ── Checklist inspection (14 points) ───────────────────────────
export const CHECKLIST_SECTIONS: { titre: string; items: { code: string; label: string }[] }[] = [
  {
    titre: 'Moteur & fluides',
    items: [
      { code: 'HUILE_MOTEUR', label: "Niveau d'huile moteur" },
      { code: 'LIQUIDE_REFROID', label: 'Liquide de refroidissement' },
      { code: 'NIVEAU_CARBURANT', label: 'Niveau de carburant' },
      { code: 'FUITE_MOTEUR', label: 'Absence de fuite moteur' },
    ],
  },
  {
    titre: 'Circuit hydraulique',
    items: [
      { code: 'HUILE_HYDRAULIQUE', label: 'Niveau huile hydraulique' },
      { code: 'FLEXIBLES', label: 'Flexibles et raccords' },
      { code: 'VERINS', label: 'Vérins (état, fuites)' },
    ],
  },
  {
    titre: 'Châssis & train roulant',
    items: [
      { code: 'PNEUS_CHENILLES', label: 'Pneus / chenilles' },
      { code: 'GRAISSAGE', label: 'Graissage des articulations' },
      { code: 'STRUCTURE', label: 'Structure et soudures' },
    ],
  },
  {
    titre: 'Sécurité & cabine',
    items: [
      { code: 'AVERTISSEUR', label: 'Avertisseur / gyrophare' },
      { code: 'CEINTURE', label: 'Ceinture de sécurité' },
      { code: 'EXTINCTEUR', label: 'Extincteur présent' },
      { code: 'ECLAIRAGE', label: 'Éclairage de travail' },
    ],
  },
]
export const TOTAL_ITEMS = CHECKLIST_SECTIONS.reduce((n, s) => n + s.items.length, 0)

// ── Signalement — types & gravités ─────────────────────────────
export const TYPES_PANNE: { id: string; Icon: IconCmp; label: string; backend: TypeIncidentEngin }[] = [
  { id: 'fuite', Icon: IconDroplet, label: 'Fuite', backend: 'DEFAUT_TECHNIQUE' },
  { id: 'electrique', Icon: IconFlash, label: 'Électrique', backend: 'DEFAUT_TECHNIQUE' },
  { id: 'panne', Icon: IconCog, label: 'Panne', backend: 'PANNE' },
  { id: 'casse', Icon: IconX, label: 'Casse', backend: 'ACCIDENT' },
  { id: 'usure', Icon: IconClock, label: 'Usure', backend: 'USURE_PREMATUREE' },
  { id: 'autre', Icon: IconWrench, label: 'Autre', backend: 'AUTRE' },
]

export const GRAVITES: { id: GraviteIncident; label: string; color: string }[] = [
  { id: 'MINEURE', label: 'Mineur', color: '#9CA3AF' },
  { id: 'MOYENNE', label: 'Modéré', color: BLUE },
  { id: 'MAJEURE', label: 'Majeur', color: AMBER },
  { id: 'CRITIQUE', label: 'Critique', color: RED },
]
