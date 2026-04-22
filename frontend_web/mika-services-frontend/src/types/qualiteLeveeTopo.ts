export interface LeveeTopoResponse {
  id: number
  projetId: number
  projetNom: string
  moisReference: string
  nbProfilsImplantes: number
  nbProfilsReceptionnes: number
  nbControlesRealises: number
  observations: string | null
  saisiParId: number | null
  saisiParNom: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface LeveeTopoCreateRequest {
  projetId: number
  moisReference?: string
  nbProfilsImplantes?: number
  nbProfilsReceptionnes?: number
  nbControlesRealises?: number
  observations?: string
  saisiParId?: number
}

export interface LeveeTopoUpdateRequest {
  nbProfilsImplantes?: number
  nbProfilsReceptionnes?: number
  nbControlesRealises?: number
  observations?: string
}
