import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

// ── Pagination ───────────────────────────────────────────────────────
const ROWS_PER_PAGE = 15

// ── Helpers visuels ──────────────────────────────────────────────────

function progressColor(pct: number): string {
  if (pct >= 100) return 'bg-gradient-to-r from-emerald-400 to-emerald-500'
  if (pct >= 50) return 'bg-gradient-to-r from-blue-400 to-blue-500'
  if (pct > 0) return 'bg-gradient-to-r from-amber-400 to-orange-400'
  return 'bg-gray-200 dark:bg-gray-700'
}

function progressBadgeClass(pct: number): string {
  if (pct >= 100) return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700'
  if (pct >= 50) return 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700'
  if (pct > 0) return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700'
  return 'bg-gray-50 text-gray-500 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700'
}

// ── Icones ───────────────────────────────────────────────────────────

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
const IconCopy = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)
const IconPercent = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20l16-16m-2 0a2 2 0 11-4 0 2 2 0 014 0zM10 20a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)
const IconGrip = () => (
  <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
  </svg>
)

/** Ligne de tableau triable par drag & drop */
function SortableTableRow({ id, disabled, children, listeners: externalListeners }: { id: string; disabled?: boolean; children: React.ReactNode; listeners?: Record<string, unknown> }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })
  void externalListeners // unused — listeners come from useSortable
  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: 'relative', zIndex: isDragging ? 10 : undefined }}
      {...attributes}
      {...(disabled ? {} : listeners)}
    >
      {children}
    </tr>
  )
}

const IconDocument = () => (
  <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)

// ── Pagination composant ─────────────────────────────────────────────

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
    <div className="flex items-center justify-center gap-1.5 py-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Prec.</button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`d${i}`} className="px-2 text-gray-400 text-xs">...</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p)} className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${p === currentPage ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>{p}</button>
        )
      )}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Suiv.</button>
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

/** Met a jour un champ du formulaire ligne et recalcule montant si qte ou pu changent */
function calcLigneForm(form: LigneForm, field: keyof LigneForm, value: string): LigneForm {
  const updated = { ...form, [field]: value }
  if (field === 'quantite' || field === 'prixUnitaire') {
    const qte = parseFloat(field === 'quantite' ? value : form.quantite)
    const pu = parseFloat(field === 'prixUnitaire' ? value : form.prixUnitaire)
    if (!isNaN(qte) && !isNaN(pu) && qte > 0 && pu > 0) {
      updated.montantTotal = String(Math.round(qte * pu * 100) / 100)
    }
  }
  return updated
}

/** Prochain numero de chapitre (100, 200, 300…) */
function nextChapitreNumero(chapitres: DqeChapitre[]): string {
  if (chapitres.length === 0) return '100'
  const nums = chapitres.map(c => parseInt(c.numero)).filter(n => !isNaN(n))
  if (nums.length === 0) return '100'
  return String(Math.ceil((Math.max(...nums) + 1) / 100) * 100)
}

/** Prochain numero de poste pour un chapitre donne */
function nextPosteNumero(chap: DqeChapitre): string {
  const nums = chap.lignes
    .map(l => { const m = l.numeroPoste?.match(/(\d+)$/); return m ? parseInt(m[1]) : 0 })
    .filter(n => n > 0)
  return `${chap.numero}-${(nums.length > 0 ? Math.max(...nums) : 0) + 1}`
}

// ── Icones supplementaires ───────────────────────────────────────────

const IconDownload = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)
const IconSpinner = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)
const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

// ── Types pour le tableau aplati ─────────────────────────────────────

