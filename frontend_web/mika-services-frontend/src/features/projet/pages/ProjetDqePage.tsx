import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useAppSelector } from '@/store/hooks'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { useConfirm } from '@/contexts/ConfirmContext'
import { dqeApi } from '@/api/dqeApi'
import { projetApi } from '@/api/projetApi'
import { canEditProjetEffective } from '@/utils/authRoles'
import type { DqeChapitre, DqeLigne } from '@/types/dqe'
import type { Projet } from '@/types/projet'

// ── Pagination config ────────────────────────────────────────────────
const CHAPITRES_PER_PAGE = 5
const LIGNES_PER_PAGE = 8

// ── Helpers visuels ──────────────────────────────────────────────────

function progressColor(pct: number): string {
  if (pct >= 100) return 'bg-gradient-to-r from-emerald-400 to-emerald-500'
  if (pct >= 75) return 'bg-gradient-to-r from-blue-400 to-blue-500'
  if (pct >= 50) return 'bg-gradient-to-r from-sky-400 to-blue-400'
  if (pct >= 25) return 'bg-gradient-to-r from-amber-400 to-orange-400'
  if (pct > 0) return 'bg-gradient-to-r from-orange-300 to-amber-400'
  return 'bg-gray-200 dark:bg-gray-700'
}

function progressBadgeClass(pct: number): string {
  if (pct >= 100) return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700'
  if (pct >= 50) return 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700'
  if (pct > 0) return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700'
  return 'bg-gray-50 text-gray-500 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700'
}

// ── Icones SVG ───────────────────────────────────────────────────────

const IconBack = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)
const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const IconEdit = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)
const IconTrash = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)
const IconChevron = ({ open }: { open: boolean }) => (
  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ease-out ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)
const IconCheck = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)
const IconX = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const IconFolder = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
)
const IconDocument = () => (
  <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)

// ── Composant Pagination ─────────────────────────────────────────────

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-5">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Prec.
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className="px-2 text-gray-400 text-xs">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all duration-200 ${
              p === currentPage
                ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Suiv.
      </button>
    </div>
  )
}

// ── Types formulaire ─────────────────────────────────────────────────

interface ChapitreForm { numero: string; designation: string }
interface LigneForm { numeroPoste: string; designation: string; unite: string; quantite: string; prixUnitaire: string; montantTotal: string; avancementPct: string }

const emptyChapitreForm: ChapitreForm = { numero: '', designation: '' }
const emptyLigneForm: LigneForm = { numeroPoste: '', designation: '', unite: '', quantite: '', prixUnitaire: '', montantTotal: '', avancementPct: '0' }

function ligneToForm(l: DqeLigne): LigneForm {
  return {
    numeroPoste: l.numeroPoste ?? '',
    designation: l.designation,
    unite: l.unite ?? '',
    quantite: l.quantite != null ? String(l.quantite) : '',
    prixUnitaire: l.prixUnitaire != null ? String(l.prixUnitaire) : '',
    montantTotal: l.montantTotal != null ? String(l.montantTotal) : '',
    avancementPct: String(l.avancementPct ?? 0),
  }
}

// ── Composant principal ──────────────────────────────────────────────

