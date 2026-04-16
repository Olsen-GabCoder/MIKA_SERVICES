import { useEffect, useState, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/store/hooks'
import { createDma } from '@/store/slices/demandeMaterielSlice'
import { projetApi } from '@/api/projetApi'
import type { ProjetSummary } from '@/types/projet'
import type { DemandeMaterielLignePayload, PrioriteDemandeMateriel } from '@/types/materiel'
import { PageContainer } from '@/components/layout/PageContainer'
import { motion, AnimatePresence } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTES
   ═══════════════════════════════════════════════════════════════════ */

const UNITES = [
  { value: 'TONNE', short: 'T' },
  { value: 'M3', short: 'M³' },
  { value: 'M2', short: 'M²' },
  { value: 'SAC', short: 'Sac' },
  { value: 'UNITE', short: 'U' },
  { value: 'KG', short: 'KG' },
  { value: 'ML', short: 'ML' },
] as const

const MIN_ROWS = 8

interface LigneRow extends DemandeMaterielLignePayload {
  _key: number
  reference?: string
}

let rowKey = 0
function mkRow(): LigneRow {
  return { _key: ++rowKey, designation: '', quantite: 0, unite: 'UNITE', reference: '' }
}

function generateDocNumber(): string {
  return String(Math.floor(Math.random() * 9999999) + 1).padStart(7, '0')
}

function todayStr(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/* ═══════════════════════════════════════════════════════════════════
   PRINT STYLES (injected once)
   ═══════════════════════════════════════════════════════════════════ */

const PRINT_STYLE_ID = 'dma-print-styles'

function injectPrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = PRINT_STYLE_ID
  style.textContent = `
    @media print {
      /* Hide everything except the form */
      body * { visibility: hidden !important; }
      #dma-form-paper, #dma-form-paper * { visibility: visible !important; }
      #dma-form-paper {
        position: absolute !important;
        left: 0 !important; top: 0 !important;
        width: 100% !important; max-width: none !important;
        margin: 0 !important; padding: 12mm !important;
        box-shadow: none !important; border-radius: 0 !important;
        background: white !important;
      }
      /* A4 landscape */
      @page { size: A4 landscape; margin: 8mm; }
      /* Hide non-print elements */
      .no-print { display: none !important; }
      /* Force borders */
      .dma-border { border-color: #000 !important; }
    }
  `
  document.head.appendChild(style)
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function CheckBox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
      <span
        role="checkbox"
        tabIndex={0}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => e.key === ' ' && onChange(!checked)}
        className={`
          w-4 h-4 border-2 border-black rounded-sm flex items-center justify-center transition-colors
          ${checked ? 'bg-black' : 'bg-white'}
        `}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="2,6 5,9 10,3" />
          </svg>
        )}
      </span>
      <span className="text-xs font-semibold text-black">{label}</span>
    </label>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */

