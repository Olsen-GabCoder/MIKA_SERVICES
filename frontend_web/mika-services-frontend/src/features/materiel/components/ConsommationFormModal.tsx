import { useState } from 'react'
import { enginApi } from '@/api/enginApi'
import { useToast } from '@/contexts/ToastContext'

interface Props {
  enginId: number
  enginNom: string
  onClose: () => void
  onSuccess: () => void
}

export function ConsommationFormModal({ enginId, enginNom, onClose, onSuccess }: Props) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    datePlein: new Date().toISOString().slice(0, 10),
    quantiteLitres: '' as string | number,
    coutTotal: undefined as number | undefined,
    heuresCompteurAuPlein: undefined as number | undefined,
    pleinPar: '',
    commentaire: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const litres = Number(form.quantiteLitres)
    if (!litres || litres <= 0) { setError('La quantité en litres est requise'); return }
    if (!form.datePlein) { setError('La date est requise'); return }
    setSubmitting(true)
    setError(null)
    try {
      await enginApi.createConsommation(enginId, {
        datePlein: form.datePlein,
        quantiteLitres: litres,
        coutTotal: form.coutTotal,
        heuresCompteurAuPlein: form.heuresCompteurAuPlein,
        pleinPar: form.pleinPar || undefined,
        commentaire: form.commentaire || undefined,
      })
      toast({ message: 'Ravitaillement enregistré', variant: 'success' })
      onSuccess()
    } catch {
      setError('Erreur lors de l\'enregistrement')
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
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Enregistrer un ravitaillement</h2>
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
              <label className={labelCls}>Date du plein <span className="text-red-500">*</span></label>
              <input type="date" value={form.datePlein} onChange={e => setForm(f => ({ ...f, datePlein: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Quantité (litres) <span className="text-red-500">*</span></label>
              <input type="number" value={form.quantiteLitres} onChange={e => setForm(f => ({ ...f, quantiteLitres: e.target.value }))} min={0} step="0.1" placeholder="ex: 148" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Coût total (FCFA)</label>
              <input type="number" value={form.coutTotal ?? ''} onChange={e => setForm(f => ({ ...f, coutTotal: e.target.value ? Number(e.target.value) : undefined }))} min={0} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Compteur au moment du plein (h)</label>
              <input type="number" value={form.heuresCompteurAuPlein ?? ''} onChange={e => setForm(f => ({ ...f, heuresCompteurAuPlein: e.target.value ? Number(e.target.value) : undefined }))} min={0} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Plein effectué par</label>
              <input type="text" value={form.pleinPar} onChange={e => setForm(f => ({ ...f, pleinPar: e.target.value }))} placeholder="Nom" className={inputCls} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Commentaire</label>
              <textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} rows={2} placeholder="Observations..." className={inputCls + ' resize-none'} />
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