export const ProjetDqePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { formatMontant } = useFormatNumber()
  const currentUser = useAppSelector((s) => s.auth.user)
  const accessToken = useAppSelector((s) => s.auth.accessToken)

  const [projet, setProjet] = useState<Projet | null>(null)
  const [chapitres, setChapitres] = useState<DqeChapitre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Pagination
  const [chapPage, setChapPage] = useState(1)
  const [lignePages, setLignePages] = useState<Record<number, number>>({})

  // Accordeons ouverts
  const [openChapitres, setOpenChapitres] = useState<Set<number>>(new Set())

  // Formulaires inline
  const [addingChapitre, setAddingChapitre] = useState(false)
  const [chapitreForm, setChapitreForm] = useState<ChapitreForm>(emptyChapitreForm)
  const [editingChapitreId, setEditingChapitreId] = useState<number | null>(null)
  const [editChapitreForm, setEditChapitreForm] = useState<ChapitreForm>(emptyChapitreForm)

  const [addingLigneChapitreId, setAddingLigneChapitreId] = useState<number | null>(null)
  const [ligneForm, setLigneForm] = useState<LigneForm>(emptyLigneForm)
  const [editingLigneId, setEditingLigneId] = useState<number | null>(null)
  const [editLigneForm, setEditLigneForm] = useState<LigneForm>(emptyLigneForm)

  const canEdit = projet != null && canEditProjetEffective(currentUser, accessToken, projet.responsableProjet?.id ?? projet.responsableProjetId)

  // ── Chargement ─────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const [p, c] = await Promise.all([
        projetApi.findById(Number(id)),
        dqeApi.findByProjet(Number(id)),
      ])
      setProjet(p)
      setChapitres(c)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  // ── Toggle accordeon ───────────────────────────────────────────────

  const toggleChapitre = (chapId: number) => {
    setOpenChapitres((prev) => {
      const next = new Set(prev)
      if (next.has(chapId)) next.delete(chapId)
      else next.add(chapId)
      return next
    })
  }

  // ── Pagination helpers ─────────────────────────────────────────────

  const totalChapPages = Math.ceil(chapitres.length / CHAPITRES_PER_PAGE)
  const paginatedChapitres = useMemo(() => {
    const start = (chapPage - 1) * CHAPITRES_PER_PAGE
    return chapitres.slice(start, start + CHAPITRES_PER_PAGE)
  }, [chapitres, chapPage])

  const getLignePage = (chapId: number) => lignePages[chapId] || 1
  const setLignePage = (chapId: number, page: number) => setLignePages(prev => ({ ...prev, [chapId]: page }))

  const getPaginatedLignes = (chap: DqeChapitre) => {
    const page = getLignePage(chap.id)
    const start = (page - 1) * LIGNES_PER_PAGE
    return {
      lignes: chap.lignes.slice(start, start + LIGNES_PER_PAGE),
      totalPages: Math.ceil(chap.lignes.length / LIGNES_PER_PAGE),
      currentPage: page,
    }
  }

  // ── CRUD Chapitres ─────────────────────────────────────────────────

  const handleCreateChapitre = async () => {
    if (!id || !chapitreForm.numero.trim() || !chapitreForm.designation.trim()) return
    setSaving(true)
    try {
      await dqeApi.createChapitre({ projetId: Number(id), numero: chapitreForm.numero.trim(), designation: chapitreForm.designation.trim() })
      setChapitreForm(emptyChapitreForm)
      setAddingChapitre(false)
      await loadData()
    } catch { setError('Erreur lors de la creation du chapitre') }
    finally { setSaving(false) }
  }

  const handleUpdateChapitre = async (chapId: number) => {
    if (!editChapitreForm.numero.trim() || !editChapitreForm.designation.trim()) return
    setSaving(true)
    try {
      await dqeApi.updateChapitre(chapId, { numero: editChapitreForm.numero.trim(), designation: editChapitreForm.designation.trim() })
      setEditingChapitreId(null)
      await loadData()
    } catch { setError('Erreur lors de la modification du chapitre') }
    finally { setSaving(false) }
  }

  const handleDeleteChapitre = async (chap: DqeChapitre) => {
    const ok = await confirm({
      title: 'Supprimer le chapitre',
      message: `Supprimer le chapitre "${chap.numero} - ${chap.designation}" et toutes ses lignes ?`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await dqeApi.deleteChapitre(chap.id)
      await loadData()
    } catch { setError('Erreur lors de la suppression du chapitre') }
  }

  // ── CRUD Lignes ────────────────────────────────────────────────────

  const parseLigneForm = (f: LigneForm) => ({
    numeroPoste: f.numeroPoste.trim() || undefined,
    designation: f.designation.trim(),
    unite: f.unite.trim() || undefined,
    quantite: f.quantite ? Number(f.quantite) : undefined,
    prixUnitaire: f.prixUnitaire ? Number(f.prixUnitaire) : undefined,
    montantTotal: f.montantTotal ? Number(f.montantTotal) : undefined,
    avancementPct: f.avancementPct ? Number(f.avancementPct) : 0,
  })

  const handleCreateLigne = async (chapitreId: number) => {
    if (!ligneForm.designation.trim()) return
    setSaving(true)
    try {
      await dqeApi.createLigne({ chapitreId, ...parseLigneForm(ligneForm) })
      setLigneForm(emptyLigneForm)
      setAddingLigneChapitreId(null)
      await loadData()
    } catch { setError('Erreur lors de la creation de la ligne') }
    finally { setSaving(false) }
  }

  const handleUpdateLigne = async (ligneId: number) => {
    if (!editLigneForm.designation.trim()) return
    setSaving(true)
    try {
      await dqeApi.updateLigne(ligneId, parseLigneForm(editLigneForm))
      setEditingLigneId(null)
      await loadData()
    } catch { setError('Erreur lors de la modification de la ligne') }
    finally { setSaving(false) }
  }

  const handleDeleteLigne = async (ligne: DqeLigne) => {
    const ok = await confirm({
      title: 'Supprimer la ligne',
      message: `Supprimer la ligne "${ligne.numeroPoste ?? ''} ${ligne.designation}" ?`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await dqeApi.deleteLigne(ligne.id)
      await loadData()
    } catch { setError('Erreur lors de la suppression de la ligne') }
  }

  // ── Calculs globaux ────────────────────────────────────────────────

  const totalMontant = chapitres.reduce((s, c) => s + c.montantTotal, 0)
  const totalExecute = chapitres.reduce((s, c) => s + c.montantExecute, 0)
  const totalLignes = chapitres.reduce((s, c) => s + c.nombreLignes, 0)
  const avancementGlobal = totalMontant > 0 ? Math.round((totalExecute / totalMontant) * 10000) / 100 : 0

  // ── Rendu ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Chargement du DQE...</p>
        </div>
      </PageContainer>
    )
  }

  if (error && !projet) return <PageContainer><Alert type="error">{error}</Alert></PageContainer>
  if (!projet) return <PageContainer><div className="text-center text-gray-500 py-12">Projet non trouve</div></PageContainer>

  return (
    <PageContainer size="full" className="bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 min-h-screen">
      {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* ══════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════ */}
      <header className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/20 mb-8 overflow-hidden">
        {/* Bande gradient decorative */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-orange-400 to-amber-300" />

        <div className="px-8 pt-8 pb-6">
          {/* Navigation retour */}
          <button
            onClick={() => navigate(`/projets/${id}`)}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-primary text-sm mb-5 transition-all duration-200 hover:-translate-x-0.5 group"
          >
            <IconBack />
            <span className="group-hover:underline underline-offset-2">Retour au projet</span>
          </button>

          {/* Titre */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Detail Quantitatif & Estimatif
              </h1>
              <p className="text-base text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                {projet.nom}
                {projet.codeProjet && <span className="text-gray-300 dark:text-gray-600 mx-2">|</span>}
                {projet.codeProjet && <span className="text-primary font-semibold">{projet.codeProjet}</span>}
                {projet.numeroMarche && <span className="text-gray-300 dark:text-gray-600 mx-2">|</span>}
                {projet.numeroMarche && <span className="text-sm">Marche n.{projet.numeroMarche}</span>}
              </p>
            </div>
            {canEdit && !addingChapitre && (
              <Button variant="primary" size="md" onClick={() => setAddingChapitre(true)} className="flex items-center gap-2 shadow-lg shadow-primary/20">
                <IconPlus /> Nouveau lot
              </Button>
            )}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Montant total */}
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100/80 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50 overflow-hidden group hover:shadow-md transition-shadow duration-300">
              <div className="absolute -right-3 -top-3 w-16 h-16 bg-primary/5 dark:bg-primary/10 rounded-full" />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-2">Montant total HT</p>
              <p className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white">{formatMontant(totalMontant)}</p>
            </div>

            {/* Montant execute */}
            <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 rounded-xl p-5 border border-emerald-100 dark:border-emerald-800/30 overflow-hidden group hover:shadow-md transition-shadow duration-300">
              <div className="absolute -right-3 -top-3 w-16 h-16 bg-emerald-500/5 rounded-full" />
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider mb-2">Execute</p>
              <p className="text-xl lg:text-2xl font-black text-emerald-700 dark:text-emerald-300">{formatMontant(totalExecute)}</p>
            </div>

            {/* Avancement */}
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-xl p-5 border border-blue-100 dark:border-blue-800/30 overflow-hidden group hover:shadow-md transition-shadow duration-300">
              <div className="absolute -right-3 -top-3 w-16 h-16 bg-blue-500/5 rounded-full" />
              <p className="text-[11px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider mb-2">Avancement global</p>
              <p className="text-xl lg:text-2xl font-black text-blue-700 dark:text-blue-300">{avancementGlobal}%</p>
              <div className="w-full h-2 bg-blue-100 dark:bg-blue-900/40 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor(avancementGlobal)}`}
                  style={{ width: `${Math.min(100, avancementGlobal)}%` }}
                />
              </div>
            </div>

            {/* Lots / Lignes */}
            <div className="relative bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/10 rounded-xl p-5 border border-violet-100 dark:border-violet-800/30 overflow-hidden group hover:shadow-md transition-shadow duration-300">
              <div className="absolute -right-3 -top-3 w-16 h-16 bg-violet-500/5 rounded-full" />
              <p className="text-[11px] text-violet-600 dark:text-violet-400 uppercase font-bold tracking-wider mb-2">Structure</p>
              <p className="text-xl lg:text-2xl font-black text-violet-700 dark:text-violet-300">{chapitres.length} <span className="text-sm font-bold">lots</span></p>
              <p className="text-sm text-violet-500 dark:text-violet-400 mt-0.5">{totalLignes} lignes au total</p>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          FORMULAIRE AJOUT CHAPITRE
      ══════════════════════════════════════════════════════════════════ */}
      {addingChapitre && (
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-primary/40 shadow-lg shadow-primary/5 p-6 animate-in fade-in duration-200">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4 flex items-center gap-2">
            <IconFolder /> Nouveau lot / chapitre
          </h3>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-36">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">N. Lot</label>
              <input
                value={chapitreForm.numero}
                onChange={(e) => setChapitreForm({ ...chapitreForm, numero: e.target.value })}
                placeholder="100"
                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Designation</label>
              <input
                value={chapitreForm.designation}
                onChange={(e) => setChapitreForm({ ...chapitreForm, designation: e.target.value })}
                placeholder="Ex: INSTALLATION DE CHANTIER"
                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="md" onClick={handleCreateChapitre} disabled={saving || !chapitreForm.numero.trim() || !chapitreForm.designation.trim()} className="flex items-center gap-1.5">
                <IconCheck /> Valider
              </Button>
              <Button variant="outline" size="md" onClick={() => { setAddingChapitre(false); setChapitreForm(emptyChapitreForm) }} className="flex items-center gap-1.5">
                <IconX /> Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EMPTY STATE
      ══════════════════════════════════════════════════════════════════ */}
      {chapitres.length === 0 && !addingChapitre && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <IconDocument />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Aucun lot DQE</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto">
            {canEdit
              ? 'Commencez par creer votre premier lot pour structurer le detail quantitatif et estimatif de ce projet.'
              : 'Aucun lot n\'a encore ete cree pour ce projet.'}
          </p>
          {canEdit && (
            <Button variant="primary" size="lg" onClick={() => setAddingChapitre(true)} className="mt-8 flex items-center gap-2 mx-auto shadow-lg shadow-primary/20">
              <IconPlus /> Creer le premier lot
            </Button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          LISTE DES LOTS (CHAPITRES) — PAGINES
      ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        {paginatedChapitres.map((chap, index) => {
          const isOpen = openChapitres.has(chap.id)
          const isEditing = editingChapitreId === chap.id
          const { lignes: paginatedLignes, totalPages: ligneTotalPages, currentPage: ligneCurrentPage } = getPaginatedLignes(chap)

          return (
            <div
              key={chap.id}
              className={`bg-white dark:bg-gray-900 rounded-2xl border transition-all duration-300 ${
                isOpen
                  ? 'border-primary/30 shadow-xl shadow-primary/5 dark:shadow-primary/5'
                  : 'border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* ── Header du lot ─────────────────────────────────────── */}
              <div
                className={`px-6 py-5 flex items-center gap-4 cursor-pointer select-none transition-colors duration-200 ${
                  isOpen ? 'bg-gradient-to-r from-primary/[0.03] to-transparent dark:from-primary/[0.05]' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                }`}
                onClick={() => !isEditing && toggleChapitre(chap.id)}
              >
                <IconChevron open={isOpen} />

                {isEditing ? (
                  <div className="flex flex-1 flex-col md:flex-row gap-3 items-end" onClick={(e) => e.stopPropagation()}>
                    <input
                      value={editChapitreForm.numero}
                      onChange={(e) => setEditChapitreForm({ ...editChapitreForm, numero: e.target.value })}
                      className="w-24 border-2 border-primary/30 rounded-lg px-3 py-1.5 text-sm font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                    <input
                      value={editChapitreForm.designation}
                      onChange={(e) => setEditChapitreForm({ ...editChapitreForm, designation: e.target.value })}
                      className="flex-1 border-2 border-primary/30 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                    <div className="flex gap-1.5">
                      <button onClick={() => handleUpdateChapitre(chap.id)} disabled={saving} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"><IconCheck /></button>
                      <button onClick={() => setEditingChapitreId(null)} className="p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"><IconX /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Badge numero */}
                    <div className="flex-shrink-0 min-w-[48px] h-10 px-3 bg-gradient-to-br from-primary/10 to-orange-100 dark:from-primary/20 dark:to-orange-900/20 rounded-xl flex items-center justify-center">
                      <span className="text-sm font-black text-primary whitespace-nowrap">{chap.numero}</span>
                    </div>

                    {/* Titre du lot */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm lg:text-base font-bold text-gray-900 dark:text-white truncate">
                        {chap.designation}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {chap.nombreLignes} poste{chap.nombreLignes > 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Metriques du lot */}
                    <div className="hidden md:flex items-center gap-5 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Montant</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatMontant(chap.montantTotal)}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-100 dark:bg-gray-800" />
                      <div className="text-center min-w-[80px]">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ring-1 ring-inset ${progressBadgeClass(chap.avancementPct)}`}>
                          {chap.avancementPct}%
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {canEdit && (
                      <div className="flex gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditingChapitreId(chap.id); setEditChapitreForm({ numero: chap.numero, designation: chap.designation }) }}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200"
                          title="Modifier"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteChapitre(chap)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                          title="Supprimer"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Corps du lot (lignes) ─────────────────────────────── */}
              <div className={`transition-all duration-300 ease-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pb-6 pt-2">
                  {/* Mini barre d'avancement du lot */}
                  <div className="flex items-center gap-3 mb-5 px-1">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${progressColor(chap.avancementPct)}`}
                        style={{ width: `${Math.min(100, chap.avancementPct)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-[60px] text-right">
                      {formatMontant(chap.montantExecute)} exec.
                    </span>
                  </div>

                  {/* Tableau des lignes */}
                  {chap.lignes.length > 0 ? (
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-gray-800/80 dark:to-gray-800/40">
                              <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400" style={{ width: '70px' }}>N.</th>
                              <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Designation</th>
                              <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400" style={{ width: '60px' }}>Unite</th>
                              <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400" style={{ width: '90px' }}>Qte</th>
                              <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400" style={{ width: '110px' }}>P.U.</th>
                              <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400" style={{ width: '130px' }}>Montant</th>
                              <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400" style={{ width: '130px' }}>Avancement</th>
                              {canEdit && <th className="py-3 px-4" style={{ width: '70px' }}></th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            {paginatedLignes.map((ligne, lIdx) => {
                              if (editingLigneId === ligne.id) {
                                return (
                                  <tr key={ligne.id} className="bg-primary/[0.02] dark:bg-primary/[0.04]">
                                    <td className="py-2.5 px-3"><input value={editLigneForm.numeroPoste} onChange={(e) => setEditLigneForm({ ...editLigneForm, numeroPoste: e.target.value })} className="w-full border-2 border-primary/20 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary outline-none" /></td>
                                    <td className="py-2.5 px-3"><input value={editLigneForm.designation} onChange={(e) => setEditLigneForm({ ...editLigneForm, designation: e.target.value })} className="w-full border-2 border-primary/20 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary outline-none" /></td>
                                    <td className="py-2.5 px-3"><input value={editLigneForm.unite} onChange={(e) => setEditLigneForm({ ...editLigneForm, unite: e.target.value })} className="w-full border-2 border-primary/20 rounded-lg px-2 py-1.5 text-xs text-center bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary outline-none" /></td>
                                    <td className="py-2.5 px-3"><input type="number" value={editLigneForm.quantite} onChange={(e) => setEditLigneForm({ ...editLigneForm, quantite: e.target.value })} className="w-full border-2 border-primary/20 rounded-lg px-2 py-1.5 text-xs text-right bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary outline-none" /></td>
                                    <td className="py-2.5 px-3"><input type="number" value={editLigneForm.prixUnitaire} onChange={(e) => setEditLigneForm({ ...editLigneForm, prixUnitaire: e.target.value })} className="w-full border-2 border-primary/20 rounded-lg px-2 py-1.5 text-xs text-right bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary outline-none" /></td>
                                    <td className="py-2.5 px-3"><input type="number" value={editLigneForm.montantTotal} onChange={(e) => setEditLigneForm({ ...editLigneForm, montantTotal: e.target.value })} className="w-full border-2 border-primary/20 rounded-lg px-2 py-1.5 text-xs text-right bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary outline-none" /></td>
                                    <td className="py-2.5 px-3"><input type="number" min="0" max="100" value={editLigneForm.avancementPct} onChange={(e) => setEditLigneForm({ ...editLigneForm, avancementPct: e.target.value })} className="w-full border-2 border-primary/20 rounded-lg px-2 py-1.5 text-xs text-center bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary outline-none" /></td>
                                    <td className="py-2.5 px-3">
                                      <div className="flex gap-1">
                                        <button onClick={() => handleUpdateLigne(ligne.id)} disabled={saving} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg transition-colors"><IconCheck /></button>
                                        <button onClick={() => setEditingLigneId(null)} className="p-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 rounded-lg transition-colors"><IconX /></button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              }

                              return (
                                <tr
                                  key={ligne.id}
                                  className={`group transition-colors duration-150 ${
                                    lIdx % 2 === 0
                                      ? 'bg-white dark:bg-gray-900'
                                      : 'bg-gray-50/50 dark:bg-gray-800/20'
                                  } hover:bg-primary/[0.02] dark:hover:bg-primary/[0.03]`}
                                >
                                  <td className="py-3.5 px-4">
                                    <span className="font-mono text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                      {ligne.numeroPoste || '-'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{ligne.designation}</span>
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{ligne.unite || '-'}</span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-mono">
                                      {ligne.quantite != null ? ligne.quantite.toLocaleString('fr-FR') : '-'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {ligne.prixUnitaire != null ? formatMontant(ligne.prixUnitaire) : '-'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                      {ligne.montantTotal != null ? formatMontant(ligne.montantTotal) : '-'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-500 ${progressColor(ligne.avancementPct)}`}
                                          style={{ width: `${Math.min(100, ligne.avancementPct)}%` }}
                                        />
                                      </div>
                                      <span className={`text-[11px] font-bold min-w-[36px] text-right ${
                                        ligne.avancementPct >= 100 ? 'text-emerald-600 dark:text-emerald-400'
                                        : ligne.avancementPct >= 50 ? 'text-blue-600 dark:text-blue-400'
                                        : ligne.avancementPct > 0 ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-gray-400'
                                      }`}>
                                        {ligne.avancementPct}%
                                      </span>
                                    </div>
                                  </td>
                                  {canEdit && (
                                    <td className="py-3.5 px-4">
                                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button onClick={() => { setEditingLigneId(ligne.id); setEditLigneForm(ligneToForm(ligne)) }} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Modifier"><IconEdit /></button>
                                        <button onClick={() => handleDeleteLigne(ligne)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Supprimer"><IconTrash /></button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              )
                            })}
                          </tbody>

                          {/* Sous-total du lot */}
                          <tfoot>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/60 dark:to-gray-800/30 border-t-2 border-gray-100 dark:border-gray-800">
                              <td colSpan={5} className="py-3.5 px-4">
                                <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  Sous-total Lot {chap.numero}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span className="text-sm font-black text-gray-900 dark:text-white">{formatMontant(chap.montantTotal)}</span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full ring-1 ring-inset ${progressBadgeClass(chap.avancementPct)}`}>
                                  {chap.avancementPct}%
                                </span>
                              </td>
                              {canEdit && <td></td>}
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Pagination lignes */}
                      <Pagination
                        currentPage={ligneCurrentPage}
                        totalPages={ligneTotalPages}
                        onPageChange={(p) => setLignePage(chap.id, p)}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50/50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                      <p className="text-sm text-gray-400 dark:text-gray-500">Aucun poste dans ce lot</p>
                    </div>
                  )}

                  {/* Formulaire ajout ligne */}
                  {addingLigneChapitreId === chap.id ? (
                    <div className="mt-5 p-5 bg-gradient-to-br from-primary/[0.02] to-orange-50/30 dark:from-primary/[0.04] dark:to-gray-800/50 rounded-xl border-2 border-dashed border-primary/20 dark:border-primary/30">
                      <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                        <IconPlus /> Nouveau poste
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">N. Poste</label>
                          <input value={ligneForm.numeroPoste} onChange={(e) => setLigneForm({ ...ligneForm, numeroPoste: e.target.value })} placeholder="101" className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                        </div>
                        <div className="col-span-2 md:col-span-3">
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Designation *</label>
                          <input value={ligneForm.designation} onChange={(e) => setLigneForm({ ...ligneForm, designation: e.target.value })} placeholder="Description du poste" className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Unite</label>
                          <input value={ligneForm.unite} onChange={(e) => setLigneForm({ ...ligneForm, unite: e.target.value })} placeholder="m3" className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Quantite</label>
                          <input type="number" value={ligneForm.quantite} onChange={(e) => setLigneForm({ ...ligneForm, quantite: e.target.value })} placeholder="0" className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Prix unitaire</label>
                          <input type="number" value={ligneForm.prixUnitaire} onChange={(e) => setLigneForm({ ...ligneForm, prixUnitaire: e.target.value })} placeholder="0" className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Montant total</label>
                          <input type="number" value={ligneForm.montantTotal} onChange={(e) => setLigneForm({ ...ligneForm, montantTotal: e.target.value })} placeholder="Auto" className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-5">
                        <Button variant="primary" size="sm" onClick={() => handleCreateLigne(chap.id)} disabled={saving || !ligneForm.designation.trim()} className="flex items-center gap-1.5">
                          <IconCheck /> Valider
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setAddingLigneChapitreId(null); setLigneForm(emptyLigneForm) }} className="flex items-center gap-1.5">
                          <IconX /> Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    canEdit && (
                      <button
                        onClick={() => { setAddingLigneChapitreId(chap.id); setLigneForm(emptyLigneForm) }}
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:text-white bg-primary/5 hover:bg-primary border border-primary/20 hover:border-primary rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
                      >
                        <IconPlus /> Ajouter un poste
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination chapitres */}
      {chapitres.length > 0 && (
        <Pagination
          currentPage={chapPage}
          totalPages={totalChapPages}
          onPageChange={setChapPage}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER TOTAL GENERAL
      ══════════════════════════════════════════════════════════════════ */}
      {chapitres.length > 0 && (
        <div className="mt-8 relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/20 overflow-hidden">
          {/* Bande gradient */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 via-blue-400 to-primary" />

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Total HT */}
              <div className="text-center md:text-left">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1.5">Total general HT</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{formatMontant(totalMontant)}</p>
              </div>

              {/* Montant execute */}
              <div className="text-center">
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider mb-1.5">Montant execute</p>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{formatMontant(totalExecute)}</p>
                <p className="text-xs text-gray-400 mt-1">Reste: {formatMontant(totalMontant - totalExecute)}</p>
              </div>

              {/* Avancement */}
              <div className="text-center md:text-right">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1.5">Avancement global</p>
                <p className={`text-3xl font-black tracking-tight ${
                  avancementGlobal >= 100 ? 'text-emerald-600 dark:text-emerald-400'
                  : avancementGlobal >= 50 ? 'text-blue-600 dark:text-blue-400'
                  : avancementGlobal > 0 ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-400'
                }`}>
                  {avancementGlobal}%
                </p>
                <div className="w-full max-w-[200px] h-3 bg-gray-100 dark:bg-gray-800 rounded-full mt-3 overflow-hidden mx-auto md:ml-auto md:mr-0">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor(avancementGlobal)}`}
                    style={{ width: `${Math.min(100, avancementGlobal)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
