export interface EssaiLaboBetonResponse {
  id: number
  projetId: number
  projetNom: string
  moisReference: string
  nbCamionsMalaxeursVolumeCoulee: number
  nbEssaisSlump: number
  nbJoursCoulage: number
  nbPrelevements: number
  observations: string | null
  saisiParId: number | null
  saisiParNom: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface EssaiLaboBetonCreateRequest {
  projetId: number
  moisReference?: string
  nbCamionsMalaxeursVolumeCoulee?: number
  nbEssaisSlump?: number
  nbJoursCoulage?: number
  nbPrelevements?: number
  observations?: string
  saisiParId?: number
}

export interface EssaiLaboBetonUpdateRequest {
  nbCamionsMalaxeursVolumeCoulee?: number
  nbEssaisSlump?: number
  nbJoursCoulage?: number
  nbPrelevements?: number
  observations?: string
}
