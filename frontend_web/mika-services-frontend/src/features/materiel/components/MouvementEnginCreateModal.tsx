import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/store/hooks'
import { createMouvement } from '@/store/slices/mouvementEnginSlice'
import { enginApi } from '@/api/enginApi'
import { projetApi } from '@/api/projetApi'
import type { EnginSummary } from '@/types/materiel'
import type { ProjetSummary } from '@/types/projet'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export function MouvementEnginCreateModal({ onClose, onSuccess }: Props) {
  const { t } = useTranslation('materiel')
  const dispatch = useAppDispatch()

  const [enginsDisponibles, setEnginsDisponibles] = useState<EnginSummary[]>([])
  const [projets, setProjets] = useState<ProjetSummary[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [enginId, setEnginId] = useState<number | ''>('')
  const [projetOrigineId, setProjetOrigineId] = useState<number | ''>('')
  const [projetDestinationId, setProjetDestinationId] = useState<number | ''>('')
  const [commentaire, setCommentaire] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      enginApi.findDisponibles(),
      projetApi.findAll(0, 200),
    ])
      .then(([engins, projetsPage]) => {
        setEnginsDisponibles(engins)
        setProjets(projetsPage.content)
      })
      .catch(() => setError(t('mouvement.errorLoadData')))
      .finally(() => setLoadingData(false))
  }, [t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enginId || !projetDestinationId) {
      setError(t('mouvement.errorRequired'))
      return
    }
    if (projetOrigineId && projetOrigineId === projetDestinationId) {
      setError(t('mouvement.errorSameProjet'))
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await dispatch(createMouvement({
        enginId: Number(enginId),
        projetOrigineId: projetOrigineId ? Number(projetOrigineId) : undefined,
        projetDestinationId: Number(projetDestinationId),
        commentaire: commentaire.trim() || undefined,
      })).unwrap()
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('form.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{t('mouvement.createTitle')}</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {loadingData ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-gray-200 dark:border-gray-600 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Engin */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('mouvement.form.engin')} <span className="text-red-500">*</span>
                </label>
                {enginsDisponibles.length === 0 ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400 italic">{t('mouvement.noEnginDisponible')}</p>
                ) : (
                  <select
                    value={enginId}
                    onChange={(e) => setEnginId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">{t('mouvement.form.selectEngin')}</option>
                    {enginsDisponibles.map((e) => (
                      <option key={e.id} value={e.id}>{e.code} — {e.nom}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Projet origine (optionnel) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('mouvement.form.projetOrigine')}
                  <span className="ml-1 text-gray-400 font-normal text-[10px]">({t('mouvement.form.optionnel')})</span>
                </label>
                <select
                  value={projetOrigineId}
                  onChange={(e) => setProjetOrigineId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">{t('mouvement.form.depotCentral')}</option>
                  {projets.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{t('mouvement.form.origineHint')}</p>
              </div>

              {/* Projet destination */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('mouvement.form.projetDestination')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={projetDestinationId}
                  onChange={(e) => setProjetDestinationId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">{t('mouvement.form.selectProjet')}</option>
                  {projets
                    .filter((p) => p.id !== projetOrigineId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                </select>
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('mouvement.commentaire')}</label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={3}
                  placeholder={t('mouvement.commentairePlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            {t('form.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loadingData || !enginId || !projetDestinationId}
            className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm shadow-primary/20"
          >
            {submitting ? t('form.saving') : t('mouvement.createConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
