/**
 * Modale d'import DQE par IA — MIKA Services
 * Upload fichier → analyse IA → édition/validation → création en base.
 */
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { dqeApi } from '@/api/dqeApi'
import type { DqeChapitreExtrait, DqeLigneExtraite } from '@/types/dqe'

// ── Types internes (copies éditables) ─────────────────────────────────

interface EditableLigne extends DqeLigneExtraite {
  _key: string
}

interface EditableChapitre {
  _key: string
  numero: string
  designation: string
  lignes: EditableLigne[]
}

let _keyCounter = 0
function uid() { return `k${++_keyCounter}` }

function toEditable(chapitres: DqeChapitreExtrait[]): EditableChapitre[] {
  return chapitres.map(c => ({
    _key: uid(),
    numero: c.numero,
    designation: c.designation,
    lignes: c.lignes.map(l => ({ ...l, _key: uid() })),
  }))
}

// ── Composant ─────────────────────────────────────────────────────────

interface Props {
  projetId: number
  open: boolean
  onClose: () => void
  onImported: () => void
}

export function DqeImportModal({ projetId, open, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  // Étapes : upload → analyzing → review → saving → done
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review' | 'saving'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [chapitres, setChapitres] = useState<EditableChapitre[]>([])
  const [mode, setMode] = useState<'replace' | 'append'>('replace')

  if (!open) return null

  const totalLignes = chapitres.reduce((s, c) => s + c.lignes.length, 0)
  const totalMontant = chapitres.reduce((s, c) => s + c.lignes.reduce((sl, l) => sl + (l.montantTotal ?? 0), 0), 0)

  // ── Upload et analyse IA ──────────────────────────────────────────

  const handleAnalyse = async () => {
    if (!file) return
    setError(null)
    setStep('analyzing')
    try {
      const result = await dqeApi.analyserDqe(projetId, file)
      setChapitres(toEditable(result.chapitres))
      setWarnings(result.avertissements)
      setStep('review')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de l\'analyse'
      setError(msg)
      setStep('upload')
    }
  }

  // ── Sauvegarde en base ────────────────────────────────────────────

  const handleSave = async () => {
    setStep('saving')
    setError(null)
    try {
      // Supprimer les chapitres existants si mode remplacer
      if (mode === 'replace') {
        const existing = await dqeApi.findByProjet(projetId)
        for (const ch of existing) {
          await dqeApi.deleteChapitre(ch.id)
        }
      }

      // Créer les chapitres et lignes
      for (let ci = 0; ci < chapitres.length; ci++) {
        const chap = chapitres[ci]
        const created = await dqeApi.createChapitre({
          projetId,
          numero: chap.numero,
          designation: chap.designation,
          ordre: ci,
        })
        for (let li = 0; li < chap.lignes.length; li++) {
          const ligne = chap.lignes[li]
          await dqeApi.createLigne({
            chapitreId: created.id,
            numeroPoste: ligne.numeroPoste,
            designation: ligne.designation,
            unite: ligne.unite,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            montantTotal: ligne.montantTotal,
            avancementPct: 0,
            ordre: li,
          })
        }
      }

      onImported()
      onClose()
    } catch {
      setError('Erreur lors de la sauvegarde du DQE')
      setStep('review')
    }
  }

  // ── Édition des chapitres ─────────────────────────────────────────

  const updateChapitre = (key: string, field: 'numero' | 'designation', value: string) => {
    setChapitres(prev => prev.map(c => c._key === key ? { ...c, [field]: value } : c))
  }

  const removeChapitre = (key: string) => {
    setChapitres(prev => prev.filter(c => c._key !== key))
  }

  const addChapitre = () => {
    const nums = chapitres.map(c => parseInt(c.numero)).filter(n => !isNaN(n))
    const next = nums.length > 0 ? String(Math.ceil((Math.max(...nums) + 1) / 100) * 100) : '100'
    setChapitres(prev => [...prev, { _key: uid(), numero: next, designation: '', lignes: [] }])
  }

  // ── Édition des lignes ────────────────────────────────────────────

  const updateLigne = (chapKey: string, ligneKey: string, field: keyof DqeLigneExtraite, value: string) => {
    setChapitres(prev => prev.map(c => {
      if (c._key !== chapKey) return c
      return {
        ...c,
        lignes: c.lignes.map(l => {
          if (l._key !== ligneKey) return l
          if (field === 'designation' || field === 'numeroPoste' || field === 'unite') {
            return { ...l, [field]: value }
          }
          const num = value === '' ? undefined : Number(value)
          const updated = { ...l, [field]: isNaN(num as number) ? undefined : num }
          // Auto-calc montant
          if (field === 'quantite' || field === 'prixUnitaire') {
            const qte = field === 'quantite' ? (num ?? undefined) : l.quantite
            const pu = field === 'prixUnitaire' ? (num ?? undefined) : l.prixUnitaire
            if (qte != null && pu != null && qte > 0 && pu > 0) {
              updated.montantTotal = Math.round(qte * pu * 100) / 100
            }
          }
          return updated
        }),
      }
    }))
  }

  const removeLigne = (chapKey: string, ligneKey: string) => {
    setChapitres(prev => prev.map(c => c._key === chapKey ? { ...c, lignes: c.lignes.filter(l => l._key !== ligneKey) } : c))
  }

  const addLigne = (chapKey: string) => {
    const chap = chapitres.find(c => c._key === chapKey)
    const nextNum = chap ? `${chap.numero}-${chap.lignes.length + 1}` : ''
    setChapitres(prev => prev.map(c => c._key === chapKey ? { ...c, lignes: [...c.lignes, { _key: uid(), designation: '', numeroPoste: nextNum }] } : c))
  }

  // ── Format montant ────────────────────────────────────────────────

  const fmt = (n?: number) => n != null ? n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : ''

  // ── Rendu ─────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-secondary-light to-secondary text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Import DQE par Intelligence Artificielle</h2>
            <p className="text-sm text-white/70">
              {step === 'upload' && 'Téléversez un fichier DQE (Excel, PDF, image)'}
              {step === 'analyzing' && 'Analyse en cours par l\'IA...'}
              {step === 'review' && `${chapitres.length} chapitres / ${totalLignes} lignes extraites — Vérifiez et modifiez si nécessaire`}
              {step === 'saving' && 'Enregistrement en cours...'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">{error}</div>
          )}

          {/* ── ÉTAPE 1 : Upload ── */}
          {step === 'upload' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 bg-secondary/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Téléversez votre DQE</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                L'IA analysera le document et extraira automatiquement les chapitres et lignes. Formats acceptés : Excel (.xlsx, .xls), PDF, images (JPG, PNG).
              </p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.pdf,.docx,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
              <div className="flex flex-col items-center gap-3">
                <Button variant="primary" size="lg" onClick={() => fileRef.current?.click()}>
                  {file ? file.name : 'Choisir un fichier'}
                </Button>
                {file && (
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                )}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Analyse en cours ── */}
          {step === 'analyzing' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">L'IA analyse le document...</p>
              <p className="text-xs text-gray-400 mt-2">Cela peut prendre jusqu'à 60 secondes pour les gros fichiers</p>
            </div>
          )}

          {/* ── ÉTAPE 3 : Revue et édition ── */}
          {step === 'review' && (
            <>
              {/* Avertissements IA */}
              {warnings.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1 uppercase">Avertissements de l'IA</p>
                  <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
                    {warnings.map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
              )}

              {/* Résumé */}
              <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{chapitres.length} chapitres</span>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{totalLignes} lignes</span>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Total: {fmt(totalMontant)} XAF</span>
                <div className="flex-1" />
                <button onClick={addChapitre} className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">+ Ajouter un chapitre</button>
              </div>

              {/* Tableau éditable */}
              <div className="space-y-3">
                {chapitres.map((chap) => (
                  <div key={chap._key} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    {/* En-tête chapitre */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary-light/20 dark:bg-secondary/20">
                      <input
                        value={chap.numero}
                        onChange={(e) => updateChapitre(chap._key, 'numero', e.target.value)}
                        className="w-20 px-2 py-1 text-sm font-bold border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
                        placeholder="N°"
                      />
                      <input
                        value={chap.designation}
                        onChange={(e) => updateChapitre(chap._key, 'designation', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
                        placeholder="Désignation du chapitre"
                      />
                      <span className="text-xs text-gray-500">{chap.lignes.length} lignes</span>
                      <button onClick={() => addLigne(chap._key)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors">+ Ligne</button>
                      <button onClick={() => removeChapitre(chap._key)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">Supprimer</button>
                    </div>

                    {/* Lignes */}
                    {chap.lignes.length > 0 && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <th className="px-2 py-1.5 text-left" style={{ width: 70 }}>N°</th>
                            <th className="px-2 py-1.5 text-left">Désignation</th>
                            <th className="px-2 py-1.5 text-center" style={{ width: 60 }}>Unité</th>
                            <th className="px-2 py-1.5 text-right" style={{ width: 80 }}>Qté</th>
                            <th className="px-2 py-1.5 text-right" style={{ width: 100 }}>P.U.</th>
                            <th className="px-2 py-1.5 text-right" style={{ width: 110 }}>Montant</th>
                            <th className="px-2 py-1.5" style={{ width: 36 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {chap.lignes.map((ligne, idx) => (
                            <tr key={ligne._key} className={idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''}>
                              <td className="px-2 py-1"><input value={ligne.numeroPoste ?? ''} onChange={(e) => updateLigne(chap._key, ligne._key, 'numeroPoste', e.target.value)} className="w-full px-1.5 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 dark:text-white" /></td>
                              <td className="px-2 py-1"><input value={ligne.designation} onChange={(e) => updateLigne(chap._key, ligne._key, 'designation', e.target.value)} className="w-full px-1.5 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 dark:text-white" /></td>
                              <td className="px-2 py-1"><input value={ligne.unite ?? ''} onChange={(e) => updateLigne(chap._key, ligne._key, 'unite', e.target.value)} className="w-full px-1.5 py-1 text-xs text-center border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 dark:text-white" /></td>
                              <td className="px-2 py-1"><input type="number" value={ligne.quantite ?? ''} onChange={(e) => updateLigne(chap._key, ligne._key, 'quantite', e.target.value)} className="w-full px-1.5 py-1 text-xs text-right border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 dark:text-white" /></td>
                              <td className="px-2 py-1"><input type="number" value={ligne.prixUnitaire ?? ''} onChange={(e) => updateLigne(chap._key, ligne._key, 'prixUnitaire', e.target.value)} className="w-full px-1.5 py-1 text-xs text-right border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 dark:text-white" /></td>
                              <td className="px-2 py-1"><input type="number" value={ligne.montantTotal ?? ''} onChange={(e) => updateLigne(chap._key, ligne._key, 'montantTotal', e.target.value)} className="w-full px-1.5 py-1 text-xs text-right font-semibold border border-gray-200 dark:border-gray-700 rounded bg-emerald-50 dark:bg-emerald-900/20 dark:text-white" /></td>
                              <td className="px-1 py-1 text-center">
                                <button onClick={() => removeLigne(chap._key, ligne._key)} className="p-1 text-gray-300 hover:text-red-500 transition-colors" title="Supprimer">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── ÉTAPE 4 : Sauvegarde ── */}
          {step === 'saving' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Enregistrement de {chapitres.length} chapitres et {totalLignes} lignes...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
          <div>
            {step === 'review' && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Si le DQE existe déjà :</label>
                <select value={mode} onChange={(e) => setMode(e.target.value as 'replace' | 'append')} className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:text-white">
                  <option value="replace">Remplacer tout</option>
                  <option value="append">Ajouter à la suite</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {step === 'upload' && (
              <Button variant="primary" onClick={handleAnalyse} disabled={!file}>
                Analyser avec l'IA
              </Button>
            )}
            {step === 'review' && (
              <Button variant="primary" onClick={handleSave} disabled={chapitres.length === 0}>
                Importer {totalLignes} lignes
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              {step === 'review' ? 'Annuler' : 'Fermer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
