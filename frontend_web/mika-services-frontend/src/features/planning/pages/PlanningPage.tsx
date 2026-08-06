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
} from '@/store/slices/planningSlice'
import { fetchProjets, fetchProjetsByResponsable } from '@/store/slices/projetSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import { StatutTache, Priorite, TypePrevision } from '@/types/planning'
import type { TacheCreateRequest, TacheUpdateRequest, Tache } from '@/types/planning'
import { canEditProjetEffective } from '@/utils/authRoles'
import { fetchUsers } from '@/store/slices/userSlice'
import { dqeApi } from '@/api/dqeApi'
import type { DqeChapitre } from '@/types/dqe'

// ---------- Suggestions predefinies BTP (identiques a ProjetFormPage) ----------
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

export default function PlanningPage() {
  const { t } = useTranslation('planning')
  const isOnline = useIsOnline()
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const toast = useToast()

  const currentUser = useAppSelector((s) => s.auth.user)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { taches, tachesEnRetard, mesTaches, loading, totalPages, currentPage } = useAppSelector((s) => s.planning)
  const allProjets = useAppSelector((s) => s.projet.projets)

  // Persister le projet sélectionné dans l'URL (?projet=14) pour survivre au HMR et refresh
  const [searchParams, setSearchParams] = useSearchParams()
  const initialProjetId = searchParams.get('projet') ? Number(searchParams.get('projet')) : null
  const [selectedProjetId, setSelectedProjetIdRaw] = useState<number | null>(initialProjetId)

  const setSelectedProjetId = useCallback((id: number | null) => {
    setSelectedProjetIdRaw(id)
    setSearchParams(id ? { projet: String(id) } : {}, { replace: true })
  }, [setSearchParams])
  const [filterStatut, setFilterStatut] = useState<StatutTache | ''>('')
  const [filterHistorique, setFilterHistorique] = useState<StatutTache | ''>('')
  const [showModal, setShowModal] = useState(false)
  const [editingTache, setEditingTache] = useState<Tache | null>(null)

  // Users for assignee
  const allUsers = useAppSelector((s) => s.user.users)

  // DQE chapitres for suggestions
  const [dqeChapitres, setDqeChapitres] = useState<DqeChapitre[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fermer suggestions au clic exterieur
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ---------- Data loading ----------
  useEffect(() => {
    dispatch(fetchProjets({ size: 200 }))
    dispatch(fetchTachesEnRetard())
    dispatch(fetchUsers({ size: 200 }))
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
    } else {
      setDqeChapitres([])
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

  // ---------- Global KPIs (from mesTaches + tachesEnRetard) ----------
  const globalKpis = useMemo(() => {
    // Combine mesTaches (active for user) + tachesEnRetard for broader counts
    const allKnown = [...mesTaches]
    // Add retard tasks not already in mesTaches
    for (const tr of tachesEnRetard) {
      if (!allKnown.some((t) => t.id === tr.id)) allKnown.push(tr)
    }
    // Count unique projects
    const uniqueProjects = new Set(allKnown.map((t) => t.projetId))
    return {
      total: allKnown.length,
      aFaire: allKnown.filter((t) => t.statut === StatutTache.A_FAIRE).length,
      enCours: allKnown.filter((t) => t.statut === StatutTache.EN_COURS).length,
      terminees: allKnown.filter((t) => t.statut === StatutTache.TERMINEE).length,
      enRetard: tachesEnRetard.length,
      projetsCount: uniqueProjects.size,
    }
  }, [mesTaches, tachesEnRetard])

  const globalDonut = useMemo(() => {
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
  }, [mesTaches, tachesEnRetard])

  // ---------- Project-level KPIs ----------
  const projectKpis = useMemo(() => ({
    total: taches.length,
    aFaire: taches.filter((t) => t.statut === StatutTache.A_FAIRE).length,
    enCours: taches.filter((t) => t.statut === StatutTache.EN_COURS).length,
    terminees: taches.filter((t) => t.statut === StatutTache.TERMINEE).length,
    enRetard: tachesEnRetard.filter((t) => t.projetId === selectedProjetId).length,
  }), [taches, tachesEnRetard, selectedProjetId])

  // Séparer tâches actives / historique (terminées + annulées)
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

  // ---------- Suggestions (titre) ----------
  const suggestionGroups = useMemo(() => {
    const q = formTitre.toLowerCase()
    const groups: { label: string; items: { value: string; label: string }[] }[] = []

    for (const g of SUGGESTION_GROUPS) {
      const items = PREVISION_DESCRIPTION_OPTIONS
        .filter((o) => o.group === g)
        .filter((o) => !q || o.label.toLowerCase().includes(q))
      if (items.length > 0) groups.push({ label: g, items })
    }

    for (const chap of dqeChapitres) {
      const items = (chap.lignes ?? [])
        .map((l) => ({
          value: `[DQE] ${l.numeroPoste ?? ''} — ${l.designation}`,
          label: `${l.numeroPoste ?? ''} — ${l.designation}${l.unite ? ` (${l.unite})` : ''}`,
        }))
        .filter((o) => !q || o.label.toLowerCase().includes(q))
      if (items.length > 0) groups.push({ label: `DQE — Chap. ${chap.numero} ${chap.designation}`, items })
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
    setFormErrors({})
    setEditingTache(null)
  }

  const openCreate = () => {
    resetForm()
    // Auto-remplir semaine et année courantes
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
    setFormErrors({})
    setShowModal(true)
  }

  // Rafraîchir les données secondaires sans toucher aux tâches du projet (déjà à jour dans le reducer)
  const refreshSecondaryData = () => {
    dispatch(fetchTachesEnRetard())
    if (currentUser?.id) dispatch(fetchMesTaches(currentUser.id))
  }

  const handleSubmit = async () => {
    if (!selectedProjetId || !formTitre.trim()) return

    // Validation côté client
    const errors: Record<string, string> = {}
    if (formDateDebut && formDateFin && formDateFin < formDateDebut) {
      errors.dateFin = t('validationDateFinAvantDebut', { defaultValue: 'La date de fin ne peut pas être antérieure à la date de début' })
    }
    if (formDateDebut && formDateEcheance && formDateEcheance < formDateDebut) {
      errors.dateEcheance = t('validationDateEcheanceAvantDebut', { defaultValue: "La date d'échéance ne peut pas être antérieure à la date de début" })
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})

    // Si semaine ou annee renseignee, forcer typePrevision par defaut
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
      }
      await dispatch(createTache(req))
      toast({ message: t('modalCreateSuccess'), variant: 'success' })
    }
    setShowModal(false)
    resetForm()
    // Recharger les tâches du projet pour avoir la liste à jour du serveur (pagination, tri)
    dispatch(fetchTachesByProjet({ projetId: selectedProjetId }))
    refreshSecondaryData()
  }

  const handleStatusChange = async (tache: Tache, statut: StatutTache) => {
    await dispatch(updateTache({ id: tache.id, request: { statut } }))
    // Le reducer met à jour la tâche localement — pas besoin de recharger fetchTachesByProjet
    refreshSecondaryData()
  }

  const handleDelete = async (id: number) => {
    if (!(await confirm({ messageKey: 'confirm.deleteTask' }))) return
    await dispatch(deleteTache(id))
    toast({ message: t('deleteSuccess'), variant: 'success' })
    refreshSecondaryData()
  }

  const handleDeleteMultiple = async (ids: number[]) => {
    if (ids.length === 0) return
    const confirmed = await confirm({
      messageKey: 'confirm.deleteMultipleTasks',
      messageParams: { count: String(ids.length) },
      variant: 'danger',
    })
    if (!confirmed) return
    await Promise.all(ids.map((id) => dispatch(deleteTache(id))))
    toast({ message: t('deleteMultipleSuccess', { count: ids.length, defaultValue: '{{count}} tâche(s) supprimée(s)' }), variant: 'success' })
    refreshSecondaryData()
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

  return (
    <PageContainer size="full" className="pb-8" style={{ background: 'var(--db-page)' }}>
      <div className="px-1 sm:px-2">

        {/* Header */}
        <PlanningHeader
          projets={allProjets}
          selectedProjetId={selectedProjetId}
          onSelectProjet={setSelectedProjetId}
          canEdit={canEdit}
          onNewTask={openCreate}
        />

        {/* Alert bar — toujours visible si retards */}
        <PlanningAlertBar
          tachesEnRetard={tachesEnRetard}
          selectedProjetId={selectedProjetId}
        />

        {/* ========== VUE GLOBALE (aucun projet selectionne) ========== */}
        {!selectedProjetId && (
          <div className="grid grid-cols-12 gap-3">
            {/* KPIs globaux */}
            <PlanningKpiRow {...globalKpis} />

            {/* Retards globaux (8) + Donut global (4) */}
            <TachesRetardList taches={tachesEnRetard} selectedProjetId={null} />
            <PlanningDonut counts={globalDonut} />

            {/* Priorités globales (si des taches connues) */}
            {(mesTaches.length > 0 || tachesEnRetard.length > 0) && (
              <div className="col-span-12 lg:col-span-4 lg:col-start-9">
                {/* Inline PrioriteBars for global */}
              </div>
            )}

            {/* Invite a selectionner un projet */}
            {tachesEnRetard.length === 0 && mesTaches.length === 0 && (
              <div
                className="col-span-12 rounded-xl p-12 text-center"
                style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 120ms both' }}
              >
                <div className="w-14 h-14 mx-auto rounded-xl grid place-items-center mb-4" style={{ background: 'var(--db-subtle)' }}>
                  <svg className="w-7 h-7" style={{ color: 'var(--db-t4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-base font-medium" style={{ color: 'var(--db-t2)' }}>
                  Selectionnez un projet pour voir ses taches en detail
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--db-t4)' }}>
                  {t('headerDescription')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========== VUE PROJET (projet selectionne) ========== */}
        {selectedProjetId && (
          <div className="grid grid-cols-12 gap-3">
            {/* Row 1: KPIs projet */}
            <PlanningKpiRow {...projectKpis} />

            {/* Row 2: Donut (6) + Priorites (6) — bande compacte */}
            <PlanningDonut counts={projectDonut} colSpanClass="col-span-12 md:col-span-6" />
            <PrioriteBars taches={taches} colSpanClass="col-span-12 md:col-span-6" />

            {/* Row 3: Taches actives (6) + Historique terminées (6) */}
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
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={(page) => dispatch(fetchTachesByProjet({ projetId: selectedProjetId, page }))}
              colSpanClass="col-span-12 lg:col-span-6"
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
              totalPages={0}
              currentPage={0}
              onPageChange={() => {}}
              colSpanClass="col-span-12 lg:col-span-6"
              title={t('tachesHistoriqueTitle')}
              filterStatuts={[StatutTache.TERMINEE, StatutTache.ANNULEE]}
            />

            {/* Row 4: Retards */}
            <TachesRetardList taches={tachesEnRetard} selectedProjetId={selectedProjetId} />
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
          <>
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm() }}
              className="px-5 py-2.5 border rounded-xl text-sm font-medium transition hover:bg-[var(--db-subtle)]"
              style={{ borderColor: 'var(--db-border)', color: 'var(--db-t2)' }}
            >
              {t('modalCancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!formTitre.trim() || !isOnline}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: 'var(--db-teal)' }}
            >
              {editingTache ? t('modalUpdate') : t('modalCreate')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Titre avec suggestions */}
          <div className="relative" ref={suggestionsRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('modalTitre')}</label>
            <input
              type="text"
              value={formTitre}
              onChange={(e) => { setFormTitre(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full px-4 py-2.5 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
              style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}
              placeholder={t('modalTitrePlaceholder')}
              autoFocus
            />
            {showSuggestions && suggestionGroups.length > 0 && (
              <div
                className="absolute z-50 top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl shadow-xl border"
                style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)' }}
              >
                {suggestionGroups.map((g) => (
                  <div key={g.label}>
                    <div
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider sticky top-0"
                      style={{ background: 'var(--db-subtle)', color: 'var(--db-t4)' }}
                    >
                      {g.label}
                    </div>
                    {g.items.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--db-subtle)]"
                        style={{ color: 'var(--db-t1)' }}
                        onClick={() => {
                          setFormTitre(item.value)
                          setShowSuggestions(false)
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ))}
                {formTitre.trim() && (
                  <div
                    className="px-3 py-2 text-xs border-t"
                    style={{ borderColor: 'var(--db-border)', color: 'var(--db-t4)' }}
                  >
                    {t('modalSuggestionHint')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('modalDescription')}</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-xl text-sm resize-none transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
              style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}
              rows={2}
              placeholder={t('modalDescriptionPlaceholder')}
            />
          </div>

          {/* Statut + Priorite */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('modalStatut')}</label>
              <select
                value={formStatut}
                onChange={(e) => setFormStatut(e.target.value as StatutTache)}
                className="w-full px-4 py-2.5 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
                style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}
              >
                {Object.values(StatutTache).map((s) => (
                  <option key={s} value={s}>{t(`statut.${s}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('modalPriorite')}</label>
              <select
                value={formPriorite}
                onChange={(e) => setFormPriorite(e.target.value as Priorite)}
                className="w-full px-4 py-2.5 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
                style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}
              >
                {Object.values(Priorite).map((p) => (
                  <option key={p} value={p}>{t(`priorite.${p}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigne a */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('modalAssigneA')}</label>
            <select
              value={formAssigneAId}
              onChange={(e) => setFormAssigneAId(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
              style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}
            >
              <option value="">{t('modalAssigneANone')}</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
              ))}
            </select>
          </div>

          {/* Tâche parente */}
          {taches.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>
                {t('modalTacheParente', { defaultValue: 'Tâche parente' })}
              </label>
              <select
                value={formTacheParentId}
                onChange={(e) => setFormTacheParentId(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
                style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}
              >
                <option value="">{t('modalTacheParenteNone', { defaultValue: 'Aucune (tâche principale)' })}</option>
                {taches
                  .filter((t) => t.id !== editingTache?.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titre}{t.semaine ? ` (S${t.semaine})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Dates : debut, fin, echeance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('modalDateDebut')}</label>
              <input
                type="date"
                value={formDateDebut}
                onChange={(e) => { setFormDateDebut(e.target.value); setFormErrors((prev) => { const { dateFin, dateEcheance, ...rest } = prev; return rest }) }}
                className="w-full px-3 py-2.5 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
                style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('modalDateFin')}</label>
              <input
                type="date"
                value={formDateFin}
                onChange={(e) => { setFormDateFin(e.target.value); setFormErrors((prev) => { const { dateFin, ...rest } = prev; return rest }) }}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40 ${formErrors.dateFin ? 'border-red-500' : ''}`}
                style={{ background: 'var(--db-subtle)', borderColor: formErrors.dateFin ? undefined : 'var(--db-border)', color: 'var(--db-t1)' }}
              />
              {formErrors.dateFin && <p className="text-xs text-red-500 mt-1">{formErrors.dateFin}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('modalDateEcheance')}</label>
              <input
                type="date"
                value={formDateEcheance}
                onChange={(e) => { setFormDateEcheance(e.target.value); setFormErrors((prev) => { const { dateEcheance, ...rest } = prev; return rest }) }}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40 ${formErrors.dateEcheance ? 'border-red-500' : ''}`}
                style={{ background: 'var(--db-subtle)', borderColor: formErrors.dateEcheance ? undefined : 'var(--db-border)', color: 'var(--db-t1)' }}
              />
              {formErrors.dateEcheance && <p className="text-xs text-red-500 mt-1">{formErrors.dateEcheance}</p>}
            </div>
          </div>

          {/* Avancement */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('avancement')}</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={formAvancement}
                onChange={(e) => setFormAvancement(Number(e.target.value))}
                className="flex-1 accent-[var(--db-teal)]"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={formAvancement}
                onChange={(e) => setFormAvancement(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                className="w-16 px-2 py-1.5 border rounded-lg text-sm text-center font-bold db-num focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
                style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--db-t3)' }}>%</span>
            </div>
          </div>

          {/* Prevision : semaine, annee, type */}
          <div
            className="border rounded-xl p-3"
            style={{ borderColor: 'var(--db-border)', background: 'color-mix(in srgb, var(--db-subtle) 50%, transparent)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--db-t4)' }}>{t('modalPrevisionSection')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--db-t3)' }}>{t('modalSemaine')}</label>
                <select
                  value={formSemaine}
                  onChange={(e) => setFormSemaine(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
                  style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}
                >
                  <option value="">—</option>
                  {Array.from({ length: 53 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>S{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--db-t3)' }}>{t('modalAnnee')}</label>
                <select
                  value={formAnnee}
                  onChange={(e) => setFormAnnee(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
                  style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}
                >
                  <option value="">—</option>
                  {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--db-t3)' }}>{t('modalTypePrevision')}</label>
                <select
                  value={formTypePrevision}
                  onChange={(e) => setFormTypePrevision(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
                  style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}
                >
                  <option value="">—</option>
                  {Object.values(TypePrevision).map((tp) => (
                    <option key={tp} value={tp}>{t(`typePrevision.${tp}`)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}