export function DemandeMaterielFormPage() {
  const { t } = useTranslation('materiel')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const formRef = useRef<HTMLDivElement>(null)

  // --- Reference data ---
  const [projets, setProjets] = useState<ProjetSummary[]>([])

  // --- Header fields ---
  const [docNumber] = useState(generateDocNumber)
  const [dateDoc, setDateDoc] = useState(todayStr)
  const [isUrgent, setIsUrgent] = useState(false)
  const [isStocke, setIsStocke] = useState(false)

  // --- Info fields ---
  const [nomDemandeur, setNomDemandeur] = useState('')
  const [projetId, setProjetId] = useState<string>('')
  const [intituleAffaire, setIntituleAffaire] = useState('')
  const [centreCout, setCentreCout] = useState('')
  const [region, setRegion] = useState('')
  const [responsableChantier, setResponsableChantier] = useState('')
  const [refBudgetaire, setRefBudgetaire] = useState('')
  const [observation, setObservation] = useState('')

  // --- Lignes ---
  const [lignes, setLignes] = useState<LigneRow[]>(() => {
    const rows: LigneRow[] = []
    for (let i = 0; i < MIN_ROWS; i++) rows.push(mkRow())
    return rows
  })

  // --- UI ---
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    injectPrintStyles()
    projetApi
      .findAll(0, 200)
      .then((r) => setProjets(r.content))
      .catch(() => {})
  }, [])

  // Auto-fill intitulé when projet changes
  useEffect(() => {
    if (projetId) {
      const p = projets.find((pr) => String(pr.id) === projetId)
      if (p) setIntituleAffaire(p.nom)
    }
  }, [projetId, projets])

  // --- Ligne helpers ---
  function updateLigne<K extends keyof LigneRow>(key: number, field: K, value: LigneRow[K]) {
    setLignes((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)))
  }

  function addLigne() {
    setLignes((prev) => [...prev, mkRow()])
  }

  function removeLigne(key: number) {
    setLignes((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r._key !== key)))
  }

  // --- Print ---
  function handlePrint() {
    window.print()
  }

  // --- Submit ---
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!projetId) { setError('Le projet / N° d\'affaires est obligatoire.'); return }
    if (!nomDemandeur.trim()) { setError('Le nom du demandeur est obligatoire.'); return }

    const validLignes = lignes.filter((l) => l.designation.trim() !== '')
    if (validLignes.length === 0) { setError('Au moins un article avec désignation est requis.'); return }

    for (const l of validLignes) {
      if (l.quantite <= 0) { setError('La quantité doit être > 0 sur tous les articles renseignés.'); return }
    }

    const payload = {
      projetId: Number(projetId),
      priorite: (isUrgent ? 'URGENTE' : 'NORMALE') as PrioriteDemandeMateriel,
      dateSouhaitee: todayISO(),
      commentaire: [
        observation.trim(),
        nomDemandeur.trim() ? `Demandeur: ${nomDemandeur}` : '',
        centreCout.trim() ? `Centre de coût: ${centreCout}` : '',
        region.trim() ? `Région: ${region}` : '',
        responsableChantier.trim() ? `Resp. chantier: ${responsableChantier}` : '',
        refBudgetaire.trim() ? `Réf. budgétaire: ${refBudgetaire}` : '',
        isStocke ? 'Achat stocké: OUI' : '',
      ].filter(Boolean).join('\n') || undefined,
      lignes: validLignes.map(({ _key, reference, ...l }) => ({
        designation: reference ? `${l.designation} [Réf: ${reference}]` : l.designation,
        quantite: l.quantite,
        unite: l.unite,
      })),
    }

    setSubmitting(true)
    try {
      const result = await dispatch(createDma(payload)).unwrap()
      setShowSuccess(true)
      setTimeout(() => navigate(`/dma/${result.id}`), 1500)
    } catch {
      setError('Une erreur est survenue lors de la soumission.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */

  const cellBorder = 'border border-black/80'
  const labelBg = 'bg-gray-50'
  const labelCls = `${cellBorder} ${labelBg} px-3 py-2 text-xs font-bold text-gray-800 whitespace-nowrap`
  const inputCls = `${cellBorder} px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:bg-amber-50/40 transition-colors`

  return (
    <PageContainer size="full" className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* ── Toolbar (hidden on print) ── */}
      <div className="no-print max-w-[1100px] mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <motion.button
          type="button"
          onClick={() => navigate('/dma')}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          whileHover={{ x: -4 }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux DMA
        </motion.button>

        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.25 7.234l-.001.006" />
            </svg>
            Imprimer
          </motion.button>

          <motion.button
            type="button"
            onClick={handleSubmit as () => void}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-bold shadow-lg shadow-primary/25 disabled:opacity-50"
            whileHover={{ scale: 1.03, boxShadow: '0 12px 30px -4px rgba(232, 90, 42, 0.4)' }}
            whileTap={{ scale: 0.97 }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Soumission…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Soumettre la demande
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Error / Success banners ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="no-print max-w-[1100px] mx-auto px-4 mb-3"
          >
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
              <button type="button" onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Demande soumise</h3>
              <p className="text-sm text-gray-500">Redirection en cours…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
         THE PAPER DOCUMENT
         ═══════════════════════════════════════════════════════════════ */}
      <motion.div
        ref={formRef}
        id="dma-form-paper"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[1100px] mx-auto bg-white shadow-2xl rounded-lg mb-12 overflow-hidden"
        style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }}
      >
        <form onSubmit={handleSubmit} noValidate>

          {/* ══════════ EN-TÊTE — 3 colonnes ══════════ */}
          <div className="border-2 border-black">
            <div className="grid grid-cols-[1fr_2fr_1fr]">
              {/* Logo */}
              <div className={`${cellBorder} flex flex-col items-center justify-center p-4`}>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md mb-1">
                  <span className="text-white font-black text-lg tracking-tighter">MS</span>
                </div>
                <p className="text-[10px] font-bold text-gray-700 tracking-wider mt-1">MIKA SERVICES</p>
              </div>

              {/* Title */}
              <div className={`${cellBorder} flex items-center justify-center p-4`}>
                <h1 className="text-2xl md:text-3xl font-black text-black tracking-wide text-center leading-tight">
                  DEMANDE DE MATÉRIEL
                </h1>
              </div>

              {/* Doc number */}
              <div className={`${cellBorder} flex flex-col items-center justify-center p-4`}>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">N° Document</p>
                <p className="text-2xl md:text-3xl font-black text-red-600 tracking-wider font-mono">
                  {docNumber}
                </p>
              </div>
            </div>

            {/* ══════════ BLOC META — Date + Urgent + Stocké ══════════ */}
            <div className="grid grid-cols-2">
              {/* Date */}
              <div className={`${cellBorder} flex items-center gap-3 px-4 py-2.5`}>
                <span className="text-xs font-bold text-gray-800 whitespace-nowrap">Date :</span>
                <input
                  type="text"
                  value={dateDoc}
                  onChange={(e) => setDateDoc(e.target.value)}
                  placeholder="JJ/MM/AAAA"
                  className="flex-1 text-sm font-semibold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-primary focus:outline-none px-1 py-0.5"
                />
              </div>

              {/* Urgent + Stocké */}
              <div className={`${cellBorder} flex items-center gap-6 px-4 py-2.5`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-800">Urgent :</span>
                  <CheckBox checked={isUrgent} onChange={setIsUrgent} label="OUI" />
                  <CheckBox checked={!isUrgent} onChange={(v) => setIsUrgent(!v)} label="NON" />
                </div>
                <div className="w-px h-5 bg-gray-300" />
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-800">Achat stocké :</span>
                  <CheckBox checked={isStocke} onChange={setIsStocke} label="OUI" />
                  <CheckBox checked={!isStocke} onChange={(v) => setIsStocke(!v)} label="NON" />
                </div>
              </div>
            </div>

            {/* ══════════ BLOC INFORMATIONS ══════════ */}
            <table className="w-full border-collapse">
              <tbody>
                {/* Nom du demandeur */}
                <tr>
                  <td className={labelCls} style={{ width: '200px' }}>Nom du demandeur</td>
                  <td className={inputCls}>
                    <input
                      type="text"
                      value={nomDemandeur}
                      onChange={(e) => setNomDemandeur(e.target.value)}
                      className="w-full bg-transparent focus:outline-none text-sm"
                      placeholder="Saisir le nom complet…"
                    />
                  </td>
                </tr>
                {/* N° d'affaires */}
                <tr>
                  <td className={labelCls}>N° d'affaires</td>
                  <td className={inputCls}>
                    <select
                      value={projetId}
                      onChange={(e) => setProjetId(e.target.value)}
                      className="w-full bg-transparent focus:outline-none text-sm cursor-pointer"
                    >
                      <option value="">— Sélectionner —</option>
                      {projets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.codeProjet ? `${p.codeProjet} — ${p.nom}` : p.nom}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                {/* Intitulé affaire */}
                <tr>
                  <td className={labelCls}>Intitulé affaire</td>
                  <td className={inputCls}>
                    <input
                      type="text"
                      value={intituleAffaire}
                      onChange={(e) => setIntituleAffaire(e.target.value)}
                      className="w-full bg-transparent focus:outline-none text-sm"
                      placeholder="Rempli automatiquement…"
                    />
                  </td>
                </tr>
                {/* Centre de coût */}
                <tr>
                  <td className={labelCls}>Centre de coût</td>
                  <td className={inputCls}>
                    <input
                      type="text"
                      value={centreCout}
                      onChange={(e) => setCentreCout(e.target.value)}
                      className="w-full bg-transparent focus:outline-none text-sm"
                    />
                  </td>
                </tr>
                {/* Région */}
                <tr>
                  <td className={labelCls}>Région</td>
                  <td className={inputCls}>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-transparent focus:outline-none text-sm"
                      placeholder="Ex: Estuaire, Haut-Ogooué…"
                    />
                  </td>
                </tr>
                {/* Responsable Chantier */}
                <tr>
                  <td className={labelCls}>Responsable Chantier</td>
                  <td className={inputCls}>
                    <input
                      type="text"
                      value={responsableChantier}
                      onChange={(e) => setResponsableChantier(e.target.value)}
                      className="w-full bg-transparent focus:outline-none text-sm"
                    />
                  </td>
                </tr>
                {/* Référence budgétaire */}
                <tr>
                  <td className={labelCls}>Référence budgétaire</td>
                  <td className={inputCls}>
                    <input
                      type="text"
                      value={refBudgetaire}
                      onChange={(e) => setRefBudgetaire(e.target.value)}
                      className="w-full bg-transparent focus:outline-none text-sm"
                    />
                  </td>
                </tr>
                {/* Observation */}
                <tr>
                  <td className={`${labelCls} align-top`}>Observation</td>
                  <td className={inputCls}>
                    <textarea
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      rows={2}
                      className="w-full bg-transparent focus:outline-none text-sm resize-none"
                      placeholder="Observations complémentaires…"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ══════════ TABLEAU DES ARTICLES ══════════ */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`${labelCls} text-center w-10`}>#</th>
                    <th className={`${labelCls} text-center`} style={{ width: '140px' }}>
                      Quantité
                      <span className="block text-[9px] font-medium text-gray-500 mt-0.5">(avec unité)</span>
                    </th>
                    <th className={`${labelCls} text-left`}>Désignation</th>
                    <th className={`${labelCls} text-left`} style={{ width: '200px' }}>Référence</th>
                    <th className={`${labelCls} text-center w-10 no-print`}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((row, idx) => (
                    <motion.tr
                      key={row._key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group"
                    >
                      {/* # */}
                      <td className={`${cellBorder} text-center text-xs font-bold text-gray-400 py-1.5`}>
                        {idx + 1}
                      </td>

                      {/* Quantité + unité */}
                      <td className={`${cellBorder} p-0`}>
                        <div className="flex">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.quantite || ''}
                            onChange={(e) => updateLigne(row._key, 'quantite', parseFloat(e.target.value) || 0)}
                            className="w-[60%] px-2 py-1.5 text-sm text-center bg-transparent border-r border-black/30 focus:outline-none focus:bg-amber-50/40"
                            placeholder="0"
                          />
                          <select
                            value={row.unite}
                            onChange={(e) => updateLigne(row._key, 'unite', e.target.value)}
                            className="w-[40%] px-1 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 focus:outline-none cursor-pointer text-center"
                          >
                            {UNITES.map((u) => (
                              <option key={u.value} value={u.value}>{u.short}</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Désignation */}
                      <td className={`${cellBorder} p-0`}>
                        <input
                          type="text"
                          value={row.designation}
                          onChange={(e) => updateLigne(row._key, 'designation', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-transparent focus:outline-none focus:bg-amber-50/40"
                          placeholder="Description de l'article…"
                        />
                      </td>

                      {/* Référence */}
                      <td className={`${cellBorder} p-0`}>
                        <input
                          type="text"
                          value={row.reference || ''}
                          onChange={(e) => updateLigne(row._key, 'reference', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-transparent focus:outline-none focus:bg-amber-50/40"
                          placeholder="Réf. catalogue…"
                        />
                      </td>

                      {/* Remove button */}
                      <td className={`${cellBorder} text-center p-0 no-print`}>
                        {lignes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLigne(row._key)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                            tabIndex={-1}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add row button (no-print) */}
            <div className="no-print flex justify-center py-2 border-t border-black/20">
              <button
                type="button"
                onClick={addLigne}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter une ligne
              </button>
            </div>

            {/* ══════════ BLOC SIGNATURES — 2×2 ══════════ */}
            <div className="grid grid-cols-2">
              {/* Row 1 */}
              <div className={`${cellBorder} p-3`}>
                <p className="text-xs font-black text-gray-900 uppercase tracking-wide mb-1">Demandeur</p>
                <div className="h-20 border border-dashed border-gray-300 rounded-md flex items-end justify-center pb-2">
                  <p className="text-[9px] text-gray-400 italic">Signature & date</p>
                </div>
              </div>
              <div className={`${cellBorder} p-3`}>
                <p className="text-xs font-black text-gray-900 uppercase tracking-wide mb-1">Responsable Service Demandeur</p>
                <div className="h-20 border border-dashed border-gray-300 rounded-md flex items-end justify-center pb-2">
                  <p className="text-[9px] text-gray-400 italic">Signature & date</p>
                </div>
              </div>

              {/* Row 2 */}
              <div className={`${cellBorder} p-3`}>
                <p className="text-xs font-black text-gray-900 uppercase tracking-wide mb-1">Directeur Général</p>
                <div className="h-20 border border-dashed border-gray-300 rounded-md flex items-end justify-center pb-2">
                  <p className="text-[9px] text-gray-400 italic">Signature & date</p>
                </div>
              </div>
              <div className={`${cellBorder} p-3`}>
                <p className="text-xs font-black text-gray-900 uppercase tracking-wide mb-1">Directeur Administratif et Financier</p>
                <div className="h-20 border border-dashed border-gray-300 rounded-md flex items-end justify-center pb-2">
                  <p className="text-[9px] text-gray-400 italic">Signature & date</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer watermark */}
          <div className="text-center py-2 text-[9px] text-gray-400 font-medium tracking-wide">
            MIKA SERVICES — Demande de Matériel — Document généré le {todayStr()}
          </div>
        </form>
      </motion.div>
    </PageContainer>
  )
}
