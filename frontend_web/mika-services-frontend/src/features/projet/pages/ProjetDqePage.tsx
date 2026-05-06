import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Alert } from '@/components/ui/Alert'
import { useAppSelector } from '@/store/hooks'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { useConfirm } from '@/contexts/ConfirmContext'
import { dqeApi } from '@/api/dqeApi'
import { projetApi } from '@/api/projetApi'
import { canEditProjetEffective } from '@/utils/authRoles'
import type { DqeChapitre, DqeLigne } from '@/types/dqe'
import type { Projet } from '@/types/projet'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden'
const CARD_HEADER = 'px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-3 border-l-[5px] border-l-primary'
const CARD_TITLE = 'text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide'
const CARD_BODY = 'p-6'
const TH = 'py-3 px-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/60 border-b-2 border-gray-200 dark:border-gray-600'
const TD = 'py-3 px-4 border-b border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm'

/** Couleur de la barre d'avancement */
function progressColor(pct: number): string {
  if (pct >= 100) return 'bg-green-500'
  if (pct >= 50) return 'bg-blue-500'
  if (pct > 0) return 'bg-amber-500'
  return 'bg-gray-300 dark:bg-gray-600'
}

/** Couleur texte du % */
function progressTextClass(pct: number): string {
  if (pct >= 100) return 'text-green-600 dark:text-green-400'
  if (pct >= 50) return 'text-blue-600 dark:text-blue-400'
  if (pct > 0) return 'text-amber-600 dark:text-amber-400'
  return 'text-gray-400 dark:text-gray-500'
}

// ── Icônes SVG inline ──────────────────────────────────────────────────

const IconBack = () => (
  <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)
