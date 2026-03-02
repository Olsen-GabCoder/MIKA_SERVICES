import type { Projet, ProjetSummary, PageResponse, PointBloquant, Prevision, AvancementEtudeProjet, PhaseEtude } from '@/types/projet'

export const mockProjetSummaries: ProjetSummary[] = [
  { id: 1, nom: 'Réhabilitation RN1 - Section Libreville / Owendo', type: 'VOIRIE', statut: 'EN_COURS', clientNom: 'Ministère des Travaux Publics', montantHT: 120_000_000, avancementGlobal: 58, dateDebut: '2024-01-15', dateFin: '2025-06-30', responsableNom: 'Jean Mbenda' },
  { id: 2, nom: 'Assainissement quartier Akébé', type: 'ASSAINISSEMENT', statut: 'EN_COURS', clientNom: 'Ville de Libreville', montantHT: 85_000_000, avancementGlobal: 67, dateDebut: '2024-03-01', dateFin: '2025-02-28', responsableNom: 'Marie Okoué' },
  { id: 3, nom: 'Construction pont sur la Komo', type: 'PONT', statut: 'PLANIFIE', clientNom: 'État gabonais', montantHT: 250_000_000, avancementGlobal: 0, dateDebut: '2025-01-01', dateFin: '2026-12-31', responsableNom: 'Paul Mba' },
  { id: 4, nom: 'Voirie secondaire Port-Gentil', type: 'VOIRIE', statut: 'TERMINE', clientNom: 'Région Ogooué-Maritime', montantHT: 45_000_000, avancementGlobal: 100, dateDebut: '2023-06-01', dateFin: '2024-05-15', responsableNom: 'Anne Nguema' },
  { id: 5, nom: 'Terrassement zone industrielle', type: 'TERRASSEMENT', statut: 'TERMINE', clientNom: 'GSEZ', montantHT: 32_000_000, avancementGlobal: 100, dateDebut: '2023-09-01', dateFin: '2024-04-30', responsableNom: 'Pierre Ndong' },
]

function pageResponse<T>(content: T[], page = 0, size = 20): PageResponse<T> {
  const totalElements = content.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  const pagedContent = content.slice(start, start + size)
  return { content: pagedContent, totalElements, totalPages, size, number: page, first: page === 0, last: page >= totalPages - 1 }
}

export function getMockProjetsPage(page = 0, size = 20): PageResponse<ProjetSummary> {
  return pageResponse(mockProjetSummaries, page, size)
}

const PHASES: PhaseEtude[] = ['APS', 'APD', 'EXE', 'GEOTECHNIQUE', 'HYDRAULIQUE', 'EIES', 'PAES']

function mockAvancementEtudes(projetId: number): AvancementEtudeProjet[] {
  return PHASES.map((phase, i) => ({
    id: projetId * 10 + i + 1,
    projetId,
    phase,
    avancementPct: i < 3 ? (i + 1) * 25 : undefined,
    dateDepot: i < 2 ? '2024-06-15' : undefined,
    etatValidation: i === 0 ? 'Validé' : i === 1 ? 'En cours' : undefined,
  }))
}

