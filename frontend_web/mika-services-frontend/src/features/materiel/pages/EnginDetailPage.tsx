import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchEnginById, clearEnginDetail, deleteEngin } from '@/store/slices/enginSlice'
import { enginApi } from '@/api/enginApi'
import { PageContainer } from '@/components/layout/PageContainer'
import { useConfirm } from '@/contexts/ConfirmContext'
import { EnginFormModal } from '../components/EnginFormModal'
import type { MouvementEnginSummary, StatutMouvementEngin } from '@/types/materiel'

const STATUT_ENGIN_STYLE: Record<string, string> = {
  DISPONIBLE: 'bg-green-50 dark:bg-green-900/25 border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-400',
  EN_SERVICE: 'bg-blue-50 dark:bg-blue-900/25 border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-400',
  EN_MAINTENANCE: 'bg-amber-50 dark:bg-amber-900/25 border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-400',
  EN_PANNE: 'bg-red-50 dark:bg-red-900/25 border-red-200 dark:border-red-700/50 text-red-600 dark:text-red-400',
  HORS_SERVICE: 'bg-gray-100 dark:bg-gray-700/60 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400',
  EN_TRANSIT: 'bg-indigo-50 dark:bg-indigo-900/25 border-indigo-200 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-400',
}

const STATUT_MOUVEMENT_STYLE: Record<StatutMouvementEngin, string> = {
  EN_ATTENTE_DEPART: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-400',
  EN_TRANSIT: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/40 text-indigo-700 dark:text-indigo-400',
  RECU: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/40 text-green-700 dark:text-green-400',
  ANNULE: 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400',
}

function InfoRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === '') return null
  const display = typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-50 dark:border-gray-700/40 last:border-0">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-40 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white font-medium">{display}</span>
    </div>
  )
}

