import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useIsOnline } from '@/hooks/useConnectivity'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/contexts/ToastContext'
import { useConfirm } from '@/contexts/ConfirmContext'
import {
  fetchTachesByProjet,
  fetchTachesEnRetard,
  fetchMesTaches,
  createTache,
  updateTache,
  deleteTache,
  fetchProjetStats,
} from '@/store/slices/planningSlice'
import { fetchProjets, fetchProjetsByResponsable } from '@/store/slices/projetSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import { StatutTache, Priorite, TypePrevision } from '@/types/planning'
import type { TacheCreateRequest, TacheUpdateRequest, Tache } from '@/types/planning'
import { canEditProjetEffective } from '@/utils/authRoles'
import { fetchUsers } from '@/store/slices/userSlice'
import { dqeApi } from '@/api/dqeApi'
import type { DqeChapitre } from '@/types/dqe'
import { exportPlanningExcel } from '../utils/exportPlanningExcel'

// ---------- Suggestions predefinies BTP ----------
const PREVISION_DESCRIPTION_OPTIONS: { value: string; label: string; group: string }[] = [
  { value: 'Terrassement général', label: 'Terrassement général', group: 'Travaux' },
  { value: 'Décapage', label: 'Décapage', group: 'Travaux' },
  { value: 'Remblai / compactage', label: 'Remblai / compactage', group: 'Travaux' },
  { value: 'Coulage fondations', label: 'Coulage fondations', group: 'Travaux' },
  { value: 'Coulage béton (dalle, poteaux)', label: 'Coulage béton (dalle, poteaux)', group: 'Travaux' },
  { value: 'Pose enrobé', label: 'Pose enrobé', group: 'Travaux' },
  { value: 'Pose bordures / caniveaux', label: 'Pose bordures / caniveaux', group: 'Travaux' },
  { value: 'Travaux d\'assainissement (réseaux)', label: 'Travaux d\'assainissement (réseaux)', group: 'Travaux' },
  { value: 'Ouvrage d\'art (dalle, culée)', label: 'Ouvrage d\'art (dalle, culée)', group: 'Travaux' },
  { value: 'Gros œuvre bâtiment', label: 'Gros œuvre bâtiment', group: 'Travaux' },
  { value: 'Topographie / piquetage', label: 'Topographie / piquetage', group: 'Études' },
  { value: 'Sondage / géotechnique', label: 'Sondage / géotechnique', group: 'Études' },
  { value: 'Contrôle qualité (laboratoire)', label: 'Contrôle qualité (laboratoire)', group: 'Qualité' },
  { value: 'Visite bureau de contrôle', label: 'Visite bureau de contrôle', group: 'Qualité' },
  { value: 'Réunion de chantier', label: 'Réunion de chantier', group: 'Pilotage' },
  { value: 'Coordination sous-traitants', label: 'Coordination sous-traitants', group: 'Pilotage' },
  { value: 'Décompte / situation', label: 'Décompte / situation', group: 'Administratif' },
  { value: 'Transmission documents MTPC', label: 'Transmission documents MTPC', group: 'Administratif' },
  { value: 'Réception livraison matériaux', label: 'Réception livraison matériaux', group: 'Logistique' },
  { value: 'Mise en place matériel / engins', label: 'Mise en place matériel / engins', group: 'Logistique' },
  { value: 'Formation sécurité équipe', label: 'Formation sécurité équipe', group: 'Sécurité' },
]

const SUGGESTION_GROUPS = ['Travaux', 'Études', 'Qualité', 'Pilotage', 'Administratif', 'Logistique', 'Sécurité']

import { PlanningHeader } from '../components/premium/PlanningHeader'
import { PlanningAlertBar } from '../components/premium/PlanningAlertBar'
import { PlanningKpiRow } from '../components/premium/PlanningKpiRow'
import { TachesTable } from '../components/premium/TachesTable'
import { PlanningDonut } from '../components/premium/PlanningDonut'
import { TachesRetardList } from '../components/premium/TachesRetardList'
import { PrioriteBars } from '../components/premium/PrioriteBars'
import { GanttChart } from '../components/premium/GanttChart'
import { KanbanBoard } from '../components/premium/KanbanBoard'
import { planningApi } from '@/api/planningApi'
import type { DependanceResponse } from '@/types/planning'

type PlanningView = 'table' | 'gantt' | 'kanban'

