export interface User {
  id: number
  matricule: string
  nom: string
  prenom: string
  email: string
  sexe?: 'HOMME' | 'FEMME' | null
  telephone?: string
  dateNaissance?: string
  adresse?: string
  ville?: string
  quartier?: string
  province?: string
  numeroCNI?: string
  numeroPasseport?: string
  dateEmbauche?: string
  photo?: string
  ficheMission?: string
  salaireMensuel?: number
  typeContrat?: string
  niveauExperience?: string
  actif: boolean
  totpEnabled?: boolean
  mustChangePassword?: boolean
  lastLogin?: string
  roles: Role[]
  departements: Departement[]
  specialites: Specialite[]
  superieurHierarchique?: UserSummary
  createdAt: string
  updatedAt: string
  /** Présent uniquement après création : true si l'email de bienvenue a été envoyé. */
  welcomeEmailSent?: boolean
  /** Préférence : recevoir les e-mails transactionnels (MDP modifié, 2FA, etc.). */
  emailNotificationsEnabled?: boolean
  /** Préférence : recevoir un e-mail à chaque nouvelle connexion. */
  alertNewLoginEnabled?: boolean
  /** Résumé quotidien par e-mail. */
  dailyDigestEnabled?: boolean
  /** Résumé hebdomadaire par e-mail. */
  weeklyDigestEnabled?: boolean
  /** Heure d'envoi des résumés (HH:mm). */
  digestTime?: string | null
  /** Afficher les notifications in-app (badge, alertes). */
  inAppNotificationsEnabled?: boolean
  /** Jouer un son à la réception d'une notification ou d'un message. */
  notificationSoundEnabled?: boolean
  /** Durée de session par défaut à la connexion : "SHORT" (1 h), "LONG" (5 h), ou non défini (choix au login). */
  defaultSessionDuration?: string | null
  /** Déconnexion à la fermeture du navigateur (token stocké en sessionStorage). */
  logoutOnBrowserClose?: boolean
}

export interface UserSummary {
  id: number
  matricule: string
  nom: string
  prenom: string
  email: string
}

export interface Role {
  id: number
  code: string
  nom: string
  description?: string
  niveau: string
  actif: boolean
  permissions: Permission[]
}

export interface Permission {
  id: number
  code: string
  nom: string
  module: string
  type: string
  description?: string
  actif: boolean
}

export interface Departement {
  id: number
  code: string
  nom: string
  type: string
  description?: string
  responsable?: UserSummary
  actif: boolean
}

export interface Specialite {
  id: number
  code: string
  nom: string
  categorie: string
  description?: string
  actif: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

/** Réponse login quand 2FA est activé : l'utilisateur doit envoyer le code TOTP via verify2FA */
export interface Login2FAPendingResponse {
  requires2FA: boolean
  tempToken: string
  message?: string
}

export interface ApiError {
  timestamp?: string
  status: number
  error: string
  message: string
  path?: string
  details?: Record<string, any>
}