/** Détail projet mock complet pour les tests — toutes les données remplies */
export function getMockProjetById(id: number): (Projet & { _fromMock?: boolean }) | null {
  const s = mockProjetSummaries.find((p) => p.id === id)
  if (!s) return null
  const [prenom, nom] = (s.responsableNom || '—').split(/\s+(.+)$/)
  const projet: Projet & { _fromMock?: boolean } = {
    id: s.id,
    numeroMarche: s.id === 1 ? '144/MTP/SG/2024' : s.id === 2 ? '004/ED/MENFPFC/CTRI/2024' : `MAR-${s.id}/2024`,
    nom: s.nom,
    description: `Projet ${s.nom}. Description détaillée pour les besoins des réunions hebdomadaires et du suivi stratégique.`,
    type: s.type,
    statut: s.statut,
    client: s.clientNom ? {
      id: 1,
      code: 'CLI-001',
      nom: s.clientNom,
      type: 'MINISTERE',
      ministere: 'Ministère des Travaux Publics',
      telephone: '+241 01 76 00 00',
      email: 'contact@mtp.ga',
      adresse: 'Libreville, Gabon',
      contactPrincipal: 'Direction des marchés',
      telephoneContact: '+241 01 76 00 01',
      actif: true,
    } : undefined,
    sourceFinancement: 'ETAT_GABONAIS',
    imputationBudgetaire: `Chapitre ${s.id} - Opération ${s.nom}`,
    province: 'Estuaire',
    ville: 'Libreville',
    quartier: s.id === 1 ? 'Owendo' : s.id === 2 ? 'Akébé' : 'Centre-ville',
    montantHT: s.montantHT,
    montantTTC: s.montantHT ? Math.round(s.montantHT * 1.18) : undefined,
    montantInitial: s.montantHT,
    montantRevise: s.montantHT ? Math.round(s.montantHT * 1.05) : undefined,
    delaiMois: s.id <= 2 ? 8 : s.id === 3 ? 12 : 6,
    modeSuiviMensuel: 'AUTO',
    dateDebut: s.dateDebut,
    dateFin: s.dateFin,
    dateDebutReel: s.dateDebut,
    dateFinReelle: s.statut === 'TERMINE' ? s.dateFin : undefined,
    avancementGlobal: s.avancementGlobal,
    avancementPhysiquePct: s.avancementGlobal,
    avancementFinancierPct: Math.min(100, s.avancementGlobal + (s.id % 3) * 5),
    delaiConsommePct: s.avancementGlobal ? Math.min(100, Math.round(s.avancementGlobal * 1.2)) : 0,
    besoinsMateriel: 'Niveleuse, compacteur, camions benne.',
    besoinsHumain: '2 conducteurs engins, 1 chef de chantier.',
    observations: 'Suivi hebdomadaire avec le maître d\'ouvrage.',
    responsableProjet: s.responsableNom ? { id: 1, nom: nom || prenom, prenom: prenom, email: 'chef@mika.ga' } : undefined,
    partenairePrincipal: 'Bureau d\'études associé',
    actif: true,
    nombreSousProjets: s.id <= 2 ? 2 : 1,
    nombrePointsBloquantsOuverts: s.id === 1 ? 2 : s.id === 2 ? 1 : 0,
    avancementEtudes: mockAvancementEtudes(s.id),
    createdAt: '2024-01-10T08:00:00',
    updatedAt: '2025-01-15T14:30:00',
  }
  projet._fromMock = true
  return projet
}

/** Points bloquants mock pour tests — données complètes */
export function getMockPointsBloquants(projetId: number): PointBloquant[] {
  const nom = mockProjetSummaries.find((p) => p.id === projetId)?.nom ?? ''
  return [
    { id: projetId * 10 + 1, projetId, projetNom: nom, titre: 'Conduite en fonte sur Axe 3', description: 'Déplacement nécessaire avant poursuite des travaux.', priorite: 'HAUTE', statut: 'OUVERT', dateDetection: '2025-01-10', detectePar: { id: 1, nom: 'Mbenda', prenom: 'Jean', email: 'j.mbenda@mika.ga' }, assigneA: { id: 2, nom: 'Okoué', prenom: 'Marie', email: 'm.okoue@mika.ga' } },
    { id: projetId * 10 + 2, projetId, projetNom: nom, titre: 'Transfo à déplacer sur l\'emprise Axe 4', description: 'Coordination avec énergie électrique.', priorite: 'NORMALE', statut: 'EN_COURS', dateDetection: '2025-01-05' },
    { id: projetId * 10 + 3, projetId, projetNom: nom, titre: 'Besoin d\'une Niveleuse à temps plein', description: 'Location ou affectation supplémentaire.', priorite: 'URGENTE', statut: 'OUVERT', dateDetection: '2025-01-12' },
  ]
}

/** Prévisions mock pour tests — données complètes */
export function getMockPrevisions(projetId: number): Prevision[] {
  const nom = mockProjetSummaries.find((p) => p.id === projetId)?.nom ?? ''
  return [
    { id: projetId * 10 + 1, projetId, projetNom: nom, type: 'HEBDOMADAIRE', annee: 2025, semaine: 2, description: 'Décompte N°3', avancementPct: 75, dateDebut: '2025-01-06', dateFin: '2025-01-12' },
    { id: projetId * 10 + 2, projetId, projetNom: nom, type: 'MENSUELLE', annee: 2025, description: 'Transmission documents MTPC - validation DQE', avancementPct: 30 },
    { id: projetId * 10 + 3, projetId, projetNom: nom, type: 'TRIMESTRIELLE', annee: 2025, description: 'Délai d\'exécution actualisé à communiquer en S2', avancementPct: 100 },
  ]
}
