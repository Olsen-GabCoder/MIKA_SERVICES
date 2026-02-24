import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  createEquipe,
  updateEquipe,
  fetchEquipeById,
  clearEquipeDetail,
} from '@/store/slices/equipeSlice'
import { userApi } from '@/api/userApi'
import type { EquipeCreateRequest, EquipeUpdateRequest, TypeEquipe } from '@/types/chantier'
import type { User } from '@/types'

const TYPE_EQUIPE_VALUES: TypeEquipe[] = ['TERRASSEMENT', 'VOIRIE', 'ASSAINISSEMENT', 'GENIE_CIVIL', 'BATIMENT', 'PONT', 'TOPOGRAPHIE', 'LABORATOIRE', 'MECANIQUE', 'POLYVALENTE']

export const EquipeFormPage = () => {
  const { t } = useTranslation('equipe')
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { equipeDetail, loading } = useAppSelector((state) => state.equipe)
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState<EquipeCreateRequest>({
    code: '',
    nom: '',
    type: 'VOIRIE',
    chefEquipeId: undefined,
    effectif: 0,
  })
  const [updateForm, setUpdateForm] = useState<EquipeUpdateRequest>({})

  useEffect(() => {
    userApi.getAll({ page: 0, size: 500 }).then((res) => setUsers(res.content))
    if (isEdit && id) {
      dispatch(fetchEquipeById(Number(id)))
    }
    return () => {
      dispatch(clearEquipeDetail())
    }
  }, [dispatch, id, isEdit])

  useEffect(() => {
    if (isEdit && equipeDetail) {
      setUpdateForm({
        nom: equipeDetail.nom,
        type: equipeDetail.type,
        chefEquipeId: equipeDetail.chefEquipe?.id,
        effectif: equipeDetail.effectif,
      })
    }
  }, [isEdit, equipeDetail])

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCreateForm((prev) => ({
      ...prev,
      [name]: name === 'effectif' || name === 'chefEquipeId' ? (value ? Number(value) : undefined) : value,
    }))
  }

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setUpdateForm((prev) => ({
      ...prev,
      [name]: name === 'effectif' || name === 'chefEquipeId' ? (value ? Number(value) : undefined) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (isEdit && id) {
        await dispatch(
          updateEquipe({
            id: Number(id),
            data: {
              ...updateForm,
              chefEquipeId: updateForm.chefEquipeId ? Number(updateForm.chefEquipeId) : undefined,
            },
          })
        ).unwrap()
        navigate(`/equipes/${id}`)
      } else {
        await dispatch(
          createEquipe({
            ...createForm,
            chefEquipeId: createForm.chefEquipeId ? Number(createForm.chefEquipeId) : undefined,
          })
        ).unwrap()
        navigate('/equipes')
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || t('form.errorSave'))
    }
  }

  if (isEdit && loading && !equipeDetail)
    return <PageContainer><div className="text-center text-gray-500">{t('form.loading')}</div></PageContainer>
  if (isEdit && !equipeDetail) return <PageContainer><div className="text-center text-gray-500">{t('form.notFound')}</div></PageContainer>

  return (
    <PageContainer size="narrow">
      <button
        onClick={() => navigate(isEdit ? `/equipes/${id}` : '/equipes')}
        className="text-sm text-gray-500 hover:text-gray-800 mb-4 flex items-center gap-1"
      >
        ← {t('form.back')} {isEdit ? t('form.backToTeam') : t('form.backToList')}
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? t('form.editTitle') : t('form.newTitle')}
      </h1>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.code')}</label>
                <input
                  type="text"
                  name="code"
                  value={createForm.code}
                  onChange={handleCreateChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder={t('form.codePlaceholder')}
                />
              </div>
            )}
            {isEdit && (
              <div>
                <span className="text-sm text-gray-500">{t('form.code')}</span>
                <p className="font-mono font-medium text-primary">{equipeDetail?.code}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.nom')}</label>
              <input
                type="text"
                name="nom"
                value={isEdit ? (updateForm.nom ?? '') : createForm.nom}
                onChange={isEdit ? handleUpdateChange : handleCreateChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder={t('form.nomPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.type')}</label>
              <select
                name="type"
                value={isEdit ? (updateForm.type ?? '') : createForm.type}
                onChange={isEdit ? handleUpdateChange : handleCreateChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              >
                {TYPE_EQUIPE_VALUES.map((v) => (
                  <option key={v} value={v}>{t(`type.${v}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.effectif')}</label>
              <input
                type="number"
                name="effectif"
                min={0}
                value={isEdit ? (updateForm.effectif ?? '') : createForm.effectif ?? ''}
                onChange={isEdit ? handleUpdateChange : handleCreateChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.chefEquipe')}</label>
              <select
                name="chefEquipeId"
                value={
                  isEdit
                    ? String(updateForm.chefEquipeId ?? '')
                    : String(createForm.chefEquipeId ?? '')
                }
                onChange={isEdit ? handleUpdateChange : handleCreateChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('form.noChef')}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/equipes/${id}` : '/equipes')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {t('form.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? t('form.saving') : isEdit ? t('form.save') : t('form.create')}
          </button>
        </div>
      </form>
    </PageContainer>
  )
}
