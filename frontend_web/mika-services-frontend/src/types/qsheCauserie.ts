export interface ParticipantResponse { id: number; nom: string; prenom: string; matricule: string | null }

export interface CauserieResponse {
  id: number; reference: string; sujet: string; description: string | null
  dateCauserie: string; heureDebut: string | null; dureeMinutes: number | null
  lieu: string | null; projetId: number; projetNom: string
  animateurId: number | null; animateurNom: string | null
  observations: string | null; nbParticipants: number
  participants: ParticipantResponse[]
  createdAt: string | null; updatedAt: string | null
}

export interface CauserieCreateRequest {
  projetId: number; sujet: string; description?: string; dateCauserie: string
  heureDebut?: string; dureeMinutes?: number; lieu?: string
  animateurId?: number; participantIds?: number[]
}

export interface CauserieUpdateRequest {
  sujet?: string; description?: string; dateCauserie?: string
  heureDebut?: string; dureeMinutes?: number; lieu?: string
  animateurId?: number; observations?: string; participantIds?: number[]
}

export interface CauserieSummaryResponse { totalCauseries: number; causeriesCeMois: number; participantsMoyens: number }
export interface PaginatedResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number }