export default function PlanningPage() {
  const { t } = useTranslation('planning')
  const isOnline = useIsOnline()
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const toast = useToast()

  const currentUser = useAppSelector((s) => s.auth.user)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { taches, tachesEnRetard, mesTaches, projetStats, loading } = useAppSelector((s) => s.planning)
  const projetsPaginated = useAppSelector((s) => s.projet.projets)
  const mesProjets = useAppSelector((s) => s.projet.mesProjets)

  const allProjets = useMemo(() => {
    const map = new Map<number, typeof projetsPaginated[0]>()
    for (const p of projetsPaginated) map.set(p.id, p)
    for (const p of mesProjets) if (!map.has(p.id)) map.set(p.id, p)
    return Array.from(map.values())
  }, [projetsPaginated, mesProjets])

  const [searchParams, setSearchParams] = useSearchParams()
  const initialProjetId = searchParams.get('projet') ? Number(searchParams.get('projet')) : null
  const [selectedProjetId, setSelectedProjetIdRaw] = useState<number | null>(initialProjetId)
  const selectedProjetIdRef = useRef(selectedProjetId)
  selectedProjetIdRef.current = selectedProjetId

  const setSelectedProjetId = useCallback((id: number | null) => {
    setSelectedProjetIdRaw(id)
    setSearchParams(id ? { projet: String(id) } : {}, { replace: true })
  }, [setSearchParams])
  const [filterStatut, setFilterStatut] = useState<StatutTache | ''>('')
  const [filterHistorique, setFilterHistorique] = useState<StatutTache | ''>('')
  const [showModal, setShowModal] = useState(false)
  const [editingTache, setEditingTache] = useState<Tache | null>(null)
  const [activeView, setActiveView] = useState<PlanningView>('table')
  const [dependances, setDependances] = useState<DependanceResponse[]>([])
  const [cheminCritique, setCheminCritique] = useState<number[]>([])

  const allUsers = useAppSelector((s) => s.user.users)

  const [dqeChapitres, setDqeChapitres] = useState<DqeChapitre[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showSuggestions) return
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSuggestions])

  // Form
  const [formTitre, setFormTitre] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPriorite, setFormPriorite] = useState<Priorite>(Priorite.NORMALE)
  const [formStatut, setFormStatut] = useState<StatutTache>(StatutTache.A_FAIRE)
  const [formDateDebut, setFormDateDebut] = useState('')
  const [formDateFin, setFormDateFin] = useState('')
  const [formDateEcheance, setFormDateEcheance] = useState('')
  const [formAvancement, setFormAvancement] = useState<number>(0)
  const [formAssigneAId, setFormAssigneAId] = useState<string>('')
  const [formSemaine, setFormSemaine] = useState<string>('')
  const [formAnnee, setFormAnnee] = useState<string>('')
  const [formTypePrevision, setFormTypePrevision] = useState<string>('')
  const [formTacheParentId, setFormTacheParentId] = useState<string>('')
  const [formEstJalon, setFormEstJalon] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([])
  const [bulkConfirmed, setBulkConfirmed] = useState(false)
  const [exporting, setExporting] = useState(false)

  // ---------- Data loading ----------
  useEffect(() => {
    dispatch(fetchProjets({ size: 200 }))
    dispatch(fetchTachesEnRetard())
    dispatch(fetchUsers({ size: 200 }))
    dispatch(fetchProjetStats())
    if (currentUser?.id) {
      dispatch(fetchProjetsByResponsable(currentUser.id))
      dispatch(fetchMesTaches(currentUser.id))
    }
  }, [dispatch, currentUser?.id])

  useEffect(() => {
    if (selectedProjetId) {
      dispatch(fetchTachesByProjet({ projetId: selectedProjetId }))
      setFilterStatut('')
      dqeApi.findByProjet(selectedProjetId).then(setDqeChapitres).catch(() => setDqeChapitres([]))
      planningApi.getDependancesByProjet(selectedProjetId).then(setDependances).catch(() => setDependances([]))
      planningApi.getCheminCritique(selectedProjetId).then((t) => setCheminCritique(t.map((x) => x.id))).catch(() => setCheminCritique([]))
    } else {
      setDqeChapitres([])
      setDependances([])
      setCheminCritique([])
    }
  }, [dispatch, selectedProjetId])

  // ---------- Permissions ----------
  const selectedProjet = useMemo(
    () => allProjets.find((p) => p.id === selectedProjetId),
    [allProjets, selectedProjetId]
  )
  const canEdit = useMemo(
    () => selectedProjet ? canEditProjetEffective(currentUser, accessToken, selectedProjet.responsableProjetId) : false,
    [currentUser, accessToken, selectedProjet]
  )

  // ---------- KPIs ----------
  const globalKpis = useMemo(() => {
    if (projetStats.length > 0) {
      return {
        total: projetStats.reduce((s, p) => s + p.total, 0),
        aFaire: projetStats.reduce((s, p) => s + p.aFaire, 0),
        enCours: projetStats.reduce((s, p) => s + p.enCours, 0),
        terminees: projetStats.reduce((s, p) => s + p.terminees, 0),
        enRetard: projetStats.reduce((s, p) => s + p.enRetard, 0),
        projetsCount: projetStats.length,
      }
    }
    const allKnown = [...mesTaches]
    for (const tr of tachesEnRetard) {
      if (!allKnown.some((t) => t.id === tr.id)) allKnown.push(tr)
    }
    const uniqueProjects = new Set(allKnown.map((t) => t.projetId))
    return {
      total: allKnown.length,
      aFaire: allKnown.filter((t) => t.statut === StatutTache.A_FAIRE).length,
      enCours: allKnown.filter((t) => t.statut === StatutTache.EN_COURS).length,
      terminees: allKnown.filter((t) => t.statut === StatutTache.TERMINEE).length,
      enRetard: tachesEnRetard.length,
      projetsCount: uniqueProjects.size,
    }
  }, [projetStats, mesTaches, tachesEnRetard])

  const globalDonut = useMemo(() => {
    if (projetStats.length > 0) {
      return {
        [StatutTache.A_FAIRE]: projetStats.reduce((s, p) => s + p.aFaire, 0),
        [StatutTache.EN_COURS]: projetStats.reduce((s, p) => s + p.enCours, 0),
        [StatutTache.EN_ATTENTE]: projetStats.reduce((s, p) => s + p.enAttente, 0),
        [StatutTache.TERMINEE]: projetStats.reduce((s, p) => s + p.terminees, 0),
        [StatutTache.ANNULEE]: projetStats.reduce((s, p) => s + p.annulees, 0),
      }
    }
    const allKnown = [...mesTaches]
    for (const tr of tachesEnRetard) {
      if (!allKnown.some((t) => t.id === tr.id)) allKnown.push(tr)
    }
    return {
      [StatutTache.A_FAIRE]: allKnown.filter((t) => t.statut === StatutTache.A_FAIRE).length,
      [StatutTache.EN_COURS]: allKnown.filter((t) => t.statut === StatutTache.EN_COURS).length,
      [StatutTache.EN_ATTENTE]: allKnown.filter((t) => t.statut === StatutTache.EN_ATTENTE).length,
      [StatutTache.TERMINEE]: allKnown.filter((t) => t.statut === StatutTache.TERMINEE).length,
      [StatutTache.ANNULEE]: allKnown.filter((t) => t.statut === StatutTache.ANNULEE).length,
    }
  }, [projetStats, mesTaches, tachesEnRetard])

  const projectKpis = useMemo(() => ({
    total: taches.length,
    aFaire: taches.filter((t) => t.statut === StatutTache.A_FAIRE).length,
    enCours: taches.filter((t) => t.statut === StatutTache.EN_COURS).length,
    terminees: taches.filter((t) => t.statut === StatutTache.TERMINEE).length,
    enRetard: tachesEnRetard.filter((t) => t.projetId === selectedProjetId).length,
  }), [taches, tachesEnRetard, selectedProjetId])

  // ---------- Export Excel ----------
  const handleExportExcel = useCallback(async () => {
    if (exporting) return
    setExporting(true)
    try {
      // Charger toutes les taches de tous les projets accessibles
      const projetIds = projetStats.length > 0
        ? projetStats.map((p) => p.projetId)
        : allProjets.map((p) => p.id)
      const allTachesPromises = projetIds.map((id) => planningApi.getAllTachesByProjet(id).catch(() => []))
      const results = await Promise.all(allTachesPromises)
      const allTaches = results.flat()

      await exportPlanningExcel(projetStats, tachesEnRetard, allTaches)
      toast({ message: 'Fichier Excel genere avec succes', variant: 'success' })
    } catch (err) {
      console.error('Export Excel error:', err)
      toast({ message: 'Erreur lors de la generation du fichier Excel', variant: 'error' })
    } finally {
      setExporting(false)
    }
  }, [exporting, projetStats, allProjets, tachesEnRetard, toast])

  const triParSemaine = (a: Tache, b: Tache) => {
    const aAbs = (a.annee ?? 9999) * 53 + (a.semaine ?? 99)
    const bAbs = (b.annee ?? 9999) * 53 + (b.semaine ?? 99)
    return aAbs - bAbs
  }

  const tachesActives = useMemo(
    () => taches
      .filter((t) => t.statut !== StatutTache.TERMINEE && t.statut !== StatutTache.ANNULEE)
      .sort(triParSemaine),
    [taches]
  )
  const tachesHistorique = useMemo(
    () => taches
      .filter((t) => t.statut === StatutTache.TERMINEE || t.statut === StatutTache.ANNULEE)
      .sort(triParSemaine),
    [taches]
  )

  const projectDonut = useMemo(() => ({
    [StatutTache.A_FAIRE]: projectKpis.aFaire,
    [StatutTache.EN_COURS]: projectKpis.enCours,
    [StatutTache.EN_ATTENTE]: taches.filter((t) => t.statut === StatutTache.EN_ATTENTE).length,
    [StatutTache.TERMINEE]: projectKpis.terminees,
    [StatutTache.ANNULEE]: taches.filter((t) => t.statut === StatutTache.ANNULEE).length,
  }), [taches, projectKpis])

  // ---------- Suggestions ----------
  const suggestionGroups = useMemo(() => {
    const q = formTitre.toLowerCase()
    const groups: { label: string; source: string; color: string; items: { value: string; label: string }[] }[] = []

    for (const g of SUGGESTION_GROUPS) {
      const items = PREVISION_DESCRIPTION_OPTIONS
        .filter((o) => o.group === g)
        .filter((o) => !q || o.label.toLowerCase().includes(q))
      if (items.length > 0) groups.push({ label: g, source: 'référentiel BTP', color: 'var(--db-orange)', items })
    }

    for (const chap of dqeChapitres) {
      const items = (chap.lignes ?? [])
        .map((l) => ({
          value: `[DQE] ${l.numeroPoste ?? ''} — ${l.designation}`,
          label: `${l.numeroPoste ?? ''} — ${l.designation}${l.unite ? ` (${l.unite})` : ''}`,
        }))
        .filter((o) => !q || o.label.toLowerCase().includes(q))
      if (items.length > 0) groups.push({ label: `DQE — Chap. ${chap.numero} ${chap.designation}`, source: 'DQE du projet', color: 'var(--db-teal)', items })
    }

    return groups
  }, [formTitre, dqeChapitres])

  // ---------- Handlers ----------
  const resetForm = () => {
    setFormTitre('')
    setFormDescription('')
    setFormPriorite(Priorite.NORMALE)
    setFormStatut(StatutTache.A_FAIRE)
    setFormDateDebut('')
    setFormDateFin('')
    setFormDateEcheance('')
    setFormAvancement(0)
    setFormAssigneAId('')
    setFormSemaine('')
    setFormAnnee('')
    setFormTypePrevision('')
    setFormTacheParentId('')
    setFormEstJalon(false)
    setFormErrors({})
    setEditingTache(null)
  }

  const openCreate = () => {
    resetForm()
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000)
    const currentWeek = Math.ceil((days + startOfYear.getDay() + 1) / 7)
    setFormSemaine(String(Math.min(currentWeek, 53)))
    setFormAnnee(String(now.getFullYear()))
    setShowModal(true)
  }

  const openEdit = (tache: Tache) => {
    setEditingTache(tache)
    setFormTitre(tache.titre)
    setFormDescription(tache.description ?? '')
    setFormPriorite(tache.priorite)
    setFormStatut(tache.statut)
    setFormDateDebut(tache.dateDebut ?? '')
    setFormDateFin(tache.dateFin ?? '')
    setFormDateEcheance(tache.dateEcheance ?? '')
    setFormAvancement(tache.pourcentageAvancement)
    setFormAssigneAId(tache.assigneA?.id ? String(tache.assigneA.id) : '')
    setFormSemaine(tache.semaine != null ? String(tache.semaine) : '')
    setFormAnnee(tache.annee != null ? String(tache.annee) : '')
    setFormTypePrevision(tache.typePrevision ?? '')
    setFormTacheParentId(tache.tacheParentId != null ? String(tache.tacheParentId) : '')
    setFormEstJalon(tache.estJalon)
    setFormErrors({})
    setShowModal(true)
  }

  const refreshSecondaryData = () => {
    dispatch(fetchTachesEnRetard()).catch((e: unknown) => console.error('fetchTachesEnRetard failed', e))
    if (currentUser?.id) dispatch(fetchMesTaches(currentUser.id)).catch((e: unknown) => console.error('fetchMesTaches failed', e))
  }

  const handleSubmit = async () => {
    if (!selectedProjetId || !formTitre.trim() || submitting) return
    setSubmitting(true)

    const errors: Record<string, string> = {}
    if (formDateDebut && formDateFin && formDateFin < formDateDebut) {
      errors.dateFin = t('validationDateFinAvantDebut', { defaultValue: 'La date de fin ne peut pas être antérieure à la date de début' })
    }
    if (formDateDebut && formDateEcheance && formDateEcheance < formDateDebut) {
      errors.dateEcheance = t('validationDateEcheanceAvantDebut', { defaultValue: "La date d'échéance ne peut pas être antérieure à la date de début" })
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setSubmitting(false)
      return
    }
    setFormErrors({})

    const effectiveTypePrevision = (formTypePrevision as TypePrevision)
      || ((formSemaine || formAnnee) ? TypePrevision.HEBDOMADAIRE : undefined)

    if (editingTache) {
      const req: TacheUpdateRequest = {
        titre: formTitre.trim(),
        description: formDescription.trim() || undefined,
        statut: formStatut,
        priorite: formPriorite,
        dateDebut: formDateDebut || undefined,
        dateFin: formDateFin || undefined,
        dateEcheance: formDateEcheance || undefined,
        pourcentageAvancement: formAvancement,
        assigneAId: formAssigneAId ? Number(formAssigneAId) : undefined,
        semaine: formSemaine ? Number(formSemaine) : undefined,
        annee: formAnnee ? Number(formAnnee) : undefined,
        typePrevision: effectiveTypePrevision,
        tacheParentId: formTacheParentId ? Number(formTacheParentId) : undefined,
        estJalon: formEstJalon,
      }
      await dispatch(updateTache({ id: editingTache.id, request: req }))
      toast({ message: t('modalUpdateSuccess'), variant: 'success' })
    } else {
      const req: TacheCreateRequest = {
        projetId: selectedProjetId,
        titre: formTitre.trim(),
        description: formDescription.trim() || undefined,
        statut: formStatut,
        priorite: formPriorite,
        dateDebut: formDateDebut || undefined,
        dateFin: formDateFin || undefined,
        dateEcheance: formDateEcheance || undefined,
        assigneAId: formAssigneAId ? Number(formAssigneAId) : undefined,
        semaine: formSemaine ? Number(formSemaine) : undefined,
        annee: formAnnee ? Number(formAnnee) : undefined,
        typePrevision: effectiveTypePrevision,
        pourcentageAvancement: formAvancement || undefined,
        tacheParentId: formTacheParentId ? Number(formTacheParentId) : undefined,
        estJalon: formEstJalon,
      }
      await dispatch(createTache(req))
      toast({ message: t('modalCreateSuccess'), variant: 'success' })
    }
    setShowModal(false)
    resetForm()
    const pid = selectedProjetIdRef.current
    if (pid) dispatch(fetchTachesByProjet({ projetId: pid })).catch(() => {})
    refreshSecondaryData()
    setSubmitting(false)
  }

  const handleStatusChange = async (tache: Tache, statut: StatutTache) => {
    try {
      await dispatch(updateTache({ id: tache.id, request: { statut } })).unwrap()
    } catch {
      toast({ message: t('updateError', { defaultValue: 'Erreur lors de la mise à jour.' }), variant: 'error' })
    }
    refreshSecondaryData()
  }

  const handleDelete = async (id: number) => {
    if (!(await confirm({ messageKey: 'confirm.deleteTask' }))) return
    try {
      await dispatch(deleteTache(id)).unwrap()
      toast({ message: t('deleteSuccess'), variant: 'success' })
    } catch {
      toast({ message: t('deleteError', { defaultValue: 'Erreur lors de la suppression. Veuillez réessayer.' }), variant: 'error' })
    }
    const pid = selectedProjetIdRef.current
    if (pid) dispatch(fetchTachesByProjet({ projetId: pid })).catch(() => {})
    refreshSecondaryData()
  }

  const handleDeleteMultiple = (ids: number[]) => {
    if (ids.length === 0) return
    setBulkDeleteIds(ids)
    setBulkConfirmed(false)
  }

  const executeBulkDelete = async () => {
    if (bulkDeleteIds.length === 0) return
    const results = await Promise.allSettled(bulkDeleteIds.map((id) => dispatch(deleteTache(id)).unwrap()))
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed === 0) {
      toast({ message: t('deleteMultipleSuccess', { count: bulkDeleteIds.length, defaultValue: '{{count}} tâche(s) supprimée(s)' }), variant: 'success' })
    } else {
      toast({ message: t('deleteMultiplePartial', { failed, defaultValue: `${failed} tâche(s) n'ont pas pu être supprimée(s)` }), variant: 'error' })
    }
    setBulkDeleteIds([])
    setBulkConfirmed(false)
    const pid = selectedProjetIdRef.current
    if (pid) dispatch(fetchTachesByProjet({ projetId: pid })).catch(() => {})
    refreshSecondaryData()
  }

  // ---------- Modal input styles ----------
  const inputStyle: React.CSSProperties = {
    width: '100%', height: 36,
    border: '1px solid var(--db-border-str)',
    borderRadius: 'var(--db-radius-xs)',
    background: 'var(--db-card)',
    color: 'var(--db-t1)',
    fontSize: 12.5, fontWeight: 500,
    padding: '0 9px',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700,
    letterSpacing: '.06em', textTransform: 'uppercase',
    color: 'var(--db-t2)', marginBottom: 6,
  }

  // ---------- Render ----------
  if (!currentUser) {
    return (
      <PageContainer size="full" style={{ background: 'var(--db-page)' }}>
        <div className="rounded-xl p-10 text-center text-sm" style={{ background: 'var(--db-card)', color: 'var(--db-t2)' }}>
          {t('loginRequired')}
        </div>
      </PageContainer>
    )
  }

  const viewTabs = [
    { id: 'table' as PlanningView, label: t('viewTable', { defaultValue: 'Tableau' }) },
    { id: 'gantt' as PlanningView, label: t('viewGantt', { defaultValue: 'Gantt' }) },
    { id: 'kanban' as PlanningView, label: t('viewKanban', { defaultValue: 'Kanban' }) },
  ]

  return (
    <PageContainer size="full" className="pb-8 planning-focus" style={{ background: 'var(--db-page)' }}>
      <div style={{ padding: '20px 24px 34px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <PlanningHeader
          projets={allProjets}
          selectedProjetId={selectedProjetId}
          onSelectProjet={setSelectedProjetId}
          canEdit={canEdit}
          onNewTask={openCreate}
          readOnly={!!selectedProjetId && !canEdit}
          onExport={handleExportExcel}
          exporting={exporting}
        />

        {/* Alert bar */}
        <PlanningAlertBar
          tachesEnRetard={tachesEnRetard}
          selectedProjetId={selectedProjetId}
        />

        {/* KPIs */}
        {!selectedProjetId ? (
          <PlanningKpiRow {...globalKpis} />
        ) : (
          <PlanningKpiRow {...projectKpis} />
        )}

        {/* ========== GLOBAL VIEW ========== */}
        {!selectedProjetId && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 16, alignItems: 'start' }}>
            {/* Left: project list + overdue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Call to action */}
              <div style={{
                background: 'var(--db-card)', border: '1px solid var(--db-border)',
                borderRadius: 'var(--db-radius)', padding: '22px 24px',
                display: 'flex', gap: 22, alignItems: 'center',
              }}>
                <div style={{
                  width: 56, height: 56, minWidth: 56,
                  borderRadius: 'var(--db-radius)',
                  background: 'var(--db-orange-soft)',
                  border: '1px solid var(--db-orange)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, color: 'var(--db-orange)', fontWeight: 700,
                }}>↗</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>
                    Sélectionnez un projet pour commencer la planification
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--db-t2)', marginTop: 5, maxWidth: 620, lineHeight: 1.5 }}>
                    Cette vue globale rassemble vos responsabilités sur l'ensemble de vos chantiers. Choisissez un projet dans le sélecteur ci-dessus pour accéder au planning détaillé — tableau, Gantt, Kanban, dépendances et chemin critique.
                  </div>
                </div>
              </div>

              {/* Project list */}
              <div style={{
                background: 'var(--db-card)', border: '1px solid var(--db-border)',
                borderRadius: 'var(--db-radius)', overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 18px', borderBottom: '1px solid var(--db-border)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Mes projets accessibles</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--db-t2)',
                    background: 'var(--db-subtle)', borderRadius: 20, padding: '2px 8px',
                  }}>{projetStats.length > 0 ? projetStats.length : allProjets.length}</span>
                </div>
                {(projetStats.length > 0 ? projetStats : allProjets.map((p) => ({
                  projetId: p.id, projetNom: p.nom, ville: p.ville ?? null,
                  total: 0, aFaire: 0, enCours: 0, enAttente: 0, terminees: 0, annulees: 0, enRetard: 0, avancement: 0,
                }))).map((ps) => (
                    <div
                      key={ps.projetId}
                      onClick={() => setSelectedProjetId(ps.projetId)}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr 90px 90px 110px 150px',
                        gap: 12, alignItems: 'center',
                        padding: '13px 18px',
                        borderBottom: '1px solid var(--db-border)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--db-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{ps.projetNom}</div>
                        <div style={{ fontSize: 11, color: 'var(--db-t3)', marginTop: 2 }}>{ps.ville || ''}</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--db-t2)' }}>
                        <b style={{ color: 'var(--db-t1)', fontSize: 13 }}>{ps.total}</b> tâches
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--db-t2)' }}>
                        <b style={{ color: 'var(--db-t1)', fontSize: 13 }}>{ps.enCours}</b> en cours
                      </div>
                      <div style={{
                        fontSize: 11.5, fontWeight: 700,
                        color: ps.enRetard > 0 ? 'var(--db-danger)' : 'var(--db-success)',
                        background: ps.enRetard > 0 ? 'var(--db-danger-bg2)' : 'var(--db-success-bg)',
                        border: `1px solid ${ps.enRetard > 0 ? 'var(--db-danger)' : 'var(--db-success)'}`,
                        borderRadius: 'var(--db-radius-xs)', padding: '3px 7px', textAlign: 'center',
                      }}>
                        {ps.enRetard > 0 ? `${ps.enRetard} en retard` : 'à jour'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'var(--db-subtle)', overflow: 'hidden' }}>
                          <div style={{ width: `${ps.avancement}%`, height: '100%', borderRadius: 4, background: 'var(--db-teal)' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{ps.avancement}%</span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Global overdue table */}
              {tachesEnRetard.length > 0 && (
                <div style={{
                  background: 'var(--db-card)', border: '1px solid var(--db-border)',
                  borderRadius: 'var(--db-radius)', overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '14px 18px', borderBottom: '1px solid var(--db-border)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--db-danger)',
                      animation: 'mkPulse 1.8s ease-in-out infinite',
                    }} />
                    <span style={{ fontSize: 13.5, fontWeight: 800 }}>Mes tâches en retard — tous projets</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#fff',
                      background: 'var(--db-danger)', borderRadius: 20, padding: '2px 8px',
                    }}>{tachesEnRetard.length}</span>
                  </div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '30px 1fr 200px 70px 100px 110px',
                    gap: 12, padding: '9px 18px',
                    background: 'var(--db-subtle)',
                    borderBottom: '1px solid var(--db-border)',
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: '.07em', textTransform: 'uppercase' as const,
                    color: 'var(--db-t3)',
                  }}>
                    <span /><span>Tâche</span><span>Projet</span><span>Sem.</span><span>Priorité</span><span>Échéance</span>
                  </div>
                  {tachesEnRetard.slice(0, 5).map((tr) => {
                    const pc = {
                      [Priorite.BASSE]: { color: '#8FA3AD', soft: 'rgba(143,163,173,.16)' },
                      [Priorite.NORMALE]: { color: '#6B7280', soft: 'var(--db-subtle)' },
                      [Priorite.HAUTE]: { color: 'var(--db-orange)', soft: 'var(--db-orange-soft)' },
                      [Priorite.URGENTE]: { color: '#E4572E', soft: 'rgba(228,87,46,.14)' },
                      [Priorite.CRITIQUE]: { color: 'var(--db-danger)', soft: 'var(--db-danger-bg2)' },
                    }[tr.priorite]
                    return (
                      <div
                        key={tr.id}
                        style={{
                          display: 'grid', gridTemplateColumns: '30px 1fr 200px 70px 100px 110px',
                          gap: 12, alignItems: 'center',
                          padding: '11px 18px',
                          borderBottom: '1px solid var(--db-border)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--db-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: 'var(--db-danger)',
                          animation: 'mkPulse 1.8s ease-in-out infinite',
                        }} />
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{tr.titre}</div>
                        <div style={{ fontSize: 12, color: 'var(--db-t2)' }}>{tr.projetNom}</div>
                        <div style={{ fontSize: 12, color: 'var(--db-t2)', fontVariantNumeric: 'tabular-nums' }}>
                          {tr.semaine ? `S${tr.semaine}·${String(tr.annee ?? '').slice(2)}` : '—'}
                        </div>
                        <div>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 11, fontWeight: tr.priorite === Priorite.CRITIQUE ? 800 : 700,
                            color: tr.priorite === Priorite.CRITIQUE ? '#fff' : pc.color,
                            background: tr.priorite === Priorite.CRITIQUE ? pc.color : pc.soft,
                            border: `1px solid ${pc.color}`,
                            borderRadius: 'var(--db-radius-xs)', padding: '3px 7px',
                          }}>{t(`priorite.${tr.priorite}`)}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--db-danger)', fontVariantNumeric: 'tabular-nums' }}>
                          {tr.dateEcheance ? `${tr.dateEcheance.split('-')[2]}/${tr.dateEcheance.split('-')[1]}/${tr.dateEcheance.split('-')[0].slice(2)}` : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: Donut + Priority bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <PlanningDonut counts={globalDonut} label="Répartition globale par statut" large subtitle={`${globalKpis.total} tâches · ${globalKpis.projetsCount} projets`} />
              {(mesTaches.length > 0 || tachesEnRetard.length > 0) && (
                <PrioriteBars taches={[...mesTaches, ...tachesEnRetard.filter((tr) => !mesTaches.some((m) => m.id === tr.id))]} />
              )}
            </div>
          </div>
        )}

        {/* ========== PROJECT VIEW ========== */}
        {selectedProjetId && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 16, alignItems: 'start' }}>
            {/* Left: view tabs + content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* View tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  display: 'flex', gap: 3,
                  background: 'var(--db-subtle)',
                  border: '1px solid var(--db-border)',
                  borderRadius: 'var(--db-radius-sm)',
                  padding: 3,
                }}>
                  {viewTabs.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setActiveView(v.id)}
                      style={{
                        height: 30, padding: '0 16px',
                        borderRadius: 'var(--db-radius-xs)',
                        border: 0,
                        background: activeView === v.id ? 'var(--db-card)' : 'transparent',
                        color: activeView === v.id ? 'var(--db-t1)' : 'var(--db-t2)',
                        fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                        boxShadow: activeView === v.id ? '0 1px 3px rgba(0,0,0,.12)' : undefined,
                      }}
                    >{v.label}</button>
                  ))}
                </div>

                {activeView === 'gantt' && cheminCritique.length > 0 && (
                  <span style={{
                    fontSize: 11.5, fontWeight: 700,
                    color: 'var(--db-danger)',
                    background: 'var(--db-danger-bg2)',
                    border: '1px solid var(--db-danger)',
                    borderRadius: 'var(--db-radius-xs)',
                    padding: '5px 9px',
                  }}>Chemin critique : {cheminCritique.length} tâches</span>
                )}

                <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--db-t2)' }}>
                  Tri par semaine de prévision · {taches.length} tâches
                </span>
              </div>

              {/* Empty state */}
              {taches.length === 0 && !loading && (
                <div style={{
                  background: 'var(--db-card)', border: '1px solid var(--db-border)',
                  borderRadius: 'var(--db-radius)',
                  padding: '64px 24px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 18, textAlign: 'center',
                }}>
                  <div style={{
                    width: 200, height: 120,
                    borderRadius: 'var(--db-radius-sm)',
                    border: '1px dashed var(--db-border-str)',
                    background: 'repeating-linear-gradient(135deg,var(--db-subtle) 0 8px,transparent 8px 16px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 10, color: 'var(--db-t3)', letterSpacing: '.06em', fontFamily: 'monospace' }}>
                      illustration planning vide
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>Aucune tâche sur ce projet</div>
                    <div style={{ fontSize: 13, color: 'var(--db-t2)', marginTop: 6, maxWidth: 430, lineHeight: 1.55 }}>
                      Le planning de <b>{selectedProjet?.nom}</b> est vide. Créez la première tâche, ou importez les chapitres du DQE pour générer automatiquement la structure du planning.
                    </div>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={openCreate} style={{
                        height: 40, padding: '0 18px', border: 0,
                        borderRadius: 'var(--db-radius-sm)',
                        background: 'var(--db-orange)', color: '#fff',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      }}>+ Créer une tâche</button>
                      <button style={{
                        height: 40, padding: '0 18px',
                        border: '1px solid var(--db-border-str)',
                        borderRadius: 'var(--db-radius-sm)',
                        background: 'var(--db-card)', color: 'var(--db-t1)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}>Importer depuis le DQE</button>
                    </div>
                  )}
                </div>
              )}

              {/* Table view */}
              {activeView === 'table' && taches.length > 0 && (
                <div className="planning-view-enter" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <TachesTable
                    taches={tachesActives}
                    loading={loading}
                    canEdit={canEdit}
                    isOnline={isOnline}
                    filterStatut={filterStatut}
                    onFilterChange={setFilterStatut}
                    onStatusChange={handleStatusChange}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onDeleteMultiple={handleDeleteMultiple}
                    title={t('tachesActivesTitle')}
                    filterStatuts={[StatutTache.A_FAIRE, StatutTache.EN_COURS, StatutTache.EN_ATTENTE]}
                  />
                  <TachesTable
                    taches={tachesHistorique}
                    loading={false}
                    canEdit={canEdit}
                    isOnline={isOnline}
                    filterStatut={filterHistorique}
                    onFilterChange={setFilterHistorique}
                    onStatusChange={handleStatusChange}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onDeleteMultiple={handleDeleteMultiple}
                    title={t('tachesHistoriqueTitle')}
                    filterStatuts={[StatutTache.TERMINEE, StatutTache.ANNULEE]}
                  />
                </div>
              )}

              {/* Gantt view */}
              {activeView === 'gantt' && (
                <div className="planning-view-enter">
                  <GanttChart
                    taches={taches}
                    dependances={dependances}
                    cheminCritique={cheminCritique}
                    onEdit={canEdit ? openEdit : undefined}
                  />
                </div>
              )}

              {/* Kanban view */}
              {activeView === 'kanban' && (
                <div className="planning-view-enter">
                  <KanbanBoard
                    taches={taches.filter((t) => t.statut !== StatutTache.ANNULEE)}
                    canEdit={canEdit}
                    onStatusChange={handleStatusChange}
                    onEdit={openEdit}
                  />
                </div>
              )}
            </div>

            {/* Right panel: Donut + Priority + Overdue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <PlanningDonut counts={projectDonut} />
              <PrioriteBars taches={taches} />
              <TachesRetardList taches={tachesEnRetard} selectedProjetId={selectedProjetId} />
            </div>
          </div>
        )}
      </div>

      {/* ===== Create / Edit Modal ===== */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm() }}
        title={editingTache ? t('modalEditTitle') : t('modalTitle')}
        size="lg"
        footer={
          <div style={{
            padding: '14px 22px', borderTop: '1px solid var(--db-border)',
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--db-subtle)',
          }}>
            <span style={{ fontSize: 11.5, color: 'var(--db-t3)' }}>
              Le titre est obligatoire · la date de fin ne peut précéder la date de début
            </span>
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm() }}
              style={{
                marginLeft: 'auto', height: 38, padding: '0 16px',
                border: '1px solid var(--db-border-str)',
                background: 'var(--db-card)', color: 'var(--db-t1)',
                borderRadius: 'var(--db-radius-sm)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >{t('modalCancel')}</button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!formTitre.trim() || !isOnline || submitting}
              style={{
                height: 38, padding: '0 18px', border: 0,
                borderRadius: 'var(--db-radius-sm)',
                background: formTitre.trim() ? 'var(--db-orange)' : 'var(--db-subtle)',
                color: formTitre.trim() ? '#fff' : 'var(--db-t3)',
                fontSize: 13, fontWeight: 700,
                cursor: formTitre.trim() ? 'pointer' : 'not-allowed',
              }}
            >{editingTache ? t('modalUpdate') : t('modalCreate')}</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '20px 22px' }}>
          {/* Titre with suggestions */}
          <div style={{ position: 'relative' }} ref={suggestionsRef}>
            <label style={labelStyle}>Titre de la tâche <span style={{ color: 'var(--db-danger)' }}>*</span></label>
            <input
              type="text"
              value={formTitre}
              onChange={(e) => setFormTitre(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Ex. Coulage dalle R+1"
              style={{
                ...inputStyle, height: 42,
                borderWidth: 1.5,
                borderColor: 'var(--db-orange)',
                fontSize: 13.5,
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--db-t3)' }}>Suggestions BTP filtrées en temps réel</span>
              <span style={{ fontSize: 11, color: 'var(--db-t3)', fontVariantNumeric: 'tabular-nums' }}>{formTitre.length}/300</span>
            </div>

            {showSuggestions && suggestionGroups.length > 0 && (
              <div style={{
                position: 'absolute', top: 70, left: 0, right: 0,
                background: 'var(--db-card)',
                border: '1px solid var(--db-border-str)',
                borderRadius: 'var(--db-radius-sm)',
                boxShadow: '0 16px 40px rgba(0,0,0,.18)',
                maxHeight: 300, overflow: 'auto', zIndex: 5,
              }}>
                {suggestionGroups.map((g) => (
                  <div key={g.label}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px',
                      background: 'var(--db-subtle)',
                      borderBottom: '1px solid var(--db-border)',
                      position: 'sticky', top: 0,
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: g.color }} />
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--db-t2)' }}>
                        {g.label}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--db-t3)' }}>{g.source}</span>
                    </div>
                    {g.items.map((item) => (
                      <div
                        key={item.value}
                        onClick={() => { setFormTitre(item.value); setShowSuggestions(false) }}
                        style={{
                          padding: '9px 12px 9px 32px', fontSize: 12.5,
                          borderBottom: '1px solid var(--db-border)',
                          cursor: 'pointer',
                          display: 'flex', gap: 8, alignItems: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--db-orange-soft)'
                          e.currentTarget.style.color = 'var(--db-orange)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--db-t1)'
                        }}
                      >
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <span style={{ fontSize: 10, color: 'var(--db-t3)' }}>↵</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Contexte, mode opératoire, réserves…"
              style={{
                width: '100%', height: 70,
                border: '1px solid var(--db-border-str)',
                borderRadius: 'var(--db-radius-xs)',
                background: 'var(--db-card)', color: 'var(--db-t1)',
                fontSize: 13, padding: '10px 12px', resize: 'vertical',
              }}
            />
          </div>

          {/* Statut + Priorite + Assigne + Parent */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div>
              <label style={labelStyle}>Statut</label>
              <select value={formStatut} onChange={(e) => setFormStatut(e.target.value as StatutTache)} style={inputStyle}>
                {Object.values(StatutTache).map((s) => (
                  <option key={s} value={s}>{t(`statut.${s}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priorité</label>
              <select value={formPriorite} onChange={(e) => setFormPriorite(e.target.value as Priorite)} style={inputStyle}>
                {Object.values(Priorite).map((p) => (
                  <option key={p} value={p}>{t(`priorite.${p}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assigné à</label>
              <select value={formAssigneAId} onChange={(e) => setFormAssigneAId(e.target.value)} style={inputStyle}>
                <option value="">Non assignée</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tâche parente</label>
              <select value={formTacheParentId} onChange={(e) => setFormTacheParentId(e.target.value)} style={inputStyle}>
                <option value="">Aucune</option>
                {taches.filter((t) => t.id !== editingTache?.id).map((t) => (
                  <option key={t.id} value={t.id}>{t.titre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={{
            border: '1px solid var(--db-border)',
            borderRadius: 'var(--db-radius-sm)',
            padding: '14px 16px',
            background: 'var(--db-subtle)',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800,
              letterSpacing: '.07em', textTransform: 'uppercase' as const,
              color: 'var(--db-t2)', marginBottom: 10,
            }}>Dates</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, color: 'var(--db-t2)', marginBottom: 5 }}>Début</label>
                <input
                  type="date" value={formDateDebut}
                  onChange={(e) => { setFormDateDebut(e.target.value); setFormErrors((prev) => { const { dateFin, dateEcheance, ...rest } = prev; return rest }) }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, color: 'var(--db-t2)', marginBottom: 5 }}>Fin</label>
                <input
                  type="date" value={formDateFin}
                  onChange={(e) => { setFormDateFin(e.target.value); setFormErrors((prev) => { const { dateFin, ...rest } = prev; return rest }) }}
                  style={{ ...inputStyle, borderColor: formErrors.dateFin ? 'var(--db-danger)' : 'var(--db-border-str)' }}
                />
                {formErrors.dateFin && <p style={{ fontSize: 11, color: 'var(--db-danger)', marginTop: 4 }}>{formErrors.dateFin}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, color: 'var(--db-t2)', marginBottom: 5 }}>Échéance</label>
                <input
                  type="date" value={formDateEcheance}
                  onChange={(e) => { setFormDateEcheance(e.target.value); setFormErrors((prev) => { const { dateEcheance, ...rest } = prev; return rest }) }}
                  style={{ ...inputStyle, borderColor: formErrors.dateEcheance ? 'var(--db-danger)' : 'var(--db-border-str)' }}
                />
                {formErrors.dateEcheance && <p style={{ fontSize: 11, color: 'var(--db-danger)', marginTop: 4 }}>{formErrors.dateEcheance}</p>}
              </div>
            </div>
          </div>

          {/* Avancement */}
          <div style={{
            border: '1px solid var(--db-border)',
            borderRadius: 'var(--db-radius-sm)',
            padding: '14px 16px',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800,
              letterSpacing: '.07em', textTransform: 'uppercase' as const,
              color: 'var(--db-t2)', marginBottom: 10,
            }}>Avancement</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <input
                type="range" min={0} max={100} value={formAvancement}
                onChange={(e) => setFormAvancement(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#FF6B35' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number" min={0} max={100} value={formAvancement}
                  onChange={(e) => setFormAvancement(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  style={{
                    width: 66, height: 36,
                    border: '1px solid var(--db-border-str)',
                    borderRadius: 'var(--db-radius-xs)',
                    background: 'var(--db-card)', color: 'var(--db-t1)',
                    fontSize: 13, fontWeight: 700, textAlign: 'center',
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-t2)' }}>%</span>
              </div>
            </div>
          </div>

          {/* Prevision */}
          <div style={{
            border: '1px dashed var(--db-border-str)',
            borderRadius: 'var(--db-radius-sm)',
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 800,
                letterSpacing: '.07em', textTransform: 'uppercase' as const,
                color: 'var(--db-t2)',
              }}>Prévision</span>
              <span style={{
                fontSize: 10.5, fontWeight: 600, color: 'var(--db-t3)',
                border: '1px solid var(--db-border)',
                borderRadius: 3, padding: '1px 5px',
              }}>optionnel</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 110px 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, color: 'var(--db-t2)', marginBottom: 5 }}>Semaine</label>
                <select value={formSemaine} onChange={(e) => setFormSemaine(e.target.value)} style={inputStyle}>
                  <option value="">—</option>
                  {Array.from({ length: 53 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>S{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, color: 'var(--db-t2)', marginBottom: 5 }}>Année</label>
                <select value={formAnnee} onChange={(e) => setFormAnnee(e.target.value)} style={inputStyle}>
                  <option value="">—</option>
                  {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, color: 'var(--db-t2)', marginBottom: 5 }}>Type de prévision</label>
                <select value={formTypePrevision} onChange={(e) => setFormTypePrevision(e.target.value)} style={inputStyle}>
                  <option value="">—</option>
                  {Object.values(TypePrevision).map((tp) => (
                    <option key={tp} value={tp}>{t(`typePrevision.${tp}`)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Jalon */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: 'var(--db-t2)' }}>
            <input
              type="checkbox"
              checked={formEstJalon}
              onChange={(e) => setFormEstJalon(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: '#FF6B35' }}
            />
            Définir comme jalon du planning
          </label>
        </div>
      </Modal>
      {/* ===== Bulk Delete Modal ===== */}
      {bulkDeleteIds.length > 0 && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,18,22,.52)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 60,
        }}>
          <div style={{
            width: 520,
            background: 'var(--db-card)',
            border: '1px solid var(--db-border)',
            borderRadius: 'var(--db-radius)',
            boxShadow: '0 24px 60px rgba(0,0,0,.3)',
            animation: 'mkModal .18s ease-out',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 22px', display: 'flex', gap: 14 }}>
              <div style={{
                width: 40, height: 40, minWidth: 40,
                borderRadius: 'var(--db-radius-sm)',
                background: 'var(--db-danger-bg2)',
                border: '1px solid var(--db-danger)',
                color: 'var(--db-danger)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 19, fontWeight: 800,
              }}>!</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>
                  Supprimer {bulkDeleteIds.length} tâches ?
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--db-t2)', marginTop: 6, lineHeight: 1.55 }}>
                  Cette action est irréversible. Les sous-tâches rattachées seront supprimées avec leur tâche parente et les dépendances associées seront nettoyées.
                </div>
              </div>
            </div>
            <div style={{ margin: '0 22px', border: '1px solid var(--db-border)', borderRadius: 'var(--db-radius-sm)', overflow: 'hidden' }}>
              {bulkDeleteIds.map((id) => {
                const tache = taches.find((t) => t.id === id)
                if (!tache) return null
                const sm = {
                  [StatutTache.A_FAIRE]: { color: '#6B7280' },
                  [StatutTache.EN_COURS]: { color: 'var(--db-info)' },
                  [StatutTache.EN_ATTENTE]: { color: 'var(--db-warn)' },
                  [StatutTache.TERMINEE]: { color: 'var(--db-success)' },
                  [StatutTache.ANNULEE]: { color: '#B08078' },
                }[tache.statut]
                return (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 12px',
                    borderBottom: '1px solid var(--db-border)',
                    fontSize: 12.5,
                  }}>
                    <span style={{ width: 8, height: 8, minWidth: 8, borderRadius: '50%', background: sm.color }} />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tache.titre}</span>
                    <span style={{ fontSize: 11, color: 'var(--db-t3)' }}>
                      {t(`statut.${tache.statut}`)} · {t(`priorite.${tache.priorite}`)}
                    </span>
                  </div>
                )
              })}
            </div>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 9,
              fontSize: 12.5, color: 'var(--db-t2)',
              padding: '14px 22px 0',
            }}>
              <input
                type="checkbox"
                checked={bulkConfirmed}
                onChange={(e) => setBulkConfirmed(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: '#C8553D' }}
              />
              Je confirme la suppression définitive de ces éléments
            </label>
            <div style={{ padding: '16px 22px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setBulkDeleteIds([]); setBulkConfirmed(false) }}
                style={{
                  height: 38, padding: '0 16px',
                  border: '1px solid var(--db-border-str)',
                  background: 'var(--db-card)', color: 'var(--db-t1)',
                  borderRadius: 'var(--db-radius-sm)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >Annuler</button>
              <button
                type="button"
                onClick={executeBulkDelete}
                disabled={!bulkConfirmed}
                style={{
                  height: 38, padding: '0 16px', border: 0,
                  background: bulkConfirmed ? 'var(--db-danger)' : 'var(--db-subtle)',
                  color: bulkConfirmed ? '#fff' : 'var(--db-t3)',
                  borderRadius: 'var(--db-radius-sm)',
                  fontSize: 13, fontWeight: 700,
                  cursor: bulkConfirmed ? 'pointer' : 'not-allowed',
                }}
              >Supprimer {bulkDeleteIds.length} tâches</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
