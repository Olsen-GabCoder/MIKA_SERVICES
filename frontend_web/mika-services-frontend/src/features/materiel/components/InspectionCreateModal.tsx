import { useState } from 'react'
import { enginApi } from '@/api/enginApi'
import { useToast } from '@/contexts/ToastContext'
import type { ChecklistItem, EtatGeneralInspection } from '@/types/materiel'

const CHECKLIST_DEFAUT: ChecklistItem[] = [
  { code: 'NIVEAUX', label: 'Niveaux (huile, hydraulique, refroidissement)', ok: true },
  { code: 'FUITES', label: 'Absence de fuites visibles', ok: true },
  { code: 'FLEXIBLES', label: 'État des flexibles et raccords', ok: true },
  { code: 'TRAIN', label: 'Train de roulement / pneumatiques', ok: true },
  { code: 'ECLAIRAGE', label: 'Éclairage et avertisseurs', ok: true },
  { code: 'CABINE', label: 'Cabine, ceinture, rétroviseurs', ok: true },
  { code: 'SECURITE', label: 'Extincteur et équipements de sécurité', ok: true },
]

const ETATS: { value: EtatGeneralInspection; label: string }[] = [
  { value: 'BON', label: 'Bon' },
  { value: 'CORRECT', label: 'Correct' },
  { value: 'MAUVAIS', label: 'Mauvais' },
]

interface Props {
  enginId: number
  enginNom: string
  onClose: () => void
  onSuccess: () => void
}

export function InspectionCreateModal({ enginId, enginNom, onClose, onSuccess }: Props) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>(CHECKLIST_DEFAUT)
  const [form, setForm] = useState({
    dateInspection: new Date().toISOString().slice(0, 10),
    inspectePar: '',
    compteurHeures: '' as string,
    etatGeneral: 'BON' as EtatGeneralInspection,
    commentaire: '',
  })

  const toggleItem = (idx: number) => setChecklist(list => list.map((it, i) => i === idx ? { ...it, ok: !it.ok } : it))
  const setItemComment = (idx: number, commentaire: string) => setChecklist(list => list.map((it, i) => i === idx ? { ...it, commentaire } : it))

  const nbAnomalies = checklist.filter(it => !it.ok).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.dateInspection) { setError("La date d'inspection est requise"); return }
    setSubmitting(true)
    setError(null)
    try {
      const created = await enginApi.createInspection(enginId, {
        dateInspection: form.dateInspection,
        inspectePar: form.inspectePar || undefined,
        compteurHeures: form.compteurHeures ? Number(form.compteurHeures) : undefined,
        checklist,
        etatGeneral: form.etatGeneral,
        commentaire: form.commentaire || undefined,
      })
      toast({
        message: created.anomaliesDetectees
          ? `Inspection enregistrée — incident #${created.incidentCreeId} créé automatiquement`
          : 'Inspection enregistrée — conforme',
        variant: created.anomaliesDetectees ? 'warning' : 'success',
      })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || "Erreur lors de l'enregistrement de l'inspection")
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent'
  const labelCls = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Inspection quotidienne</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{enginNom}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.dateInspection} onChange={e => setForm(f => ({ ...f, dateInspection: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Inspecteur</label>
              <input type="text" value={form.inspectePar} onChange={e => setForm(f => ({ ...f, inspectePar: e.target.value }))} placeholder="Nom de l'inspecteur" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Compteur (heures)</label>
              <input type="number" value={form.compteurHeures} onChange={e => setForm(f => ({ ...f, compteurHeures: e.target.value }))} min={0} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>État général</label>
              <select value={form.etatGeneral} onChange={e => setForm(f => ({ ...f, etatGeneral: e.target.value as EtatGeneralInspection }))} className={inputCls}>
                {ETATS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Checklist pré-utilisation {nbAnomalies > 0 && <span className="text-amber-600 dark:text-amber-400">— {nbAnomalies} anomalie(s), un incident sera créé</span>}</label>
            <div className="space-y-2 mt-1">
              {checklist.map((it, idx) => (
                <div key={it.code} className={`rounded-xl border px-3 py-2 ${it.ok ? 'border-gray-200 dark:border-gray-600' : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={it.ok} onChange={() => toggleItem(idx)} className="w-4 h-4 rounded accent-green-600" />
                    <span className={`text-sm ${it.ok ? 'text-gray-700 dark:text-gray-300' : 'text-amber-800 dark:text-amber-300 font-semibold'}`}>{it.label}</span>
                    <span className={`ml-auto text-xs font-bold ${it.ok ? 'text-green-600' : 'text-amber-600'}`}>{it.ok ? 'OK' : 'NOK'}</span>
                  </label>
                  {!it.ok && (
                    <input type="text" value={it.commentaire || ''} onChange={e => setItemComment(idx, e.target.value)} placeholder="Détail de l'anomalie..." className={inputCls + ' mt-2'} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Commentaire général</label>
            <textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} rows={2} placeholder="Remarques..." className={inputCls + ' resize-none'} />
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">Annuler</button>
          <button type="submit" onClick={handleSubmit} disabled={submitting} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm shadow-primary/20">
            {submitting ? 'Enregistrement...' : "Valider l'inspection"}
          </button>
        </div>
      </div>
    </div>
  )
}
