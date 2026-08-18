/**
 * Module Engins & Materiel — Reproduction fidele de la maquette Claude Design.
 * 4 ecrans desktop : Tableau de bord, Fiche equipement, Carte, Planning.
 * Navigation interne par state (pas de routes separees).
 */
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { enginApi } from '@/api/enginApi'
import type { EnginSummary, EnginStats, Engin, CarnetEngin, OperationMaintenance, IncidentEngin, DocumentEngin, AffectationEnginResponse, ReleveCompteur, ConsommationCarburant, EnginCarte, AlerteEngin, EcheanceEngin, HeuresMensuelles, PlanMaintenance, CoutEngin, InspectionEngin, PositionEngin, MouvementEnginSummary } from '@/types/materiel'
import { EnginFormModal } from '../components/EnginFormModal'
import { MaintenanceFormModal } from '../components/MaintenanceFormModal'
import { IncidentFormModal } from '../components/IncidentFormModal'
import { ReleveCompteurFormModal } from '../components/ReleveCompteurFormModal'
import { ConsommationFormModal } from '../components/ConsommationFormModal'
import { DocumentFormModal } from '../components/DocumentFormModal'
import { AffectationFormModal } from '../components/AffectationFormModal'
import { AffectationEditModal } from '../components/AffectationEditModal'
import { InspectionCreateModal } from '../components/InspectionCreateModal'
import { DocumentEditModal } from '../components/DocumentEditModal'
import { TransfertCreateModal } from '../components/TransfertCreateModal'
import { mouvementEnginApi } from '@/api/mouvementEnginApi'
import apiClient from '@/api/axios'
import { QrCodeModal } from '../components/QrCodeModal'
import { PlanMaintenanceFormModal } from '../components/PlanMaintenanceFormModal'
import { LeafletCarteEngins } from '../map/LeafletCarteEngins'
import { useConfirm } from '@/contexts/ConfirmContext'
import { useToast } from '@/contexts/ToastContext'
import '../styles/materiel-maquette.css'

/* ═══════════════════════════════════════════════════════════
   DATA & CONFIG
   ═══════════════════════════════════════════════════════════ */

const ST: Record<string, { label: string; color: string; bg: string }> = {
  DISPONIBLE:     { label: 'Disponible',   color: '#16A34A', bg: '#E7F6EC' },
  EN_SERVICE:     { label: 'En service',   color: '#3F6B83', bg: '#E8F0F5' },
  EN_MAINTENANCE: { label: 'Maintenance',  color: '#D97706', bg: '#FDF2E3' },
  EN_PANNE:       { label: 'En panne',     color: '#DC2626', bg: '#FDECEC' },
  IMMOBILISE:     { label: 'Immobilisé',   color: '#9333EA', bg: '#F3E8FF' },
  HORS_SERVICE:   { label: 'Hors service', color: '#6B7280', bg: '#EFF1F3' },
  EN_TRANSIT:     { label: 'En transit',   color: '#8B5CF6', bg: '#F1EAFE' },
  REFORME:        { label: 'Réformé',      color: '#78716C', bg: '#F5F5F4' },
}

const TYPE_ABBR: Record<string, string> = {
  PELLETEUSE: 'PEL', BULLDOZER: 'BUL', NIVELEUSE: 'NIV', COMPACTEUR: 'CMP',
  CAMION_BENNE: 'CAM', CAMION_CITERNE: 'CIT', GRUE: 'GRU', CHARGEUSE: 'CHA',
  RETROCHARGEUSE: 'RET', BETONNIERE: 'BET', FINISSEUR: 'FIN',
  GROUPE_ELECTROGENE: 'GEN', POMPE: 'POM', FOREUSE: 'FOR', CONCASSEUR: 'CON', AUTRE: 'AUT',
}

const TYPE_LABEL: Record<string, string> = {
  PELLETEUSE: 'Engin lourd', BULLDOZER: 'Engin lourd', NIVELEUSE: 'Engin lourd', COMPACTEUR: 'Compacteur',
  CAMION_BENNE: 'Véhicule', CAMION_CITERNE: 'Véhicule', GRUE: 'Grue', CHARGEUSE: 'Engin lourd',
  RETROCHARGEUSE: 'Engin lourd', BETONNIERE: 'Engin léger', FINISSEUR: 'Engin lourd',
  GROUPE_ELECTROGENE: 'Générateur', POMPE: 'Équipement', FOREUSE: 'Engin lourd', CONCASSEUR: 'Engin lourd', AUTRE: 'Autre',
}

const TABS_FICHE: [string, string][] = [
  ['infos', 'Informations'], ['affectations', 'Affectations'], ['transferts', 'Transferts'], ['maintenance', 'Maintenance'],
  ['plans', 'Plans maintenance'], ['incidents', 'Incidents'], ['compteurs', 'Compteurs & conso.'],
  ['documents', 'Documents'], ['positions', 'Positions'], ['couts', 'Coûts'], ['inspections', 'Inspections'],
  ['carnet', 'Carnet de bord'],
]

/** YYYY-MM-DD en heure locale (évite le décalage UTC de toISOString en soirée) */
const localISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

interface CellData { text: string; weight: number; color: string; bg: string; pad: string; size: string }
function cell(text: string, opt?: Partial<{ weight: number; color: string; bg: string; size: string }>): CellData {
  const hasBg = !!opt?.bg && opt.bg !== 'transparent'
  return {
    text, weight: opt?.weight ?? 500, color: opt?.color ?? '#33465A',
    bg: opt?.bg ?? 'transparent', pad: hasBg ? '4px 9px' : '0', size: opt?.size ?? '13.5px',
  }
}
function badge(t: string, color: string, bg: string): CellData {
  return cell(t, { color, bg, weight: 600, size: '11.5px' })
}

/* ── Table definitions for fiche tabs ── */
const TABLES: Record<string, { titre: string; action: string; cols: string; head: string[]; rows: CellData[][] }> = {
  affectations: {
    titre: 'Historique des affectations', action: '+ Nouvelle affectation',
    cols: '1.4fr 1fr 1fr .9fr .8fr', head: ['Chantier', 'Période', 'Conducteur', 'Statut', 'Durée'],
    rows: [
      [cell('Résidence Le Parc', { weight: 600 }), cell('12/06/2026 → en cours'), cell('M. Diallo'), badge('ACTIVE', '#3F6B83', '#E8F0F5'), cell('64 j')],
      [cell('ZAC Rivière Sud', { weight: 600 }), cell('03/03 → 09/06/2026'), cell('A. Berger'), badge('TERMINÉE', '#6B7280', '#EFF1F3'), cell('98 j')],
      [cell('Écoquartier — lot 2', { weight: 600 }), cell('14/11/2025 → 27/02/2026'), cell('M. Diallo'), badge('TERMINÉE', '#6B7280', '#EFF1F3'), cell('105 j')],
      [cell('Viaduc Est (réservation)', { weight: 600 }), cell('01/10 → 15/12/2026'), cell('à définir'), badge('PLANIFIÉE', '#2563EB', '#E7EEFD'), cell('75 j')],
    ],
  },
  maintenance: {
    titre: 'Opérations et plans de maintenance', action: '+ Planifier une opération',
    cols: '1.6fr .8fr .9fr 1fr .8fr', head: ['Opération', 'Type', 'Statut', 'Échéance', 'Coût'],
    rows: [
      [cell('Vidange moteur + filtres', { weight: 600 }), badge('PRÉVENTIVE', '#2563EB', '#E7EEFD'), badge('DÉPASSÉE +12 J', '#DC2626', '#FDECEC'), cell('à 4 500 h'), cell('—')],
      [cell('Contrôle flexibles hydrauliques', { weight: 600 }), badge('RÉGLEMENT.', '#7C3AED', '#F1EAFE'), badge('PLANIFIÉE', '#D97706', '#FDF2E3'), cell('02/09/2026'), cell('380 FCFA')],
      [cell('Remplacement train de chenilles', { weight: 600 }), badge('CORRECTIVE', '#DC2626', '#FDECEC'), badge('TERMINÉE', '#16A34A', '#E7F6EC'), cell('18/04/2026'), cell('6 240 FCFA')],
      [cell('Graissage général', { weight: 600 }), badge('PRÉVENTIVE', '#2563EB', '#E7EEFD'), badge('TERMINÉE', '#16A34A', '#E7F6EC'), cell('toutes les 250 h'), cell('95 FCFA')],
    ],
  },
  incidents: {
    titre: 'Incidents signalés', action: '+ Signaler un incident',
    cols: '1.6fr .9fr .9fr 1fr .9fr', head: ['Incident', 'Type', 'Gravité', 'Signalé le', 'Statut'],
    rows: [
      [cell('Suintement flexible de flèche', { weight: 600 }), cell('Hydraulique'), badge('MAJEURE', '#D97706', '#FDF2E3'), cell('11/08/2026 · M. Diallo'), badge('EN RÉPARATION', '#D97706', '#FDF2E3')],
      [cell('Avertisseur de recul HS', { weight: 600 }), cell('Électrique'), badge('MODÉRÉE', '#2563EB', '#E7EEFD'), cell('22/06/2026 · M. Diallo'), badge('RÉSOLU', '#16A34A', '#E7F6EC')],
      [cell('Casse dent de godet', { weight: 600 }), cell('Casse'), badge('MINEURE', '#6B7280', '#EFF1F3'), cell('04/05/2026 · S. Rey'), badge('CLOS', '#6B7280', '#EFF1F3')],
    ],
  },
  documents: {
    titre: 'Documents et conformité', action: '+ Ajouter un document',
    cols: '1.5fr 1fr .9fr .9fr .9fr', head: ['Document', 'Type', 'Émission', 'Expiration', 'État'],
    rows: [
      [cell("Attestation d'assurance flotte", { weight: 600 }), cell('Assurance'), cell('01/09/2025'), cell('31/08/2026'), badge('EXPIRE DANS 16 J', '#D97706', '#FDF2E3')],
      [cell('Certificat de conformité CE', { weight: 600 }), cell('Certificat'), cell('12/02/2024'), cell('—'), badge('VALIDE', '#16A34A', '#E7F6EC')],
      [cell('Rapport VGP (vérification générale)', { weight: 600 }), cell('Réglementaire'), cell('14/03/2026'), cell('14/09/2026'), badge('VALIDE', '#16A34A', '#E7F6EC')],
      [cell("Facture d'acquisition", { weight: 600 }), cell('Facture'), cell('08/01/2024'), cell('—'), badge('ARCHIVÉ', '#6B7280', '#EFF1F3')],
    ],
  },
  positions: {
    titre: 'Historique des positions', action: 'Voir sur la carte',
    cols: '1fr 1.4fr 1fr .9fr .8fr', head: ['Horodatage', 'Coordonnées', 'Chantier', 'Source', 'Précision'],
    rows: [
      [cell('15/08 · 09:41', { weight: 600 }), cell('48,8721 N · 2,3412 E'), cell('Résidence Le Parc'), badge('QR SCAN', '#2563EB', '#E7EEFD'), cell('± 6 m')],
      [cell('14/08 · 17:12', { weight: 600 }), cell('48,8720 N · 2,3410 E'), cell('Résidence Le Parc'), badge('GPS AUTO', '#3F6B83', '#E8F0F5'), cell('± 12 m')],
      [cell('09/06 · 08:03', { weight: 600 }), cell('48,8654 N · 2,3789 E'), cell('ZAC Rivière Sud'), badge('QR SCAN', '#2563EB', '#E7EEFD'), cell('± 5 m')],
    ],
  },
  couts: {
    titre: 'Journal des coûts · TCO 2026 : 38 420 FCFA', action: 'Exporter le journal',
    cols: '1fr 1.4fr .9fr 1fr .8fr', head: ['Type', 'Description', 'Date', 'Chantier', 'Montant'],
    rows: [
      [badge('MAINTENANCE', '#2563EB', '#E7EEFD'), cell("Train de chenilles + main-d'œuvre"), cell('18/04/2026'), cell('Le Parc'), cell('6 240 FCFA', { weight: 700 })],
      [badge('CARBURANT', '#D97706', '#FDF2E3'), cell('Ravitaillements — cumul juillet'), cell('31/07/2026'), cell('Le Parc'), cell('3 118 FCFA', { weight: 700 })],
      [badge('ASSURANCE', '#7C3AED', '#F1EAFE'), cell('Prime annuelle flotte engins'), cell('01/09/2025'), cell('—'), cell('2 940 FCFA', { weight: 700 })],
      [badge('TRANSPORT', '#3F6B83', '#E8F0F5'), cell('Convoi ZAC Rivière Sud → Le Parc'), cell('12/06/2026'), cell('Le Parc'), cell('1 450 FCFA', { weight: 700 })],
    ],
  },
  inspections: {
    titre: 'Inspections quotidiennes', action: 'Nouvelle inspection',
    cols: '1fr 1.2fr .9fr 1.2fr .8fr', head: ['Date', 'Inspecteur', 'Compteur', 'Résultat', 'Signature'],
    rows: [
      [cell('15/08/2026', { weight: 600 }), cell('M. Diallo'), cell('4 520 h'), badge('1 ANOMALIE', '#D97706', '#FDF2E3'), cell('✓ signée')],
      [cell('14/08/2026', { weight: 600 }), cell('M. Diallo'), cell('4 512 h'), badge('CONFORME', '#16A34A', '#E7F6EC'), cell('✓ signée')],
      [cell('13/08/2026', { weight: 600 }), cell('S. Rey'), cell('4 503 h'), badge('CONFORME', '#16A34A', '#E7F6EC'), cell('✓ signée')],
    ],
  },
}

const TIMELINE = {
  titre: 'Carnet de bord numérique',
  sous: 'Consolidation chronologique — exportable en PDF pour audit ou contrôle réglementaire',
  items: [
    { date: '15/08 · 09:41', titre: 'Inspection quotidienne — 1 anomalie', detail: 'M. Diallo · flexible de flèche signalé NOK, incident créé automatiquement', tag: 'INSPECTION', color: '#D97706', bg: '#FDF2E3' },
    { date: '15/08 · 09:38', titre: 'Relevé compteur — 4 520 h', detail: 'Scan QR sur site · +8 h depuis la veille', tag: 'COMPTEUR', color: '#2563EB', bg: '#E7EEFD' },
    { date: '14/08 · 16:20', titre: 'Ravitaillement — 148 L', detail: '19,8 L/h · 218 FCFA · surconsommation détectée (+14 %)', tag: 'CARBURANT', color: '#D97706', bg: '#FDF2E3' },
    { date: '11/08 · 07:55', titre: 'Incident — suintement hydraulique', detail: 'Gravité majeure, non immobilisant · maintenance corrective planifiée', tag: 'INCIDENT', color: '#DC2626', bg: '#FDECEC' },
    { date: '12/06 · 08:00', titre: 'Affectation — Résidence Le Parc', detail: "Conducteur M. Diallo · habilitation CACES R482 cat. B1 vérifiée", tag: 'AFFECTATION', color: '#3F6B83', bg: '#E8F0F5' },
    { date: '18/04 · 14:30', titre: 'Maintenance corrective terminée', detail: 'Remplacement train de chenilles · 6 240 FCFA · atelier interne', tag: 'MAINTENANCE', color: '#16A34A', bg: '#E7F6EC' },
  ],
}

/* ── Static data matching maquette ── */
const EQUIPEMENTS_STATIC = [
  { code: 'ENG-2024-042', designation: 'Pelle hydraulique 20T', marque: 'Caterpillar 320', categorie: 'Engin lourd', st: 'EN_SERVICE', chantier: 'Résidence Le Parc', conducteur: 'M. Diallo', releve: '4 520 h', abbr: 'PEL', tint: '#3F6B83' },
  { code: 'ENG-2024-018', designation: 'Grue mobile 60T', marque: 'Liebherr LTM 1060', categorie: 'Grue', st: 'EN_SERVICE', chantier: 'ZAC Rivière Sud', conducteur: 'A. Berger', releve: '2 130 h', abbr: 'GRU', tint: '#2563EB' },
  { code: 'ENG-2023-091', designation: 'Compacteur tandem', marque: 'Bomag BW 138', categorie: 'Compacteur', st: 'EN_PANNE', chantier: 'ZAC Rivière Sud', conducteur: '—', releve: '1 870 h', abbr: 'CMP', tint: '#DC2626' },
  { code: 'VEH-2022-007', designation: 'Camion benne 19T', marque: 'Renault C380', categorie: 'Véhicule', st: 'DISPONIBLE', chantier: 'Dépôt Nord', conducteur: '—', releve: '84 210 km', abbr: 'CAM', tint: '#16A34A' },
  { code: 'ENG-2024-055', designation: 'Chargeuse sur pneus', marque: 'Volvo L60H', categorie: 'Engin lourd', st: 'EN_MAINTENANCE', chantier: 'Atelier central', conducteur: '—', releve: '3 042 h', abbr: 'CHA', tint: '#D97706' },
  { code: 'ENG-2021-033', designation: 'Nacelle élévatrice 16 m', marque: 'Haulotte HA16', categorie: 'Engin léger', st: 'DISPONIBLE', chantier: 'Dépôt Nord', conducteur: '—', releve: '990 h', abbr: 'NAC', tint: '#16A34A' },
  { code: 'MAT-2023-120', designation: 'Groupe électrogène 60 kVA', marque: 'SDMO R66', categorie: 'Générateur', st: 'EN_SERVICE', chantier: 'Lot 4 — Écoquartier', conducteur: 'Équipe TP2', releve: '6 410 h', abbr: 'GEN', tint: '#3F6B83' },
  { code: 'ENG-2020-004', designation: 'Mini-pelle 3,5T', marque: 'Kubota U35', categorie: 'Engin léger', st: 'HORS_SERVICE', chantier: 'Dépôt Sud', conducteur: '—', releve: '5 760 h', abbr: 'MPE', tint: '#6B7280' },
]



/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

type Screen = 'dashboard' | 'fiche' | 'carte' | 'planning' | 'chantiers' | 'maintenance'

