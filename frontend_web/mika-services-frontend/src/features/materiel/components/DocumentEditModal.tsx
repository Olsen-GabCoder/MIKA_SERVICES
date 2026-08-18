import { useState } from 'react'
import { enginApi } from '@/api/enginApi'
import { useToast } from '@/contexts/ToastContext'
import type { DocumentEngin, TypeDocumentEngin } from '@/types/materiel'

const TYPES: [TypeDocumentEngin, string][] = [
  ['CARTE_GRISE', 'Carte grise'],
  ['ASSURANCE', 'Assurance'],
  ['CONTROLE_TECHNIQUE', 'Contrôle technique'],
  ['CERTIFICAT_CONFORMITE', 'Certificat de conformité'],
  ['BON_LIVRAISON', 'Bon de livraison'],
  ['FACTURE', 'Facture'],
  ['PHOTO', 'Photo'],
  ['RAPPORT', 'Rapport'],
  ['AUTRE', 'Autre'],
]

interface Props {
  enginId: number
  document: DocumentEngin
  onClose: () => void
  onSuccess: () => void
}

export function DocumentEditModal({ enginId, document, onClose, onSuccess }: Props) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    typeDocument: document.typeDocument,
    nom: document.nom,
    urlFichier: document.urlFichier || '',
    dateExpiration: document.dateExpiration || '',
    commentaire: document.commentaire || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nom.trim()) { setError('Le nom du document est requis'); return }
    setSubmitting(true)
    setError(null)
    try {
      await enginApi.updateDocument(enginId, document.id, {
        typeDocument: form.typeDocument,
        nom: form.nom.trim(),
        urlFichier: form.urlFichier || undefined,
        dateExpiration: form.dateExpiration || undefined,
        commentaire: form.commentaire || undefined,
      })
      toast({ message: 'Document mis à jour', variant: 'success' })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Erreur lors de la mise à jour du document')
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
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Modifier le document</h2>
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
            <label className={labelCls}>Nom <span className="text-red-500">*</span></label>
            <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Type</label>
              <select value={form.typeDocument} onChange={e => setForm(f => ({ ...f, typeDocument: e.target.value as TypeDocumentEngin }))} className={inputCls}>
                {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Date d'expiration</label>
              <input type="date" value={form.dateExpiration} onChange={e => setForm(f => ({ ...f, dateExpiration: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>URL du fichier</label>
            <input type="text" value={form.urlFichier} onChange={e => setForm(f => ({ ...f, urlFichier: e.target.value }))} placeholder="https://..." className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Commentaire</label>
            <textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} rows={2} className={inputCls + ' resize-none'} />
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
