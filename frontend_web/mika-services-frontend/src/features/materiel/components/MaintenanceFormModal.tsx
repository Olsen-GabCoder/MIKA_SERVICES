import { useState } from 'react'
import { enginApi } from '@/api/enginApi'
import { useToast } from '@/contexts/ToastContext'
import type { TypeOperationMaintenance } from '@/types/materiel'

const ALL_TYPES: { value: TypeOperationMaintenance; label: string }[] = [
  { value: 'VIDANGE', label: 'Vidange' },
  { value: 'GRAISSAGE', label: 'Graissage' },
  { value: 'REVISION', label: 'Révision' },
  { value: 'REPARATION', label: 'Réparation' },
  { value: 'CONTROLE_TECHNIQUE', label: 'Contrôle technique' },
  { value: 'CHANGEMENT_PIECES', label: 'Changement de pièces' },
  { value: 'ENTRETIEN_PREVENTIF', label: 'Entretien préventif' },
  { value: 'AUTRE', label: 'Autre' },
]

interface Props {
  enginId: number
  enginNom: string
  onClose: () => void
  onSuccess: () => void
}

export function MaintenanceFormModal({ enginId, enginNom, onClose, onSuccess }: Props) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    typeOperation: 'ENTRETIEN_PREVENTIF' as TypeOperationMaintenance,
    description: '',
    echeanceDate: '',
    echeanceHeures: undefined as number | undefined,
    coutEstime: undefined as number | undefined,
    executePar: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.typeOperation) { setError('Le type est requis'); return }
    setSubmitting(true)
    setError(null)
    try {
      await enginApi.createMaintenance(enginId, {
        typeOperation: form.typeOperation,
        description: form.description || undefined,
        echeanceDate: form.echeanceDate || undefined,
        echeanceHeures: form.echeanceHeures,
        coutEstime: form.coutEstime,
        executePar: form.executePar || undefined,
      })
      toast({ message: 'Maintenance planifiée avec succès', variant: 'success' })
      onSuccess()
    } catch {
      setError('Erreur lors de la création de la maintenance')
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Planifier une maintenance</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{enginNom}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Type d'opération <span className="text-red-500">*</span></label>
              <select value={form.typeOperation} onChange={e => setForm(f => ({ ...f, typeOperation: e.target.value as TypeOperationMaintenance }))} className={inputCls}>
                {ALL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Date échéance */}
            <div>
              <label className={labelCls}>Date échéance</label>
              <input type="date" value={form.echeanceDate} onChange={e => setForm(f => ({ ...f, echeanceDate: e.target.value }))} className={inputCls} />
            </div>

            {/* Heures échéance */}
            <div>
              <label className={labelCls}>Heures compteur échéance</label>
              <input type="number" value={form.echeanceHeures ?? ''} onChange={e => setForm(f => ({ ...f, echeanceHeures: e.target.value ? Number(e.target.value) : undefined }))} min={0} className={inputCls} />
            </div>

            {/* Coût estimé */}
            <div>
              <label className={labelCls}>Coût estimé (FCFA)</label>
              <input type="number" value={form.coutEstime ?? ''} onChange={e => setForm(f => ({ ...f, coutEstime: e.target.value ? Number(e.target.value) : undefined }))} min={0} className={inputCls} />
            </div>

            {/* Exécuté par */}
            <div>
              <label className={labelCls}>Exécuté par</label>
              <input type="text" value={form.executePar} onChange={e => setForm(f => ({ ...f, executePar: e.target.value }))} placeholder="Nom du technicien" className={inputCls} />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Détails de l'opération..." className={inputCls + ' resize-none'} />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
            Annuler
          </button>
          <button type="submit" onClick={handleSubmit} disabled={submitting} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm shadow-primary/20">
            {submitting ? 'Enregistrement...' : 'Planifier'}
          </button>
        </div>
      </div>
    </div>
  )
}
