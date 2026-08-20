import { useState, useEffect } from 'react'
import { mouvementEnginApi } from '@/api/mouvementEnginApi'
import { useToast } from '@/contexts/ToastContext'
import apiClient from '@/api/axios'

interface ProjetOption {
  id: number
  nom: string
}

interface Props {
  enginId: number
  enginNom: string
  /** Chantier actuel de l'engin (origine), s'il est affecté */
  projetOrigineId?: number
  projetOrigineNom?: string
  onClose: () => void
  onSuccess: () => void
}

export function TransfertCreateModal({ enginId, enginNom, projetOrigineId, projetOrigineNom, onClose, onSuccess }: Props) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projets, setProjets] = useState<ProjetOption[]>([])
  const [form, setForm] = useState({
    projetDestinationId: '' as string | number,
    commentaire: '',
  })

  useEffect(() => {
    apiClient.get<{ content: ProjetOption[] }>('/projets', { params: { page: 0, size: 200 } })
      .then(r => setProjets(r.data.content || []))
      .catch(() => setProjets([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.projetDestinationId) { setError('Le chantier de destination est requis'); return }
    if (Number(form.projetDestinationId) === projetOrigineId) { setError("La destination doit être différente de l'origine"); return }
    setSubmitting(true)
    setError(null)
    try {
      // L'origine n'est pas envoyée : le backend la déduit de la localisation réelle de l'engin.
      await mouvementEnginApi.create({
        enginId,
        projetDestinationId: Number(form.projetDestinationId),
        commentaire: form.commentaire || undefined,
      })
      toast({ message: 'Ordre de transfert créé', variant: 'success' })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Erreur lors de la création du transfert')
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
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Nouveau transfert inter-chantiers</h2>
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

          <div>
            <label className={labelCls}>Origine</label>
            <input type="text" value={projetOrigineNom || 'Dépôt (engin disponible)'} disabled className={inputCls + ' opacity-70'} />
          </div>

          <div>
            <label className={labelCls}>Chantier de destination <span className="text-red-500">*</span></label>
            <select value={form.projetDestinationId} onChange={e => setForm(f => ({ ...f, projetDestinationId: e.target.value }))} className={inputCls}>
              <option value="">— Sélectionner un chantier —</option>
              {projets.filter(p => p.id !== projetOrigineId).map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Commentaire</label>
            <textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} rows={2} placeholder="Motif, transporteur, consignes..." className={inputCls + ' resize-none'} />
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">Annuler</button>
          <button type="submit" onClick={handleSubmit} disabled={submitting} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm shadow-primary/20">
            {submitting ? 'Création...' : 'Créer le transfert'}
          </button>
        </div>
      </div>
    </div>
  )
}
