import type { ControleQualite, QualiteSummary, NonConformite, PaginatedResponse } from '@/types/qualite'
import { StatutControleQualite, TypeControle } from '@/types/qualite'

const userSummary = { id: 1, nom: 'Mbenda', prenom: 'Jean', email: 'jean@mika.ga' }

export const mockControles: ControleQualite[] = [
  { id: 1, projetId: 1, projetNom: 'Réhabilitation RN1',  reference: 'CQ-001', titre: 'Contrôle réception enrobé', description: null, typeControle: TypeControle.EN_COURS_EXECUTION, statut: StatutControleQualite.CONFORME, inspecteur: userSummary, datePlanifiee: '2024-03-01', dateRealisation: '2024-03-05', zoneControlee: 'PK 0+500', criteresVerification: null, observations: null, noteGlobale: 85, nbNonConformites: 0, createdAt: '2024-02-28T10:00:00', updatedAt: '2024-03-05T14:00:00' },
  { id: 2, projetId: 1, projetNom: 'Réhabilitation RN1',  reference: 'CQ-002', titre: 'Contrôle compactage', description: null, typeControle: TypeControle.EN_COURS_EXECUTION, statut: StatutControleQualite.EN_COURS, inspecteur: userSummary, datePlanifiee: '2024-03-15', dateRealisation: null, zoneControlee: 'PK 0+800', criteresVerification: null, observations: null, noteGlobale: null, nbNonConformites: 1, createdAt: '2024-03-10T10:00:00', updatedAt: '2024-03-10T10:00:00' },
  { id: 3, projetId: 2, projetNom: 'Assainissement Akébé',  reference: 'CQ-003', titre: 'Contrôle pose buses', description: null, typeControle: TypeControle.RECEPTION_MATERIAUX, statut: StatutControleQualite.CONFORME, inspecteur: { id: 2, nom: 'Okoué', prenom: 'Marie', email: 'marie@mika.ga' }, datePlanifiee: '2024-02-20', dateRealisation: '2024-02-22', zoneControlee: 'Zone Nord', criteresVerification: null, observations: null, noteGlobale: 90, nbNonConformites: 0, createdAt: '2024-02-18T10:00:00', updatedAt: '2024-02-22T16:00:00' },
]

export const mockNcEnRetard: NonConformite[] = []

function paginated<T>(content: T[], page = 0, size = 20): PaginatedResponse<T> {
  const totalElements = content.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  return { content: content.slice(start, start + size), totalElements, totalPages, number: page, size }
}

export function getMockControlesByProjet(projetId: number, page = 0, size = 20): PaginatedResponse<ControleQualite> {
  const filtered = mockControles.filter((c) => c.projetId === projetId)
  return paginated(filtered.length ? filtered : mockControles, page, size)
}

export function getMockQualiteSummary(projetId: number): QualiteSummary {
  const controlesProjet = mockControles.filter((c) => c.projetId === projetId)
  const conformes = controlesProjet.filter((c) => c.statut === StatutControleQualite.CONFORME).length
  const total = controlesProjet.length
  return {
    totalControles: total,
    controlesConformes: conformes,
    controlesNonConformes: total - conformes,
    controlesPlanifies: controlesProjet.filter((c) => c.statut === StatutControleQualite.PLANIFIE).length,
    controlesEnCours: controlesProjet.filter((c) => c.statut === StatutControleQualite.EN_COURS).length,
    ncOuvertes: 0,
    ncParGravite: {},
    tauxConformite: total ? Math.round((conformes / total) * 100) : 0,
  }
}

export function getMockNcEnRetard(): NonConformite[] {
  return mockNcEnRetard
}
