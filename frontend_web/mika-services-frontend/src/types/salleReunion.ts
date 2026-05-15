export interface UserSummary {
  id: number
  nom: string
  prenom: string
}

export interface SalleReunion {
  id: number
  roomName: string
  libelle: string
  ouverte: boolean
  dateOuverture: string | null
  ouvertePar: UserSummary | null
  dateFermeture: string | null
  fermeePar: UserSummary | null
  updatedAt: string
}

export interface JitsiConfig {
  roomName: string
  displayName: string
  subject: string
  ouverte: boolean
}

export interface JaaSToken {
  token: string
  appId: string
  roomName: string
  displayName: string
  subject: string
  moderator: boolean
}

export interface SalleParticipant {
  id: number
  user: UserSummary
  joinedAt: string
  leftAt: string | null
}
