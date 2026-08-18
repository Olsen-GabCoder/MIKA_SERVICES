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

export function PlanMaintenanceFormModal({ enginId, enginNom, onClose, onSuccess }: Props) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    titre: '',
    description: '',
    typeOperation: 'ENTRETIEN_PREVENTIF' as TypeOperationMaintenance,
    intervalleJours: undefined as number | undefined,
    intervalleHeures: undefined as number | undefined,
    intervalleKm: undefined as number | undefined,
    seuilAlerte: 30,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titre.trim()) { setError('Le titre est requis'); return }
    if (!form.intervalleJours && !form.intervalleHeures && !form.intervalleKm) {
      setError('Au moins un intervalle (jours, heures ou km) est requis')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await enginApi.createPlanMaintenance(enginId, {
        titre: form.titre.trim(),
        description: form.description || undefined,
        typeOperation: form.typeOperation,
        intervalleJours: form.intervalleJours,
        intervalleHeures: form.intervalleHeures,
        intervalleKm: form.intervalleKm,
        seuilAlerte: form.seuilAlerte,
      })
      toast({ message: 'Plan de maintenance créé', variant: 'success' })
      onSuccess()
    } catch {
      setError('Erreur lors de la création du plan')
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
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Nouveau plan de maintenance</h2>
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
            <div className="sm:col-span-2">
              <label className={labelCls}>Titre du plan <span className="text-red-500">*</span></label>
              <input type="text" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="ex: Vidange moteur + filtres" className={inputCls} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Type d'opération <span className="text-red-500">*</span></label>
              <select value={form.typeOperation} onChange={e => setForm(f => ({ ...f, typeOperation: e.target.value as TypeOperationMaintenance }))} className={inputCls}>
                {ALL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <fieldset className="sm:col-span-2 border border-gray-200 dark:border-gray-600 rounded-xl p-3 space-y-3">
              <legend className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">Intervalles de récurrence</legend>
              <p className="text-[11px] text-gray-400">Renseignez au moins un intervalle.</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Jours</label>
                  <input type="number" value={form.intervalleJours ?? ''} onChange={e => setForm(f => ({ ...f, intervalleJours: e.target.value ? Number(e.target.value) : undefined }))} min={1} placeholder="ex: 90" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Heures</label>
                  <input type="number" value={form.intervalleHeures ?? ''} onChange={e => setForm(f => ({ ...f, intervalleHeures: e.target.value ? Number(e.target.value) : undefined }))} min={1} placeholder="ex: 500" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kilomètres</label>
                  <input type="number" value={form.intervalleKm ?? ''} onChange={e => setForm(f => ({ ...f, intervalleKm: e.target.value ? Number(e.target.value) : undefined }))} min={1} placeholder="ex: 10000" className={inputCls} />
                </div>
              </div>
            </fieldset>

            <div>
              <label className={labelCls}>Seuil d'alerte (jours/h/km avant)</label>
              <input type="number" value={form.seuilAlerte} onChange={e => setForm(f => ({ ...f, seuilAlerte: Number(e.target.value) || 30 }))} min={1} className={inputCls} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Détails du plan..." className={inputCls + ' resize-none'} />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">Annuler</button>
          <button type="submit" onClick={handleSubmit} disabled={submitting} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm shadow-primary/20">
            {submitting ? 'Création...' : 'Créer le plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
