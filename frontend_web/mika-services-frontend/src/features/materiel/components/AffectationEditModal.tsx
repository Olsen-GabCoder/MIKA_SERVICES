import { useState } from 'react'
import { enginApi } from '@/api/enginApi'
import { useToast } from '@/contexts/ToastContext'
import type { AffectationEnginResponse, StatutAffectation } from '@/types/materiel'

const STATUTS: { value: StatutAffectation; label: string }[] = [
  { value: 'PLANIFIEE', label: 'Planifiée' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'SUSPENDUE', label: 'Suspendue' },
  { value: 'TERMINEE', label: 'Terminée' },
  { value: 'ANNULEE', label: 'Annulée' },
]

interface Props {
  affectation: AffectationEnginResponse
  onClose: () => void
  onSuccess: () => void
}

export function AffectationEditModal({ affectation, onClose, onSuccess }: Props) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    dateDebut: affectation.dateDebut,
    dateFin: affectation.dateFin || '',
    heuresPrevues: affectation.heuresPrevues,
    heuresReelles: affectation.heuresReelles,
    statut: affectation.statut,
    observations: affectation.observations || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.dateDebut) { setError('La date de début est requise'); return }
    setSubmitting(true)
    setError(null)
    try {
      await enginApi.updateAffectation(affectation.id, {
        dateDebut: form.dateDebut,
        dateFin: form.dateFin || undefined,
        heuresPrevues: form.heuresPrevues,
        heuresReelles: form.heuresReelles,
        statut: form.statut,
        observations: form.observations || undefined,
      })
      toast({ message: 'Affectation mise à jour', variant: 'success' })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Erreur lors de la mise à jour')
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
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Modifier l'affectation</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{affectation.enginNom} · {affectation.projetNom}</p>
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
              <label className={labelCls}>Date de début <span className="text-red-500">*</span></label>
              <input type="date" value={form.dateDebut} onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Date de fin</label>
              <input type="date" value={form.dateFin} onChange={e => setForm(f => ({ ...f, dateFin: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Heures prévues</label>
              <input type="number" value={form.heuresPrevues ?? ''} onChange={e => setForm(f => ({ ...f, heuresPrevues: e.target.value ? Number(e.target.value) : undefined }))} min={0} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Heures réelles</label>
              <input type="number" value={form.heuresReelles} onChange={e => setForm(f => ({ ...f, heuresReelles: Number(e.target.value) || 0 }))} min={0} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Statut</label>
              <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value as StatutAffectation }))} className={inputCls}>
                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Observations</label>
              <textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={2} placeholder="Motif, remarques..." className={inputCls + ' resize-none'} />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">Annuler</button>
          <button type="submit" onClick={handleSubmit} disabled={submitting} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm shadow-primary/20">
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
