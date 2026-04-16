export const TypeNotification = {
  INFO: 'INFO',
  ALERTE: 'ALERTE',
  TACHE_ASSIGNEE: 'TACHE_ASSIGNEE',
  INCIDENT: 'INCIDENT',
  NON_CONFORMITE: 'NON_CONFORMITE',
  ECHEANCE: 'ECHEANCE',
  STOCK_BAS: 'STOCK_BAS',
  MESSAGE: 'MESSAGE',
  SYSTEME: 'SYSTEME',
  DMA_SOUMISE: 'DMA_SOUMISE',
  DMA_VALIDEE_CHANTIER: 'DMA_VALIDEE_CHANTIER',
  DMA_VALIDEE_PROJET: 'DMA_VALIDEE_PROJET',
  DMA_PRISE_EN_CHARGE: 'DMA_PRISE_EN_CHARGE',
  DMA_COMPLEMENT_REQUIS: 'DMA_COMPLEMENT_REQUIS',
  DMA_COMMANDEE: 'DMA_COMMANDEE',
  DMA_LIVREE: 'DMA_LIVREE',
  DMA_REJETEE: 'DMA_REJETEE',
  MOUVEMENT_ORDRE_CREE: 'MOUVEMENT_ORDRE_CREE',
  MOUVEMENT_DEPART_CONFIRME: 'MOUVEMENT_DEPART_CONFIRME',
  MOUVEMENT_RECEPTION_CONFIRMEE: 'MOUVEMENT_RECEPTION_CONFIRMEE',
  MOUVEMENT_ANNULE: 'MOUVEMENT_ANNULE',
  RAPPEL_MAJ_PROJET: 'RAPPEL_MAJ_PROJET',
} as const

export type TypeNotification = (typeof TypeNotification)[keyof typeof TypeNotification]

export interface UserMinimal {
  id: number
  nom: string
  prenom: string
  email: string
}

export interface PieceJointe {
  id: number
  nomOriginal: string
  typeMime: string | null
  tailleOctets: number
}

export interface Message {
  id: number
  expediteur: UserMinimal
  destinataire: UserMinimal
  sujet: string | null
  contenu: string
  dateEnvoi: string
  lu: boolean
  dateLecture: string | null
  parentId: number | null
  piecesJointes?: PieceJointe[]
  mentions?: UserMinimal[]
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: number
  titre: string
  contenu: string | null
  typeNotification: TypeNotification
  lien: string | null
  lu: boolean
  dateCreation: string
  dateLecture: string | null
}

export interface MessageCreateRequest {
  destinataireId: number
  sujet?: string
  contenu: string
  parentId?: number
  mentionIds?: number[]
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
