import { useState } from 'react'
import { enginApi } from '@/api/enginApi'
import { useToast } from '@/contexts/ToastContext'
import type { TypeIncidentEngin, GraviteIncident } from '@/types/materiel'

const ALL_TYPES: { value: TypeIncidentEngin; label: string }[] = [
  { value: 'PANNE', label: 'Panne' },
  { value: 'ACCIDENT', label: 'Accident' },
  { value: 'VOL', label: 'Vol' },
  { value: 'VANDALISME', label: 'Vandalisme' },
  { value: 'USURE_PREMATUREE', label: 'Usure prématurée' },
  { value: 'DEFAUT_TECHNIQUE', label: 'Défaut technique' },
  { value: 'AUTRE', label: 'Autre' },
]

const ALL_GRAVITES: { value: GraviteIncident; label: string; color: string }[] = [
  { value: 'MINEURE', label: 'Mineure', color: '#16A34A' },
  { value: 'MOYENNE', label: 'Moyenne', color: '#D97706' },
  { value: 'MAJEURE', label: 'Majeure', color: '#EA580C' },
  { value: 'CRITIQUE', label: 'Critique', color: '#DC2626' },
]

interface Props {
  enginId: number
  enginNom: string
  onClose: () => void
  onSuccess: () => void
}

export function IncidentFormModal({ enginId, enginNom, onClose, onSuccess }: Props) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    typeIncident: 'PANNE' as TypeIncidentEngin,
    gravite: 'MOYENNE' as GraviteIncident,
    dateIncident: new Date().toISOString().slice(0, 10),
    description: '',
    lieu: '',
    signalePar: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.dateIncident) { setError('La date est requise'); return }
    setSubmitting(true)
    setError(null)
    try {
      await enginApi.createIncident(enginId, {
        typeIncident: form.typeIncident,
        gravite: form.gravite,
        dateIncident: form.dateIncident,
        description: form.description || undefined,
        lieu: form.lieu || undefined,
        signalePar: form.signalePar || undefined,
      })
      toast({ message: 'Incident signalé avec succès', variant: 'success' })
      onSuccess()
    } catch {
      setError("Erreur lors du signalement de l'incident")
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
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Signaler un incident</h2>
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
            <div>
              <label className={labelCls}>Type d'incident <span className="text-red-500">*</span></label>
              <select value={form.typeIncident} onChange={e => setForm(f => ({ ...f, typeIncident: e.target.value as TypeIncidentEngin }))} className={inputCls}>
                {ALL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Gravité */}
            <div>
              <label className={labelCls}>Gravité <span className="text-red-500">*</span></label>
              <select value={form.gravite} onChange={e => setForm(f => ({ ...f, gravite: e.target.value as GraviteIncident }))} className={inputCls}>
                {ALL_GRAVITES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className={labelCls}>Date de l'incident <span className="text-red-500">*</span></label>
              <input type="date" value={form.dateIncident} onChange={e => setForm(f => ({ ...f, dateIncident: e.target.value }))} className={inputCls} />
            </div>

            {/* Lieu */}
            <div>
              <label className={labelCls}>Lieu</label>
              <input type="text" value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))} placeholder="Chantier, route..." className={inputCls} />
            </div>

            {/* Signalé par */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Signalé par</label>
              <input type="text" value={form.signalePar} onChange={e => setForm(f => ({ ...f, signalePar: e.target.value }))} placeholder="Nom de la personne" className={inputCls} />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Décrivez l'incident..." className={inputCls + ' resize-none'} />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
            Annuler
          </button>
          <button type="submit" onClick={handleSubmit} disabled={submitting} className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm shadow-red-600/20">
            {submitting ? 'Enregistrement...' : 'Signaler'}
          </button>
        </div>
      </div>
    </div>
  )
}