const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const IconEdit = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)
const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)
const IconChevron = ({ open }: { open: boolean }) => (
  <svg className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

// ── Types formulaire ───────────────────────────────────────────────────

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

// ── Composant principal ────────────────────────────────────────────────

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

  // Accordéons ouverts
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

  // ── Toggle accordéon ──────────────────────────────────────────────

  const toggleChapitre = (chapId: number) => {
    setOpenChapitres((prev) => {
      const next = new Set(prev)
      if (next.has(chapId)) next.delete(chapId)
      else next.add(chapId)
      return next
    })
  }

  // ── CRUD Chapitres ────────────────────────────────────────────────

  const handleCreateChapitre = async () => {
    if (!id || !chapitreForm.numero.trim() || !chapitreForm.designation.trim()) return
    setSaving(true)
    try {
      await dqeApi.createChapitre({ projetId: Number(id), numero: chapitreForm.numero.trim(), designation: chapitreForm.designation.trim() })
      setChapitreForm(emptyChapitreForm)
      setAddingChapitre(false)
      await loadData()
    } catch { setError('Erreur lors de la création du chapitre') }
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
      message: `Supprimer le chapitre « ${chap.numero} — ${chap.designation} » et toutes ses lignes ?`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await dqeApi.deleteChapitre(chap.id)
      await loadData()
    } catch { setError('Erreur lors de la suppression du chapitre') }
  }

  // ── CRUD Lignes ───────────────────────────────────────────────────

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
    } catch { setError('Erreur lors de la création de la ligne') }
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
      message: `Supprimer la ligne « ${ligne.numeroPoste ?? ''} ${ligne.designation} » ?`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await dqeApi.deleteLigne(ligne.id)
      await loadData()
    } catch { setError('Erreur lors de la suppression de la ligne') }
  }

  // ── Calculs globaux ───────────────────────────────────────────────

  const totalMontant = chapitres.reduce((s, c) => s + c.montantTotal, 0)
  const totalExecute = chapitres.reduce((s, c) => s + c.montantExecute, 0)
  const totalLignes = chapitres.reduce((s, c) => s + c.nombreLignes, 0)
  const avancementGlobal = totalMontant > 0 ? Math.round((totalExecute / totalMontant) * 10000) / 100 : 0

  // ── Rendu ─────────────────────────────────────────────────────────

  if (loading) return <PageContainer><div className="text-center text-gray-500 py-12">Chargement du DQE…</div></PageContainer>
  if (error && !projet) return <PageContainer><Alert type="error">{error}</Alert></PageContainer>
  if (!projet) return <PageContainer><div className="text-center text-gray-500 py-12">Projet non trouvé</div></PageContainer>

  return (
    <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
      {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* En-tête */}
      <header className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md mb-6 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-orange-400 to-amber-400" />
        <div className="px-6 py-6">
          <button onClick={() => navigate(`/projets/${id}`)} className="inline-flex items-center gap-1.5 text-gray-400 hover:text-primary text-sm mb-4 transition-colors group">
            <IconBack /> Retour au projet
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white">DQE — {projet.nom}</h1>
              {projet.codeProjet && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{projet.codeProjet}{projet.numeroMarche ? ` · Marché ${projet.numeroMarche}` : ''}</p>}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Montant total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMontant(totalMontant)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Montant exécuté</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatMontant(totalExecute)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Avancement</p>
              <p className={`text-lg font-bold ${progressTextClass(avancementGlobal)}`}>{avancementGlobal} %</p>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                <div className={`h-full rounded-full transition-all duration-500 ${progressColor(avancementGlobal)}`} style={{ width: `${Math.min(100, avancementGlobal)}%` }} />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Postes</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{totalLignes} <span className="text-sm font-normal text-gray-500">lignes</span></p>
              <p className="text-sm text-gray-500 mt-1">{chapitres.length} chapitres</p>
            </div>
          </div>
        </div>
      </header>

      {/* Bouton ajouter chapitre */}
      {canEdit && !addingChapitre && (
        <div className="mb-4">
          <button onClick={() => setAddingChapitre(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <IconPlus /> Ajouter un chapitre
          </button>
        </div>
      )}

      {/* Formulaire ajout chapitre */}
      {addingChapitre && (
        <div className={`${CARD} mb-4`}>
          <div className={CARD_BODY}>
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-shrink-0 w-32">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">N° Chapitre</label>
                <input value={chapitreForm.numero} onChange={(e) => setChapitreForm({ ...chapitreForm, numero: e.target.value })} placeholder="100" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Désignation</label>
                <input value={chapitreForm.designation} onChange={(e) => setChapitreForm({ ...chapitreForm, designation: e.target.value })} placeholder="INSTALLATION DE CHANTIER" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateChapitre} disabled={saving || !chapitreForm.numero.trim() || !chapitreForm.designation.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
                  <IconCheck /> Valider
                </button>
                <button onClick={() => { setAddingChapitre(false); setChapitreForm(emptyChapitreForm) }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-semibold transition-colors">
                  <IconX /> Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des chapitres */}
      {chapitres.length === 0 && !addingChapitre && (
        <div className={CARD}>
          <div className={CARD_BODY}>
            <p className="text-center text-gray-400 dark:text-gray-500 py-8">Aucun chapitre DQE pour ce projet.{canEdit ? ' Cliquez sur « Ajouter un chapitre » pour commencer.' : ''}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {chapitres.map((chap) => {
          const isOpen = openChapitres.has(chap.id)
          const isEditing = editingChapitreId === chap.id

          return (
            <div key={chap.id} className={CARD}>
              {/* Header chapitre */}
              <div className={`${CARD_HEADER} cursor-pointer select-none`} onClick={() => !isEditing && toggleChapitre(chap.id)}>
                <IconChevron open={isOpen} />
                {isEditing ? (
                  <div className="flex flex-1 flex-col md:flex-row gap-2 items-end" onClick={(e) => e.stopPropagation()}>
                    <input value={editChapitreForm.numero} onChange={(e) => setEditChapitreForm({ ...editChapitreForm, numero: e.target.value })} className="w-24 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    <input value={editChapitreForm.designation} onChange={(e) => setEditChapitreForm({ ...editChapitreForm, designation: e.target.value })} className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    <div className="flex gap-1">
                      <button onClick={() => handleUpdateChapitre(chap.id)} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"><IconCheck /></button>
                      <button onClick={() => setEditingChapitreId(null)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><IconX /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <h3 className={CARD_TITLE}>{chap.numero} — {chap.designation}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm flex-shrink-0">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{formatMontant(chap.montantTotal)}</span>
                      <span className={`font-bold ${progressTextClass(chap.avancementPct)}`}>{chap.avancementPct} %</span>
                      <span className="text-xs text-gray-400">{chap.nombreLignes} ligne{chap.nombreLignes > 1 ? 's' : ''}</span>
                      {canEdit && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setEditingChapitreId(chap.id); setEditChapitreForm({ numero: chap.numero, designation: chap.designation }) }} className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Modifier"><IconEdit /></button>
                          <button onClick={() => handleDeleteChapitre(chap)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Supprimer"><IconTrash /></button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Corps chapitre (lignes) */}
              {isOpen && (
                <div className={CARD_BODY}>
                  {chap.lignes.length > 0 && (
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr>
                            <th className={TH} style={{ width: '80px' }}>N°</th>
                            <th className={TH}>Désignation</th>
                            <th className={TH} style={{ width: '60px' }}>Unité</th>
                            <th className={`${TH} text-right`} style={{ width: '90px' }}>Quantité</th>
                            <th className={`${TH} text-right`} style={{ width: '120px' }}>P.U.</th>
                            <th className={`${TH} text-right`} style={{ width: '140px' }}>Montant</th>
                            <th className={`${TH} text-center`} style={{ width: '120px' }}>Avancement</th>
                            {canEdit && <th className={TH} style={{ width: '80px' }}></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {chap.lignes.map((ligne) => {
                            if (editingLigneId === ligne.id) {
                              return (
                                <tr key={ligne.id} className="bg-primary/5 dark:bg-primary/10">
                                  <td className={TD}><input value={editLigneForm.numeroPoste} onChange={(e) => setEditLigneForm({ ...editLigneForm, numeroPoste: e.target.value })} className="w-full border rounded px-1.5 py-1 text-xs bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></td>
                                  <td className={TD}><input value={editLigneForm.designation} onChange={(e) => setEditLigneForm({ ...editLigneForm, designation: e.target.value })} className="w-full border rounded px-1.5 py-1 text-xs bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></td>
                                  <td className={TD}><input value={editLigneForm.unite} onChange={(e) => setEditLigneForm({ ...editLigneForm, unite: e.target.value })} className="w-full border rounded px-1.5 py-1 text-xs bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></td>
                                  <td className={TD}><input type="number" value={editLigneForm.quantite} onChange={(e) => setEditLigneForm({ ...editLigneForm, quantite: e.target.value })} className="w-full border rounded px-1.5 py-1 text-xs text-right bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></td>
                                  <td className={TD}><input type="number" value={editLigneForm.prixUnitaire} onChange={(e) => setEditLigneForm({ ...editLigneForm, prixUnitaire: e.target.value })} className="w-full border rounded px-1.5 py-1 text-xs text-right bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></td>
                                  <td className={TD}><input type="number" value={editLigneForm.montantTotal} onChange={(e) => setEditLigneForm({ ...editLigneForm, montantTotal: e.target.value })} className="w-full border rounded px-1.5 py-1 text-xs text-right bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></td>
                                  <td className={TD}><input type="number" min="0" max="100" value={editLigneForm.avancementPct} onChange={(e) => setEditLigneForm({ ...editLigneForm, avancementPct: e.target.value })} className="w-full border rounded px-1.5 py-1 text-xs text-center bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></td>
                                  <td className={TD}>
                                    <div className="flex gap-1">
                                      <button onClick={() => handleUpdateLigne(ligne.id)} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"><IconCheck /></button>
                                      <button onClick={() => setEditingLigneId(null)} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><IconX /></button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            }

                            return (
                              <tr key={ligne.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className={`${TD} font-mono text-xs text-gray-500`}>{ligne.numeroPoste || '—'}</td>
                                <td className={`${TD} font-medium`}>{ligne.designation}</td>
                                <td className={`${TD} text-center text-xs text-gray-500`}>{ligne.unite || '—'}</td>
                                <td className={`${TD} text-right font-mono`}>{ligne.quantite != null ? ligne.quantite.toLocaleString('fr-FR') : '—'}</td>
                                <td className={`${TD} text-right`}>{ligne.prixUnitaire != null ? formatMontant(ligne.prixUnitaire) : '—'}</td>
                                <td className={`${TD} text-right font-semibold`}>{ligne.montantTotal != null ? formatMontant(ligne.montantTotal) : '—'}</td>
                                <td className={TD}>
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`text-xs font-bold ${progressTextClass(ligne.avancementPct)}`}>{ligne.avancementPct} %</span>
                                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                      <div className={`h-full rounded-full transition-all duration-300 ${progressColor(ligne.avancementPct)}`} style={{ width: `${Math.min(100, ligne.avancementPct)}%` }} />
                                    </div>
                                  </div>
                                </td>
                                {canEdit && (
                                  <td className={TD}>
                                    <div className="flex gap-1">
                                      <button onClick={() => { setEditingLigneId(ligne.id); setEditLigneForm(ligneToForm(ligne)) }} className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Modifier"><IconEdit /></button>
                                      <button onClick={() => handleDeleteLigne(ligne)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Supprimer"><IconTrash /></button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            )
                          })}

                          {/* Sous-total */}
                          <tr className="bg-gray-50 dark:bg-gray-700/40 font-semibold">
                            <td className={TD} colSpan={5}><span className="text-xs uppercase text-gray-500">Sous-total {chap.numero}</span></td>
                            <td className={`${TD} text-right`}>{formatMontant(chap.montantTotal)}</td>
                            <td className={`${TD} text-center`}><span className={progressTextClass(chap.avancementPct)}>{chap.avancementPct} %</span></td>
                            {canEdit && <td className={TD}></td>}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {chap.lignes.length === 0 && (
                    <p className="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">Aucune ligne dans ce chapitre.</p>
                  )}

                  {/* Formulaire ajout ligne */}
                  {addingLigneChapitreId === chap.id ? (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">Nouvelle ligne</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">N° Poste</label>
                          <input value={ligneForm.numeroPoste} onChange={(e) => setLigneForm({ ...ligneForm, numeroPoste: e.target.value })} placeholder="101" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none" />
                        </div>
                        <div className="col-span-2 md:col-span-3">
                          <label className="block text-xs text-gray-500 mb-1">Désignation *</label>
                          <input value={ligneForm.designation} onChange={(e) => setLigneForm({ ...ligneForm, designation: e.target.value })} placeholder="Installation de chantier" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Unité</label>
                          <input value={ligneForm.unite} onChange={(e) => setLigneForm({ ...ligneForm, unite: e.target.value })} placeholder="m³" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Quantité</label>
                          <input type="number" value={ligneForm.quantite} onChange={(e) => setLigneForm({ ...ligneForm, quantite: e.target.value })} placeholder="0" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Prix unitaire</label>
                          <input type="number" value={ligneForm.prixUnitaire} onChange={(e) => setLigneForm({ ...ligneForm, prixUnitaire: e.target.value })} placeholder="0" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Montant total</label>
                          <input type="number" value={ligneForm.montantTotal} onChange={(e) => setLigneForm({ ...ligneForm, montantTotal: e.target.value })} placeholder="Auto si Qté × PU" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => handleCreateLigne(chap.id)} disabled={saving || !ligneForm.designation.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
                          <IconCheck /> Valider
                        </button>
                        <button onClick={() => { setAddingLigneChapitreId(null); setLigneForm(emptyLigneForm) }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-semibold transition-colors">
                          <IconX /> Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    canEdit && (
                      <div className="mt-4">
                        <button onClick={() => { setAddingLigneChapitreId(chap.id); setLigneForm(emptyLigneForm) }} className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-semibold transition-colors">
                          <IconPlus /> Ajouter une ligne
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Total général */}
      {chapitres.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total général HT</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatMontant(totalMontant)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Montant exécuté</p>
              <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">{formatMontant(totalExecute)}</p>
            </div>
            <div className="text-center md:w-48">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Avancement global</p>
              <p className={`text-2xl font-extrabold ${progressTextClass(avancementGlobal)}`}>{avancementGlobal} %</p>
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                <div className={`h-full rounded-full transition-all duration-500 ${progressColor(avancementGlobal)}`} style={{ width: `${Math.min(100, avancementGlobal)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
