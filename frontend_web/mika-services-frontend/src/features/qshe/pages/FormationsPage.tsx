import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchCertificationsByUser, createCertification, deleteCertification, fetchExpirant, fetchCertSummary } from '@/store/slices/qsheCertificationSlice'
import { TypeCertification, StatutCertification } from '@/types/qsheCertification'
import type { CertificationCreateRequest, CertificationResponse } from '@/types/qsheCertification'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

const statutColors: Record<StatutCertification, string> = {
  VALIDE: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  EXPIRE_BIENTOT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  EXPIREE: 'bg-red-200 text-red-900 dark:bg-red-900/70 dark:text-red-100',
  NON_OBTENUE: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

export default function FormationsPage() {
  const { t } = useTranslation('qshe')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { certifications, expirant, summary, loading } = useAppSelector(s => s.qsheCertification)
  const users = useAppSelector(s => s.user.users ?? [])

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'user' | 'alertes'>('alertes')

  const [fType, setFType] = useState<TypeCertification>(TypeCertification.CACES_R482)
  const [fLibelle, setFLibelle] = useState('')
  const [fOrg, setFOrg] = useState('')
  const [fDateObt, setFDateObt] = useState('')
  const [fDateExp, setFDateExp] = useState('')

  useEffect(() => { dispatch(fetchExpirant(90)); dispatch(fetchCertSummary()) }, [dispatch])
  useEffect(() => { if (selectedUserId) dispatch(fetchCertificationsByUser({ userId: selectedUserId })) }, [dispatch, selectedUserId])

  const handleCreate = async () => {
    if (!selectedUserId || !fLibelle.trim()) return
    const req: CertificationCreateRequest = {
      userId: selectedUserId, typeCertification: fType, libelle: fLibelle.trim(),
      organismeFormation: fOrg.trim() || undefined,
      dateObtention: fDateObt || undefined, dateExpiration: fDateExp || undefined,
    }
    await dispatch(createCertification(req))
    setShowForm(false); setFLibelle(''); setFOrg(''); setFDateObt(''); setFDateExp('')
    dispatch(fetchCertificationsByUser({ userId: selectedUserId })); dispatch(fetchCertSummary())
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'incidents.confirm.delete' })) {
      await dispatch(deleteCertification(id)); dispatch(fetchCertSummary())
    }
  }

  const displayList = viewMode === 'alertes' ? expirant : certifications

  const KpiCard = ({ value, label, accent = '' }: { value: number | string; label: string; accent?: string }) => (
    <div className={CARD}><div className={`${BODY} text-center`}>
      <p className={`text-xl sm:text-2xl font-bold tabular-nums ${accent || 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div></div>
  )

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6 bg-gray-50/80 dark:bg-gray-900/80">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Formations & Habilitations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">CACES, habilitations électriques, SST, travail en hauteur</p>
        </div>
        {selectedUserId && viewMode === 'user' && (
          <button onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark font-medium shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
            <span className="text-lg leading-none">+</span> Nouvelle certification
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard value={summary.totalCertifications} label="Total certifications" />
          <KpiCard value={summary.valides} label="Valides" accent="text-green-600 dark:text-green-400" />
          <KpiCard value={summary.expirentBientot} label="Expirent bientôt" accent={summary.expirentBientot > 0 ? 'text-orange-600 dark:text-orange-400 animate-pulse' : ''} />
          <KpiCard value={summary.expirees} label="Expirées" accent={summary.expirees > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600'} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setViewMode('alertes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewMode === 'alertes' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
          Alertes expiration ({expirant.length})
        </button>
        <button onClick={() => setViewMode('user')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewMode === 'user' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
          Par travailleur
        </button>
      </div>

      {viewMode === 'user' && (
        <div className={CARD}><div className={BODY}>
          <select value={selectedUserId ?? ''} onChange={e => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
            className="w-full sm:max-w-md border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary">
            <option value="">— Sélectionner un travailleur —</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.matricule})</option>)}
          </select>
        </div></div>
      )}

      <div className={CARD}>
        {loading ? <div className="p-8 text-center text-gray-400">{t('incidents.loading')}</div>
        : displayList.length === 0 ? <div className="p-8 text-center text-gray-400">{viewMode === 'alertes' ? 'Aucune certification expirant prochainement.' : 'Sélectionnez un travailleur.'}</div>
        : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayList.map((c: CertificationResponse) => (
              <div key={c.id} className={`px-4 py-3 sm:px-5 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${c.statut === 'EXPIREE' ? 'border-l-4 border-l-red-500' : c.statut === 'EXPIRE_BIENTOT' ? 'border-l-4 border-l-orange-400' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{c.libelle}</h3>
                      <span className="text-xs text-gray-400">{c.userNom}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs mt-1">
                      <span className={`px-2 py-0.5 rounded-md font-medium ${statutColors[c.statut]}`}>{c.statut.replace(/_/g, ' ')}</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200">{c.typeCertification.replace(/_/g, ' ')}</span>
                      {c.dateExpiration && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">Exp: {c.dateExpiration}</span>}
                      {c.joursAvantExpiration !== null && c.joursAvantExpiration >= 0 && (
                        <span className={`px-2 py-0.5 rounded-md font-bold ${c.joursAvantExpiration <= 30 ? 'bg-red-600 text-white' : c.joursAvantExpiration <= 60 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.joursAvantExpiration}j restants
                        </span>
                      )}
                      {c.joursAvantExpiration !== null && c.joursAvantExpiration < 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-bold">Expirée depuis {Math.abs(c.joursAvantExpiration)}j</span>
                      )}
                      {c.organismeFormation && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700">{c.organismeFormation}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(c.id)}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 transition self-end sm:self-start">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:border dark:border-gray-600 w-full max-w-lg p-5 sm:p-6 my-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouvelle certification</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                <select value={fType} onChange={e => setFType(e.target.value as TypeCertification)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100">
                  {Object.values(TypeCertification).map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Libellé *</label>
                <input type="text" value={fLibelle} onChange={e => setFLibelle(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organisme de formation</label>
                <input type="text" value={fOrg} onChange={e => setFOrg(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date obtention</label>
                  <input type="date" value={fDateObt} onChange={e => setFDateObt(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date expiration</label>
                  <input type="date" value={fDateExp} onChange={e => setFDateExp(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">Annuler</button>
              <button onClick={handleCreate} disabled={!fLibelle.trim()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium">Créer</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
