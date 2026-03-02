import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PageContainer } from '@/components/layout/PageContainer'
import { fetchEquipeById, clearEquipeDetail } from '@/store/slices/equipeSlice'
import { equipeApi } from '@/api/chantierApi'
import { userApi } from '@/api/userApi'
import type { TypeEquipe, MembreEquipeResponse, RoleDansEquipe } from '@/types/chantier'
import type { User } from '@/types'
import { useFormatDate } from '@/hooks/useFormatDate'

export const EquipeDetailPage = () => {
  const { t } = useTranslation('equipe')
  const formatDate = useFormatDate()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { equipeDetail: equipe, loading, error } = useAppSelector((state) => state.equipe)
  const TYPE_LABELS = useMemo(
    () =>
      Object.fromEntries(
        (['TERRASSEMENT', 'VOIRIE', 'ASSAINISSEMENT', 'GENIE_CIVIL', 'BATIMENT', 'PONT', 'TOPOGRAPHIE', 'LABORATOIRE', 'MECANIQUE', 'POLYVALENTE'] as TypeEquipe[]).map(
          (key) => [key, t(`type.${key}`)]
        )
      ) as Record<TypeEquipe, string>,
    [t]
  )
  const ROLE_LABELS = useMemo(
    () =>
      Object.fromEntries(
        (['CHEF_EQUIPE', 'CHEF_EQUIPE_ADJOINT', 'OUVRIER_QUALIFIE', 'OUVRIER_SPECIALISE', 'MANOEUVRE', 'APPRENTI'] as RoleDansEquipe[]).map(
          (key) => [key, t(`role.${key}`)]
        )
      ) as Record<RoleDansEquipe, string>,
    [t]
  )
  const [membres, setMembres] = useState<MembreEquipeResponse[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showAddMembre, setShowAddMembre] = useState(false)
  const [addUserId, setAddUserId] = useState<number | ''>('')
  const [addRole, setAddRole] = useState<RoleDansEquipe>('OUVRIER_QUALIFIE')
  const [adding, setAdding] = useState(false)

  const refreshMembres = () => {
    if (id) equipeApi.getMembres(Number(id)).then(setMembres)
  }

  useEffect(() => {
    if (id) dispatch(fetchEquipeById(Number(id)))
    userApi.getAll({ page: 0, size: 500 }).then((res) => setUsers(res.content))
    return () => { dispatch(clearEquipeDetail()) }
  }, [dispatch, id])

  useEffect(() => {
    if (id) equipeApi.getMembres(Number(id)).then(setMembres)
  }, [id])

  const handleAddMembre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !addUserId) return
    setAdding(true)
    try {
      await equipeApi.ajouterMembre(Number(id), {
        userId: Number(addUserId),
        role: addRole,
        dateAffectation: new Date().toISOString().slice(0, 10),
      })
      refreshMembres()
      setShowAddMembre(false)
      setAddUserId('')
      setAddRole('OUVRIER_QUALIFIE')
    } finally {
      setAdding(false)
    }
  }

  const existingUserIds = new Set(membres.filter((m) => m.actif).map((m) => m.user.id))
  const availableUsers = users.filter((u) => !existingUserIds.has(u.id))

  if (loading && !equipe)
    return <PageContainer><div className="text-center text-gray-500">{t('detail.loading')}</div></PageContainer>
  if (error) return <PageContainer><div className="text-center text-red-500">{error}</div></PageContainer>
  if (!equipe) return <PageContainer><div className="text-center text-gray-500">{t('detail.notFound')}</div></PageContainer>

  return (
    <PageContainer size="default">
      <div className="flex justify-between items-start mb-6">
        <div>
          <button
            onClick={() => navigate('/equipes')}
            className="text-sm text-gray-500 hover:text-gray-800 mb-2 flex items-center gap-1"
          >
            ← {t('detail.backToList')}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{equipe.nom}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-1 rounded">
              {equipe.code}
            </span>
            <span className="text-sm text-gray-600">{TYPE_LABELS[equipe.type] ?? equipe.type}</span>
            <span className="text-sm text-gray-500">{t('detail.effectifLabel')} : {equipe.effectif}</span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/equipes/${equipe.id}/edit`)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {t('detail.edit')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {equipe.chefEquipe && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('detail.chefEquipe')}</h2>
              <p className="font-medium text-gray-900">
                {equipe.chefEquipe.prenom} {equipe.chefEquipe.nom}
              </p>
              <p className="text-sm text-gray-500">{equipe.chefEquipe.email}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('detail.members')}</h2>
              <button
                type="button"
                onClick={() => setShowAddMembre(true)}
                className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark"
              >
                {t('detail.addMember')}
              </button>
            </div>

            {showAddMembre && (
              <form onSubmit={handleAddMembre} className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-wrap items-end gap-3">
                <div className="min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('detail.user')}</label>
                  <select
                    value={addUserId}
                    onChange={(e) => setAddUserId(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">{t('detail.choose')}</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.prenom} {u.nom} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[160px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('detail.role')}</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as RoleDansEquipe)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    {(Object.keys(ROLE_LABELS) as RoleDansEquipe[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {adding ? t('detail.adding') : t('detail.add')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMembre(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600"
                >
                  {t('detail.cancel')}
                </button>
              </form>
            )}

            {membres.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('detail.noMembers')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">{t('detail.columns.nom')}</th>
                    <th className="pb-2">{t('detail.columns.role')}</th>
                    <th className="pb-2">{t('detail.columns.dateAffectation')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {membres
                    .filter((m) => m.actif)
                    .map((m) => (
                      <tr key={m.id}>
                        <td className="py-2">
                          {m.user.prenom} {m.user.nom}
                        </td>
                        <td className="py-2">{ROLE_LABELS[m.role] ?? m.role}</td>
                        <td className="py-2 text-gray-500">
                          {m.dateAffectation ? formatDate(m.dateAffectation) : '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('detail.info')}</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">{t('detail.statut')}</dt>
                <dd className="font-medium">{equipe.actif ? t('detail.active') : t('detail.inactive')}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
