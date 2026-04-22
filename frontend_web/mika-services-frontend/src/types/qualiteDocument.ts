export interface DocumentQualiteListResponse {
  id: number
  codeDocument: string
  titre: string
  versionCourante: string
  nomOriginal: string | null
  typeMime: string | null
  actif: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface DocumentQualiteResponse extends DocumentQualiteListResponse {
  description: string | null
  tailleOctets: number | null
  versions: VersionDocumentResponse[]
}

export interface VersionDocumentResponse {
  id: number
  numeroVersion: string
  nomOriginal: string
  typeMime: string | null
  tailleOctets: number
  commentaire: string | null
  auteurId: number | null
  auteurNom: string | null
  createdAt: string | null
}

export interface DocumentQualiteUpdateRequest {
  titre?: string
  description?: string
  actif?: boolean
}
