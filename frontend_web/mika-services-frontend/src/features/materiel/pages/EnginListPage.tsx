/**
 * Module Engins & Materiel — Reproduction fidele de la maquette Claude Design.
 * 4 ecrans desktop : Tableau de bord, Fiche equipement, Carte, Planning.
 * Navigation interne par state (pas de routes separees).
 */
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { enginApi } from '@/api/enginApi'
import type { EnginSummary, EnginStats, Engin, CarnetEngin, OperationMaintenance, IncidentEngin, DocumentEngin, AffectationEnginResponse, ReleveCompteur, ConsommationCarburant, EnginCarte, AlerteEngin, EcheanceEngin, HeuresMensuelles } from '@/types/materiel'
import { EnginFormModal } from '../components/EnginFormModal'
import { MaintenanceFormModal } from '../components/MaintenanceFormModal'
import { IncidentFormModal } from '../components/IncidentFormModal'
import { MapboxCarteEngins } from '../map/MapboxCarteEngins'
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
  HORS_SERVICE:   { label: 'Immobilisé',   color: '#6B7280', bg: '#EFF1F3' },
  EN_TRANSIT:     { label: 'En transit',   color: '#8B5CF6', bg: '#F1EAFE' },
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
  ['infos', 'Informations'], ['affectations', 'Affectations'], ['maintenance', 'Maintenance'],
  ['incidents', 'Incidents'], ['compteurs', 'Compteurs & conso.'], ['documents', 'Documents'],
  ['positions', 'Positions'], ['couts', 'Coûts'], ['inspections', 'Inspections'], ['carnet', 'Carnet de bord'],
]

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

