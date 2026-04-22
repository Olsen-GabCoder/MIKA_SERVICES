export interface SyntheseMensuelleResponse {
  projetId: number | null
  projetNom: string | null
  moisReference: string
  receptions: BlocReceptionSynthese[]
  essaisLabo: EssaisLaboSynthese | null
  leveeTopo: LeveeTopoSynthese | null
  agrements: AgrementsSynthese
  ncSynthese: NcSynthese
}

export interface BlocReceptionSynthese {
  nature: string
  sousType: string
  total: number
  parStatut: Record<string, number>
  statistiques: Record<string, number>
}

export interface EssaisLaboSynthese {
  nbCamionsMalaxeursVolumeCoulee: number
  nbEssaisSlump: number
  nbJoursCoulage: number
  nbPrelevements: number
  observations: string | null
}

export interface LeveeTopoSynthese {
  nbProfilsImplantes: number
  nbProfilsReceptionnes: number
  nbControlesRealises: number
  observations: string | null
}

export interface AgrementsSynthese {
  total: number
  parStatut: Record<string, number>
  statistiques: Record<string, number>
}

export interface NcSynthese {
  enregistrees: number
  traitees: number
  ouvertes: number
  parStatut: Record<string, number>
}