export function EnginDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('materiel')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { enginDetail, loading, error } = useAppSelector((s) => s.engin)

  const [mouvements, setMouvements] = useState<MouvementEnginSummary[]>([])
  const [mouvLoading, setMouvLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (id) dispatch(fetchEnginById(Number(id)))
    return () => { dispatch(clearEnginDetail()) }
  }, [dispatch, id])

  useEffect(() => {
    if (!id) return
    setMouvLoading(true)
    enginApi.getMouvements(Number(id))
      .then(setMouvements)
      .catch(() => setMouvements([]))
      .finally(() => setMouvLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!enginDetail) return
    if (await confirm({ messageKey: 'confirm.deactivateEngin', messageParams: { name: enginDetail.nom } })) {
      await dispatch(deleteEngin(enginDetail.id))
      navigate('/engins')
    }
  }

  if (loading) {
    return (
      <PageContainer size="lg" className="py-10 flex justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-600 border-t-primary rounded-full animate-spin" />
      </PageContainer>
    )
  }

  if (error || !enginDetail) {
    return (
      <PageContainer size="lg" className="py-10">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="font-bold text-lg">{t('detail.notFound')}</p>
          <button type="button" onClick={() => navigate('/engins')} className="mt-4 text-primary text-sm font-semibold hover:underline">
            ← {t('detail.backToList')}
          </button>
        </div>
      </PageContainer>
    )
  }

  const statutStyle = STATUT_ENGIN_STYLE[enginDetail.statut] ?? STATUT_ENGIN_STYLE.HORS_SERVICE

  return (
    <PageContainer size="lg" className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary" />
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 px-6 py-7 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m3 0h-9m-9-3h9m-9 3v-4.5m0 4.5h-.375a1.125 1.125 0 01-1.125-1.125V9.75m18 0v8.25m0 0h.375a1.125 1.125 0 001.125-1.125V9.75m-14.25 6.375h3m-3-4.5h9" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-white">{enginDetail.nom}</h1>
                <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold ${statutStyle}`}>
                  {t(`engin.statut.${enginDetail.statut}`)}
                </span>
              </div>
              <p className="text-white/70 text-sm mt-0.5 font-mono">{enginDetail.code}</p>
              <p className="text-white/60 text-sm mt-1">{t(`engin.type.${enginDetail.type}`)}{enginDetail.marque ? ` · ${enginDetail.marque}` : ''}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => navigate('/engins')}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors"
            >
              ← {t('detail.backToList')}
            </button>
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="px-3 py-2 rounded-xl bg-white text-primary text-xs font-bold hover:bg-white/90 transition-colors shadow"
            >
              {t('detail.edit')}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-xs font-bold hover:bg-red-500/30 transition-colors"
            >
              {t('engin.delete')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations */}
        <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs">i</span>
            {t('detail.infoTitle')}
          </h2>
          <div>
            <InfoRow label={t('engin.columns.code')} value={enginDetail.code} />
            <InfoRow label={t('engin.columns.nom')} value={enginDetail.nom} />
            <InfoRow label={t('engin.columns.type')} value={t(`engin.type.${enginDetail.type}`)} />
            <InfoRow label={t('engin.columns.marque')} value={enginDetail.marque} />
            <InfoRow label={t('form.modele')} value={enginDetail.modele} />
            <InfoRow label={t('engin.columns.immatriculation')} value={enginDetail.immatriculation} />
            <InfoRow label={t('form.numeroSerie')} value={enginDetail.numeroSerie} />
            <InfoRow label={t('form.anneeFabrication')} value={enginDetail.anneeFabrication} />
            <InfoRow label={t('detail.heuresCompteur')} value={enginDetail.heuresCompteur ? `${enginDetail.heuresCompteur} h` : undefined} />
            <InfoRow label={t('form.proprietaire')} value={enginDetail.proprietaire} />
            <InfoRow label={t('engin.columns.location')} value={enginDetail.estLocation} />
            <InfoRow label={t('form.coutLocation')} value={enginDetail.coutLocationJournalier ? `${enginDetail.coutLocationJournalier} / j` : undefined} />
          </div>
        </div>

        {/* Historique des mouvements */}
        <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-5 flex flex-col">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-secondary/10 text-secondary flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0h6m-6 0V8.25m0 10.5H3.375c-.621 0-1.125-.504-1.125-1.125v-8.25M20.625 18.75a1.5 1.5 0 01-3 0m3 0h.375c.621 0 1.125-.504 1.125-1.125v-8.25M17.625 18.75V8.25m0 10.5H9.75" />
              </svg>
            </span>
            {t('detail.mouvementsTitle')}
            {!mouvLoading && <span className="ml-auto text-xs font-bold text-gray-400">{mouvements.length}</span>}
          </h2>

          {mouvLoading && (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-gray-200 dark:border-gray-600 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {!mouvLoading && mouvements.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-8 text-center">
              <div>
                <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0h6m-6 0V8.25m0 10.5H3.375c-.621 0-1.125-.504-1.125-1.125v-8.25M20.625 18.75a1.5 1.5 0 01-3 0m3 0h.375c.621 0 1.125-.504 1.125-1.125v-8.25M17.625 18.75V8.25m0 10.5H9.75" />
                </svg>
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('detail.noMouvements')}</p>
              </div>
            </div>
          )}

          {!mouvLoading && mouvements.length > 0 && (
            <div className="space-y-2 overflow-y-auto max-h-80">
              {mouvements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">#{m.id}</span>
                      <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${STATUT_MOUVEMENT_STYLE[m.statut]}`}>
                        {t(`mouvement.statut.${m.statut}`)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 truncate">
                      {m.projetOrigineNom ?? t('detail.depot')} → {m.projetDestinationNom}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(m.dateDemande).toLocaleDateString()}
                      {m.initiateurNom ? ` · ${m.initiateurNom}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEditModal && enginDetail && (
        <EnginFormModal
          engin={enginDetail}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            dispatch(fetchEnginById(enginDetail.id))
          }}
        />
      )}
    </PageContainer>
  )
}