export const EnginListPage = () => {

  const confirm = useConfirm()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  // Sync screen state with URL params (?view=fiche&id=42&tab=maintenance)
  const screenFromUrl = (searchParams.get('view') as Screen) || 'dashboard'
  const enginIdFromUrl = searchParams.get('id') ? Number(searchParams.get('id')) : null
  const tabFromUrl = searchParams.get('tab') || 'infos'

  const [screen, setScreenInternal] = useState<Screen>(screenFromUrl)
  const [ficheTab, setFicheTabInternal] = useState(tabFromUrl)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [showReleveModal, setShowReleveModal] = useState(false)
  const [showConsommationModal, setShowConsommationModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showAffectationModal, setShowAffectationModal] = useState(false)
  const [editingAffectation, setEditingAffectation] = useState<AffectationEnginResponse | null>(null)
  const [editingDocument, setEditingDocument] = useState<DocumentEngin | null>(null)
  const [showPlanMaintenanceModal, setShowPlanMaintenanceModal] = useState(false)
  const [enginPhotoUrl, setEnginPhotoUrl] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [selectedEnginId, setSelectedEnginId] = useState<number | null>(null)
  const [ficheEngin, setFicheEngin] = useState<Engin | null>(null)
  const [ficheCarnet, setFicheCarnet] = useState<CarnetEngin | null>(null)
  const [ficheMaintenances, setFicheMaintenances] = useState<OperationMaintenance[]>([])
  const [ficheIncidents, setFicheIncidents] = useState<IncidentEngin[]>([])
  const [ficheDocuments, setFicheDocuments] = useState<DocumentEngin[]>([])
  const [ficheAffectations, setFicheAffectations] = useState<AffectationEnginResponse[]>([])
  const [ficheReleves, setFicheReleves] = useState<ReleveCompteur[]>([])
  const [ficheConsos, setFicheConsos] = useState<ConsommationCarburant[]>([])
  const [fichePlans, setFichePlans] = useState<PlanMaintenance[]>([])
  const [ficheHeuresMensuelles, setFicheHeuresMensuelles] = useState<HeuresMensuelles | null>(null)
  const [ficheCouts, setFicheCouts] = useState<CoutEngin | null>(null)
  const [ficheInspections, setFicheInspections] = useState<InspectionEngin[]>([])
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [fichePositions, setFichePositions] = useState<PositionEngin[]>([])
  const [ficheMouvements, setFicheMouvements] = useState<MouvementEnginSummary[]>([])
  const [showTransfertModal, setShowTransfertModal] = useState(false)
  const [ficheLoading, setFicheLoading] = useState(false)
  const [cartePositions, setCartePositions] = useState<EnginCarte[]>([])
  const [carteSelectedId, setCarteSelectedId] = useState<number | null>(null)
  const [carteLastUpdate, setCarteLastUpdate] = useState<Date | null>(null)
  const [carteSearch, setCarteSearch] = useState('')
  const [carteFilterStatut, setCarteFilterStatut] = useState('')
  const [planningAffectations, setPlanningAffectations] = useState<AffectationEnginResponse[]>([])
  const [chantierSearch, setChantierSearch] = useState('')
  const [chantierPage, setChantierPage] = useState(0)
  const [chantierFilterStatut, setChantierFilterStatut] = useState('')
  const [chantierSort, setChantierSort] = useState<'engins' | 'nom'>('engins')
  const [chantierCardPages, setChantierCardPages] = useState<Record<number, number>>({})
  const [planningLoading, setPlanningLoading] = useState(false)
  // Maintenance globale
  const [maintList, setMaintList] = useState<OperationMaintenance[]>([])
  const [maintLoading, setMaintLoading] = useState(false)
  const [maintView, setMaintView] = useState<'tableau' | 'calendrier'>('tableau')
  const [maintFilterStatut, setMaintFilterStatut] = useState('')
  const [maintFilterType, setMaintFilterType] = useState('')
  const [maintMonth, setMaintMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [maintCalendrier, setMaintCalendrier] = useState<OperationMaintenance[]>([])
  const [donutMode, setDonutMode] = useState<'statut' | 'type'>('statut')
  const [engins, setEngins] = useState<EnginSummary[]>([])
  const [stats, setStats] = useState<EnginStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [enginThumbs, setEnginThumbs] = useState<Record<number, string>>({})
  const [alertes, setAlertes] = useState<AlerteEngin[]>([])
  const [echeances, setEcheances] = useState<EcheanceEngin[]>([])
  // Filters & pagination
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [filterChantier, setFilterChantier] = useState<string>('')
  const [projetOptions, setProjetOptions] = useState<{ id: number; nom: string }[]>([])
  const [sortField, setSortField] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showQrModal, setShowQrModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const PAGE_SIZE = 20

  // Load projets (options du filtre chantier)
  useEffect(() => {
    apiClient.get<{ content: { id: number; nom: string }[] }>('/projets', { params: { page: 0, size: 200 } })
      .then(r => setProjetOptions(r.data.content || []))
      .catch(() => setProjetOptions([]))
  }, [])

  const sortParam = sortField ? `${sortField},${sortDir}` : undefined

  // Load engins list (reacts to filter/page changes)
  const loadEngins = useCallback((page = 0) => {
    const doSearch = searchQuery.trim().length > 0
    const promise = doSearch
      ? enginApi.search(searchQuery.trim(), page, PAGE_SIZE)
      : enginApi.findAll(page, PAGE_SIZE, filterStatut || undefined, filterType || undefined, filterChantier ? Number(filterChantier) : undefined, sortParam)
    promise.then(result => {
      setEngins(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
      setCurrentPage(page)
    }).catch(() => {})
  }, [searchQuery, filterStatut, filterType, filterChantier, sortParam])

  useEffect(() => {
    let cancelled = false
    const doSearch = searchQuery.trim().length > 0
    const enginPromise = doSearch
      ? enginApi.search(searchQuery.trim(), 0, PAGE_SIZE)
      : enginApi.findAll(0, PAGE_SIZE, filterStatut || undefined, filterType || undefined, filterChantier ? Number(filterChantier) : undefined, sortParam)
    Promise.all([
      enginPromise,
      enginApi.getStats().catch(() => null),
      enginApi.getAlertes().catch(() => [] as AlerteEngin[]),
      enginApi.getEcheances(7).catch(() => [] as EcheanceEngin[]),
    ]).then(([page, st, al, ec]) => {
      if (!cancelled) {
        setEngins(page.content)
        setTotalPages(page.totalPages)
        setTotalElements(page.totalElements)
        setCurrentPage(0)
        setStats(st); setAlertes(al); setEcheances(ec); setLoading(false)
      }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterStatut, filterChantier, sortParam, searchQuery])

  // Load thumbnails for engins that have photos
  useEffect(() => {
    if (engins.length === 0) return
    const withPhoto = engins.filter(e => e.photo && !enginThumbs[e.id])
    if (withPhoto.length === 0) return
    let cancelled = false
    const urls: string[] = []
    // Load in small batches to avoid flooding
    const load = async () => {
      for (const e of withPhoto) {
        if (cancelled) break
        try {
          const blob = await enginApi.getPhotoBlob(e.id)
          if (blob && !cancelled) {
            const url = URL.createObjectURL(blob)
            urls.push(url)
            setEnginThumbs(prev => ({ ...prev, [e.id]: url }))
          }
        } catch { /* ignore */ }
      }
    }
    load()
    return () => { cancelled = true; urls.forEach(u => URL.revokeObjectURL(u)) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engins])

  // Fetch carte positions — suivi temps réel (rafraîchissement toutes les 30s)
  const loadCarte = useCallback(() => {
    enginApi.getPositions()
      .then(p => { setCartePositions(p); setCarteLastUpdate(new Date()) })
      .catch(() => {})
  }, [])
  useEffect(() => {
    if (screen !== 'carte') return
    loadCarte()
    const timer = setInterval(loadCarte, 30000)
    return () => clearInterval(timer)
  }, [screen, loadCarte])

  // Fetch planning affectations (aussi pour la vue par chantier)
  useEffect(() => {
    if (screen !== 'planning' && screen !== 'chantiers') return
    setPlanningLoading(true)
    enginApi.getPlanningAffectations()
      .then(setPlanningAffectations)
      .catch(() => setPlanningAffectations([]))
      .finally(() => setPlanningLoading(false))
  }, [screen])

  // Fetch fiche data when selecting an engin
  useEffect(() => {
    if (screen !== 'fiche' || !selectedEnginId) return
    let cancelled = false
    setFicheLoading(true)
    Promise.all([
      enginApi.findById(selectedEnginId).catch(() => null),
      enginApi.getCarnet(selectedEnginId).catch(() => null),
      enginApi.getMaintenances(selectedEnginId, 0, 50).then(p => p.content).catch(() => []),
      enginApi.getIncidents(selectedEnginId, 0, 50).then(p => p.content).catch(() => []),
      enginApi.getDocuments(selectedEnginId, 0, 50).then(p => p.content).catch(() => []),
      enginApi.getAffectationsByEngin(selectedEnginId).catch(() => []),
      enginApi.getReleves(selectedEnginId, 0, 20).then(p => p.content).catch(() => []),
      enginApi.getConsommations(selectedEnginId, 0, 20).then(p => p.content).catch(() => []),
      enginApi.getHeuresMensuelles(selectedEnginId).catch(() => null),
      enginApi.getPlansMaintenance(selectedEnginId).catch(() => []),
      enginApi.getCouts(selectedEnginId).catch(() => null),
      enginApi.getInspections(selectedEnginId, 0, 50).then(p => p.content).catch(() => []),
      enginApi.getPositionsHistorique(selectedEnginId, 0, 50).then(p => p.content).catch(() => []),
      enginApi.getMouvements(selectedEnginId).catch(() => []),
    ]).then(([eng, carnet, maint, inc, docs, aff, rel, conso, hm, plans, couts, insp, pos, mvts]) => {
      if (cancelled) return
      setFicheEngin(eng)
      setFicheCarnet(carnet)
      setFicheMaintenances(maint)
      setFicheIncidents(inc)
      setFicheDocuments(docs)
      setFicheAffectations(aff)
      setFicheReleves(rel)
      setFicheConsos(conso)
      setFicheHeuresMensuelles(hm as HeuresMensuelles | null)
      setFichePlans(plans as PlanMaintenance[])
      setFicheCouts(couts as CoutEngin | null)
      setFicheInspections(insp as InspectionEngin[])
      setFichePositions(pos as PositionEngin[])
      setFicheMouvements(mvts as MouvementEnginSummary[])
      setFicheLoading(false)
    })
    return () => { cancelled = true }
  }, [screen, selectedEnginId])

  // Load engin photo when fiche is open
  useEffect(() => {
    if (screen !== 'fiche' || !selectedEnginId || !ficheEngin?.photo) {
      setEnginPhotoUrl(null)
      return
    }
    let objectUrl: string | null = null
    enginApi.getPhotoBlob(selectedEnginId).then(blob => {
      if (!blob) return
      objectUrl = URL.createObjectURL(blob)
      setEnginPhotoUrl(objectUrl)
    })
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [screen, selectedEnginId, ficheEngin?.photo])

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/') || !selectedEnginId) return
    setPhotoUploading(true)
    try {
      const updated = await enginApi.uploadPhoto(selectedEnginId, file)
      setFicheEngin(updated)
      toast({ message: 'Photo mise à jour', variant: 'success' })
    } catch {
      toast({ message: 'Erreur lors de l\'upload de la photo', variant: 'error' })
    } finally {
      setPhotoUploading(false)
      e.target.value = ''
    }
  }, [selectedEnginId, toast])

  const go = useCallback((s: Screen) => {
    setScreenInternal(s)
    const params: Record<string, string> = {}
    if (s !== 'dashboard') params.view = s
    setSearchParams(params, { replace: true })
    window.scrollTo(0, 0)
  }, [setSearchParams])

  const goFiche = useCallback((enginId?: number) => {
    if (enginId) setSelectedEnginId(enginId)
    setScreenInternal('fiche')
    setFicheTabInternal('infos')
    setSearchParams({ view: 'fiche', id: String(enginId || selectedEnginId || ''), tab: 'infos' }, { replace: true })
    window.scrollTo(0, 0)
  }, [setSearchParams, selectedEnginId])

  const setFicheTab = useCallback((tab: string) => {
    setFicheTabInternal(tab)
    setSearchParams({ view: 'fiche', id: String(selectedEnginId || ''), tab }, { replace: true })
  }, [setSearchParams, selectedEnginId])

  // Restore state from URL on mount
  useEffect(() => {
    if (screenFromUrl !== 'dashboard') setScreenInternal(screenFromUrl)
    if (enginIdFromUrl) setSelectedEnginId(enginIdFromUrl)
    if (tabFromUrl !== 'infos') setFicheTabInternal(tabFromUrl)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshList = useCallback(() => {
    loadEngins(currentPage)
    enginApi.getStats().then(setStats).catch(() => {})
    enginApi.getAlertes().then(setAlertes).catch(() => {})
    enginApi.getEcheances(7).then(setEcheances).catch(() => {})
  }, [loadEngins, currentPage])

  const handleDeleteEngin = useCallback(async () => {
    if (!selectedEnginId || !ficheEngin) return
    const confirmed = await confirm({ message: `Supprimer l'engin "${ficheEngin.nom}" (${ficheEngin.code}) ? Cette action est irréversible.`, variant: 'danger' })
    if (!confirmed) return
    try {
      await enginApi.delete(selectedEnginId)
      toast({ message: `Engin "${ficheEngin.nom}" supprimé`, variant: 'success' })
      setSelectedEnginId(null)
      setFicheEngin(null)
      refreshList()
      go('dashboard')
    } catch {
      toast({ message: 'Erreur lors de la suppression', variant: 'error' })
    }
  }, [selectedEnginId, ficheEngin, confirm, toast, refreshList, go])

  /* ── Build equipment rows from real data or static fallback ── */
  const equipements = useMemo(() => {
    if (engins.length > 0) {
      return engins.map(e => {
        const st = ST[e.statut] || ST.HORS_SERVICE
        return {
          code: e.code, designation: e.nom, marque: e.marque || '—',
          categorie: TYPE_LABEL[e.type] || 'Autre', st: e.statut,
          chantier: e.chantierActuel || '—', conducteur: '—', releve: '—',
          abbr: TYPE_ABBR[e.type] || 'ENG', tint: st.color,
          statut: st.label, statutColor: st.color, statutBg: st.bg,
          id: e.id,
        }
      })
    }
    return EQUIPEMENTS_STATIC.map(e => {
      const st = ST[e.st] || ST.HORS_SERVICE
      return { ...e, statut: st.label, statutColor: st.color, statutBg: st.bg }
    })
  }, [engins])

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const total = stats?.totalEngins ?? (engins.length || 47)
    const dispo = stats?.disponibles ?? (engins.length ? engins.filter(e => e.statut === 'DISPONIBLE').length : 21)
    const service = stats?.enService ?? (engins.length ? engins.filter(e => e.statut === 'EN_SERVICE').length : 12)
    const maint = stats?.enMaintenance ?? (engins.length ? engins.filter(e => e.statut === 'EN_MAINTENANCE').length : 8)
    const panne = stats?.enPanne ?? (engins.length ? engins.filter(e => e.statut === 'EN_PANNE').length : 3)
    const taux = stats?.tauxDisponibilite ?? (total > 0 ? Math.round(((dispo + service) / total) * 100) : 68)
    const alertesMaint = stats?.alertesMaintenance ?? 0
    const incidentsOuverts = stats?.incidentsNonResolus ?? 0
    return [
      { label: 'Total parc', value: String(total), unit: 'engins', color: '#152230', delta: '', deltaColor: '#7A8B9A' },
      { label: 'Disponibles', value: String(dispo), unit: '', color: '#16A34A', delta: `${total > 0 ? Math.round((dispo / total) * 100) : 0} % du parc`, deltaColor: '#7A8B9A' },
      { label: 'En service', value: String(service), unit: '', color: '#3F6B83', delta: '', deltaColor: '#7A8B9A' },
      { label: 'Maintenance', value: String(maint), unit: '', color: '#D97706', delta: alertesMaint > 0 ? `${alertesMaint} planifiee(s)` : '', deltaColor: '#D97706' },
      { label: 'En panne', value: String(panne), unit: '', color: '#DC2626', delta: incidentsOuverts > 0 ? `${incidentsOuverts} incident(s)` : '', deltaColor: '#DC2626', pulse: panne > 0 },
      { label: 'Taux dispo.', value: String(taux), unit: '%', color: '#152230', delta: '', deltaColor: '#16A34A' },
    ]
  }, [engins, stats])

  /* ── Donut ── */
  const donut = useMemo(() => {
    const counts: Record<string, number> = {}
    if (donutMode === 'type') {
      if (stats?.parType && Object.keys(stats.parType).length > 0) {
        Object.assign(counts, stats.parType)
      } else if (engins.length) {
        engins.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1 })
      }
    } else if (stats?.parStatut && Object.keys(stats.parStatut).length > 0) {
      Object.assign(counts, stats.parStatut)
    } else if (engins.length) {
      engins.forEach(e => { counts[e.statut] = (counts[e.statut] || 0) + 1 })
    } else {
      counts.DISPONIBLE = 21; counts.EN_SERVICE = 12; counts.EN_MAINTENANCE = 8; counts.EN_PANNE = 3; counts.HORS_SERVICE = 3
    }
    const TYPE_DONUT_COLORS = ['#2563EB', '#3F6B83', '#16A34A', '#D97706', '#8B5CF6', '#DC2626', '#0EA5E9', '#F59E0B', '#9333EA', '#78716C']
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    let cum = 0
    let ti = 0
    const stops: string[] = []
    const items: { label: string; n: number; color: string }[] = []
    for (const [key, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      if (n === 0) continue
      const cfg = donutMode === 'type'
        ? { label: key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' '), color: TYPE_DONUT_COLORS[ti++ % TYPE_DONUT_COLORS.length] }
        : (ST[key] || { label: key, color: '#6B7280' })
      const pct = (n / total) * 100
      stops.push(`${cfg.color} ${cum}% ${cum + pct}%`)
      items.push({ label: cfg.label, n, color: cfg.color })
      cum += pct
    }
    return { gradient: `conic-gradient(${stops.join(', ')})`, items, total }
  }, [engins, stats, donutMode])

  /* ── Alerts (real data from backend, fallback to static) ── */
  const alertesDisplay = useMemo(() => {
    if (alertes.length > 0) {
      return alertes.map(a => ({
        niveau: a.niveau,
        titre: a.titre,
        detail: a.detail,
        color: a.couleur,
        pulse: a.pulse,
        enginId: a.enginId,
      }))
    }
    // Fallback statique si aucune alerte du backend
    return [
      { niveau: 'CRITIQUE', titre: 'Pelle CAT 320 — maintenance dépassée', detail: 'Vidange moteur en retard de 12 jours · ENG-2024-042', color: '#DC2626', pulse: true, enginId: undefined as number | undefined },
      { niveau: 'CRITIQUE', titre: 'Compacteur Bomag — panne hydraulique', detail: 'Signalée il y a 2 h · équipement immobilisé', color: '#DC2626', pulse: true, enginId: undefined as number | undefined },
      { niveau: 'HAUTE', titre: 'Grue Liebherr LTM — assurance', detail: 'Expire le 28/08/2026 · document à renouveler', color: '#D97706', pulse: false, enginId: undefined as number | undefined },
      { niveau: 'NORMALE', titre: 'Chargeuse Volvo L60H — contrôle technique', detail: 'Échéance dans 9 jours', color: '#2563EB', pulse: false, enginId: undefined as number | undefined },
    ]
  }, [alertes])

  /* ── Calendar (dynamic from echeances) ── */
  const { semaine, echeancesListe } = useMemo(() => {
    const today = new Date()
    const jours: { jour: string; num: string; border: string; bg: string; numColor: string; dot: string; dateStr: string }[] = []
    const jourNoms = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

    // Build 7 days starting from today
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dateStr = localISO(d) // YYYY-MM-DD
      // Check if any echeance falls on this day
      const dayEcheances = echeances.filter(e => e.date === dateStr)
      const hasCritique = dayEcheances.some(e => e.couleur === '#DC2626')
      const hasWarning = dayEcheances.some(e => e.couleur === '#D97706')
      const hot = hasCritique
      const dotColor = hasCritique ? '#DC2626' : hasWarning ? '#D97706' : dayEcheances.length > 0 ? '#2563EB' : 'transparent'
      jours.push({
        jour: jourNoms[d.getDay()],
        num: String(d.getDate()),
        border: hot ? '#F5D8D8' : '#E8EDF1',
        bg: hot ? '#FEF7F7' : '#fff',
        numColor: hot ? '#DC2626' : '#33465A',
        dot: dotColor,
        dateStr,
      })
    }

    // Build echeances list for display
    const liste = echeances.length > 0
      ? echeances.map(e => {
          const d = new Date(e.date)
          const dateLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
          return { date: dateLabel, texte: e.titre + (e.detail ? ` · ${e.detail}` : ''), color: e.couleur, enginId: e.enginId }
        })
      : [
          { date: '—', texte: 'Aucune echeance dans les 7 prochains jours', color: '#7A8B9A', enginId: undefined as number | undefined },
        ]

    return { semaine: jours, echeancesListe: liste }
  }, [echeances])


  /* ── Planning data (computed from real affectations) ── */
  const PROJET_COLORS = ['#2563EB', '#3F6B83', '#16A34A', '#D97706', '#8B5CF6', '#DC2626', '#0EA5E9', '#F59E0B']
  const planningData = useMemo(() => {
    if (planningAffectations.length === 0) return { weeks: [] as { label: string; start: Date; end: Date }[], rows: [] as { enginNom: string; enginCode: string; bars: { left: string; width: string; color: string; label: string; statut: string; conflict: boolean }[] }[], legende: [] as { label: string; color: string }[], totalAffectations: 0, conflits: [] as { engin: string; detail: string }[] }

    // Determine time range: 8 weeks centered on today
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const thisMonday = new Date(now)
    thisMonday.setDate(now.getDate() + mondayOffset)
    thisMonday.setHours(0, 0, 0, 0)

    // Start 2 weeks before this Monday, show 8 weeks total
    const rangeStart = new Date(thisMonday)
    rangeStart.setDate(rangeStart.getDate() - 14)
    const rangeEnd = new Date(rangeStart)
    rangeEnd.setDate(rangeEnd.getDate() + 8 * 7)
    const totalDays = 8 * 7

    // Build week labels
    const weeks: { label: string; start: Date; end: Date }[] = []
    for (let w = 0; w < 8; w++) {
      const wStart = new Date(rangeStart)
      wStart.setDate(wStart.getDate() + w * 7)
      const wEnd = new Date(wStart)
      wEnd.setDate(wEnd.getDate() + 6)
      // ISO week number
      const jan4 = new Date(wStart.getFullYear(), 0, 4)
      const weekNum = Math.ceil(((wStart.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
      weeks.push({ label: `S${weekNum}`, start: wStart, end: wEnd })
    }

    // Current week index
    const currentWeekIdx = weeks.findIndex(w => thisMonday >= w.start && thisMonday <= w.end)

    // Assign colors per project
    const projets = [...new Set(planningAffectations.map(a => a.projetNom))]
    const projetColorMap: Record<string, string> = {}
    projets.forEach((p, i) => { projetColorMap[p] = PROJET_COLORS[i % PROJET_COLORS.length] })

    // Group by engin
    const enginMap = new Map<number, { nom: string; code: string; affectations: AffectationEnginResponse[] }>()
    planningAffectations.forEach(a => {
      if (!enginMap.has(a.enginId)) enginMap.set(a.enginId, { nom: a.enginNom, code: a.enginCode, affectations: [] })
      enginMap.get(a.enginId)!.affectations.push(a)
    })

    // Build rows + détection de conflits (chevauchements d'affectations actives par engin)
    const conflits: { engin: string; detail: string }[] = []
    const rows = [...enginMap.values()].map(({ nom, code, affectations }) => {
      const actives = affectations.filter(a => a.statut !== 'TERMINEE' && a.statut !== 'ANNULEE')
      const conflictIds = new Set<number>()
      for (let i = 0; i < actives.length; i++) {
        for (let j = i + 1; j < actives.length; j++) {
          const aS = new Date(actives[i].dateDebut).getTime()
          const aE = actives[i].dateFin ? new Date(actives[i].dateFin!).getTime() : Infinity
          const bS = new Date(actives[j].dateDebut).getTime()
          const bE = actives[j].dateFin ? new Date(actives[j].dateFin!).getTime() : Infinity
          if (aS <= bE && bS <= aE) {
            conflictIds.add(actives[i].id); conflictIds.add(actives[j].id)
            conflits.push({ engin: `${nom} (${code})`, detail: `${actives[i].projetNom} ↔ ${actives[j].projetNom}` })
          }
        }
      }
      const bars = affectations.map(a => {
        const start = new Date(a.dateDebut)
        const end = a.dateFin ? new Date(a.dateFin) : rangeEnd
        const clampStart = start < rangeStart ? rangeStart : start
        const clampEnd = end > rangeEnd ? rangeEnd : end
        const leftDays = (clampStart.getTime() - rangeStart.getTime()) / 86400000
        const widthDays = Math.max(1, (clampEnd.getTime() - clampStart.getTime()) / 86400000)
        return {
          left: `${(leftDays / totalDays * 100).toFixed(1)}%`,
          width: `${(widthDays / totalDays * 100).toFixed(1)}%`,
          color: projetColorMap[a.projetNom] || '#6B7280',
          label: a.projetNom,
          statut: a.statut,
          conflict: conflictIds.has(a.id),
        }
      })
      return { enginNom: nom, enginCode: code, bars }
    })

    const legende = projets.map(p => ({ label: p, color: projetColorMap[p] }))

    // Mark current week
    weeks.forEach((w, i) => {
      if (i === currentWeekIdx) {
        (w as Record<string, unknown>).isCurrent = true
      }
    })

    return { weeks, rows, legende, totalAffectations: planningAffectations.length, conflits }
  }, [planningAffectations])

  /* ── Barres compteurs (dynamic or fallback) ── */
  const barres = useMemo(() => {
    if (ficheHeuresMensuelles && ficheHeuresMensuelles.mois.length > 0) {
      const maxVal = Math.max(...ficheHeuresMensuelles.mois.map(m => m.heures), 1)
      return ficheHeuresMensuelles.mois.map(m => ({
        mois: m.label,
        val: m.heures,
        h: Math.round((m.heures / maxVal) * 165) + 'px',
        color: m.heures > maxVal * 0.85 ? '#2563EB' : '#9CBBD3',
      }))
    }
    // Fallback statique
    return ([
      ['Sep', 312], ['Oct', 288], ['Nov', 341], ['Dec', 196], ['Jan', 210], ['Fev', 264],
      ['Mar', 358], ['Avr', 172], ['Mai', 396], ['Juin', 412], ['Juil', 388], ['Aout', 214],
    ] as [string, number][]).map(([mois, val]) => ({
      mois, val, h: Math.round((val / 430) * 165) + 'px',
      color: val > 380 ? '#2563EB' : '#9CBBD3',
    }))
  }, [ficheHeuresMensuelles])

  const releves = useMemo(() => {
    if (ficheReleves.length > 0) {
      return ficheReleves.slice(0, 6).map(r => ({
        date: r.dateReleve,
        val: `${r.valeurHeures} h`,
        source: r.relevePar || 'MANUEL',
      }))
    }
    return [
      { date: '15/08 09:41', val: '4 520 h', source: 'QR SCAN' },
      { date: '14/08 17:12', val: '4 512 h', source: 'QR SCAN' },
      { date: '13/08 08:05', val: '4 503 h', source: 'MANUEL' },
      { date: '12/08 17:40', val: '4 495 h', source: 'QR SCAN' },
    ]
  }, [ficheReleves])

  // Chargement maintenance globale (tableau)
  useEffect(() => {
    if (screen !== 'maintenance' || maintView !== 'tableau') return
    setMaintLoading(true)
    enginApi.getAllMaintenances(0, 100, maintFilterStatut || undefined, maintFilterType || undefined)
      .then(p => setMaintList(p.content))
      .catch(() => setMaintList([]))
      .finally(() => setMaintLoading(false))
  }, [screen, maintView, maintFilterStatut, maintFilterType])

  // Chargement maintenance globale (calendrier)
  useEffect(() => {
    if (screen !== 'maintenance' || maintView !== 'calendrier') return
    const debut = `${maintMonth.getFullYear()}-${String(maintMonth.getMonth() + 1).padStart(2, '0')}-01`
    const finDate = new Date(maintMonth.getFullYear(), maintMonth.getMonth() + 1, 0)
    const fin = `${finDate.getFullYear()}-${String(finDate.getMonth() + 1).padStart(2, '0')}-${String(finDate.getDate()).padStart(2, '0')}`
    setMaintLoading(true)
    enginApi.getMaintenancesCalendrier(debut, fin)
      .then(setMaintCalendrier)
      .catch(() => setMaintCalendrier([]))
      .finally(() => setMaintLoading(false))
  }, [screen, maintView, maintMonth])

  /* ── Nav items ── */
  const nav: [Screen | 'terrain', string][] = [['dashboard', 'Tableau de bord'], ['fiche', 'Fiche équipement'], ['carte', 'Carte'], ['planning', 'Planning'], ['chantiers', 'Par chantier'], ['maintenance', 'Maintenance']]

  /* ── Fiche info groups ── */
  const infoGroupes = useMemo(() => {
    const e = ficheEngin
    if (!e) return [
      { titre: 'Identification', lignes: [{ k: 'Code interne', v: 'ENG-2024-042' }, { k: 'Categorie', v: 'Engin lourd' }, { k: 'Marque / modele', v: 'Caterpillar 320' }, { k: 'N de serie', v: 'CAT0320LKBH04872' }, { k: 'Annee', v: '2023' }] },
      { titre: 'Technique', lignes: [{ k: 'Compteur', v: '—' }, { k: 'Immatriculation', v: '—' }] },
      { titre: 'Propriete & couts', lignes: [{ k: 'Proprietaire', v: '—' }, { k: 'Date acquisition', v: '—' }, { k: 'Valeur acquisition', v: '—' }] },
    ]
    const ETAT_LABELS: Record<string, string> = { NEUF: 'Neuf', BON: 'Bon', CORRECT: 'Correct', USE: 'Usé', MAUVAIS: 'Mauvais', IRREPARABLE: 'Irréparable' }
    const MODE_LABELS: Record<string, string> = { ACHAT: 'Achat', LOCATION_LONGUE_DUREE: 'Location longue durée', LOCATION_COURTE: 'Location courte', CREDIT_BAIL: 'Crédit-bail', PRET: 'Prêt' }
    const CARBURANT_LABELS: Record<string, string> = { DIESEL: 'Diesel', ESSENCE: 'Essence', ELECTRIQUE: 'Électrique', HYBRIDE: 'Hybride', AUCUN: 'Aucun' }
    return [
      { titre: 'Identification', lignes: [
        { k: 'Code interne', v: e.code },
        { k: 'Categorie', v: TYPE_LABEL[e.type] || e.type },
        { k: 'Marque / modele', v: `${e.marque || '—'} ${e.modele || ''}`.trim() },
        { k: 'N de serie', v: e.numeroSerie || '—' },
        { k: 'Immatriculation', v: e.immatriculation || '—' },
        { k: 'Annee', v: e.anneeFabrication ? String(e.anneeFabrication) : '—' },
        { k: 'Statut', v: ST[e.statut]?.label || e.statut },
        ...(e.etat ? [{ k: 'État général', v: ETAT_LABELS[e.etat] || e.etat }] : []),
      ]},
      { titre: 'Technique', lignes: [
        { k: 'Heures compteur', v: `${e.heuresCompteur} h` },
        ...(e.carburant ? [{ k: 'Carburant', v: CARBURANT_LABELS[e.carburant] || e.carburant }] : []),
        ...(e.puissance ? [{ k: 'Puissance', v: e.puissance }] : []),
        ...(e.poids ? [{ k: 'Poids', v: e.poids }] : []),
        ...(e.capacite ? [{ k: 'Capacité', v: e.capacite }] : []),
        ...(e.dateMiseEnService ? [{ k: 'Mise en service', v: e.dateMiseEnService }] : []),
        ...(e.caracteristiques ? [{ k: 'Caractéristiques', v: e.caracteristiques }] : []),
      ]},
      { titre: 'Propriété & coûts', lignes: [
        { k: 'Proprietaire', v: e.proprietaire || 'Interne' },
        ...(e.modeAcquisition ? [{ k: "Mode d'acquisition", v: MODE_LABELS[e.modeAcquisition] || e.modeAcquisition }] : []),
        { k: 'Date acquisition', v: e.dateAcquisition || '—' },
        { k: 'Valeur acquisition', v: e.valeurAcquisition ? `${e.valeurAcquisition} FCFA` : '—' },
        { k: 'Location', v: e.estLocation ? 'Oui' : 'Non' },
        ...(e.coutLocationJournalier ? [{ k: 'Coût location/jour', v: `${e.coutLocationJournalier} FCFA` }] : []),
        { k: 'Actif', v: e.actif ? 'Oui' : 'Non' },
      ]},
      ...(e.notes ? [{ titre: 'Notes', lignes: [{ k: 'Notes internes', v: e.notes }] }] : []),
    ]
  }, [ficheEngin])

  const ficheStats = useMemo(() => {
    const selEngin = selectedEnginId ? engins.find(e => e.id === selectedEnginId) : null
    const chantier = selEngin?.chantierActuel || 'Non affecte'
    const compteur = ficheEngin ? `${ficheEngin.heuresCompteur} h` : '—'
    const prochaineMaint = ficheMaintenances.find(m => m.statut === 'PLANIFIEE')
    const maintLabel = prochaineMaint ? `${prochaineMaint.typeOperation.replace(/_/g, ' ')} — ${prochaineMaint.echeanceDate || 'a planifier'}` : 'Aucune planifiee'
    const maintColor = prochaineMaint ? '#D97706' : '#7A8B9A'
    return [
      { label: 'Chantier actuel', value: chantier, color: '#152230' },
      { label: 'Conducteur', value: '—', color: '#152230' },
      { label: 'Compteur', value: compteur, color: '#152230' },
      { label: 'Prochaine maintenance', value: maintLabel, color: maintColor },
    ]
  }, [selectedEnginId, engins, ficheEngin, ficheMaintenances])

  /* ── Current tab table/timeline ── */
  const tbl = useMemo(() => {
    // For tabs with real data, build dynamic tables; fall back to static TABLES
    if (ficheTab === 'affectations' && ficheAffectations.length > 0) {
      return {
        titre: 'Historique des affectations', action: '+ Nouvelle affectation',
        cols: '1.3fr 1fr .8fr .7fr .7fr 1fr', head: ['Chantier', 'Periode', 'Statut', 'Heures prevues', 'Heures reelles', 'Actions'],
        rows: ficheAffectations.map(a => [
          cell(a.projetNom, { weight: 600 }),
          cell(`${a.dateDebut}${a.dateFin ? ' → ' + a.dateFin : ' → en cours'}`),
          badge(a.statut, a.statut === 'EN_COURS' ? '#3F6B83' : a.statut === 'TERMINEE' ? '#6B7280' : '#2563EB', a.statut === 'EN_COURS' ? '#E8F0F5' : a.statut === 'TERMINEE' ? '#EFF1F3' : '#E7EEFD'),
          cell(a.heuresPrevues ? `${a.heuresPrevues} h` : '—'),
          cell(`${a.heuresReelles} h`),
          cell(a.statut === 'TERMINEE' || a.statut === 'ANNULEE' ? `__AFF_DELETE__${a.id}` : `__AFF_ACTIONS__${a.id}`),
        ]),
      }
    }
    if (ficheTab === 'maintenance' && ficheMaintenances.length > 0) {
      return {
        titre: 'Operations et plans de maintenance', action: '+ Planifier une operation',
        cols: '1.6fr .8fr .9fr 1fr .8fr', head: ['Operation', 'Type', 'Statut', 'Echeance', 'Cout'],
        rows: ficheMaintenances.map(m => [
          cell(m.description || m.typeOperation.replace(/_/g, ' '), { weight: 600 }),
          badge(m.typeOperation.replace(/_/g, ' '), '#2563EB', '#E7EEFD'),
          badge(m.statut, m.statut === 'TERMINEE' ? '#16A34A' : m.statut === 'PLANIFIEE' ? '#D97706' : '#3F6B83', m.statut === 'TERMINEE' ? '#E7F6EC' : m.statut === 'PLANIFIEE' ? '#FDF2E3' : '#E8F0F5'),
          cell(m.echeanceDate || (m.echeanceHeures ? `a ${m.echeanceHeures} h` : '—')),
          cell(m.coutReel ? `${m.coutReel} FCFA` : (m.coutEstime ? `~${m.coutEstime} FCFA` : '—')),
        ]),
      }
    }
    if (ficheTab === 'incidents' && ficheIncidents.length > 0) {
      return {
        titre: 'Incidents signales', action: '+ Signaler un incident',
        cols: '1.4fr .8fr .8fr 1fr .7fr .7fr', head: ['Incident', 'Type', 'Gravité', 'Signalé le', 'Statut', 'Actions'],
        rows: ficheIncidents.map(inc => [
          cell(inc.description || inc.typeIncident.replace(/_/g, ' '), { weight: 600 }),
          cell(inc.typeIncident.replace(/_/g, ' ')),
          badge(inc.gravite, inc.gravite === 'CRITIQUE' ? '#DC2626' : inc.gravite === 'MAJEURE' ? '#D97706' : '#6B7280', inc.gravite === 'CRITIQUE' ? '#FDECEC' : inc.gravite === 'MAJEURE' ? '#FDF2E3' : '#EFF1F3'),
          cell(`${inc.dateIncident}${inc.signalePar ? ' · ' + inc.signalePar : ''}`),
          badge(inc.resolu ? 'RÉSOLU' : 'OUVERT', inc.resolu ? '#16A34A' : '#DC2626', inc.resolu ? '#E7F6EC' : '#FDECEC'),
          // Action column: will be replaced by a button via _incidentId marker
          cell(inc.resolu ? '—' : `__MAINT_CORRECTIVE__${inc.id}`),
        ]),
      }
    }
    if (ficheTab === 'documents' && ficheDocuments.length > 0) {
      return {
        titre: 'Documents et conformite', action: '+ Ajouter un document',
        cols: '1.4fr .9fr .8fr .9fr .6fr', head: ['Document', 'Type', 'Expiration', 'Commentaire', 'Actions'],
        rows: ficheDocuments.map(d => [
          cell(d.nom, { weight: 600 }),
          cell(d.typeDocument.replace(/_/g, ' ')),
          cell(d.dateExpiration || '—'),
          cell(d.commentaire || '—'),
          cell(`__DOC_ACTIONS__${d.id}`),
        ]),
      }
    }
    if (ficheTab === 'plans' && fichePlans.length > 0) {
      return {
        titre: 'Plans de maintenance récurrents', action: '+ Nouveau plan',
        cols: '1.3fr .7fr .7fr .8fr .7fr .7fr', head: ['Plan', 'Type', 'Intervalle', 'Prochaine échéance', 'Statut', 'Actions'],
        rows: fichePlans.map(p => [
          cell(p.titre, { weight: 600 }),
          badge(p.typeOperation.replace(/_/g, ' '), '#2563EB', '#E7EEFD'),
          cell(p.intervalleJours ? `${p.intervalleJours} j` : p.intervalleHeures ? `${p.intervalleHeures} h` : p.intervalleKm ? `${p.intervalleKm} km` : '—'),
          cell(p.prochaineEcheance || (p.prochainCompteur ? `${p.prochainCompteur} h` : '—')),
          badge(
            p.echeanceDateDepassee || p.echeanceCompteurDepassee ? 'DÉPASSÉE' : p.actif ? 'ACTIF' : 'INACTIF',
            p.echeanceDateDepassee || p.echeanceCompteurDepassee ? '#DC2626' : p.actif ? '#16A34A' : '#6B7280',
            p.echeanceDateDepassee || p.echeanceCompteurDepassee ? '#FDECEC' : p.actif ? '#E7F6EC' : '#EFF1F3',
          ),
          cell(p.actif ? `__EXEC_PLAN__${p.id}` : '—'),
        ]),
      }
    }
    if (ficheTab === 'transferts') {
      const mvtStyle: Record<string, [string, string, string]> = {
        EN_ATTENTE_DEPART: ['EN ATTENTE DÉPART', '#D97706', '#FDF2E3'],
        EN_TRANSIT: ['EN TRANSIT', '#2563EB', '#E7EEFD'],
        RECU: ['REÇU', '#16A34A', '#E7F6EC'],
        ANNULE: ['ANNULÉ', '#6B7280', '#EFF1F3'],
      }
      return {
        titre: 'Transferts inter-chantiers', action: '+ Nouveau transfert',
        cols: '1fr 1fr .9fr 1fr 1.1fr', head: ['Origine', 'Destination', 'Statut', 'Demandé le', 'Actions'],
        rows: ficheMouvements.length === 0
          ? [[cell('Aucun transfert pour cet engin'), cell('—'), cell('—'), cell('—'), cell('—')]]
          : ficheMouvements.map(m => {
              const [lbl, c, bg] = mvtStyle[m.statut] || [m.statut, '#6B7280', '#EFF1F3']
              return [
                cell(m.projetOrigineNom || 'Dépôt', { weight: 600 }),
                cell(m.projetDestinationNom, { weight: 600 }),
                badge(lbl, c, bg),
                cell(new Date(m.dateDemande).toLocaleDateString('fr-FR')),
                cell(m.statut === 'EN_ATTENTE_DEPART' ? `__MVT_DEPART__${m.id}` : m.statut === 'EN_TRANSIT' ? `__MVT_RECEPTION__${m.id}` : '—'),
              ]
            }),
      }
    }
    if (ficheTab === 'positions' && fichePositions.length > 0) {
      const srcStyle: Record<string, [string, string]> = {
        QR_SCAN: ['#2563EB', '#E7EEFD'],
        GPS_AUTO: ['#3F6B83', '#E8F0F5'],
        MANUEL: ['#6B7280', '#EFF1F3'],
        CHANTIER: ['#16A34A', '#E7F6EC'],
      }
      return {
        titre: 'Historique des positions', action: 'Voir sur la carte',
        cols: '1fr 1.4fr 1fr .9fr .8fr', head: ['Horodatage', 'Coordonnées', 'Chantier', 'Source', 'Précision'],
        rows: fichePositions.map(p => {
          const [c, bg] = srcStyle[p.source] || ['#6B7280', '#EFF1F3']
          const d = new Date(p.horodatage)
          return [
            cell(d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), { weight: 600 }),
            cell(`${p.latitude.toFixed(4)} · ${p.longitude.toFixed(4)}`),
            cell(p.chantierNom || '—'),
            badge(p.source.replace(/_/g, ' '), c, bg),
            cell(p.precisionMetres != null ? `± ${p.precisionMetres} m` : '—'),
          ]
        }),
      }
    }
    if (ficheTab === 'positions' && fichePositions.length === 0) {
      return {
        titre: 'Historique des positions', action: 'Voir sur la carte',
        cols: '1fr', head: [''],
        rows: [[cell('Aucune position historisée pour cet engin')]],
      }
    }
    if (ficheTab === 'inspections' && ficheInspections.length > 0) {
      return {
        titre: 'Inspections quotidiennes', action: '+ Nouvelle inspection',
        cols: '.9fr 1fr .8fr 1.2fr 1.4fr', head: ['Date', 'Inspecteur', 'Compteur', 'Résultat', 'Anomalies'],
        rows: ficheInspections.map(i => {
          const nok = i.checklist.filter(it => !it.ok)
          return [
            cell(i.dateInspection, { weight: 600 }),
            cell(i.inspectePar || '—'),
            cell(i.compteurHeures != null ? `${i.compteurHeures} h` : '—'),
            i.anomaliesDetectees
              ? badge(`${nok.length || 1} ANOMALIE${nok.length > 1 ? 'S' : ''}`, '#D97706', '#FDF2E3')
              : badge('CONFORME', '#16A34A', '#E7F6EC'),
            cell(nok.length > 0
              ? nok.map(it => it.label).join(' · ') + (i.incidentCreeId ? ` (incident #${i.incidentCreeId})` : '')
              : (i.commentaire || '—')),
          ]
        }),
      }
    }
    if (ficheTab === 'inspections' && ficheInspections.length === 0) {
      return {
        titre: 'Inspections quotidiennes', action: '+ Nouvelle inspection',
        cols: '1fr', head: [''],
        rows: [[cell('Aucune inspection enregistrée pour cet engin')]],
      }
    }
    if (ficheTab === 'couts' && ficheCouts) {
      const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
      const typeStyle: Record<string, [string, string]> = {
        MAINTENANCE: ['#2563EB', '#E7EEFD'],
        CARBURANT: ['#D97706', '#FDF2E3'],
        LOCATION: ['#7C3AED', '#F1EAFE'],
        ACQUISITION: ['#3F6B83', '#E8F0F5'],
      }
      const rows = ficheCouts.lignes.map(l => {
        const [c, bg] = typeStyle[l.type] || ['#6B7280', '#EFF1F3']
        return [
          badge(l.type, c, bg),
          cell(l.description),
          cell(l.date || '—'),
          cell(`${fmt(l.montant)} FCFA`, { weight: 700 }),
        ]
      })
      if (ficheCouts.valeurAcquisition != null) {
        rows.push([
          badge('ACQUISITION', '#3F6B83', '#E8F0F5'),
          cell("Valeur d'acquisition de l'engin"),
          cell(ficheEngin?.dateAcquisition || '—'),
          cell(`${fmt(ficheCouts.valeurAcquisition)} FCFA`, { weight: 700 }),
        ])
      }
      if (rows.length === 0) rows.push([cell('—'), cell('Aucun coût enregistré pour cet engin'), cell('—'), cell('—')])
      return {
        titre: `Journal des coûts · TCO : ${fmt(ficheCouts.tco)} FCFA (maintenance ${fmt(ficheCouts.totalMaintenance)} · carburant ${fmt(ficheCouts.totalCarburant)}${ficheCouts.totalLocation > 0 ? ` · location ${fmt(ficheCouts.totalLocation)}` : ''})`,
        action: 'Exporter le journal',
        cols: '1fr 1.6fr .9fr .9fr', head: ['Type', 'Description', 'Date', 'Montant'],
        rows,
      }
    }
    if (ficheTab === 'plans' && fichePlans.length === 0) {
      return {
        titre: 'Plans de maintenance récurrents', action: '+ Nouveau plan',
        cols: '1fr', head: [''],
        rows: [[cell('Aucun plan de maintenance configuré pour cet engin')]],
      }
    }
    return TABLES[ficheTab]
  }, [ficheTab, ficheAffectations, ficheMaintenances, ficheIncidents, ficheDocuments, fichePlans, ficheCouts, ficheEngin, ficheInspections, fichePositions, ficheMouvements])

  const tl = useMemo(() => {
    if (ficheTab !== 'carnet') return undefined
    if (ficheCarnet && ficheCarnet.entries.length > 0) {
      return {
        titre: 'Carnet de bord numerique',
        sous: 'Consolidation chronologique de toutes les operations',
        items: ficheCarnet.entries.map(e => {
          const colorMap: Record<string, string> = { MAINTENANCE: '#F59E0B', INCIDENT: '#DC2626', RELEVE_COMPTEUR: '#6366F1', CARBURANT: '#8B5CF6', MOUVEMENT: '#2563EB' }
          const bgMap: Record<string, string> = { MAINTENANCE: '#FDF2E3', INCIDENT: '#FDECEC', RELEVE_COMPTEUR: '#F1EAFE', CARBURANT: '#F1EAFE', MOUVEMENT: '#E7EEFD' }
          return {
            date: new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
            titre: e.titre,
            detail: e.detail || '',
            tag: e.type,
            color: colorMap[e.type] || e.couleur,
            bg: bgMap[e.type] || '#EFF1F3',
          }
        }),
      }
    }
    return TIMELINE
  }, [ficheTab, ficheCarnet])

  /* ── Export PDF du carnet de bord consolidé ── */
  const handleExportCarnet = () => {
    if (!ficheEngin) return
    const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const fmt = (n: number) => n.toLocaleString('fr-FR')
    const stLabel = ST[ficheEngin.statut]?.label || ficheEngin.statut
    const entries = ficheCarnet?.entries || []
    const rows = entries.map(e => `<tr>
      <td>${esc(new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}</td>
      <td><span class="tag" style="color:${esc(e.couleur)};border-color:${esc(e.couleur)}">${esc(e.type)}</span></td>
      <td><strong>${esc(e.titre)}</strong>${e.detail ? `<br><span class="detail">${esc(e.detail)}</span>` : ''}</td>
    </tr>`).join('')
    const maintRows = ficheMaintenances.slice(0, 30).map(m => `<tr>
      <td>${esc(m.echeanceDate || m.dateRealisation || '—')}</td><td>${esc(m.typeOperation)}</td><td>${esc(m.statut)}</td>
      <td>${m.coutReel != null ? fmt(m.coutReel) + ' FCFA' : m.coutEstime != null ? fmt(m.coutEstime) + ' FCFA (est.)' : '—'}</td>
    </tr>`).join('')
    const incRows = ficheIncidents.slice(0, 30).map(inc => `<tr>
      <td>${esc(inc.dateIncident)}</td><td>${esc(inc.typeIncident.replace(/_/g, ' '))}</td><td>${esc(inc.gravite)}</td>
      <td>${inc.resolu ? `Résolu${inc.dateResolution ? ` le ${esc(inc.dateResolution)}` : ''}` : '<strong style="color:#DC2626">Non résolu</strong>'}</td>
      <td>${esc(inc.description || '—')}</td>
    </tr>`).join('')
    const couts = ficheCouts && ficheCouts.tco > 0
      ? `<div class="section">Synthèse des coûts</div>
         <table><tr><th>Maintenance</th><th>Carburant</th><th>Location</th><th>TCO</th></tr>
         <tr><td>${fmt(ficheCouts.totalMaintenance)} FCFA</td><td>${fmt(ficheCouts.totalCarburant)} FCFA</td><td>${fmt(ficheCouts.totalLocation)} FCFA</td><td><strong>${fmt(ficheCouts.tco)} FCFA</strong></td></tr></table>`
      : ''
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Carnet de bord — ${esc(ficheEngin.code)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #152230; margin: 32px; font-size: 12px; }
  h1 { font-size: 22px; margin: 0; } .sub { color: #5B6C7C; margin: 4px 0 18px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #EE6C2B; padding-bottom: 12px; margin-bottom: 18px; }
  .brand { font-size: 15px; font-weight: 700; color: #EE6C2B; }
  .infos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 20px; margin-bottom: 20px; }
  .infos div span { display: block; } .infos .k { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #7A8B9A; }
  .infos .v { font-weight: 700; font-size: 13px; }
  .section { font-size: 14px; font-weight: 700; border-bottom: 1px solid #DFE5EB; padding-bottom: 5px; margin: 22px 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #7A8B9A; padding: 6px 8px; background: #F7F9FA; border-bottom: 1px solid #DFE5EB; }
  td { padding: 6px 8px; border-bottom: 1px solid #F1F4F7; vertical-align: top; }
  .tag { font-size: 9px; font-weight: 700; border: 1px solid; border-radius: 3px; padding: 1px 5px; }
  .detail { color: #5B6C7C; } .foot { margin-top: 26px; font-size: 10px; color: #93A2AF; text-align: center; }
  @media print { body { margin: 12mm; } }
</style></head><body>
<div class="head">
  <div><h1>Carnet de bord — ${esc(ficheEngin.nom)}</h1><div class="sub">${esc(ficheEngin.code)} · Édité le ${new Date().toLocaleDateString('fr-FR')}</div></div>
  <div class="brand">MIKA Services<br><span style="font-weight:400;color:#5B6C7C;font-size:11px">Engins &amp; Matériel</span></div>
</div>
<div class="infos">
  <div><span class="k">Type</span><span class="v">${esc(ficheEngin.type)}</span></div>
  <div><span class="k">Statut</span><span class="v">${esc(stLabel)}</span></div>
  <div><span class="k">Compteur</span><span class="v">${fmt(ficheEngin.heuresCompteur)} h</span></div>
  <div><span class="k">Événements</span><span class="v">${entries.length}</span></div>
</div>
${couts}
<div class="section">Historique des maintenances (${ficheMaintenances.length})</div>
<table><tr><th>Date</th><th>Type</th><th>Statut</th><th>Coût</th></tr>${maintRows || '<tr><td colspan="4">Aucune maintenance</td></tr>'}</table>
<div class="section">Incidents (${ficheIncidents.length})</div>
<table><tr><th>Date</th><th>Type</th><th>Gravité</th><th>Résolution</th><th>Description</th></tr>${incRows || '<tr><td colspan="5">Aucun incident</td></tr>'}</table>
<div class="section">Journal chronologique (${entries.length} événements)</div>
<table><tr><th style="width:110px">Date</th><th style="width:110px">Catégorie</th><th>Événement</th></tr>${rows || '<tr><td colspan="3">Aucun événement enregistré</td></tr>'}</table>
<div class="foot">Document généré automatiquement par la plateforme MIKA Services — carnet de bord numérique de l'équipement ${esc(ficheEngin.code)}</div>
<script>window.onload = function(){ window.print() }</script>
</body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) { toast({ message: 'Autorisez les popups pour exporter le carnet', variant: 'error' }); return }
    w.document.write(html)
    w.document.close()
  }

  if (loading) {
    return (
      <div style={{ fontFamily: "Barlow, system-ui, sans-serif", background: '#EEF1F4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #DFE5EB', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div className="mk-root" style={{ fontFamily: "Barlow, system-ui, sans-serif", background: '#EEF1F4', minHeight: '100vh', color: '#152230', WebkitFontSmoothing: 'antialiased' }}>

      {/* ═══════ NAV BAR ═══════ */}
      <nav className="mk-nav" role="navigation" aria-label="Navigation module materiel" style={{ display: 'flex', alignItems: 'stretch', gap: 0, padding: '0 28px', background: '#fff', borderBottom: '1px solid #DFE5EB' }}>
        {nav.map(([id, label]) => (
          <button key={id} onClick={() => go(id as Screen)} aria-current={screen === id ? 'page' : undefined} style={{
            appearance: 'none' as const, background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: screen === id ? 700 : 600,
            letterSpacing: '.02em', padding: '14px 18px 12px',
            color: screen === id ? '#152230' : '#7A8B9A',
            borderBottom: `3px solid ${screen === id ? '#2563EB' : 'transparent'}`,
          }}>
            {label}
          </button>
        ))}
      </nav>

      {/* ═══════════════════════════════════════════════
           TABLEAU DE BORD
         ═══════════════════════════════════════════════ */}
      {screen === 'dashboard' && (
        <div className="mk-content" style={{ padding: "24px 28px 40px" }}>
          {/* Header */}
          {/* Header — Planning design */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 20 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 23, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--db-t1)' }}>Parc Engins &amp; Matériel</h1>
              <div style={{ fontSize: 12, color: 'var(--db-t2)', marginTop: 5 }}>{kpis[0].value} équipements · {kpis[2].value} en service · {alertesDisplay.length} alerte{alertesDisplay.length !== 1 ? 's' : ''} active{alertesDisplay.length !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => enginApi.exportCsv().catch(() => toast({ message: 'Erreur lors de l\'export', variant: 'error' }))} style={{ height: 38, padding: '0 16px', border: '1.5px solid var(--db-border-str)', borderRadius: 'var(--db-radius-sm)', background: 'var(--db-card)', color: 'var(--db-t1)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Exporter
              </button>
              <button onClick={() => go('carte')} style={{ height: 38, padding: '0 16px', border: '1.5px solid var(--db-border-str)', borderRadius: 'var(--db-radius-sm)', background: 'var(--db-card)', color: 'var(--db-t1)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Carte du parc</button>
              <button onClick={() => setShowCreateModal(true)} style={{ height: 38, padding: '0 16px', border: 0, borderRadius: 'var(--db-radius-sm)', background: 'var(--db-orange)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
                Nouvel équipement
              </button>
            </div>
          </div>

          {/* Alert bar */}
          {alertesDisplay.filter(a => a.niveau === 'CRITIQUE').length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--db-danger-bg2)', border: '1px solid var(--db-danger)', borderRadius: 'var(--db-radius)', padding: '12px 16px' }}>
              <span style={{ width: 9, height: 9, minWidth: 9, borderRadius: '50%', background: 'var(--db-danger)', animation: 'mk-pulse 1.8s ease-in-out infinite' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--db-danger)' }}>
                {alertesDisplay.filter(a => a.niveau === 'CRITIQUE').length} alerte{alertesDisplay.filter(a => a.niveau === 'CRITIQUE').length > 1 ? 's' : ''} critique{alertesDisplay.filter(a => a.niveau === 'CRITIQUE').length > 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: 12, color: 'var(--db-t2)' }}>Action requise — maintenance dépassée ou panne bloquante.</span>
            </div>
          )}

          {/* KPIs */}
          <div className="mk-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
            {kpis.map((k, i) => {
              const isHot = k.label === 'En panne' && Number(k.value) > 0
              return (
                <div key={i} style={{
                  background: isHot ? 'var(--db-danger-bg2)' : 'var(--db-card)',
                  border: `1px solid ${isHot ? 'var(--db-danger)' : 'var(--db-border)'}`,
                  borderRadius: 'var(--db-radius)',
                  padding: '14px 16px',
                  cursor: 'default',
                  boxShadow: isHot ? '0 2px 10px rgba(200,85,61,.14)' : undefined,
                  transition: 'transform .18s ease, box-shadow .18s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: k.color, animation: isHot ? 'mk-pulse 1.8s ease-in-out infinite' : undefined }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase' as const, color: 'var(--db-t2)' }}>{k.label}</span>
                  </div>
                  <div style={{ fontSize: isHot ? 32 : 29, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', color: isHot ? 'var(--db-danger)' : 'var(--db-t1)', margin: '10px 0 6px' }}>
                    {k.value}<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--db-t3)', marginLeft: 4 }}>{k.unit}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--db-t3)' }}>{k.delta}</div>
                </div>
              )
            })}
          </div>

          <div className="mk-dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Equipment table */}
              <div className="mk-table-scroll" style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #E8EDF1' }}>
                  <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600 }}>Équipements</div>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(0) }} style={{ height: 32, padding: '0 10px', borderRadius: 'var(--db-radius-xs)', border: `1px solid ${filterType ? 'var(--db-orange)' : 'var(--db-border)'}`, background: filterType ? 'var(--db-orange)' : 'var(--db-card)', color: filterType ? '#fff' : 'var(--db-t2)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                      <option value="">Catégorie</option>
                      {Object.entries(TYPE_LABEL).filter(([, v], i, arr) => arr.findIndex(([, v2]) => v2 === v) === i).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <select value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setCurrentPage(0) }} style={{ height: 32, padding: '0 10px', borderRadius: 'var(--db-radius-xs)', border: `1px solid ${filterStatut ? 'var(--db-orange)' : 'var(--db-border)'}`, background: filterStatut ? 'var(--db-orange)' : 'var(--db-card)', color: filterStatut ? '#fff' : 'var(--db-t2)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                      <option value="">Statut</option>
                      {Object.entries(ST).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <select value={filterChantier} onChange={e => { setFilterChantier(e.target.value); setCurrentPage(0) }} style={{ height: 32, padding: '0 10px', borderRadius: 'var(--db-radius-xs)', border: `1px solid ${filterChantier ? 'var(--db-orange)' : 'var(--db-border)'}`, background: filterChantier ? 'var(--db-orange)' : 'var(--db-card)', color: filterChantier ? '#fff' : 'var(--db-t2)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', maxWidth: 180 }}>
                      <option value="">Chantier</option>
                      {projetOptions.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                    </select>
                    {(filterType || filterStatut || filterChantier || sortField) && (
                      <button onClick={() => { setFilterType(''); setFilterStatut(''); setFilterChantier(''); setSortField(''); setCurrentPage(0) }} style={{ height: 32, padding: '0 10px', border: '1px solid var(--db-border)', borderRadius: 'var(--db-radius-xs)', background: 'var(--db-card)', color: 'var(--db-t2)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Réinitialiser</button>
                    )}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: 10, color: '#A9B7C3', fontSize: 14, pointerEvents: 'none' }}>⌕</span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(0) }}
                        placeholder="Rechercher un equipement"
                        style={{ fontSize: 13, padding: '7px 12px 7px 28px', border: '1px solid #DDE4EA', borderRadius: 6, color: '#33465A', background: '#FBFCFD', minWidth: 200, fontFamily: 'Barlow,sans-serif', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '56px 2.1fr 1.1fr 1fr 1.3fr 1fr 1fr 40px', gap: 12, padding: '10px 16px', background: '#F7F9FA', borderBottom: '1px solid #E8EDF1', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#7A8B9A' }}>
                  <div></div>
                  {([['code', 'Code · Désignation'], ['type', 'Catégorie'], ['statut', 'Statut']] as const).map(([field, label]) => (
                    <div key={field} onClick={() => { if (sortField === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') } else { setSortField(field); setSortDir('asc') } setCurrentPage(0) }}
                      style={{ cursor: 'pointer', userSelect: 'none' as const, color: sortField === field ? '#2563EB' : '#7A8B9A' }} title="Trier">
                      {label}{sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </div>
                  ))}
                  <div>Chantier actuel</div><div>Conducteur</div>
                  <div onClick={() => { if (sortField === 'heuresCompteur') { setSortDir(d => d === 'asc' ? 'desc' : 'asc') } else { setSortField('heuresCompteur'); setSortDir('desc') } setCurrentPage(0) }}
                    style={{ cursor: 'pointer', userSelect: 'none' as const, color: sortField === 'heuresCompteur' ? '#2563EB' : '#7A8B9A' }} title="Trier">
                    Dernier relevé{sortField === 'heuresCompteur' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </div>
                  <div></div>
                </div>

                {/* Table rows */}
                {equipements.map((e, i) => (
                  <div key={i} onClick={() => goFiche((e as any).id)} style={{ display: 'grid', gridTemplateColumns: '56px 2.1fr 1.1fr 1fr 1.3fr 1fr 1fr 40px', gap: 12, alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #EFF3F6', cursor: 'pointer' }}>
                    {enginThumbs[(e as any).id] ? (
                      <img src={enginThumbs[(e as any).id]} alt="" style={{ width: 44, height: 36, borderRadius: 5, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 44, height: 36, borderRadius: 5, background: e.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '.06em' }}>{e.abbr}</div>
                    )}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{e.designation}</div>
                      <div style={{ fontSize: 12, color: '#7A8B9A', fontFamily: "'Barlow Semi Condensed',sans-serif", letterSpacing: '.05em' }}>{e.code} · {e.marque}</div>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#4A5C6D' }}>{e.categorie}</div>
                    <div><span style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 600, letterSpacing: '.04em', padding: '4px 9px', borderRadius: 4, color: e.statutColor, background: e.statutBg }}>{e.statut}</span></div>
                    <div style={{ fontSize: 13, color: '#33465A' }}>{e.chantier}</div>
                    <div style={{ fontSize: 13, color: '#33465A' }}>{e.conducteur}</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 600, color: '#33465A' }}>{e.releve}</div>
                    <div style={{ textAlign: 'right' as const, color: '#B6C2CC', fontSize: 16 }}>›</div>
                  </div>
                ))}

                {/* Empty state */}
                {equipements.length === 0 && !loading && (
                  <div style={{ padding: '48px 20px', textAlign: 'center' as const }}>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C1CBD4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block' }}>
                      <rect x="2" y="7" width="14" height="10" rx="1" /><path d="M16 10h3l3 4v3h-6" /><circle cx="7" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
                    </svg>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#33465A' }}>Aucun équipement trouvé</div>
                    <div style={{ fontSize: 13, color: '#7A8B9A', marginTop: 4 }}>
                      {(filterType || filterStatut || filterChantier || searchQuery) ? 'Modifiez ou réinitialisez les filtres pour élargir la recherche.' : 'Ajoutez votre premier équipement avec le bouton « + Nouvel équipement ».'}
                    </div>
                  </div>
                )}

                {/* Pagination */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', fontSize: 12.5, color: '#7A8B9A' }}>
                  <span>{equipements.length} sur {totalElements || kpis[0].value} equipements</span>
                  <div style={{ flex: 1 }} />
                  {totalPages > 1 && (
                    <>
                      <button onClick={() => loadEngins(Math.max(0, currentPage - 1))} disabled={currentPage === 0} style={{ appearance: 'none' as const, border: '1px solid #DDE4EA', borderRadius: 5, background: '#fff', padding: '5px 10px', cursor: currentPage > 0 ? 'pointer' : 'default', color: currentPage > 0 ? '#33465A' : '#C1CBD4', fontFamily: 'Barlow,sans-serif', fontSize: 12.5 }}>‹</button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5))
                        const pageNum = start + i
                        if (pageNum >= totalPages) return null
                        return (
                          <button key={pageNum} onClick={() => loadEngins(pageNum)} style={{ appearance: 'none' as const, border: '1px solid #DDE4EA', borderRadius: 5, background: pageNum === currentPage ? '#2563EB' : '#fff', color: pageNum === currentPage ? '#fff' : '#33465A', padding: '5px 10px', cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 12.5, fontWeight: pageNum === currentPage ? 700 : 500 }}>{pageNum + 1}</button>
                        )
                      })}
                      <button onClick={() => loadEngins(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1} style={{ appearance: 'none' as const, border: '1px solid #DDE4EA', borderRadius: 5, background: '#fff', padding: '5px 10px', cursor: currentPage < totalPages - 1 ? 'pointer' : 'default', color: currentPage < totalPages - 1 ? '#33465A' : '#C1CBD4', fontFamily: 'Barlow,sans-serif', fontSize: 12.5 }}>›</button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Alertes */}
              <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 15px', borderBottom: '1px solid #E8EDF1' }}>
                  <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 16, fontWeight: 600 }}>Alertes actives</div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: alertesDisplay.length > 0 ? '#DC2626' : '#7A8B9A', color: '#fff', borderRadius: 9, padding: '2px 7px' }}>{alertesDisplay.length}</span>
                </div>
                {alertesDisplay.length === 0 && (
                  <div style={{ padding: '20px 15px', fontSize: 13, color: '#7A8B9A', textAlign: 'center' }}>Aucune alerte active</div>
                )}
                {alertesDisplay.map((a, i) => (
                  <div key={i} onClick={() => a.enginId && goFiche(a.enginId)} style={{ display: 'flex', gap: 10, padding: '12px 15px', borderBottom: '1px solid #F1F4F7', cursor: a.enginId ? 'pointer' : 'default' }}>
                    <div style={{ width: 4, borderRadius: 2, background: a.color, flex: 'none', animation: a.pulse ? 'mk-pulse 1.8s ease-in-out infinite' : 'none' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', color: a.color }}>{a.niveau}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{a.titre}</div>
                      <div style={{ fontSize: 12.5, color: '#7A8B9A', marginTop: 1 }}>{a.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Donut */}
              <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 16, fontWeight: 600, flex: 1 }}>Répartition du parc</div>
                  <div style={{ display: 'flex', border: '1px solid #DFE5EB', borderRadius: 6, overflow: 'hidden' }}>
                    {(['statut', 'type'] as const).map(m => (
                      <button key={m} onClick={() => setDonutMode(m)} style={{
                        appearance: 'none' as const, cursor: 'pointer', border: 'none', fontFamily: 'Barlow,sans-serif',
                        fontSize: 11.5, fontWeight: 700, padding: '4px 9px',
                        background: donutMode === m ? '#2563EB' : '#fff', color: donutMode === m ? '#fff' : '#7A8B9A',
                      }}>{m === 'statut' ? 'Statut' : 'Type'}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ width: 118, height: 118, borderRadius: '50%', flex: 'none', background: donut.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 74, height: 74, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{donut.total}</div>
                      <div style={{ fontSize: 10, letterSpacing: '.08em', color: '#7A8B9A', textTransform: 'uppercase' as const }}>Parc</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                    {donut.items.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: r.color }} />
                        <span style={{ flex: 1, color: '#4A5C6D' }}>{r.label}</span>
                        <span style={{ fontWeight: 700, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15 }}>{r.n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: 15 }}>
                <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Échéances · 7 prochains jours</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 12 }}>
                  {semaine.map((j, i) => (
                    <div key={i} style={{ textAlign: 'center' as const, border: `1px solid ${j.border}`, background: j.bg, borderRadius: 6, padding: '7px 0' }}>
                      <div style={{ fontSize: 10, letterSpacing: '.06em', color: '#7A8B9A', textTransform: 'uppercase' as const }}>{j.jour}</div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, color: j.numColor }}>{j.num}</div>
                      <div style={{ height: 5, width: 5, borderRadius: '50%', margin: '2px auto 0', background: j.dot }} />
                    </div>
                  ))}
                </div>
                {echeancesListe.map((ec, i) => (
                  <div key={i} onClick={() => ec.enginId && goFiche(ec.enginId)} style={{ display: 'flex', gap: 9, alignItems: 'baseline', padding: '6px 0', borderTop: '1px solid #F1F4F7', cursor: ec.enginId ? 'pointer' : 'default' }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, color: ec.color, minWidth: 38 }}>{ec.date}</span>
                    <span style={{ fontSize: 12.5, color: '#4A5C6D' }}>{ec.texte}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
           FICHE ÉQUIPEMENT
         ═══════════════════════════════════════════════ */}
      {screen === 'fiche' && (
        <div className="mk-content" style={{ padding: "24px 28px 40px" }}>
          {ficheLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 13, color: '#7A8B9A' }}>
              <div style={{ width: 16, height: 16, border: '2px solid #DFE5EB', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Chargement des donnees...
            </div>
          )}
          {/* Breadcrumb */}
          <div style={{ fontSize: 13, color: '#7A8B9A', marginBottom: 14 }}>
            Parc <span style={{ color: '#C1CBD4' }}>/</span> Engins lourds <span style={{ color: '#C1CBD4' }}>/</span> <span style={{ color: '#33465A', fontWeight: 600 }}>{selectedEnginId ? engins.find(e => e.id === selectedEnginId)?.code ?? 'ENG-2024-042' : 'ENG-2024-042'}</span>
          </div>

          {/* Fiche card */}
          <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, overflow: 'hidden' }}>
            {/* Header with photo */}
            <div style={{ display: 'flex', gap: 24, padding: '20px 22px' }}>
              <div
                style={{ width: 230, height: 160, borderRadius: 7, flex: 'none', background: '#3F6B83', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => photoInputRef.current?.click()}
                title="Cliquer pour changer la photo"
              >
                {enginPhotoUrl ? (
                  <img src={enginPhotoUrl} alt={ficheEngin?.nom || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CFE0EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '.1em', color: '#CFE0EA', textTransform: 'uppercase' as const }}>
                      Ajouter une photo
                    </span>
                  </div>
                )}
                {/* Hover overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                {/* Upload spinner */}
                {photoUploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                )}
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} disabled={photoUploading} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h1 style={{ margin: 0, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 700 }}>{ficheEngin?.nom || 'Pelle hydraulique 20T'}</h1>
                  {(() => { const s = ST[ficheEngin?.statut || 'EN_SERVICE'] || ST.EN_SERVICE; return <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.05em', padding: '5px 11px', borderRadius: 5, color: s.color, background: s.bg }}>{s.label.toUpperCase()}</span> })()}
                </div>
                <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 15, letterSpacing: '.06em', color: '#7A8B9A', marginTop: 2 }}>{ficheEngin?.code || 'ENG-2024-042'} · {ficheEngin?.marque || 'Caterpillar'} {ficheEngin?.modele || '320'} · {TYPE_LABEL[ficheEngin?.type || 'PELLETEUSE'] || 'Engin'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 18 }}>
                  {ficheStats.map((s, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.09em', textTransform: 'uppercase' as const, color: '#7A8B9A' }}>{s.label}</div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 3, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 190 }}>
                <button onClick={() => setShowEditModal(true)} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: 700, padding: 10, borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff' }}>Modifier</button>
                <button onClick={() => setShowAffectationModal(true)} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: 600, padding: 10, borderRadius: 6, border: '1px solid #B8D4C6', background: '#F0FAF4', color: '#16A34A' }}>Affecter à un chantier</button>
                <button onClick={() => setShowMaintenanceModal(true)} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: 600, padding: 10, borderRadius: 6, border: '1px solid #C9D3DC', background: '#fff', color: '#33465A' }}>Planifier maintenance</button>
                <button onClick={() => setShowIncidentModal(true)} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: 600, padding: 10, borderRadius: 6, border: '1px solid #F0B7B7', background: '#FEF3F3', color: '#DC2626' }}>Signaler un incident</button>
                <button onClick={handleDeleteEngin} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: 600, padding: 10, borderRadius: 6, border: '1px solid #F0B7B7', background: '#fff', color: '#DC2626' }}>Supprimer</button>
                <button onClick={() => setShowQrModal(true)} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 13, fontWeight: 600, padding: 10, borderRadius: 6, border: '1px solid #C9D3DC', background: '#FBFCFD', color: '#5B6C7C', marginTop: 4 }}>QR Code</button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, padding: '0 22px', borderTop: '1px solid #E8EDF1', background: '#FAFBFC', overflowX: 'auto' }}>
              {TABS_FICHE.map(([id, label]) => (
                <button key={id} onClick={() => setFicheTab(id)} style={{
                  appearance: 'none' as const, background: 'none', border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap' as const, fontFamily: 'Barlow,sans-serif', fontSize: 13.5, fontWeight: ficheTab === id ? 700 : 600,
                  padding: '13px 14px 11px', color: ficheTab === id ? '#152230' : '#7A8B9A',
                  borderBottom: `3px solid ${ficheTab === id ? '#2563EB' : 'transparent'}`,
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ marginTop: 18 }}>
            {/* INFOS */}
            {ficheTab === 'infos' && (
              <div className="mk-fiche-info" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
                {infoGroupes.map((g, gi) => (
                  <div key={gi} style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: '16px 18px' }}>
                    <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 16, fontWeight: 600, paddingBottom: 10, borderBottom: '1px solid #EFF3F6' }}>{g.titre}</div>
                    {g.lignes.map((l, li) => (
                      <div key={li} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: '1px solid #F5F7F9' }}>
                        <span style={{ fontSize: 12.5, color: '#7A8B9A', flex: 1 }}>{l.k}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right' as const }}>{l.v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* COMPTEURS */}
            {ficheTab === 'compteurs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowReleveModal(true)} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 13.5, fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff' }}>+ Nouveau relevé</button>
                  <button onClick={() => setShowConsommationModal(true)} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 13.5, fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: '1px solid #D97706', background: '#FDF2E3', color: '#D97706' }}>+ Ravitaillement</button>
                </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
                <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
                    <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600 }}>Heures moteur · 12 derniers mois</div>
                    <div style={{ flex: 1 }} />
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, fontWeight: 700 }}>{ficheEngin ? `${ficheEngin.heuresCompteur} h` : '4 520 h'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 190, borderBottom: '1px solid #E8EDF1', paddingBottom: 0 }}>
                    {barres.map((b, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, justifyContent: 'flex-end', height: '100%' }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, fontWeight: 600, color: '#7A8B9A' }}>{b.val}</span>
                        <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: b.color, height: b.h }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    {barres.map((b, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center' as const, fontSize: 11, color: '#93A2AF' }}>{b.mois}</div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: 18 }}>
                    <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Consommation carburant</div>
                    {ficheConsos.length > 0 ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>{ficheConsos[0].quantiteLitres}</span>
                          <span style={{ fontSize: 14, color: '#7A8B9A' }}>L · dernier plein ({ficheConsos[0].datePlein})</span>
                        </div>
                        <div style={{ marginTop: 14, fontSize: 13, color: '#7A8B9A' }}>{ficheConsos.length} plein(s) enregistre(s)</div>
                        {(() => {
                          // Conso anormale : L/h entre pleins consécutifs (ficheConsos trié du plus récent au plus ancien)
                          const rates: number[] = []
                          for (let i = 0; i < ficheConsos.length - 1; i++) {
                            const cur = ficheConsos[i], prev = ficheConsos[i + 1]
                            if (cur.heuresCompteurAuPlein != null && prev.heuresCompteurAuPlein != null) {
                              const dh = cur.heuresCompteurAuPlein - prev.heuresCompteurAuPlein
                              if (dh > 0) rates.push(cur.quantiteLitres / dh)
                            }
                          }
                          if (rates.length === 0) return null
                          const dernier = rates[0]
                          const anciens = rates.slice(1)
                          const moyenne = anciens.length > 0 ? anciens.reduce((s, r) => s + r, 0) / anciens.length : null
                          const surconsommation = moyenne != null && dernier > moyenne * 1.15
                          return (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F1F4F7' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700 }}>{dernier.toFixed(1)} L/h</span>
                                <span style={{ fontSize: 12, color: '#7A8B9A' }}>dernier plein{moyenne != null ? ` · moy. ${moyenne.toFixed(1)} L/h` : ''}</span>
                                {surconsommation && (
                                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', padding: '3px 8px', borderRadius: 4, background: '#FDF2E3', color: '#D97706', border: '1px solid #F0D9B5' }}>
                                    SURCONSOMMATION +{Math.round((dernier / (moyenne as number) - 1) * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>—</span>
                          <span style={{ fontSize: 14, color: '#7A8B9A' }}>Aucune donnee</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: 18 }}>
                    <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Derniers relevés</div>
                    {releves.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: '1px solid #F1F4F7' }}>
                        <span style={{ fontSize: 12.5, color: '#7A8B9A', width: 74 }}>{r.date}</span>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, fontWeight: 700, flex: 1 }}>{r.val}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.05em', padding: '3px 8px', borderRadius: 4, background: '#EEF2F6', color: '#5B6C7C' }}>{r.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Évolution conso + jauge utilisation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
                <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: 18 }}>
                  <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Évolution consommation · derniers pleins</div>
                  {(() => {
                    const data = [...ficheConsos].reverse().slice(-12)
                    if (data.length < 2) return <div style={{ fontSize: 13, color: '#7A8B9A', padding: '30px 0', textAlign: 'center' as const }}>Au moins 2 pleins nécessaires pour tracer la courbe</div>
                    const W = 600, H = 170, PAD = 28
                    const maxL = Math.max(...data.map(d => d.quantiteLitres), 1)
                    const pts = data.map((d, i) => ({
                      x: PAD + (i * (W - 2 * PAD)) / (data.length - 1),
                      y: H - PAD - ((d.quantiteLitres / maxL) * (H - 2 * PAD)),
                      d,
                    }))
                    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                    const area = `${path} L${pts[pts.length - 1].x.toFixed(1)},${H - PAD} L${pts[0].x.toFixed(1)},${H - PAD} Z`
                    const fmtD = (s: string) => { const d = new Date(s); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` }
                    return (
                      <svg viewBox={`0 0 ${W} ${H + 18}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                        {[0.25, 0.5, 0.75, 1].map(f => (
                          <line key={f} x1={PAD} x2={W - PAD} y1={H - PAD - f * (H - 2 * PAD)} y2={H - PAD - f * (H - 2 * PAD)} stroke="#EFF3F6" strokeWidth={1} />
                        ))}
                        <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="#E8EDF1" strokeWidth={1.5} />
                        <path d={area} fill="#FDF2E3" opacity={0.7} />
                        <path d={path} fill="none" stroke="#D97706" strokeWidth={2.5} strokeLinejoin="round" />
                        {pts.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r={4} fill="#fff" stroke="#D97706" strokeWidth={2.5} />
                            <text x={p.x} y={p.y - 10} textAnchor="middle" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, fill: '#33465A' }}>{p.d.quantiteLitres}</text>
                            <text x={p.x} y={H + 10} textAnchor="middle" style={{ fontFamily: 'Barlow,sans-serif', fontSize: 11, fill: '#93A2AF' }}>{fmtD(p.d.datePlein)}</text>
                          </g>
                        ))}
                      </svg>
                    )
                  })()}
                </div>
                <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: 18 }}>
                  <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Taux d'utilisation</div>
                  {(() => {
                    const dernier = ficheHeuresMensuelles && ficheHeuresMensuelles.mois.length > 0
                      ? ficheHeuresMensuelles.mois[ficheHeuresMensuelles.mois.length - 1] : null
                    const CAPACITE = 220 // heures théoriques / mois (26 j × 8,5 h)
                    const pct = dernier ? Math.min(dernier.heures / CAPACITE, 1) : 0
                    const R = 70, HALF = Math.PI * R
                    const color = pct >= 0.6 ? '#16A34A' : pct >= 0.3 ? '#D97706' : '#DC2626'
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: 180, height: 104 }}>
                          <svg width={180} height={104} viewBox="0 0 180 104">
                            <path d={`M 20 94 A ${R} ${R} 0 0 1 160 94`} fill="none" stroke="#EFF3F6" strokeWidth={16} strokeLinecap="round" />
                            <path d={`M 20 94 A ${R} ${R} 0 0 1 160 94`} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round"
                              strokeDasharray={`${pct * HALF} ${HALF}`} />
                          </svg>
                          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 4, textAlign: 'center' as const }}>
                            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 34, fontWeight: 700, color }}>{Math.round(pct * 100)}%</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 12.5, color: '#7A8B9A', marginTop: 6, textAlign: 'center' as const }}>
                          {dernier ? `${dernier.heures} h en ${dernier.label} · capacité théorique ${CAPACITE} h/mois` : 'Aucune heure moteur enregistrée ce mois'}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
              </div>
            )}

            {/* TIMELINE (carnet) */}
            {tl && (
              <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{tl.titre}</div>
                    <div style={{ fontSize: 13, color: '#7A8B9A', marginBottom: 18 }}>{tl.sous}</div>
                  </div>
                  <button onClick={handleExportCarnet} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 13.5, fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', whiteSpace: 'nowrap' as const }}>Exporter PDF</button>
                </div>
                {tl.items.map((t, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '96px 24px 1fr', gap: 0, alignItems: 'stretch' }}>
                    <div style={{ textAlign: 'right' as const, padding: '0 14px 22px 0', fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 13.5, color: '#7A8B9A', letterSpacing: '.03em' }}>{t.date}</div>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: i < tl.items.length - 1 ? '#E8EDF1' : 'transparent' }} />
                      <div style={{ position: 'relative', width: 11, height: 11, borderRadius: '50%', marginTop: 4, background: t.color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${t.color}` }} />
                    </div>
                    <div style={{ padding: '0 0 22px 16px' }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{t.titre}</div>
                      <div style={{ fontSize: 13, color: '#5B6C7C', marginTop: 2 }}>{t.detail}</div>
                      <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 600, letterSpacing: '.05em', padding: '3px 8px', borderRadius: 4, color: t.color, background: t.bg }}>{t.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COUTS — donut répartition */}
            {ficheTab === 'couts' && ficheCouts && ficheCouts.tco > 0 && (() => {
              const fmt = (n: number) => n.toLocaleString('fr-FR')
              const parts = [
                { label: 'Maintenance', val: ficheCouts.totalMaintenance, color: '#2563EB' },
                { label: 'Carburant', val: ficheCouts.totalCarburant, color: '#D97706' },
                { label: 'Location', val: ficheCouts.totalLocation, color: '#9333EA' },
              ].filter(p => p.val > 0)
              const total = parts.reduce((s, p) => s + p.val, 0)
              const R = 62, C = 2 * Math.PI * R
              let acc = 0
              return (
                <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: '18px 22px', marginBottom: 18, display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' as const }}>
                  <div style={{ position: 'relative', width: 160, height: 160 }}>
                    <svg width={160} height={160} viewBox="0 0 160 160">
                      <circle cx={80} cy={80} r={R} fill="none" stroke="#EFF3F6" strokeWidth={20} />
                      {parts.map((p, i) => {
                        const frac = p.val / total
                        const dash = frac * C
                        const offset = -acc * C
                        acc += frac
                        return <circle key={i} cx={80} cy={80} r={R} fill="none" stroke={p.color} strokeWidth={20}
                          strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={offset}
                          transform="rotate(-90 80 80)" />
                      })}
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', color: '#7A8B9A' }}>TCO</span>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 21, fontWeight: 700, lineHeight: 1.1 }}>{fmt(ficheCouts.tco)}</span>
                      <span style={{ fontSize: 10.5, color: '#7A8B9A' }}>FCFA</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Répartition des coûts</div>
                    {parts.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #F1F4F7' }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
                        <span style={{ fontSize: 13, color: '#5B6C7C', flex: 1 }}>{p.label}</span>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700 }}>{fmt(p.val)} FCFA</span>
                        <span style={{ fontSize: 12, color: '#7A8B9A', width: 44, textAlign: 'right' as const }}>{Math.round((p.val / total) * 100)}%</span>
                      </div>
                    ))}
                    {ficheCouts.valeurAcquisition != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #F1F4F7' }}>
                        <span style={{ fontSize: 13, color: '#7A8B9A', flex: 1 }}>Valeur d'acquisition</span>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700 }}>{fmt(ficheCouts.valeurAcquisition)} FCFA</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* GENERIC TABLE tabs */}
            {tbl && (
              <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 18px', borderBottom: '1px solid #E8EDF1' }}>
                  <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600 }}>{tbl.titre}</div>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => {
                    if (ficheTab === 'maintenance') setShowMaintenanceModal(true)
                    else if (ficheTab === 'incidents') setShowIncidentModal(true)
                    else if (ficheTab === 'documents') setShowDocumentModal(true)
                    else if (ficheTab === 'affectations') setShowAffectationModal(true)
                    else if (ficheTab === 'plans') setShowPlanMaintenanceModal(true)
                    else if (ficheTab === 'inspections') setShowInspectionModal(true)
                    else if (ficheTab === 'transferts') setShowTransfertModal(true)
                    else if (ficheTab === 'carte' || ficheTab === 'positions') go('carte')
                  }} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 13.5, fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff' }}>{tbl.action}</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: tbl.cols, gap: 14, padding: '10px 18px', background: '#F7F9FA', borderBottom: '1px solid #E8EDF1', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#7A8B9A' }}>
                  {tbl.head.map((h, i) => <div key={i}>{h}</div>)}
                </div>
                {tbl.rows.map((row, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: tbl.cols, gap: 14, alignItems: 'center', padding: '13px 18px', borderBottom: '1px solid #F1F4F7' }}>
                    {row.map((c, ci) => {
                      // Action buttons for documents: "Modifier" + "Supprimer"
                      if (c.text.startsWith('__DOC_ACTIONS__')) {
                        const docId = Number(c.text.replace('__DOC_ACTIONS__', ''))
                        return (
                          <div key={ci} style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => {
                                const doc = ficheDocuments.find(d => d.id === docId)
                                if (doc) setEditingDocument(doc)
                              }}
                              style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 5, border: '1px solid #C9D3DC', background: '#fff', color: '#2563EB' }}
                            >
                              Modifier
                            </button>
                            <button
                              onClick={async () => {
                                if (!selectedEnginId) return
                                const ok = await confirm({ message: 'Supprimer définitivement ce document ?', variant: 'danger' })
                                if (!ok) return
                                try {
                                  await enginApi.deleteDocument(selectedEnginId, docId)
                                  toast({ message: 'Document supprimé', variant: 'success' })
                                  const docs = await enginApi.getDocuments(selectedEnginId, 0, 50).then(p => p.content).catch(() => [])
                                  setFicheDocuments(docs)
                                } catch (err: unknown) {
                                  const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                                  toast({ message: msg || 'Erreur lors de la suppression', variant: 'error' })
                                }
                              }}
                              style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 5, border: '1px solid #F3C1C1', background: '#fff', color: '#DC2626' }}
                            >
                              Supprimer
                            </button>
                          </div>
                        )
                      }
                      // Action buttons for incidents: "Créer maintenance corrective"
                      if (c.text.startsWith('__MAINT_CORRECTIVE__')) {
                        const incId = Number(c.text.replace('__MAINT_CORRECTIVE__', ''))
                        return (
                          <div key={ci}>
                            <button
                              onClick={async () => {
                                if (!selectedEnginId) return
                                try {
                                  await enginApi.creerMaintenanceCorrective(selectedEnginId, incId)
                                  toast({ message: 'Maintenance corrective créée', variant: 'success' })
                                  // Refresh fiche data
                                  const [maint, inc] = await Promise.all([
                                    enginApi.getMaintenances(selectedEnginId, 0, 50).then(p => p.content),
                                    enginApi.getIncidents(selectedEnginId, 0, 50).then(p => p.content),
                                  ])
                                  setFicheMaintenances(maint)
                                  setFicheIncidents(inc)
                                } catch { toast({ message: 'Erreur lors de la création', variant: 'error' }) }
                              }}
                              style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 5, border: '1px solid #D97706', background: '#FDF2E3', color: '#D97706', whiteSpace: 'nowrap' as const }}
                            >
                              Maint. corrective
                            </button>
                          </div>
                        )
                      }
                      // Action buttons for affectations: "Terminer" + "Supprimer"
                      if (c.text.startsWith('__AFF_ACTIONS__') || c.text.startsWith('__AFF_DELETE__')) {
                        const isActive = c.text.startsWith('__AFF_ACTIONS__')
                        const affId = Number(c.text.replace('__AFF_ACTIONS__', '').replace('__AFF_DELETE__', ''))
                        const refreshAffectations = async () => {
                          if (!selectedEnginId) return
                          const aff = await enginApi.getAffectationsByEngin(selectedEnginId).catch(() => [])
                          setFicheAffectations(aff)
                        }
                        return (
                          <div key={ci} style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => {
                                const aff = ficheAffectations.find(a => a.id === affId)
                                if (aff) setEditingAffectation(aff)
                              }}
                              style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 5, border: '1px solid #C9D3DC', background: '#fff', color: '#2563EB' }}
                            >
                              Modifier
                            </button>
                            {isActive && (
                              <button
                                onClick={async () => {
                                  const ok = await confirm({ message: 'Terminer cette affectation et libérer l\'engin ?' })
                                  if (!ok) return
                                  try {
                                    await enginApi.terminerAffectation(affId)
                                    toast({ message: 'Affectation terminée — engin libéré', variant: 'success' })
                                    await refreshAffectations()
                                  } catch (err: unknown) {
                                    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                                    toast({ message: msg || 'Erreur lors de la clôture', variant: 'error' })
                                  }
                                }}
                                style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 5, border: '1px solid #C9D3DC', background: '#fff', color: '#16A34A' }}
                              >
                                Terminer
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                const ok = await confirm({ message: 'Supprimer définitivement cette affectation ?', variant: 'danger' })
                                if (!ok) return
                                try {
                                  await enginApi.deleteAffectation(affId)
                                  toast({ message: 'Affectation supprimée', variant: 'success' })
                                  await refreshAffectations()
                                } catch {
                                  toast({ message: 'Erreur lors de la suppression', variant: 'error' })
                                }
                              }}
                              style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 5, border: '1px solid #F0B7B7', background: '#fff', color: '#DC2626' }}
                            >
                              Suppr.
                            </button>
                          </div>
                        )
                      }
                      // Action buttons for transferts: confirmer départ / réception / annuler
                      if (c.text.startsWith('__MVT_DEPART__') || c.text.startsWith('__MVT_RECEPTION__')) {
                        const isDepart = c.text.startsWith('__MVT_DEPART__')
                        const mvtId = Number(c.text.replace('__MVT_DEPART__', '').replace('__MVT_RECEPTION__', ''))
                        const refreshMouvements = async () => {
                          if (!selectedEnginId) return
                          const mvts = await enginApi.getMouvements(selectedEnginId).catch(() => [])
                          setFicheMouvements(mvts)
                        }
                        return (
                          <div key={ci} style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={async () => {
                                const ok = await confirm({ message: isDepart ? 'Confirmer le départ de l\'engin ?' : 'Confirmer la réception de l\'engin sur le chantier ?' })
                                if (!ok) return
                                try {
                                  if (isDepart) await mouvementEnginApi.confirmerDepart(mvtId)
                                  else await mouvementEnginApi.confirmerReception(mvtId)
                                  toast({ message: isDepart ? 'Départ confirmé — engin en transit' : 'Réception confirmée', variant: 'success' })
                                  await refreshMouvements()
                                } catch (err: unknown) {
                                  const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                                  toast({ message: msg || 'Erreur lors de la confirmation', variant: 'error' })
                                }
                              }}
                              style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 5, border: '1px solid #C9D3DC', background: '#fff', color: isDepart ? '#2563EB' : '#16A34A', whiteSpace: 'nowrap' as const }}
                            >
                              {isDepart ? 'Confirmer départ' : 'Confirmer réception'}
                            </button>
                            {isDepart && (
                              <button
                                onClick={async () => {
                                  const ok = await confirm({ message: 'Annuler ce transfert ?', variant: 'danger' })
                                  if (!ok) return
                                  try {
                                    await mouvementEnginApi.annuler(mvtId)
                                    toast({ message: 'Transfert annulé', variant: 'success' })
                                    await refreshMouvements()
                                  } catch (err: unknown) {
                                    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                                    toast({ message: msg || 'Erreur lors de l\'annulation', variant: 'error' })
                                  }
                                }}
                                style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 5, border: '1px solid #F0B7B7', background: '#fff', color: '#DC2626' }}
                              >
                                Annuler
                              </button>
                            )}
                          </div>
                        )
                      }
                      // Action buttons for plans: "Exécuter"
                      if (c.text.startsWith('__EXEC_PLAN__')) {
                        const planId = Number(c.text.replace('__EXEC_PLAN__', ''))
                        return (
                          <div key={ci}>
                            <button
                              onClick={async () => {
                                if (!selectedEnginId) return
                                try {
                                  await enginApi.executerPlanMaintenance(selectedEnginId, planId)
                                  toast({ message: 'Plan exécuté — maintenance créée', variant: 'success' })
                                  const [maint, plans] = await Promise.all([
                                    enginApi.getMaintenances(selectedEnginId, 0, 50).then(p => p.content),
                                    enginApi.getPlansMaintenance(selectedEnginId),
                                  ])
                                  setFicheMaintenances(maint)
                                  setFichePlans(plans)
                                } catch { toast({ message: 'Erreur lors de l\'exécution', variant: 'error' }) }
                              }}
                              style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 5, border: '1px solid #16A34A', background: '#E7F6EC', color: '#16A34A', whiteSpace: 'nowrap' as const }}
                            >
                              Exécuter
                            </button>
                          </div>
                        )
                      }
                      return (
                        <div key={ci} style={{ fontSize: c.size, fontWeight: c.weight, color: c.color }}>
                          <span style={{ display: 'inline-block', padding: c.pad, borderRadius: 4, background: c.bg, fontSize: c.size }}>{c.text}</span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
           CARTE
         ═══════════════════════════════════════════════ */}
      {screen === 'carte' && (() => {
        const q = carteSearch.trim().toLowerCase()
        const filtered = cartePositions.filter(p =>
          (!carteFilterStatut || p.statut === carteFilterStatut) &&
          (!q || p.nom.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.chantierNom || '').toLowerCase().includes(q))
        )
        const countByStatut: Record<string, number> = {}
        cartePositions.forEach(p => { countByStatut[p.statut] = (countByStatut[p.statut] || 0) + 1 })
        const sansPosition = Math.max(0, engins.length - cartePositions.length)
        const now = Date.now()
        const relTime = (iso?: string) => {
          if (!iso) return null
          const diff = now - new Date(iso).getTime()
          const min = Math.floor(diff / 60000)
          if (min < 1) return "à l'instant"
          if (min < 60) return `il y a ${min} min`
          const h = Math.floor(min / 60)
          if (h < 24) return `il y a ${h} h`
          return `il y a ${Math.floor(h / 24)} j`
        }
        const isObsolete = (iso?: string) => !!iso && (now - new Date(iso).getTime()) > 24 * 3600 * 1000
        return (
        <div className="mk-carte-grid" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', height: 'calc(100vh - 113px)', overflow: 'hidden' }}>
          {/* Sidebar — scroll interne indépendant de la carte */}
          <div style={{ background: '#fff', borderRight: '1px solid #DFE5EB', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #E8EDF1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 700, flex: 1 }}>Carte du parc</div>
                <button
                  onClick={loadCarte}
                  title="Rafraîchir les positions"
                  style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 5, border: '1px solid #C9D4DD', background: '#fff', color: '#3F6B83' }}
                >
                  ↻ Actualiser
                </button>
              </div>
              <div style={{ fontSize: 12.5, color: '#7A8B9A', marginTop: 2 }}>{cartePositions.length} équipements géolocalisés sur {engins.length || '—'}</div>
              <input
                type="text"
                value={carteSearch}
                onChange={e => setCarteSearch(e.target.value)}
                placeholder="Rechercher (nom, code, chantier)…"
                style={{ marginTop: 10, width: '100%', boxSizing: 'border-box' as const, fontFamily: 'Barlow,sans-serif', fontSize: 13, padding: '7px 10px', borderRadius: 6, border: '1px solid #C9D4DD', outline: 'none' }}
              />
              {/* Légende / compteurs cliquables */}
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginTop: 9 }}>
                {Object.entries(ST).filter(([k]) => countByStatut[k]).map(([k, cfg]) => {
                  const active = carteFilterStatut === k
                  return (
                    <button
                      key={k}
                      onClick={() => setCarteFilterStatut(active ? '' : k)}
                      style={{ appearance: 'none' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Barlow,sans-serif', fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 12, border: active ? `1.5px solid ${cfg.color}` : '1px solid #E1E7ED', background: active ? cfg.bg : '#fff', color: active ? cfg.color : '#5B6C7C' }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
                      {cfg.label} · {countByStatut[k]}
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ overflow: 'auto', flex: 1 }}>
              {filtered.map(pos => {
                const stCfg = ST[pos.statut] || ST.HORS_SERVICE
                const rel = relTime(pos.horodatage)
                const obsolete = isObsolete(pos.horodatage)
                return (
                  <div
                    key={pos.id}
                    ref={el => { if (el && pos.id === carteSelectedId) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }}
                    onClick={() => setCarteSelectedId(pos.id)}
                    style={{ display: 'flex', gap: 11, padding: '12px 18px', borderBottom: '1px solid #F1F4F7', cursor: 'pointer', background: pos.id === carteSelectedId ? '#F0F5FF' : '#fff' }}
                  >
                    <div style={{ width: 9, height: 9, borderRadius: '50%', marginTop: 5, flex: 'none', background: stCfg.color }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, flex: 1, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{pos.nom}</div>
                        <button
                          onClick={e => { e.stopPropagation(); goFiche(pos.id) }}
                          title="Ouvrir la fiche"
                          style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, border: '1px solid #C9D4DD', background: '#fff', color: '#3F6B83', flex: 'none' }}
                        >
                          Fiche
                        </button>
                      </div>
                      <div style={{ fontSize: 12, color: '#7A8B9A', marginTop: 1 }}>{pos.chantierNom || '—'} · {pos.code}</div>
                      {(rel || obsolete) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          {rel && <span style={{ fontSize: 11, color: '#94A3B2' }}>{rel}</span>}
                          {obsolete && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#FDF2E3', color: '#D97706' }}>Position obsolète</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {filtered.length === 0 && cartePositions.length > 0 && (
                <div style={{ padding: '20px 18px', fontSize: 13, color: '#7A8B9A', textAlign: 'center' }}>
                  Aucun engin ne correspond aux filtres.
                </div>
              )}
              {cartePositions.length === 0 && (
                <div style={{ padding: '20px 18px', fontSize: 13, color: '#7A8B9A', textAlign: 'center' }}>
                  Aucun engin avec position GPS.<br/>Affectez des engins a des chantiers avec coordonnees.
                </div>
              )}
            </div>
            {sansPosition > 0 && (
              <div style={{ padding: '9px 18px', borderTop: '1px solid #E8EDF1', fontSize: 12, color: '#7A8B9A', background: '#FAFBFC' }}>
                {sansPosition} engin{sansPosition > 1 ? 's' : ''} sans position connue
              </div>
            )}
          </div>

          {/* Carte Leaflet — suivi temps réel */}
          <LeafletCarteEngins
            positions={filtered}
            selectedId={carteSelectedId}
            onSelect={setCarteSelectedId}
            onOpenFiche={(id) => goFiche(id)}
            lastUpdate={carteLastUpdate}
          />
        </div>
        )
      })()}

      {/* ═══════════════════════════════════════════════
           PLANNING
         ═══════════════════════════════════════════════ */}
      {screen === 'planning' && (
        <div className="mk-content" style={{ padding: "24px 28px 40px" }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 18 }}>
            <div>
              <h1 style={{ margin: 0, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 700 }}>Planning des affectations</h1>
              <div style={{ fontSize: 14, color: '#5B6C7C', marginTop: 3 }}>
                {planningData.weeks.length > 0
                  ? `${planningData.weeks[0].label} à ${planningData.weeks[planningData.weeks.length - 1].label} — ${planningData.totalAffectations} affectation${planningData.totalAffectations > 1 ? 's' : ''} · ${planningData.rows.length} engin${planningData.rows.length > 1 ? 's' : ''}`
                  : 'Aucune affectation active'}
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: '#5B6C7C', alignItems: 'center', flexWrap: 'wrap' }}>
              {planningData.legende.map((gl, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 14, height: 10, borderRadius: 3, background: gl.color }} />{gl.label}
                </span>
              ))}
            </div>
          </div>

          {planningLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#7A8B9A', fontSize: 14 }}>Chargement du planning...</div>
          ) : planningData.rows.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#152230' }}>Aucune affectation active</div>
              <div style={{ fontSize: 13.5, color: '#7A8B9A', marginTop: 8 }}>Les affectations d'engins aux projets apparaîtront ici sous forme de diagramme de Gantt.</div>
            </div>
          ) : (
            <>
            {planningData.conflits.length > 0 && (
              <div style={{ background: '#FDECEC', border: '1px solid #F0B7B7', borderRadius: 8, padding: '12px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>⚠ {planningData.conflits.length} conflit{planningData.conflits.length > 1 ? 's' : ''} d'affectation détecté{planningData.conflits.length > 1 ? 's' : ''}</div>
                {planningData.conflits.map((c, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: '#7F1D1D', padding: '2px 0' }}>
                    <span style={{ fontWeight: 600 }}>{c.engin}</span> — affecté simultanément : {c.detail}
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, overflow: 'hidden' }}>
              {/* Header */}
              <div className="mk-planning-row" style={{ display: 'grid', gridTemplateColumns: '230px 1fr', borderBottom: '1px solid #E8EDF1', background: '#F7F9FA' }}>
                <div style={{ padding: '11px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#7A8B9A' }}>Équipement</div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${planningData.weeks.length},1fr)` }}>
                  {planningData.weeks.map((w, i) => {
                    const isCurrent = (w as Record<string, unknown>).isCurrent === true
                    return (
                      <div key={i} style={{ padding: '11px 0', textAlign: 'center' as const, fontSize: 11.5, fontWeight: 600, color: isCurrent ? '#152230' : '#7A8B9A', borderLeft: '1px solid #E8EDF1', background: isCurrent ? '#EEF3FF' : 'transparent' }}>{w.label}</div>
                    )
                  })}
                </div>
              </div>
              {/* Rows */}
              {planningData.rows.map((row, ri) => (
                <div key={ri} className="mk-planning-row" style={{ display: 'grid', gridTemplateColumns: '230px 1fr', borderBottom: '1px solid #F1F4F7' }}>
                  <div style={{ padding: '11px 16px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{row.enginNom}</div>
                    <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 11.5, letterSpacing: '.05em', color: '#7A8B9A' }}>{row.enginCode}</div>
                  </div>
                  <div style={{ position: 'relative', minHeight: 52, background: `repeating-linear-gradient(90deg,transparent 0 calc(${100 / planningData.weeks.length}% - 1px),#EFF3F6 calc(${100 / planningData.weeks.length}% - 1px),#EFF3F6 ${100 / planningData.weeks.length}%)` }}>
                    {row.bars.map((bar, bi) => (
                      <div key={bi} title={`${bar.label} (${bar.statut})`} style={{ position: 'absolute', top: 11, height: 30, borderRadius: 5, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' as const, overflow: 'hidden', left: bar.left, width: bar.width, background: bar.color, border: bar.conflict ? '2px solid #DC2626' : bar.statut === 'SUSPENDUE' ? '2px dashed #94A9BC' : 'none', boxShadow: bar.conflict ? '0 0 0 2px #FDECEC' : 'none', opacity: bar.statut === 'SUSPENDUE' ? 0.7 : 1 }}>{bar.conflict ? '⚠ ' : ''}{bar.label}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
           VUE PAR CHANTIER
           ═══════════════════════════════════════════════ */}
      {screen === 'chantiers' && (() => {
        const parChantier = new Map<number, { nom: string; affs: AffectationEnginResponse[] }>()
        for (const a of planningAffectations) {
          const entry = parChantier.get(a.projetId) || { nom: a.projetNom, affs: [] }
          entry.affs.push(a)
          parChantier.set(a.projetId, entry)
        }
        const q = chantierSearch.trim().toLowerCase()
        // Filtre statut appliqué aux affectations de chaque carte
        const chantiersAll = [...parChantier.entries()]
          .map(([id, ch]) => ({ id, nom: ch.nom, affs: chantierFilterStatut ? ch.affs.filter(a => a.statut === chantierFilterStatut) : ch.affs }))
          .filter(ch => ch.affs.length > 0)
          .filter(ch => !q || ch.nom.toLowerCase().includes(q) || ch.affs.some(a => a.enginNom.toLowerCase().includes(q) || a.enginCode.toLowerCase().includes(q)))
          .sort((a, b) => chantierSort === 'nom' ? a.nom.localeCompare(b.nom, 'fr') : b.affs.length - a.affs.length)
        const CH_PAGE_SIZE = 6
        const chTotalPages = Math.max(1, Math.ceil(chantiersAll.length / CH_PAGE_SIZE))
        const chPage = Math.min(chantierPage, chTotalPages - 1)
        const chantiers = chantiersAll.slice(chPage * CH_PAGE_SIZE, (chPage + 1) * CH_PAGE_SIZE)
        const stAff: Record<string, [string, string, string]> = {
          PLANIFIEE: ['Planifiée', '#2563EB', '#E7EEFD'],
          EN_COURS: ['En cours', '#3F6B83', '#E8F0F5'],
          SUSPENDUE: ['Suspendue', '#D97706', '#FDF2E3'],
        }
        const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
        const totalEnginsAffectes = new Set(planningAffectations.map(a => a.enginId)).size
        const nEnCoursTotal = planningAffectations.filter(a => a.statut === 'EN_COURS').length
        const nPlanifTotal = planningAffectations.filter(a => a.statut === 'PLANIFIEE').length
        const ROWS_VISIBLE = 5
        const selectCls = { height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #DDE4EA', background: '#fff', color: '#5B6C7C', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Barlow,sans-serif' }
        return (
          <div className="mk-content" style={{ padding: "24px 28px 40px" }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
              <div>
                <h1 style={{ margin: 0, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 700 }}>Équipements par chantier</h1>
                <div style={{ fontSize: 14, color: '#5B6C7C', marginTop: 3 }}>
                  {parChantier.size > 0
                    ? `${parChantier.size} chantier${parChantier.size > 1 ? 's' : ''} · ${totalEnginsAffectes} engin${totalEnginsAffectes > 1 ? 's' : ''} mobilisé${totalEnginsAffectes > 1 ? 's' : ''} · ${nEnCoursTotal} affectation${nEnCoursTotal > 1 ? 's' : ''} en cours · ${nPlanifTotal} planifiée${nPlanifTotal > 1 ? 's' : ''}`
                    : 'Aucune affectation active'}
                </div>
              </div>
            </div>

            {/* Barre de filtres */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' as const }}>
              <input
                value={chantierSearch}
                onChange={e => { setChantierSearch(e.target.value); setChantierPage(0) }}
                placeholder="Rechercher un chantier ou un engin..."
                style={{ height: 34, width: 260, padding: '0 12px', borderRadius: 6, border: '1px solid #DDE4EA', background: '#fff', fontSize: 13, fontFamily: 'Barlow,sans-serif', color: '#33465A', outline: 'none' }}
              />
              <select value={chantierFilterStatut} onChange={e => { setChantierFilterStatut(e.target.value); setChantierPage(0) }}
                style={{ ...selectCls, borderColor: chantierFilterStatut ? '#EE6C2B' : '#DDE4EA', color: chantierFilterStatut ? '#EE6C2B' : '#5B6C7C' }}>
                <option value="">Toutes les affectations</option>
                <option value="EN_COURS">En cours</option>
                <option value="PLANIFIEE">Planifiées</option>
                <option value="SUSPENDUE">Suspendues</option>
              </select>
              <select value={chantierSort} onChange={e => { setChantierSort(e.target.value as 'engins' | 'nom'); setChantierPage(0) }} style={selectCls}>
                <option value="engins">Tri : nb d'engins</option>
                <option value="nom">Tri : nom A→Z</option>
              </select>
              {(chantierSearch || chantierFilterStatut) && (
                <button onClick={() => { setChantierSearch(''); setChantierFilterStatut(''); setChantierPage(0) }}
                  style={{ ...selectCls, border: 'none', background: 'transparent', color: '#2563EB', textDecoration: 'underline' }}>Réinitialiser</button>
              )}
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 12.5, color: '#7A8B9A' }}>{chantiersAll.length} chantier{chantiersAll.length > 1 ? 's' : ''} affiché{chantiersAll.length > 1 ? 's' : ''}</span>
            </div>

            {planningLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#7A8B9A', fontSize: 14 }}>Chargement...</div>
            ) : chantiers.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#152230' }}>{q || chantierFilterStatut ? 'Aucun résultat' : 'Aucun chantier avec des engins affectés'}</div>
                <div style={{ fontSize: 13.5, color: '#7A8B9A', marginTop: 8 }}>{q || chantierFilterStatut ? 'Modifiez la recherche ou les filtres pour voir plus de chantiers.' : 'Affectez des engins à des chantiers pour les retrouver ici, groupés par projet.'}</div>
              </div>
            ) : (
              <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(420px,1fr))', gap: 16 }}>
                {chantiers.map(ch => {
                  const cardPages = Math.max(1, Math.ceil(ch.affs.length / ROWS_VISIBLE))
                  const cardPage = Math.min(chantierCardPages[ch.id] || 0, cardPages - 1)
                  const visible = ch.affs.slice(cardPage * ROWS_VISIBLE, (cardPage + 1) * ROWS_VISIBLE)
                  return (
                    <div key={ch.id} style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 328 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid #E8EDF1', background: '#F7F9FA' }}>
                        <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.nom}</div>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#E7EEFD', color: '#2563EB', flex: 'none' }}>{ch.affs.length} engin{ch.affs.length > 1 ? 's' : ''}</span>
                      </div>
                      {visible.map(a => {
                        const [lbl, c, bg] = stAff[a.statut] || [a.statut, '#6B7280', '#EFF1F3']
                        return (
                          <div key={a.id} className="mk-ch-row" onClick={() => goFiche(a.enginId)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #F1F4F7', cursor: 'pointer' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.enginNom}</div>
                              <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 11.5, letterSpacing: '.05em', color: '#7A8B9A' }}>{a.enginCode} · {fmtDate(a.dateDebut)} → {a.dateFin ? fmtDate(a.dateFin) : 'en cours'}</div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 4, color: c, background: bg, whiteSpace: 'nowrap' as const, flex: 'none' }}>{lbl}</span>
                          </div>
                        )
                      })}
                      {cardPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderTop: '1px solid #F1F4F7', background: '#FBFCFD', marginTop: 'auto' }}>
                          <span style={{ fontSize: 11.5, color: '#93A2AF' }}>{cardPage * ROWS_VISIBLE + 1}–{Math.min((cardPage + 1) * ROWS_VISIBLE, ch.affs.length)} sur {ch.affs.length}</span>
                          <div style={{ flex: 1 }} />
                          <button
                            disabled={cardPage === 0}
                            onClick={() => setChantierCardPages({ ...chantierCardPages, [ch.id]: cardPage - 1 })}
                            style={{ appearance: 'none' as const, width: 26, height: 26, borderRadius: 5, border: '1px solid #DDE4EA', background: '#fff', color: cardPage === 0 ? '#C1CBD4' : '#5B6C7C', fontSize: 14, fontWeight: 700, cursor: cardPage === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow,sans-serif' }}>‹</button>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#5B6C7C' }}>{cardPage + 1}/{cardPages}</span>
                          <button
                            disabled={cardPage >= cardPages - 1}
                            onClick={() => setChantierCardPages({ ...chantierCardPages, [ch.id]: cardPage + 1 })}
                            style={{ appearance: 'none' as const, width: 26, height: 26, borderRadius: 5, border: '1px solid #DDE4EA', background: '#fff', color: cardPage >= cardPages - 1 ? '#C1CBD4' : '#5B6C7C', fontSize: 14, fontWeight: 700, cursor: cardPage >= cardPages - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow,sans-serif' }}>›</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {chTotalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                  <button disabled={chPage === 0} onClick={() => setChantierPage(chPage - 1)}
                    style={{ ...selectCls, opacity: chPage === 0 ? 0.5 : 1, cursor: chPage === 0 ? 'default' : 'pointer' }}>‹ Précédent</button>
                  <span style={{ fontSize: 13, color: '#5B6C7C', fontWeight: 600 }}>Page {chPage + 1} sur {chTotalPages}</span>
                  <button disabled={chPage >= chTotalPages - 1} onClick={() => setChantierPage(chPage + 1)}
                    style={{ ...selectCls, opacity: chPage >= chTotalPages - 1 ? 0.5 : 1, cursor: chPage >= chTotalPages - 1 ? 'default' : 'pointer' }}>Suivant ›</button>
                </div>
              )}
              </>
            )}
          </div>
        )
      })()}

      {/* ═══════════════════════════════════════════════
           MAINTENANCE GLOBALE (tableau + calendrier)
           ═══════════════════════════════════════════════ */}
      {screen === 'maintenance' && (() => {
        const today = localISO(new Date())
        const MAINT_ST: Record<string, [string, string, string]> = {
          PLANIFIEE: ['Planifiée', '#2563EB', '#E7EEFD'],
          EN_COURS: ['En cours', '#D97706', '#FDF2E3'],
          TERMINEE: ['Terminée', '#16A34A', '#E7F6EC'],
          ANNULEE: ['Annulée', '#6B7280', '#EFF1F3'],
        }
        const TYPE_OPTS: [string, string][] = [
          ['VIDANGE', 'Vidange'], ['GRAISSAGE', 'Graissage'], ['REVISION', 'Révision'], ['REPARATION', 'Réparation'],
          ['CONTROLE_TECHNIQUE', 'Contrôle technique'], ['CHANGEMENT_PIECES', 'Changement pièces'],
          ['ENTRETIEN_PREVENTIF', 'Entretien préventif'], ['AUTRE', 'Autre'],
        ]
        const typeLabel = (t: string) => TYPE_OPTS.find(([k]) => k === t)?.[1] || t.replace(/_/g, ' ')
        const isRetard = (m: OperationMaintenance) => m.statut === 'PLANIFIEE' && !!m.echeanceDate && m.echeanceDate < today
        const enRetard = maintList.filter(isRetard).length
        const selCls = (active: boolean) => ({ height: 32, padding: '0 10px', borderRadius: 6, border: `1px solid ${active ? '#EE6C2B' : '#DDE4EA'}`, background: active ? '#EE6C2B' : '#fff', color: active ? '#fff' : '#5B6C7C', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow,sans-serif' })
        // Calendrier
        const nbJours = new Date(maintMonth.getFullYear(), maintMonth.getMonth() + 1, 0).getDate()
        const firstDow = (new Date(maintMonth.getFullYear(), maintMonth.getMonth(), 1).getDay() + 6) % 7 // lundi = 0
        const moisLabel = maintMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        const parJour = new Map<string, OperationMaintenance[]>()
        for (const m of maintCalendrier) {
          const d = m.dateRealisation || m.echeanceDate
          if (!d) continue
          const arr = parJour.get(d) || []
          arr.push(m)
          parJour.set(d, arr)
        }
        return (
          <div className="mk-content" style={{ padding: "24px 28px 40px" }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 18, flexWrap: 'wrap' as const }}>
              <div>
                <h1 style={{ margin: 0, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 700 }}>Maintenance du parc</h1>
                <div style={{ fontSize: 14, color: '#5B6C7C', marginTop: 3 }}>
                  {maintView === 'tableau'
                    ? `${maintList.length} opération${maintList.length > 1 ? 's' : ''}${enRetard > 0 ? ` — ${enRetard} en retard` : ''}`
                    : moisLabel.charAt(0).toUpperCase() + moisLabel.slice(1)}
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => setMaintView('tableau')} style={selCls(maintView === 'tableau')}>Tableau</button>
                <button onClick={() => setMaintView('calendrier')} style={selCls(maintView === 'calendrier')}>Calendrier</button>
              </div>
            </div>

            {/* KPIs maintenance */}
            {(() => {
              const planifiees = maintList.filter(m => m.statut === 'PLANIFIEE').length
              const enCours = maintList.filter(m => m.statut === 'EN_COURS').length
              const coutPrev = maintList.filter(m => m.statut === 'PLANIFIEE' || m.statut === 'EN_COURS').reduce((s, m) => s + (m.coutEstime || 0), 0)
              const cards: { label: string; value: string; color: string }[] = [
                { label: 'En retard', value: String(enRetard), color: enRetard > 0 ? '#DC2626' : '#16A34A' },
                { label: 'Planifiées', value: String(planifiees), color: '#2563EB' },
                { label: 'En cours', value: String(enCours), color: '#D97706' },
                { label: 'Coût prévisionnel', value: `${coutPrev.toLocaleString('fr-FR')} FCFA`, color: '#33465A' },
              ]
              return (
                <div className="mk-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
                  {cards.map((c, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: '13px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#7A8B9A' }}>{c.label}</div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.value}</div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {maintView === 'tableau' && (
              <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid #E8EDF1' }}>
                  <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600 }}>Opérations de maintenance</div>
                  <div style={{ flex: 1 }} />
                  <select value={maintFilterStatut} onChange={e => setMaintFilterStatut(e.target.value)} style={{ height: 30, padding: '0 8px', borderRadius: 5, border: '1px solid #DDE4EA', background: '#fff', color: '#5B6C7C', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Barlow,sans-serif' }}>
                    <option value="">Statut</option>
                    {Object.entries(MAINT_ST).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <select value={maintFilterType} onChange={e => setMaintFilterType(e.target.value)} style={{ height: 30, padding: '0 8px', borderRadius: 5, border: '1px solid #DDE4EA', background: '#fff', color: '#5B6C7C', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Barlow,sans-serif' }}>
                    <option value="">Type</option>
                    {TYPE_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr .9fr 1fr .8fr .9fr', gap: 12, padding: '10px 16px', background: '#F7F9FA', borderBottom: '1px solid #E8EDF1', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#7A8B9A' }}>
                  <div>Équipement</div><div>Type</div><div>Statut</div><div>Échéance</div><div>Coût</div><div>Exécutant</div>
                </div>
                {maintLoading ? (
                  <div style={{ padding: '40px 0', textAlign: 'center' as const, color: '#7A8B9A', fontSize: 13 }}>Chargement...</div>
                ) : maintList.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#33465A' }}>Aucune opération de maintenance</div>
                    <div style={{ fontSize: 13, color: '#7A8B9A', marginTop: 4 }}>Planifiez une maintenance depuis la fiche d'un équipement.</div>
                  </div>
                ) : maintList.map(m => {
                  const [lbl, c, bg] = MAINT_ST[m.statut] || [m.statut, '#6B7280', '#EFF1F3']
                  const retard = isRetard(m)
                  return (
                    <div key={m.id} onClick={() => goFiche(m.enginId)} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr .9fr 1fr .8fr .9fr', gap: 12, alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F1F4F7', cursor: 'pointer', background: retard ? '#FEF6F6' : '#fff' }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.enginNom || m.enginCode}</div>
                        <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 11.5, letterSpacing: '.05em', color: '#7A8B9A' }}>{m.enginCode}</div>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#4A5C6D' }}>{typeLabel(m.typeOperation)}</div>
                      <div><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 4, color: c, background: bg }}>{lbl.toUpperCase()}</span></div>
                      <div style={{ fontSize: 13, fontWeight: retard ? 700 : 500, color: retard ? '#DC2626' : '#33465A' }}>
                        {m.dateRealisation ? `Réalisée le ${m.dateRealisation}` : m.echeanceDate || (m.echeanceHeures ? `${m.echeanceHeures} h` : '—')}
                        {retard && ' ⚠'}
                      </div>
                      <div style={{ fontSize: 13, color: '#33465A' }}>{(m.coutReel ?? m.coutEstime) != null ? `${Number(m.coutReel ?? m.coutEstime).toLocaleString('fr-FR')} F` : '—'}</div>
                      <div style={{ fontSize: 13, color: '#33465A' }}>{m.executePar || '—'}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {maintView === 'calendrier' && (
              <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid #E8EDF1' }}>
                  <button onClick={() => setMaintMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} style={{ appearance: 'none' as const, border: '1px solid #DDE4EA', borderRadius: 5, background: '#fff', padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'Barlow,sans-serif' }}>‹</button>
                  <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600, minWidth: 170, textAlign: 'center' as const }}>{moisLabel.charAt(0).toUpperCase() + moisLabel.slice(1)}</div>
                  <button onClick={() => setMaintMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} style={{ appearance: 'none' as const, border: '1px solid #DDE4EA', borderRadius: 5, background: '#fff', padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'Barlow,sans-serif' }}>›</button>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 12, color: '#7A8B9A' }}>{maintCalendrier.length} opération{maintCalendrier.length > 1 ? 's' : ''} ce mois</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #E8EDF1', background: '#F7F9FA' }}>
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(j => (
                    <div key={j} style={{ padding: '8px 0', textAlign: 'center' as const, fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#7A8B9A' }}>{j}</div>
                  ))}
                </div>
                {maintLoading ? (
                  <div style={{ padding: '40px 0', textAlign: 'center' as const, color: '#7A8B9A', fontSize: 13 }}>Chargement...</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                    {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} style={{ minHeight: 92, borderBottom: '1px solid #F1F4F7', borderRight: '1px solid #F1F4F7', background: '#FAFBFC' }} />)}
                    {Array.from({ length: nbJours }, (_, i) => {
                      const jour = i + 1
                      const dateStr = `${maintMonth.getFullYear()}-${String(maintMonth.getMonth() + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`
                      const ops = parJour.get(dateStr) || []
                      const isToday = dateStr === today
                      return (
                        <div key={jour} style={{ minHeight: 92, padding: '6px 7px', borderBottom: '1px solid #F1F4F7', borderRight: '1px solid #F1F4F7', background: isToday ? '#F0F6FF' : '#fff' }}>
                          <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday ? '#2563EB' : '#7A8B9A', marginBottom: 4 }}>{jour}</div>
                          {ops.slice(0, 3).map(m => {
                            const retard = isRetard(m)
                            const [, c, bg] = MAINT_ST[m.statut] || ['', '#6B7280', '#EFF1F3']
                            return (
                              <div key={m.id} onClick={() => goFiche(m.enginId)} title={`${m.enginCode} — ${typeLabel(m.typeOperation)}`}
                                style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4, marginBottom: 3, cursor: 'pointer', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', color: retard ? '#DC2626' : c, background: retard ? '#FDECEC' : bg }}>
                                {m.enginCode} · {typeLabel(m.typeOperation)}
                              </div>
                            )
                          })}
                          {ops.length > 3 && <div style={{ fontSize: 10.5, color: '#7A8B9A', fontWeight: 600 }}>+{ops.length - 3} autres</div>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* Create modal */}
      {showCreateModal && (
        <EnginFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); refreshList() }}
        />
      )}

      {/* Edit modal */}
      {showEditModal && ficheEngin && (
        <EnginFormModal
          engin={ficheEngin}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            refreshList()
            // Refresh fiche detail
            if (selectedEnginId) {
              enginApi.findById(selectedEnginId).then(setFicheEngin).catch(() => {})
            }
          }}
        />
      )}

      {/* Maintenance modal */}
      {showMaintenanceModal && selectedEnginId && ficheEngin && (
        <MaintenanceFormModal
          enginId={selectedEnginId}
          enginNom={`${ficheEngin.nom} (${ficheEngin.code})`}
          onClose={() => setShowMaintenanceModal(false)}
          onSuccess={() => {
            setShowMaintenanceModal(false)
            if (selectedEnginId) {
              enginApi.getMaintenances(selectedEnginId).then(p => setFicheMaintenances(p.content)).catch(() => {})
            }
          }}
        />
      )}

      {/* Incident modal */}
      {showIncidentModal && selectedEnginId && ficheEngin && (
        <IncidentFormModal
          enginId={selectedEnginId}
          enginNom={`${ficheEngin.nom} (${ficheEngin.code})`}
          onClose={() => setShowIncidentModal(false)}
          onSuccess={() => {
            setShowIncidentModal(false)
            if (selectedEnginId) {
              enginApi.getIncidents(selectedEnginId).then(p => setFicheIncidents(p.content)).catch(() => {})
            }
          }}
        />
      )}

      {/* Relevé compteur modal */}
      {showReleveModal && selectedEnginId && ficheEngin && (
        <ReleveCompteurFormModal
          enginId={selectedEnginId}
          enginNom={`${ficheEngin.nom} (${ficheEngin.code})`}
          onClose={() => setShowReleveModal(false)}
          onSuccess={() => {
            setShowReleveModal(false)
            if (selectedEnginId) {
              Promise.all([
                enginApi.getReleves(selectedEnginId, 0, 20).then(p => p.content),
                enginApi.getHeuresMensuelles(selectedEnginId),
                enginApi.findById(selectedEnginId),
              ]).then(([rel, hm, eng]) => {
                setFicheReleves(rel)
                setFicheHeuresMensuelles(hm)
                setFicheEngin(eng)
              }).catch(() => {})
            }
          }}
        />
      )}

      {/* Consommation carburant modal */}
      {showConsommationModal && selectedEnginId && ficheEngin && (
        <ConsommationFormModal
          enginId={selectedEnginId}
          enginNom={`${ficheEngin.nom} (${ficheEngin.code})`}
          onClose={() => setShowConsommationModal(false)}
          onSuccess={() => {
            setShowConsommationModal(false)
            if (selectedEnginId) {
              enginApi.getConsommations(selectedEnginId, 0, 20).then(p => setFicheConsos(p.content)).catch(() => {})
            }
          }}
        />
      )}

      {/* Document modal */}
      {showDocumentModal && selectedEnginId && ficheEngin && (
        <DocumentFormModal
          enginId={selectedEnginId}
          enginNom={`${ficheEngin.nom} (${ficheEngin.code})`}
          onClose={() => setShowDocumentModal(false)}
          onSuccess={() => {
            setShowDocumentModal(false)
            if (selectedEnginId) {
              enginApi.getDocuments(selectedEnginId, 0, 50).then(p => setFicheDocuments(p.content)).catch(() => {})
            }
          }}
        />
      )}

      {/* QR Code modal */}
      {showQrModal && selectedEnginId && ficheEngin && (
        <QrCodeModal
          enginId={selectedEnginId}
          enginCode={ficheEngin.code}
          enginNom={ficheEngin.nom}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {/* Document edit modal */}
      {editingDocument && selectedEnginId && (
        <DocumentEditModal
          enginId={selectedEnginId}
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
          onSuccess={() => {
            setEditingDocument(null)
            if (selectedEnginId) {
              enginApi.getDocuments(selectedEnginId, 0, 50).then(p => setFicheDocuments(p.content)).catch(() => {})
            }
          }}
        />
      )}

      {/* Affectation modal */}
      {showAffectationModal && selectedEnginId && ficheEngin && (
        <AffectationFormModal
          enginId={selectedEnginId}
          enginNom={`${ficheEngin.nom} (${ficheEngin.code})`}
          onClose={() => setShowAffectationModal(false)}
          onSuccess={() => {
            setShowAffectationModal(false)
            if (selectedEnginId) {
              enginApi.getAffectationsByEngin(selectedEnginId).then(setFicheAffectations).catch(() => {})
            }
          }}
        />
      )}

      {/* Affectation edit modal */}
      {editingAffectation && (
        <AffectationEditModal
          affectation={editingAffectation}
          onClose={() => setEditingAffectation(null)}
          onSuccess={() => {
            setEditingAffectation(null)
            if (selectedEnginId) {
              enginApi.getAffectationsByEngin(selectedEnginId).then(setFicheAffectations).catch(() => {})
            }
          }}
        />
      )}

      {/* Transfert modal */}
      {showTransfertModal && selectedEnginId && ficheEngin && (() => {
        const affActive = ficheAffectations.find(a => a.statut === 'EN_COURS')
        return (
          <TransfertCreateModal
            enginId={selectedEnginId}
            enginNom={`${ficheEngin.nom} (${ficheEngin.code})`}
            projetOrigineId={affActive?.projetId}
            projetOrigineNom={affActive?.projetNom}
            onClose={() => setShowTransfertModal(false)}
            onSuccess={() => {
              setShowTransfertModal(false)
              if (selectedEnginId) {
                enginApi.getMouvements(selectedEnginId).then(setFicheMouvements).catch(() => {})
              }
            }}
          />
        )
      })()}

      {/* Inspection modal */}
      {showInspectionModal && selectedEnginId && ficheEngin && (
        <InspectionCreateModal
          enginId={selectedEnginId}
          enginNom={`${ficheEngin.nom} (${ficheEngin.code})`}
          onClose={() => setShowInspectionModal(false)}
          onSuccess={() => {
            setShowInspectionModal(false)
            if (selectedEnginId) {
              enginApi.getInspections(selectedEnginId, 0, 50).then(p => setFicheInspections(p.content)).catch(() => {})
              enginApi.getIncidents(selectedEnginId, 0, 50).then(p => setFicheIncidents(p.content)).catch(() => {})
            }
          }}
        />
      )}

      {/* Plan maintenance modal */}
      {showPlanMaintenanceModal && selectedEnginId && ficheEngin && (
        <PlanMaintenanceFormModal
          enginId={selectedEnginId}
          enginNom={`${ficheEngin.nom} (${ficheEngin.code})`}
          onClose={() => setShowPlanMaintenanceModal(false)}
          onSuccess={() => {
            setShowPlanMaintenanceModal(false)
            if (selectedEnginId) {
              enginApi.getPlansMaintenance(selectedEnginId).then(setFichePlans).catch(() => {})
            }
          }}
        />
      )}
    </div>
  )
}
