export const TypeInspection = {
  QUOTIDIENNE: 'QUOTIDIENNE', HEBDOMADAIRE: 'HEBDOMADAIRE', MENSUELLE: 'MENSUELLE',
  INOPINEE: 'INOPINEE', VIC: 'VIC', AUDIT_INTERNE: 'AUDIT_INTERNE', AUDIT_EXTERNE: 'AUDIT_EXTERNE',
} as const
export type TypeInspection = (typeof TypeInspection)[keyof typeof TypeInspection]

export const StatutInspection = {
  PLANIFIEE: 'PLANIFIEE', EN_COURS: 'EN_COURS', TERMINEE: 'TERMINEE', ANNULEE: 'ANNULEE',
} as const
export type StatutInspection = (typeof StatutInspection)[keyof typeof StatutInspection]

export const ResultatItem = {
  CONFORME: 'CONFORME', NON_CONFORME: 'NON_CONFORME', NON_APPLICABLE: 'NON_APPLICABLE', NON_VERIFIE: 'NON_VERIFIE',
} as const
export type ResultatItem = (typeof ResultatItem)[keyof typeof ResultatItem]

export interface InspectionItemResponse {
  id: number; ordre: number; libelle: string; section: string | null
  resultat: ResultatItem; commentaire: string | null; photoUrl: string | null
  critique: boolean; poids: number
}

export interface InspectionResponse {
  id: number; reference: string; titre: string; description: string | null
  typeInspection: TypeInspection; statut: StatutInspection
  projetId: number; projetNom: string
  sousProjetId: number | null; sousProjetNom: string | null
  inspecteurId: number | null; inspecteurNom: string | null
  datePlanifiee: string | null; dateRealisation: string | null
  zoneInspecte: string | null; observations: string | null
  scoreGlobal: number | null
  checklistTemplateId: number | null; checklistTemplateNom: string | null
  nbItems: number; nbConformes: number; nbNonConformes: number
  items: InspectionItemResponse[]
  createdAt: string | null; updatedAt: string | null
}

export interface ChecklistTemplateItemResponse {
  id: number; ordre: number; libelle: string; section: string | null
  description: string | null; critique: boolean; poids: number
}

export interface ChecklistTemplateResponse {
  id: number; code: string; nom: string; description: string | null
  typeInspection: TypeInspection | null; actif: boolean; nbItems: number
  items: ChecklistTemplateItemResponse[]
}

export interface InspectionCreateRequest {
  projetId: number; titre: string; description?: string
  typeInspection: TypeInspection; inspecteurId?: number
  datePlanifiee?: string; zoneInspecte?: string
  sousProjetId?: number; checklistTemplateId?: number
}

export interface InspectionItemUpdateRequest {
  id: number; resultat: ResultatItem; commentaire?: string; photoUrl?: string
}

export interface InspectionUpdateRequest {
  titre?: string; description?: string; statut?: StatutInspection
  inspecteurId?: number; datePlanifiee?: string; dateRealisation?: string
  zoneInspecte?: string; observations?: string
  items?: InspectionItemUpdateRequest[]
}

export interface PaginatedResponse<T> {
  content: T[]; totalElements: number; totalPages: number; number: number; size: number
}