type FlatRow =
  | { type: 'chapitre'; chapitre: DqeChapitre }
  | { type: 'ligne'; ligne: DqeLigne; chapitreId: number }
  | { type: 'add-ligne'; chapitre: DqeChapitre }
  | { type: 'sous-total'; chapitre: DqeChapitre }

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

  // Pagination globale du document
  const [page, setPage] = useState(1)

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

  // Recherche
  const [searchQuery, setSearchQuery] = useState('')
  // Export
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  // Batch avancement
  const [batchChapitreId, setBatchChapitreId] = useState<number | null>(null)
  const [batchPct, setBatchPct] = useState('100')

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

  // ── Filtrage recherche ────────────────────────────────────────────

  const filteredChapitres = useMemo(() => {
    if (!searchQuery.trim()) return chapitres
    const q = searchQuery.toLowerCase()
    return chapitres
      .map(chap => {
        const chapMatch = chap.numero.toLowerCase().includes(q) || chap.designation.toLowerCase().includes(q)
        if (chapMatch) return chap
        const matchingLignes = chap.lignes.filter(l =>
          l.designation.toLowerCase().includes(q) ||
          (l.numeroPoste?.toLowerCase().includes(q) ?? false) ||
          (l.unite?.toLowerCase().includes(q) ?? false)
        )
        if (matchingLignes.length > 0) return { ...chap, lignes: matchingLignes } as DqeChapitre
        return null
      })
      .filter((c): c is DqeChapitre => c !== null)
  }, [chapitres, searchQuery])

  // ── Aplatir chapitres + lignes en tableau unique ───────────────────

  const flatRows: FlatRow[] = useMemo(() => {
    const rows: FlatRow[] = []
    for (const chap of filteredChapitres) {
      rows.push({ type: 'chapitre', chapitre: chap })
      for (const ligne of chap.lignes) {
        rows.push({ type: 'ligne', ligne, chapitreId: chap.id })
      }
      if (addingLigneChapitreId === chap.id) {
        rows.push({ type: 'add-ligne', chapitre: chap } as FlatRow)
      }
      rows.push({ type: 'sous-total', chapitre: chap })
    }
    return rows
  }, [filteredChapitres, addingLigneChapitreId])

  const totalPages = Math.ceil(flatRows.length / ROWS_PER_PAGE)
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE
    return flatRows.slice(start, start + ROWS_PER_PAGE)
  }, [flatRows, page])

  // ── CRUD Chapitres ─────────────────────────────────────────────────

  const handleCreateChapitre = async () => {
    if (!id || !chapitreForm.numero.trim() || !chapitreForm.designation.trim()) return
    setSaving(true)
    try {
      await dqeApi.createChapitre({ projetId: Number(id), numero: chapitreForm.numero.trim(), designation: chapitreForm.designation.trim() })
      setChapitreForm(emptyChapitreForm)
      setAddingChapitre(false)
      await loadData()
      // Aller a la derniere page pour voir le nouveau chapitre
      setPage(Math.ceil((flatRows.length + 3) / ROWS_PER_PAGE))
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
    try { await dqeApi.deleteChapitre(chap.id); await loadData(); setPage(1) }
    catch { setError('Erreur lors de la suppression du chapitre') }
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
    try { await dqeApi.deleteLigne(ligne.id); await loadData(); if (paginatedRows.length <= 2) setPage(Math.max(1, page - 1)) }
    catch { setError('Erreur lors de la suppression de la ligne') }
  }

  // ── Duplication de ligne ──────────────────────────────────────────

  const handleDuplicateLigne = async (ligne: DqeLigne, chapitreId: number) => {
    setSaving(true)
    try {
      const chap = chapitres.find(c => c.id === chapitreId)
      await dqeApi.createLigne({
        chapitreId,
        numeroPoste: chap ? nextPosteNumero(chap) : undefined,
        designation: ligne.designation,
        unite: ligne.unite ?? undefined,
        quantite: ligne.quantite ?? undefined,
        prixUnitaire: ligne.prixUnitaire ?? undefined,
        montantTotal: ligne.montantTotal ?? undefined,
        avancementPct: 0,
      })
      await loadData()
    } catch { setError('Erreur lors de la duplication') }
    finally { setSaving(false) }
  }

  // ── Batch avancement chapitre ───────────────────────────────────

  const handleBatchAvancement = async (chapitreId: number) => {
    const pct = Number(batchPct)
    if (isNaN(pct) || pct < 0 || pct > 100) return
    const chap = chapitres.find(c => c.id === chapitreId)
    if (!chap || chap.lignes.length === 0) return
    setSaving(true)
    try {
      await Promise.all(
        chap.lignes.map(l => dqeApi.updateLigne(l.id, { avancementPct: pct }))
      )
      setBatchChapitreId(null)
      await loadData()
    } catch { setError('Erreur lors de la mise a jour de l\'avancement') }
    finally { setSaving(false) }
  }

  // ── Drag & drop réordonnement ─────────────────────────────────────

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEndLigne = useCallback(async (event: DragEndEvent, chapitreId: number) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const chap = chapitres.find(c => c.id === chapitreId)
    if (!chap) return
    const oldIdx = chap.lignes.findIndex(l => `ligne-${l.id}` === active.id)
    const newIdx = chap.lignes.findIndex(l => `ligne-${l.id}` === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    const reorderedLignes = [...chap.lignes]
    const [moved] = reorderedLignes.splice(oldIdx, 1)
    reorderedLignes.splice(newIdx, 0, moved)
    setChapitres(prev => prev.map(c => c.id === chapitreId ? { ...c, lignes: reorderedLignes } : c))
    try {
      await dqeApi.reorderLignes(reorderedLignes.map((l, i) => ({ id: l.id, ordre: i })))
    } catch { setError('Erreur lors du réordonnement'); await loadData() }
  }, [chapitres, loadData])

  // ── Export PDF / Excel ─────────────────────────────────────────────

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!projet) return
    setExporting(format)
    try {
      const { generateDqeDocument } = await import('@/features/projet/export/dqeExport')
      const filename = `DQE_${projet.codeProjet ?? projet.nom.replace(/\s+/g, '_')}`
      await generateDqeDocument({ projet, chapitres, formatMontant }, format, filename)
    } catch {
      setError(`Erreur lors de l'export ${format.toUpperCase()}`)
    } finally {
      setExporting(null)
    }
  }

  // ── Calculs globaux ────────────────────────────────────────────────

  const totalMontant = chapitres.reduce((s, c) => s + c.montantTotal, 0)
  const totalExecute = chapitres.reduce((s, c) => s + c.montantExecute, 0)
  const totalLignes = chapitres.reduce((s, c) => s + c.nombreLignes, 0)
  const avancementGlobal = totalMontant > 0 ? Math.round((totalExecute / totalMontant) * 10000) / 100 : 0

  // nombre de colonnes
  const colCount = canEdit ? 8 : 7

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
    <PageContainer size="full" className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 min-h-screen">
      {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* ══════════════════════════════════════════════════════════════
          DOCUMENT DQE — Feuille unique
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-black/30 overflow-hidden">

        {/* ── En-tete du document ─────────────────────────────────── */}
        <div className="bg-gradient-to-r from-secondary to-secondary-light dark:from-secondary dark:to-secondary-light px-8 py-7 text-white">
          {/* Retour */}
          <button
            onClick={() => navigate(`/projets/${id}`)}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-5 transition-colors group"
          >
            <IconBack />
            <span className="group-hover:underline underline-offset-2">Retour au projet</span>
          </button>

          <h1 className="text-xl lg:text-2xl font-black uppercase tracking-wide mb-1">
            Devis Quantitatif et Estimatif
          </h1>
          <p className="text-white/70 text-sm font-medium">
            {projet.nom}
            {projet.codeProjet && <span className="mx-2 text-white/30">|</span>}
            {projet.codeProjet && <span className="text-white/90 font-bold">{projet.codeProjet}</span>}
            {projet.numeroMarche && <span className="mx-2 text-white/30">|</span>}
            {projet.numeroMarche && <span>Marche n.{projet.numeroMarche}</span>}
          </p>

          {/* KPIs en ligne */}
          <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-white/10">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-0.5">Montant HT</p>
              <p className="text-lg font-black tabular-nums">{formatMontant(totalMontant)}</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-0.5">Execute</p>
              <p className="text-lg font-black tabular-nums text-emerald-300">{formatMontant(totalExecute)}</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-0.5">Avancement</p>
              <div className="flex items-center gap-3">
                <p className="text-lg font-black">{avancementGlobal}%</p>
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${progressColor(avancementGlobal)}`} style={{ width: `${Math.min(100, avancementGlobal)}%` }} />
                </div>
              </div>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-0.5">Structure</p>
              <p className="text-lg font-black">{chapitres.length} <span className="text-sm font-semibold text-white/60">chap.</span> / {totalLignes} <span className="text-sm font-semibold text-white/60">lignes</span></p>
            </div>

            {/* Boutons export */}
            {chapitres.length > 0 && (
              <>
                <div className="w-px h-10 bg-white/15" />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={exporting !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-40"
                  >
                    {exporting === 'pdf' ? <IconSpinner /> : <IconDownload />} PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    disabled={exporting !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-40"
                  >
                    {exporting === 'excel' ? <IconSpinner /> : <IconDownload />} Excel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Barre d'actions ─────────────────────────────────────── */}
        {canEdit && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
            {!addingChapitre ? (
              <Button variant="primary" size="sm" onClick={() => { setAddingChapitre(true); setChapitreForm({ numero: nextChapitreNumero(chapitres), designation: '' }) }} className="flex items-center gap-1.5">
                <IconPlus /> Ajouter un chapitre
              </Button>
            ) : (
              <div className="flex flex-1 flex-col md:flex-row gap-3 items-end">
                <div className="w-full md:w-36">
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">N. Chapitre</label>
                  <input value={chapitreForm.numero} onChange={(e) => setChapitreForm({ ...chapitreForm, numero: e.target.value })} placeholder="100" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Designation</label>
                  <input value={chapitreForm.designation} onChange={(e) => setChapitreForm({ ...chapitreForm, designation: e.target.value })} placeholder="Ex: TRAVAUX PREPARATOIRES" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleCreateChapitre} disabled={saving || !chapitreForm.numero.trim() || !chapitreForm.designation.trim()} className="flex items-center gap-1.5"><IconCheck /> OK</Button>
                  <Button variant="outline" size="sm" onClick={() => { setAddingChapitre(false); setChapitreForm(emptyChapitreForm) }} className="flex items-center gap-1.5"><IconX /> Annuler</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Barre de recherche ─────────────────────────────────── */}
        {chapitres.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400"><IconSearch /></div>
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                placeholder="Rechercher par designation, n. poste, unite..."
                className="w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setPage(1) }} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><IconX /></button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{filteredChapitres.length} chapitre(s) / {filteredChapitres.reduce((s, c) => s + c.lignes.length, 0)} ligne(s) correspondant(s)</p>
            )}
          </div>
        )}

        {/* ── Tableau DQE continu ─────────────────────────────────── */}
        {chapitres.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <IconDocument />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Aucun chapitre DQE</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto">
              {canEdit ? 'Commencez par creer votre premier chapitre pour structurer le DQE.' : 'Aucun chapitre n\'a encore ete cree.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              {/* Header colonnes */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="py-3 px-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700" style={{ width: '90px' }}>N. Prix</th>
                  <th className="py-3 px-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">Designation</th>
                  <th className="py-3 px-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700" style={{ width: '70px' }}>Unite</th>
                  <th className="py-3 px-4 text-right text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700" style={{ width: '100px' }}>Quantite</th>
                  <th className="py-3 px-4 text-right text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700" style={{ width: '130px' }}>Prix Unit.</th>
                  <th className="py-3 px-4 text-right text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700" style={{ width: '150px' }}>Prix Total</th>
                  <th className="py-3 px-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300" style={{ width: '150px' }}>Avancement</th>
                  {canEdit && <th className="py-3 px-3 border-l border-gray-200 dark:border-gray-700" style={{ width: '90px' }}>Actions</th>}
                </tr>
              </thead>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                // Detecter si c'est une ligne ou un chapitre
                const activeId = String(e.active.id)
                if (activeId.startsWith('ligne-') && e.over) {
                  // Trouver le chapitre de la ligne active
                  const ligneId = Number(activeId.replace('ligne-', ''))
                  const chap = chapitres.find(c => c.lignes.some(l => l.id === ligneId))
                  if (chap) handleDragEndLigne(e, chap.id)
                }
              }}>
              <SortableContext items={paginatedRows.filter(r => r.type === 'ligne').map(r => `ligne-${(r as { type: 'ligne'; ligne: DqeLigne }).ligne.id}`)} strategy={verticalListSortingStrategy}>
              <tbody>
                {paginatedRows.map((row, rIdx) => {
                  // ── LIGNE CHAPITRE (bandeau) ───────────────────
                  if (row.type === 'chapitre') {
                    const chap = row.chapitre
                    const isEditing = editingChapitreId === chap.id

                    if (isEditing) {
                      return (
                        <tr key={`ch-${chap.id}`} className="bg-secondary/10 dark:bg-secondary/20">
                          <td colSpan={colCount} className="py-3 px-4">
                            <div className="flex flex-col md:flex-row gap-3 items-end">
                              <input value={editChapitreForm.numero} onChange={(e) => setEditChapitreForm({ ...editChapitreForm, numero: e.target.value })} className="w-32 border-2 border-secondary/30 rounded-lg px-3 py-1.5 text-sm font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-secondary outline-none" />
                              <input value={editChapitreForm.designation} onChange={(e) => setEditChapitreForm({ ...editChapitreForm, designation: e.target.value })} className="flex-1 border-2 border-secondary/30 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-secondary outline-none" />
                              <div className="flex gap-1.5">
                                <button onClick={() => handleUpdateChapitre(chap.id)} disabled={saving} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg transition-colors"><IconCheck /></button>
                                <button onClick={() => setEditingChapitreId(null)} className="p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 rounded-lg transition-colors"><IconX /></button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <React.Fragment key={`ch-${chap.id}`}>
                        <tr className="bg-secondary-light dark:bg-secondary group">
                          <td colSpan={colCount} className="py-3.5 px-5">
                            <div className="flex items-center justify-between">
                              <h3 className="text-[13px] font-black uppercase tracking-wide text-white">
                                Chapitre {chap.numero} — {chap.designation}
                              </h3>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white/60">{chap.nombreLignes} postes</span>
                                {canEdit && (
                                  <div className="flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingChapitreId(chap.id); setEditChapitreForm({ numero: chap.numero, designation: chap.designation }) }} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Modifier"><IconEdit /></button>
                                    <button onClick={() => handleDeleteChapitre(chap)} className="p-1.5 text-white/50 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors" title="Supprimer"><IconTrash /></button>
                                    <button onClick={() => { setAddingLigneChapitreId(chap.id); setLigneForm({ ...emptyLigneForm, numeroPoste: nextPosteNumero(chap) }) }} className="p-1.5 text-white/50 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors" title="Ajouter un poste"><IconPlus /></button>
                                    <button onClick={() => { setBatchChapitreId(batchChapitreId === chap.id ? null : chap.id); setBatchPct('100') }} className="p-1.5 text-white/50 hover:text-amber-300 hover:bg-amber-500/20 rounded-lg transition-colors" title="Avancement en masse"><IconPercent /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                        {batchChapitreId === chap.id && (
                          <tr className="bg-amber-50 dark:bg-amber-900/20">
                            <td colSpan={colCount} className="py-3 px-5 border-b-2 border-dashed border-amber-200 dark:border-amber-700/50">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Avancement en masse — {chap.numero}</span>
                                <input type="number" min="0" max="100" value={batchPct} onChange={(e) => setBatchPct(e.target.value)} className="w-20 border border-amber-300 dark:border-amber-600 rounded-lg px-2.5 py-1.5 text-sm text-center font-bold bg-white dark:bg-gray-800 dark:text-white focus:border-amber-500 outline-none" />
                                <span className="text-xs text-amber-600 dark:text-amber-400">% pour les {chap.nombreLignes} lignes</span>
                                <Button variant="primary" size="sm" onClick={() => handleBatchAvancement(chap.id)} disabled={saving} className="flex items-center gap-1.5"><IconCheck /> Appliquer</Button>
                                <button onClick={() => setBatchChapitreId(null)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><IconX /></button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  }

                  // ── FORMULAIRE AJOUT LIGNE (inline) ─────────────
                  if (row.type === 'add-ligne') {
                    const chap = (row as { type: 'add-ligne'; chapitre: DqeChapitre }).chapitre
                    return (
                      <tr key={`al-${chap.id}`} className="bg-primary/[0.03] dark:bg-primary/[0.05]">
                        <td colSpan={colCount} className="py-4 px-5 border-y-2 border-dashed border-primary/20">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-black text-primary uppercase tracking-wider">Nouveau poste — {chap.numero}</p>
                            <button onClick={() => { setAddingLigneChapitreId(null); setLigneForm(emptyLigneForm) }} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><IconX /></button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                            <input value={ligneForm.numeroPoste} onChange={(e) => setLigneForm({ ...ligneForm, numeroPoste: e.target.value })} placeholder="N. Poste" className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary outline-none" />
                            <input value={ligneForm.designation} onChange={(e) => setLigneForm({ ...ligneForm, designation: e.target.value })} placeholder="Designation *" className="md:col-span-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary outline-none" />
                            <input value={ligneForm.unite} onChange={(e) => setLigneForm({ ...ligneForm, unite: e.target.value })} placeholder="Unite" className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary outline-none" />
                            <input type="number" value={ligneForm.quantite} onChange={(e) => setLigneForm(calcLigneForm(ligneForm, 'quantite', e.target.value))} placeholder="Qte" className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary outline-none" />
                            <input type="number" value={ligneForm.prixUnitaire} onChange={(e) => setLigneForm(calcLigneForm(ligneForm, 'prixUnitaire', e.target.value))} placeholder="P.U." className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary outline-none" />
                            <input type="number" value={ligneForm.montantTotal} onChange={(e) => setLigneForm({ ...ligneForm, montantTotal: e.target.value })} placeholder="Montant (auto)" className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 dark:text-white focus:border-primary outline-none tabular-nums" />
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button variant="primary" size="sm" onClick={() => handleCreateLigne(chap.id)} disabled={saving || !ligneForm.designation.trim()} className="flex items-center gap-1.5"><IconCheck /> Valider</Button>
                            <Button variant="outline" size="sm" onClick={() => { setAddingLigneChapitreId(null); setLigneForm(emptyLigneForm) }} className="flex items-center gap-1.5"><IconX /> Annuler</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  // ── LIGNE SOUS-TOTAL ───────────────────────────
                  if (row.type === 'sous-total') {
                    const chap = row.chapitre

                    return (
                      <tr key={`st-${chap.id}`} className="bg-secondary/[0.06] dark:bg-secondary/[0.12] border-t-2 border-b-2 border-secondary/15 dark:border-secondary/25">
                        <td colSpan={5} className="py-3 px-5 border-r border-gray-200 dark:border-gray-700">
                          <span className="text-[12px] font-black uppercase tracking-wide text-secondary dark:text-secondary-light">
                            Sous-total — {chap.numero}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right border-r border-gray-200 dark:border-gray-700">
                          <span className="text-[14px] font-black text-gray-900 dark:text-white tabular-nums">{formatMontant(chap.montantTotal)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full ring-1 ring-inset ${progressBadgeClass(chap.avancementPct)}`}>
                            {chap.avancementPct}%
                          </span>
                        </td>
                        {canEdit && <td className="border-l border-gray-200 dark:border-gray-700"></td>}
                      </tr>
                    )
                  }

                  // ── LIGNE DQE (poste) ──────────────────────────
                  const { ligne } = row

                  if (editingLigneId === ligne.id) {
                    return (
                      <tr key={`l-${ligne.id}`} className="bg-primary/[0.04] dark:bg-primary/[0.06]">
                        <td className="py-2.5 px-3 border-r border-gray-100 dark:border-gray-800"><input value={editLigneForm.numeroPoste} onChange={(e) => setEditLigneForm({ ...editLigneForm, numeroPoste: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary outline-none" /></td>
                        <td className="py-2.5 px-3 border-r border-gray-100 dark:border-gray-800"><input value={editLigneForm.designation} onChange={(e) => setEditLigneForm({ ...editLigneForm, designation: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-primary outline-none" /></td>
                        <td className="py-2.5 px-3 border-r border-gray-100 dark:border-gray-800"><input value={editLigneForm.unite} onChange={(e) => setEditLigneForm({ ...editLigneForm, unite: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-sm text-center bg-white dark:bg-gray-800 dark:text-white focus:border-primary outline-none" /></td>
                        <td className="py-2.5 px-3 border-r border-gray-100 dark:border-gray-800"><input type="number" value={editLigneForm.quantite} onChange={(e) => setEditLigneForm(calcLigneForm(editLigneForm, 'quantite', e.target.value))} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-sm text-right bg-white dark:bg-gray-800 dark:text-white focus:border-primary outline-none" /></td>
                        <td className="py-2.5 px-3 border-r border-gray-100 dark:border-gray-800"><input type="number" value={editLigneForm.prixUnitaire} onChange={(e) => setEditLigneForm(calcLigneForm(editLigneForm, 'prixUnitaire', e.target.value))} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-sm text-right bg-white dark:bg-gray-800 dark:text-white focus:border-primary outline-none" /></td>
                        <td className="py-2.5 px-3 border-r border-gray-100 dark:border-gray-800"><input type="number" value={editLigneForm.montantTotal} onChange={(e) => setEditLigneForm({ ...editLigneForm, montantTotal: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-sm text-right bg-emerald-50 dark:bg-emerald-900/20 dark:text-white focus:border-primary outline-none tabular-nums" /></td>
                        <td className="py-2.5 px-3"><input type="number" min="0" max="100" value={editLigneForm.avancementPct} onChange={(e) => setEditLigneForm({ ...editLigneForm, avancementPct: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-sm text-center bg-white dark:bg-gray-800 dark:text-white focus:border-primary outline-none" /></td>
                        <td className="py-2.5 px-3 border-l border-gray-100 dark:border-gray-800">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => handleUpdateLigne(ligne.id)} disabled={saving} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg transition-colors"><IconCheck /></button>
                            <button onClick={() => setEditingLigneId(null)} className="p-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 rounded-lg transition-colors"><IconX /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <SortableTableRow
                      key={`l-${ligne.id}`}
                      id={`ligne-${ligne.id}`}
                      disabled={!canEdit}
                    >
                      <td className={`py-3 px-4 border-r border-gray-100 dark:border-gray-800/50 group transition-colors duration-100 ${rIdx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/40 dark:bg-gray-800/10'} hover:bg-blue-50/30 dark:hover:bg-blue-900/5`}>
                        <div className="flex items-center gap-1.5">
                          {canEdit && <span className="opacity-0 group-hover:opacity-40 transition-opacity cursor-grab"><IconGrip /></span>}
                          <span className="font-mono text-[13px] font-bold text-secondary dark:text-secondary-light">{ligne.numeroPoste || ''}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 border-r border-gray-100 dark:border-gray-800/50">
                        <span className="text-[13px] text-gray-800 dark:text-gray-200">{ligne.designation}</span>
                      </td>
                      <td className="py-3 px-4 text-center border-r border-gray-100 dark:border-gray-800/50">
                        <span className="text-[13px] text-gray-500 dark:text-gray-400">{ligne.unite || ''}</span>
                      </td>
                      <td className="py-3 px-4 text-right border-r border-gray-100 dark:border-gray-800/50">
                        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{ligne.quantite != null ? ligne.quantite.toLocaleString('fr-FR') : ''}</span>
                      </td>
                      <td className="py-3 px-4 text-right border-r border-gray-100 dark:border-gray-800/50">
                        <span className="text-[13px] text-gray-600 dark:text-gray-400 tabular-nums">{ligne.prixUnitaire != null ? formatMontant(ligne.prixUnitaire) : ''}</span>
                      </td>
                      <td className="py-3 px-4 text-right border-r border-gray-100 dark:border-gray-800/50">
                        <span className="text-[13px] font-bold text-gray-900 dark:text-white tabular-nums">{ligne.montantTotal != null ? formatMontant(ligne.montantTotal) : ''}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${progressColor(ligne.avancementPct)}`} style={{ width: `${Math.min(100, ligne.avancementPct)}%` }} />
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-full ring-1 ring-inset min-w-[40px] justify-center ${progressBadgeClass(ligne.avancementPct)}`}>{ligne.avancementPct}%</span>
                        </div>
                      </td>
                      {canEdit && (
                        <td className="py-3 px-3 border-l border-gray-100 dark:border-gray-800/50">
                          <div className="flex gap-0.5 justify-center opacity-50 hover:opacity-100 transition-opacity duration-150">
                            <button onClick={() => { setEditingLigneId(ligne.id); setEditLigneForm(ligneToForm(ligne)) }} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Modifier"><IconEdit /></button>
                            <button onClick={() => handleDuplicateLigne(ligne, row.chapitreId)} disabled={saving} className="p-1.5 text-gray-400 hover:text-secondary hover:bg-secondary/5 rounded-lg transition-all" title="Dupliquer"><IconCopy /></button>
                            <button onClick={() => handleDeleteLigne(ligne)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Supprimer"><IconTrash /></button>
                          </div>
                        </td>
                      )}
                    </SortableTableRow>
                  )
                })}

                {/* (formulaire ajout ligne est insere via flatRows type 'add-ligne') */}
              </tbody>
              </SortableContext>
              </DndContext>

              {/* ── TOTAL GENERAL (derniere page uniquement) ───── */}
              {chapitres.length > 0 && (page >= totalPages || totalPages <= 1) && (
                <tfoot>
                  <tr className="bg-gradient-to-r from-secondary to-secondary/90 dark:from-secondary-dark dark:to-secondary border-t-4 border-secondary-light">
                    <td colSpan={5} className="py-5 px-5 border-r border-white/15">
                      <span className="text-[14px] font-black uppercase tracking-wider text-white">
                        Total General HT
                      </span>
                    </td>
                    <td className="py-5 px-4 text-right border-r border-white/15">
                      <span className="text-[16px] font-black text-white tabular-nums">{formatMontant(totalMontant)}</span>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[14px] font-black text-white">{avancementGlobal}%</span>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${progressColor(avancementGlobal)}`} style={{ width: `${Math.min(100, avancementGlobal)}%` }} />
                        </div>
                      </div>
                    </td>
                    {canEdit && <td className="border-l border-white/15"></td>}
                  </tr>
                  <tr className="bg-secondary/90 dark:bg-secondary-dark">
                    <td colSpan={5} className="py-3 px-5 border-r border-white/15">
                      <span className="text-[12px] font-bold text-emerald-400 uppercase tracking-wide">Montant execute</span>
                    </td>
                    <td className="py-3 px-4 text-right border-r border-white/15">
                      <span className="text-[14px] font-black text-emerald-300 tabular-nums">{formatMontant(totalExecute)}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[12px] font-semibold text-white/60">Reste: {formatMontant(totalMontant - totalExecute)}</span>
                    </td>
                    {canEdit && <td className="border-l border-white/15"></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-800">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </PageContainer>
  )
}