type Screen = 'dashboard' | 'fiche' | 'carte' | 'planning'

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
  const [ficheHeuresMensuelles, setFicheHeuresMensuelles] = useState<HeuresMensuelles | null>(null)
  const [ficheLoading, setFicheLoading] = useState(false)
  const [cartePositions, setCartePositions] = useState<EnginCarte[]>([])
  const [carteSelectedId, setCarteSelectedId] = useState<number | null>(null)
  const [planningAffectations, setPlanningAffectations] = useState<AffectationEnginResponse[]>([])
  const [planningLoading, setPlanningLoading] = useState(false)
  const [engins, setEngins] = useState<EnginSummary[]>([])
  const [stats, setStats] = useState<EnginStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [enginThumbs, setEnginThumbs] = useState<Record<number, string>>({})
  const [alertes, setAlertes] = useState<AlerteEngin[]>([])
  const [echeances, setEcheances] = useState<EcheanceEngin[]>([])
  // Filters & pagination
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const PAGE_SIZE = 20

  // Load engins list (reacts to filter/page changes)
  const loadEngins = useCallback((page = 0) => {
    const doSearch = searchQuery.trim().length > 0
    const promise = doSearch
      ? enginApi.search(searchQuery.trim(), page, PAGE_SIZE)
      : enginApi.findAll(page, PAGE_SIZE, filterStatut || undefined, filterType || undefined)
    promise.then(result => {
      setEngins(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
      setCurrentPage(page)
    }).catch(() => {})
  }, [searchQuery, filterStatut, filterType])

  useEffect(() => {
    let cancelled = false
    const doSearch = searchQuery.trim().length > 0
    const enginPromise = doSearch
      ? enginApi.search(searchQuery.trim(), 0, PAGE_SIZE)
      : enginApi.findAll(0, PAGE_SIZE, filterStatut || undefined, filterType || undefined)
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
  }, [filterType, filterStatut, searchQuery])

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

  // Fetch carte positions
  useEffect(() => {
    if (screen !== 'carte') return
    enginApi.getPositions().then(setCartePositions).catch(() => setCartePositions([]))
  }, [screen])

  // Fetch planning affectations
  useEffect(() => {
    if (screen !== 'planning') return
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
    ]).then(([eng, carnet, maint, inc, docs, aff, rel, conso, hm]) => {
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
    if (stats?.parStatut && Object.keys(stats.parStatut).length > 0) {
      Object.assign(counts, stats.parStatut)
    } else if (engins.length) {
      engins.forEach(e => { counts[e.statut] = (counts[e.statut] || 0) + 1 })
    } else {
      counts.DISPONIBLE = 21; counts.EN_SERVICE = 12; counts.EN_MAINTENANCE = 8; counts.EN_PANNE = 3; counts.HORS_SERVICE = 3
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    let cum = 0
    const stops: string[] = []
    const items: { label: string; n: number; color: string }[] = []
    for (const [key, n] of Object.entries(counts)) {
      if (n === 0) continue
      const cfg = ST[key] || { label: key, color: '#6B7280', bg: '#EFF1F3' }
      const pct = (n / total) * 100
      stops.push(`${cfg.color} ${cum}% ${cum + pct}%`)
      items.push({ label: cfg.label, n, color: cfg.color })
      cum += pct
    }
    return { gradient: `conic-gradient(${stops.join(', ')})`, items, total }
  }, [engins, stats])

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
      const dateStr = d.toISOString().slice(0, 10) // YYYY-MM-DD
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
    if (planningAffectations.length === 0) return { weeks: [] as { label: string; start: Date; end: Date }[], rows: [] as { enginNom: string; enginCode: string; bars: { left: string; width: string; color: string; label: string; statut: string }[] }[], legende: [] as { label: string; color: string }[], totalAffectations: 0 }

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

    // Build rows
    const rows = [...enginMap.values()].map(({ nom, code, affectations }) => {
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

    return { weeks, rows, legende, totalAffectations: planningAffectations.length }
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

  /* ── Nav items ── */
  const nav: [Screen | 'terrain', string][] = [['dashboard', 'Tableau de bord'], ['fiche', 'Fiche équipement'], ['carte', 'Carte'], ['planning', 'Planning']]

  /* ── Fiche info groups ── */
  const infoGroupes = useMemo(() => {
    const e = ficheEngin
    if (!e) return [
      { titre: 'Identification', lignes: [{ k: 'Code interne', v: 'ENG-2024-042' }, { k: 'Categorie', v: 'Engin lourd' }, { k: 'Marque / modele', v: 'Caterpillar 320' }, { k: 'N de serie', v: 'CAT0320LKBH04872' }, { k: 'Annee', v: '2023' }] },
      { titre: 'Technique', lignes: [{ k: 'Compteur', v: '—' }, { k: 'Immatriculation', v: '—' }] },
      { titre: 'Propriete & couts', lignes: [{ k: 'Proprietaire', v: '—' }, { k: 'Date acquisition', v: '—' }, { k: 'Valeur acquisition', v: '—' }] },
    ]
    return [
      { titre: 'Identification', lignes: [
        { k: 'Code interne', v: e.code },
        { k: 'Categorie', v: TYPE_LABEL[e.type] || e.type },
        { k: 'Marque / modele', v: `${e.marque || '—'} ${e.modele || ''}`.trim() },
        { k: 'N de serie', v: e.numeroSerie || '—' },
        { k: 'Immatriculation', v: e.immatriculation || '—' },
        { k: 'Annee', v: e.anneeFabrication ? String(e.anneeFabrication) : '—' },
        { k: 'Statut', v: ST[e.statut]?.label || e.statut },
      ]},
      { titre: 'Compteurs & usage', lignes: [
        { k: 'Heures compteur', v: `${e.heuresCompteur} h` },
        { k: 'Location', v: e.estLocation ? 'Oui' : 'Non' },
        ...(e.coutLocationJournalier ? [{ k: 'Cout location/jour', v: `${e.coutLocationJournalier} FCFA` }] : []),
      ]},
      { titre: 'Propriete & couts', lignes: [
        { k: 'Proprietaire', v: e.proprietaire || 'Interne' },
        { k: 'Date acquisition', v: e.dateAcquisition || '—' },
        { k: 'Valeur acquisition', v: e.valeurAcquisition ? `${e.valeurAcquisition} FCFA` : '—' },
        { k: 'Actif', v: e.actif ? 'Oui' : 'Non' },
      ]},
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
        cols: '1.4fr 1fr 1fr .9fr .8fr', head: ['Chantier', 'Periode', 'Statut', 'Heures prevues', 'Heures reelles'],
        rows: ficheAffectations.map(a => [
          cell(a.projetNom, { weight: 600 }),
          cell(`${a.dateDebut}${a.dateFin ? ' → ' + a.dateFin : ' → en cours'}`),
          badge(a.statut, a.statut === 'EN_COURS' ? '#3F6B83' : a.statut === 'TERMINEE' ? '#6B7280' : '#2563EB', a.statut === 'EN_COURS' ? '#E8F0F5' : a.statut === 'TERMINEE' ? '#EFF1F3' : '#E7EEFD'),
          cell(a.heuresPrevues ? `${a.heuresPrevues} h` : '—'),
          cell(`${a.heuresReelles} h`),
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
        cols: '1.6fr .9fr .9fr 1fr .9fr', head: ['Incident', 'Type', 'Gravite', 'Signale le', 'Statut'],
        rows: ficheIncidents.map(inc => [
          cell(inc.description || inc.typeIncident.replace(/_/g, ' '), { weight: 600 }),
          cell(inc.typeIncident.replace(/_/g, ' ')),
          badge(inc.gravite, inc.gravite === 'CRITIQUE' ? '#DC2626' : inc.gravite === 'MAJEURE' ? '#D97706' : '#6B7280', inc.gravite === 'CRITIQUE' ? '#FDECEC' : inc.gravite === 'MAJEURE' ? '#FDF2E3' : '#EFF1F3'),
          cell(`${inc.dateIncident}${inc.signalePar ? ' · ' + inc.signalePar : ''}`),
          badge(inc.resolu ? 'RESOLU' : 'OUVERT', inc.resolu ? '#16A34A' : '#DC2626', inc.resolu ? '#E7F6EC' : '#FDECEC'),
        ]),
      }
    }
    if (ficheTab === 'documents' && ficheDocuments.length > 0) {
      return {
        titre: 'Documents et conformite', action: '+ Ajouter un document',
        cols: '1.5fr 1fr .9fr .9fr', head: ['Document', 'Type', 'Expiration', 'Commentaire'],
        rows: ficheDocuments.map(d => [
          cell(d.nom, { weight: 600 }),
          cell(d.typeDocument.replace(/_/g, ' ')),
          cell(d.dateExpiration || '—'),
          cell(d.commentaire || '—'),
        ]),
      }
    }
    return TABLES[ficheTab]
  }, [ficheTab, ficheAffectations, ficheMaintenances, ficheIncidents, ficheDocuments])

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

  if (loading) {
    return (
      <div style={{ fontFamily: "Barlow, system-ui, sans-serif", background: '#EEF1F4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #DFE5EB', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div className="mk-root" style={{ fontFamily: "Barlow, system-ui, sans-serif", background: '#EEF1F4', minHeight: '100vh', color: '#152230', WebkitFontSmoothing: 'antialiased' }}>

      {/* ═══════ TOP BAR ═══════ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '0 28px', height: 64, background: '#0F1B26', color: '#fff', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: '.14em', textTransform: 'uppercase' as const }}>MIKA</span>
          <span style={{ fontSize: 13, color: '#8FA3B4', letterSpacing: '.06em' }}>Services</span>
        </div>
        <div style={{ width: 1, height: 26, background: '#28394A' }} />
        <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600, letterSpacing: '.03em' }}>Parc Engins &amp; Matériel</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9FB2C2' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
          Synchronisé · S33 2026
        </div>
      </div>

      {/* ═══════ NAV BAR ═══════ */}
      <nav role="navigation" aria-label="Navigation module materiel" style={{ display: 'flex', alignItems: 'stretch', gap: 0, padding: '0 28px', background: '#fff', borderBottom: '1px solid #DFE5EB', position: 'sticky', top: 64, zIndex: 19 }}>
        {nav.map(([id, label]) => (
          <button key={id} onClick={() => go(id as Screen)} aria-current={screen === id ? 'page' : undefined} style={{
            appearance: 'none' as const, background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: screen === id ? 700 : 600,
            letterSpacing: '.02em', padding: '16px 18px 14px',
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
        <div style={{ padding: '24px 28px 40px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 20 }}>
            <div>
              <h1 style={{ margin: 0, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 34, fontWeight: 700, letterSpacing: '.01em' }}>Parc Engins &amp; Matériel</h1>
              <div style={{ marginTop: 4, fontSize: 14, color: '#5B6C7C' }}>{kpis[0].value} equipements · {kpis[2].value} en service · {alertesDisplay.length} alerte{alertesDisplay.length !== 1 ? 's' : ''} active{alertesDisplay.length !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => enginApi.exportCsv().catch(() => toast({ message: 'Erreur lors de l\'export', variant: 'error' }))} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: 600, padding: '10px 16px', borderRadius: 6, border: '1px solid #C9D3DC', background: '#fff', color: '#33465A' }}>Exporter</button>
              <button onClick={() => go('carte')} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: 600, padding: '10px 16px', borderRadius: 6, border: '1px solid #C9D3DC', background: '#fff', color: '#33465A' }}>Carte du parc</button>
              <button onClick={() => setShowCreateModal(true)} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: 700, padding: '10px 18px', borderRadius: 6, border: 'none', background: '#FF6B35', color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.12)' }}>+ Nouvel équipement</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
                {kpis.map((k, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #DFE5EB', borderTop: `3px solid ${k.color}`, borderRadius: 8, padding: '14px 14px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.09em', textTransform: 'uppercase' as const, color: '#7A8B9A' }}>{k.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 36, fontWeight: 700, lineHeight: 1, color: k.color, animation: (k as any).pulse ? 'mkpulse 1.8s ease-in-out infinite' : 'none' }}>{k.value}</span>
                      <span style={{ fontSize: 12, color: '#7A8B9A' }}>{k.unit}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: k.deltaColor }}>{k.delta}</div>
                  </div>
                ))}
              </div>

              {/* Equipment table */}
              <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #E8EDF1' }}>
                  <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600 }}>Équipements</div>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(0) }} style={{ appearance: 'none' as const, fontSize: 13, padding: '7px 26px 7px 10px', border: '1px solid #DDE4EA', borderRadius: 6, color: filterType ? '#152230' : '#4A5C6D', background: `#FBFCFD url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23A9B7C3'/%3E%3C/svg%3E") no-repeat right 8px center`, cursor: 'pointer', fontFamily: 'Barlow,sans-serif' }}>
                      <option value="">Categorie</option>
                      {Object.entries(TYPE_LABEL).filter(([, v], i, arr) => arr.findIndex(([, v2]) => v2 === v) === i).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <select value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setCurrentPage(0) }} style={{ appearance: 'none' as const, fontSize: 13, padding: '7px 26px 7px 10px', border: '1px solid #DDE4EA', borderRadius: 6, color: filterStatut ? '#152230' : '#4A5C6D', background: `#FBFCFD url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23A9B7C3'/%3E%3C/svg%3E") no-repeat right 8px center`, cursor: 'pointer', fontFamily: 'Barlow,sans-serif' }}>
                      <option value="">Statut</option>
                      {Object.entries(ST).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    {(filterType || filterStatut) && (
                      <button onClick={() => { setFilterType(''); setFilterStatut(''); setCurrentPage(0) }} style={{ appearance: 'none' as const, border: '1px solid #DDE4EA', borderRadius: 6, background: '#FBFCFD', color: '#7A8B9A', fontSize: 13, padding: '7px 10px', cursor: 'pointer', fontFamily: 'Barlow,sans-serif' }}>Reinitialiser</button>
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
                  <div></div><div>Code · Désignation</div><div>Catégorie</div><div>Statut</div><div>Chantier actuel</div><div>Conducteur</div><div>Dernier relevé</div><div></div>
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
                    <div style={{ width: 4, borderRadius: 2, background: a.color, flex: 'none', animation: a.pulse ? 'mkpulse 1.8s ease-in-out infinite' : 'none' }} />
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
                <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Répartition du parc</div>
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
        <div style={{ padding: '24px 28px 40px' }}>
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
                <button onClick={() => setShowMaintenanceModal(true)} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: 600, padding: 10, borderRadius: 6, border: '1px solid #C9D3DC', background: '#fff', color: '#33465A' }}>Planifier maintenance</button>
                <button onClick={() => setShowIncidentModal(true)} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: 600, padding: 10, borderRadius: 6, border: '1px solid #F0B7B7', background: '#FEF3F3', color: '#DC2626' }}>Signaler un incident</button>
                <button onClick={handleDeleteEngin} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: 600, padding: 10, borderRadius: 6, border: '1px solid #F0B7B7', background: '#fff', color: '#DC2626' }}>Supprimer</button>
                <button onClick={() => selectedEnginId && enginApi.getQrCode(selectedEnginId).catch(() => toast({ message: 'Erreur generation QR code', variant: 'error' }))} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 13, fontWeight: 600, padding: 10, borderRadius: 6, border: '1px solid #C9D3DC', background: '#FBFCFD', color: '#5B6C7C', marginTop: 4 }}>QR Code</button>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
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
            )}

            {/* TIMELINE (carnet) */}
            {tl && (
              <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, padding: '20px 22px' }}>
                <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{tl.titre}</div>
                <div style={{ fontSize: 13, color: '#7A8B9A', marginBottom: 18 }}>{tl.sous}</div>
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

            {/* GENERIC TABLE tabs */}
            {tbl && (
              <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 18px', borderBottom: '1px solid #E8EDF1' }}>
                  <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 17, fontWeight: 600 }}>{tbl.titre}</div>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => {
                    if (ficheTab === 'maintenance') setShowMaintenanceModal(true)
                    else if (ficheTab === 'incidents') setShowIncidentModal(true)
                    else if (ficheTab === 'carte' || ficheTab === 'positions') go('carte')
                  }} style={{ appearance: 'none' as const, cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 13.5, fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff' }}>{tbl.action}</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: tbl.cols, gap: 14, padding: '10px 18px', background: '#F7F9FA', borderBottom: '1px solid #E8EDF1', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#7A8B9A' }}>
                  {tbl.head.map((h, i) => <div key={i}>{h}</div>)}
                </div>
                {tbl.rows.map((row, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: tbl.cols, gap: 14, alignItems: 'center', padding: '13px 18px', borderBottom: '1px solid #F1F4F7' }}>
                    {row.map((c, ci) => (
                      <div key={ci} style={{ fontSize: c.size, fontWeight: c.weight, color: c.color }}>
                        <span style={{ display: 'inline-block', padding: c.pad, borderRadius: 4, background: c.bg, fontSize: c.size }}>{c.text}</span>
                      </div>
                    ))}
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
      {screen === 'carte' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', height: 'calc(100vh - 113px)' }}>
          {/* Sidebar */}
          <div style={{ background: '#fff', borderRight: '1px solid #DFE5EB', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #E8EDF1' }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 700 }}>Carte du parc</div>
              <div style={{ fontSize: 12.5, color: '#7A8B9A', marginTop: 2 }}>{cartePositions.length} equipements geolocalisés sur {engins.length || '—'}</div>
            </div>
            <div style={{ overflow: 'auto', flex: 1 }}>
              {cartePositions.map(pos => {
                const stCfg = ST[pos.statut] || ST.HORS_SERVICE
                return (
                  <div key={pos.id} onClick={() => setCarteSelectedId(pos.id)} style={{ display: 'flex', gap: 11, padding: '13px 18px', borderBottom: '1px solid #F1F4F7', cursor: 'pointer', background: pos.id === carteSelectedId ? '#F0F5FF' : '#fff' }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', marginTop: 5, flex: 'none', background: stCfg.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{pos.nom}</div>
                      <div style={{ fontSize: 12, color: '#7A8B9A', marginTop: 1 }}>{pos.chantierNom || '—'} · {pos.code}</div>
                    </div>
                  </div>
                )
              })}
              {cartePositions.length === 0 && (
                <div style={{ padding: '20px 18px', fontSize: 13, color: '#7A8B9A', textAlign: 'center' }}>
                  Aucun engin avec position GPS.<br/>Affectez des engins a des chantiers avec coordonnees.
                </div>
              )}
            </div>
          </div>

          {/* Mapbox */}
          <MapboxCarteEngins
            positions={cartePositions}
            selectedId={carteSelectedId}
            onSelect={setCarteSelectedId}
            onOpenFiche={(id) => goFiche(id)}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════
           PLANNING
         ═══════════════════════════════════════════════ */}
      {screen === 'planning' && (
        <div style={{ padding: '24px 28px 40px' }}>
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
            <div style={{ background: '#fff', border: '1px solid #DFE5EB', borderRadius: 8, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', borderBottom: '1px solid #E8EDF1', background: '#F7F9FA' }}>
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
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: '230px 1fr', borderBottom: '1px solid #F1F4F7' }}>
                  <div style={{ padding: '11px 16px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{row.enginNom}</div>
                    <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 11.5, letterSpacing: '.05em', color: '#7A8B9A' }}>{row.enginCode}</div>
                  </div>
                  <div style={{ position: 'relative', minHeight: 52, background: `repeating-linear-gradient(90deg,transparent 0 calc(${100 / planningData.weeks.length}% - 1px),#EFF3F6 calc(${100 / planningData.weeks.length}% - 1px),#EFF3F6 ${100 / planningData.weeks.length}%)` }}>
                    {row.bars.map((bar, bi) => (
                      <div key={bi} title={`${bar.label} (${bar.statut})`} style={{ position: 'absolute', top: 11, height: 30, borderRadius: 5, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' as const, overflow: 'hidden', left: bar.left, width: bar.width, background: bar.color, border: bar.statut === 'SUSPENDUE' ? '2px dashed #94A9BC' : 'none', opacity: bar.statut === 'SUSPENDUE' ? 0.7 : 1 }}>{bar.label}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
    </div>
  )
}
