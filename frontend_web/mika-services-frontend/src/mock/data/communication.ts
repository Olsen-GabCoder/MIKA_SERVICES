import type { Message, Notification, PaginatedResponse } from '@/types/communication'
import { TypeNotification } from '@/types/communication'

const user1 = { id: 1, nom: 'Mbenda', prenom: 'Jean', email: 'jean@mika.ga' }
const user2 = { id: 2, nom: 'Okoué', prenom: 'Marie', email: 'marie@mika.ga' }

export const mockMessagesRecus: Message[] = [
  { id: 1, expediteur: user2, destinataire: user1, sujet: 'Point chantier RN1', contenu: 'Bonjour, point de situation à prévoir jeudi 14h.', dateEnvoi: '2024-03-10T09:00:00', lu: false, dateLecture: null, parentId: null, createdAt: '2024-03-10T09:00:00', updatedAt: '2024-03-10T09:00:00' },
  { id: 2, expediteur: user2, destinataire: user1, sujet: null, contenu: 'Livraison enrobé reportée au 22/03.', dateEnvoi: '2024-03-11T14:00:00', lu: true, dateLecture: '2024-03-11T15:00:00', parentId: null, createdAt: '2024-03-11T14:00:00', updatedAt: '2024-03-11T15:00:00' },
]

export const mockMessagesEnvoyes: Message[] = [
  { id: 3, expediteur: user1, destinataire: user2, sujet: 'Réunion équipe', contenu: 'Merci de confirmer votre présence.', dateEnvoi: '2024-03-09T16:00:00', lu: true, dateLecture: '2024-03-09T17:00:00', parentId: null, createdAt: '2024-03-09T16:00:00', updatedAt: '2024-03-09T17:00:00' },
]

export const mockNotifications: Notification[] = [
  { id: 1, titre: 'Tâche assignée : Décapage chaussée', contenu: 'Une nouvelle tâche vous a été assignée.', typeNotification: TypeNotification.TACHE_ASSIGNEE, lien: '/planning', lu: false, dateCreation: '2024-03-10T08:00:00', dateLecture: null },
  { id: 2, titre: 'Échéance approchante', contenu: 'Signalisation temporaire - échéance 15/05/2024', typeNotification: TypeNotification.ECHEANCE, lien: '/planning', lu: true, dateCreation: '2024-03-08T10:00:00', dateLecture: '2024-03-09T09:00:00' },
  { id: 3, titre: 'Stock bas : Gravier 5/15', contenu: 'Le stock du matériau Gravier 5/15 est en dessous du minimum.', typeNotification: TypeNotification.STOCK_BAS, lien: '/materiaux', lu: false, dateCreation: '2024-03-12T07:00:00', dateLecture: null },
]

function paginated<T>(content: T[], page = 0, size = 20): PaginatedResponse<T> {
  const totalElements = content.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  return { content: content.slice(start, start + size), totalElements, totalPages, number: page, size }
}

export function getMockMessagesRecus(_userId: number, page = 0, size = 20): PaginatedResponse<Message> {
  return paginated(mockMessagesRecus, page, size)
}

export function getMockMessagesEnvoyes(_userId: number, page = 0, size = 20): PaginatedResponse<Message> {
  return paginated(mockMessagesEnvoyes, page, size)
}

export function getMockNotifications(_userId: number, page = 0, size = 30): PaginatedResponse<Notification> {
  return paginated(mockNotifications, page, size)
}

export function getMockNotificationsNonLuesCount(_userId: number): number {
  return mockNotifications.filter((n) => !n.lu).length
}

export function getMockMessagesNonLusCount(_userId: number): number {
  return mockMessagesRecus.filter((m) => !m.lu).length
}
