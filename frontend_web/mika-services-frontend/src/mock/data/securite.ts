import type { Incident, Risque, SecuriteSummary, PaginatedResponse } from '@/types/securite'
import { TypeIncident, GraviteIncident, StatutIncident, NiveauRisque } from '@/types/securite'

const userSummary = { id: 1, nom: 'Mbenda', prenom: 'Jean', email: 'jean@mika.ga' }

export const mockIncidents: Incident[] = [
  { id: 1, projetId: 1, projetNom: 'Réhabilitation RN1',  reference: 'INC-001', titre: 'Presqu\'accident engin', description: 'Quasi-collision', typeIncident: TypeIncident.PRESQU_ACCIDENT, gravite: GraviteIncident.LEGER, statut: StatutIncident.CLOTURE, dateIncident: '2024-02-10', heureIncident: '14:30', lieu: 'PK 0+500', declarePar: userSummary, nbBlesses: 0, arretTravail: false, nbJoursArret: 0, causeIdentifiee: 'Visibilité', mesuresImmediates: 'Signalisation', analyseCause: null, nbActionsPrevention: 2, createdAt: '2024-02-10T15:00:00', updatedAt: '2024-02-15T10:00:00' },
  { id: 2, projetId: 1, projetNom: 'Réhabilitation RN1',  reference: 'INC-002', titre: 'Incident matériel', description: 'Panne compacteur', typeIncident: TypeIncident.INCIDENT_MATERIEL, gravite: GraviteIncident.BENIN, statut: StatutIncident.CLOTURE, dateIncident: '2024-03-01', heureIncident: null, lieu: 'Base vie', declarePar: userSummary, nbBlesses: 0, arretTravail: false, nbJoursArret: 0, causeIdentifiee: null, mesuresImmediates: null, analyseCause: null, nbActionsPrevention: 0, createdAt: '2024-03-01T09:00:00', updatedAt: '2024-03-01T12:00:00' },
]

export const mockRisques: Risque[] = [
  { id: 1, projetId: 1, projetNom: 'Réhabilitation RN1',  titre: 'Risque chute', description: 'Zones glissantes', niveau: NiveauRisque.MOYEN, probabilite: 3, impact: 2, zoneConcernee: 'Chantier', mesuresPrevention: 'Nettoyage', actif: true, createdAt: '2024-01-20T10:00:00', updatedAt: '2024-01-20T10:00:00' },
  { id: 2, projetId: 1, projetNom: 'Réhabilitation RN1',  titre: 'Risque circulation engins', description: 'Croisement engins', niveau: NiveauRisque.ELEVE, probabilite: 4, impact: 3, zoneConcernee: 'Base vie', mesuresPrevention: 'Sens unique', actif: true, createdAt: '2024-01-25T10:00:00', updatedAt: '2024-01-25T10:00:00' },
]

function paginated<T>(content: T[], page = 0, size = 20): PaginatedResponse<T> {
  const totalElements = content.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  return { content: content.slice(start, start + size), totalElements, totalPages, number: page, size }
}

export function getMockIncidentsByProjet(projetId: number, page = 0, size = 20): PaginatedResponse<Incident> {
  const filtered = mockIncidents.filter((i) => i.projetId === projetId)
  return paginated(filtered.length ? filtered : mockIncidents, page, size)
}

export function getMockRisquesByProjet(projetId: number, page = 0, size = 20): PaginatedResponse<Risque> {
  const filtered = mockRisques.filter((r) => r.projetId === projetId)
  return paginated(filtered.length ? filtered : mockRisques, page, size)
}

export function getMockSecuriteSummary(projetId: number): SecuriteSummary {
  const incidents = mockIncidents.filter((i) => i.projetId === projetId)
  const risques = mockRisques.filter((r) => r.projetId === projetId && r.actif)
  return {
    totalIncidents: incidents.length,
    incidentsGraves: 0,
    totalJoursArret: 0,
    incidentsParGravite: {},
    risquesActifs: risques.length,
    risquesCritiques: risques.filter((r) => r.niveau === NiveauRisque.CRITIQUE).length,
    actionsEnRetard: 0,
  }
}
