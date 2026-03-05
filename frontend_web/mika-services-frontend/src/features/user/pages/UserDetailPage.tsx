import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PageContainer } from '@/components/layout/PageContainer'
import { fetchUserById, updateUser, deleteUser, fetchUsers } from '@/store/slices/userSlice'
import { userApi, equipeApi, auditApi } from '@/api/userApi'
import type { AuditLogEntry, UserActivitySummary, UserAffectation } from '@/api/userApi'
import { clearError } from '@/store/slices/userSlice'
import { fullName, getInitials } from '@/utils/userDisplay'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UserEditForm } from '../components/UserEditForm'
import type { UserUpdateRequest } from '@/api/userApi'
import { validatePassword } from '@/utils/passwordValidation'
import { useFormatDate } from '@/hooks/useFormatDate'

function getActionBadgeClass(action: string): string {
  switch (action) {
    case 'LOGIN': case 'FIRST_LOGIN': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    case 'LOGOUT': return 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
    case 'CREATE': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    case 'UPDATE': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    case 'DELETE': case 'DEACTIVATE': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    case 'ACTIVATE': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    case 'PASSWORD_CHANGE': case 'PASSWORD_RESET': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
    case '2FA_ENABLE': case '2FA_DISABLE': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
    case 'PAGE_VIEW': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  }
}

const SECTION_CLASS = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden min-h-[200px] flex flex-col'
const SECTION_HEADER_CLASS = 'text-lg font-semibold text-gray-900 dark:text-gray-100 px-6 py-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 shrink-0'
const SECTION_BODY_CLASS = 'p-6 flex-1 text-gray-900 dark:text-gray-100'

export const UserDetailPage = () => {
  const { t } = useTranslation('user')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const {
    selectedUser: user,
    isLoading: loading,
    error,
    currentPage,
    pageSize,
    search,
    actifFilter,
    roleIdFilter,
    sort,
  } = useAppSelector((state) => state.user)
  const authUser = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    if (error) {
      setActionMessage({ type: 'error', text: error })
      dispatch(clearError())
    }
  }, [error, dispatch])
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [affectations, setAffectations] = useState<UserAffectation[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [auditPage, setAuditPage] = useState(0)
  const [auditTotalPages, setAuditTotalPages] = useState(0)
  const [activitySummary, setActivitySummary] = useState<UserActivitySummary | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [confirmToggleActif, setConfirmToggleActif] = useState(false)
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null)
  const [confirmDisable2FA, setConfirmDisable2FA] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (id) dispatch(fetchUserById(Number(id)))
  }, [dispatch, id])

  useEffect(() => {
    if ((location.state as { openEdit?: boolean } | null)?.openEdit) {
      setEditModalOpen(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  useEffect(() => {
    if (!user?.id) return
    let revoked = false
    userApi.getPhotoBlobById(user.id).then((blob) => {
      if (blob && !revoked) setPhotoUrl(URL.createObjectURL(blob))
    })
    return () => {
      revoked = true
      setPhotoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    equipeApi.getAffectationsByUser(user.id).then(setAffectations).catch(() => setAffectations([]))
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    userApi.getAuditLogs(user.id, auditPage, 20).then((res) => {
      setAuditLogs(res.content)
      setAuditTotalPages(res.totalPages)
    }).catch(() => setAuditLogs([]))
  }, [user?.id, auditPage])

  useEffect(() => {
    if (!user?.id) return
    auditApi.getUserSummary(user.id).then(setActivitySummary).catch(() => setActivitySummary(null))
  }, [user?.id])

  const formatDate = useFormatDate()

  const isSelf = authUser?.id === user?.id

  const handleToggleActif = () => {
    if (!user) return
    const data: UserUpdateRequest = {
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      actif: !user.actif,
    }
    dispatch(updateUser({ id: user.id, data }))
    setConfirmToggleActif(false)
    setActionMessage({ type: 'success', text: user.actif ? t('detail.actions.deactivated') : t('detail.actions.activated') })
    setTimeout(() => setActionMessage(null), 4000)
  }

  const handleResetPassword = async () => {
    if (!user || !resetPasswordValue.trim()) {
      setResetPasswordError(t('form.validation.passwordRequired'))
      return
    }
    const pwdErr = validatePassword(resetPasswordValue)
    if (pwdErr) {
      setResetPasswordError(t(`common:${pwdErr}`))
      return
    }
    setResetPasswordError(null)
    try {
      await userApi.adminResetPassword(user.id, resetPasswordValue)
      setResetPasswordModalOpen(false)
      setResetPasswordValue('')
      setActionMessage({ type: 'success', text: t('detail.actions.passwordReset') })
      setTimeout(() => setActionMessage(null), 4000)
    } catch (err: unknown) {
      setResetPasswordError((err as { message?: string })?.message || t('detail.actions.errorGeneric'))
    }
  }

  const handleDisable2FA = async () => {
    if (!user) return
    try {
      await userApi.adminDisable2FA(user.id)
      dispatch(fetchUserById(user.id))
      setConfirmDisable2FA(false)
      setActionMessage({ type: 'success', text: t('detail.actions.twoFaDisabled') })
      setTimeout(() => setActionMessage(null), 4000)
    } catch (err: unknown) {
      setActionMessage({ type: 'error', text: (err as { message?: string })?.message || t('detail.actions.errorGeneric') })
      setTimeout(() => setActionMessage(null), 5000)
    }
  }

  const handleDelete = () => {
    if (!user) return
    dispatch(deleteUser(user.id))
      .unwrap()
      .then(() => {
        setConfirmDelete(false)
        dispatch(
          fetchUsers({
            page: currentPage,
            size: pageSize,
            search: search || undefined,
            actif: actifFilter ?? undefined,
            roleId: roleIdFilter ?? undefined,
            sort: sort || undefined,
          })
        )
        navigate('/users')
      })
      .catch(() => {})
  }

  if (loading && !user) {
    return (
      <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">{t('detail.loading')}</div>
      </PageContainer>
    )
  }
  if (error && !user) {
    return (
      <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
        <div className="text-center text-red-500 dark:text-red-400 py-12">{error}</div>
      </PageContainer>
    )
  }
  if (!user) {
    return (
      <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">{t('detail.notFound')}</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <button
          onClick={() => navigate('/users')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm flex items-center gap-1"
        >
          ← {t('detail.backToList')}
        </button>
        {actionMessage && (
          <div
            className={`text-sm px-4 py-2 rounded-lg ${
              actionMessage.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}
          >
            {actionMessage.text}
          </div>
        )}
      </div>

      {/* Barre d'actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
          {t('detail.actions.edit')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmToggleActif(true)}
          disabled={isSelf}
          title={isSelf ? t('detail.actions.cannotSelf') : undefined}
        >
          {user.actif ? t('detail.actions.deactivate') : t('detail.actions.activate')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setResetPasswordModalOpen(true); setResetPasswordError(null); setResetPasswordValue(''); }}>
          {t('detail.actions.resetPassword')}
        </Button>
        {user.totpEnabled && (
          <Button variant="outline" size="sm" onClick={() => setConfirmDisable2FA(true)}>
            {t('detail.actions.disable2FA')}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          disabled={isSelf}
          title={isSelf ? t('detail.actions.cannotSelf') : undefined}
          className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {t('detail.actions.delete')}
        </Button>
      </div>

      {/* En-tête avec photo et infos principales */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6">
          <div className="flex-shrink-0 w-24 h-24 rounded-full overflow-hidden bg-primary/10 dark:bg-white/10 flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt={fullName(user)} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary dark:text-white">{getInitials(user)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fullName(user)}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('detail.matriculeLabel')} : {user.matricule}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span
                className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                  user.actif ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                }`}
              >
                {user.actif ? t('detail.active') : t('detail.inactive')}
              </span>
              {user.roles?.map((r) => (
                <span key={r.id} className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  {r.nom}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* État du compte */}
        <section className={SECTION_CLASS}>
          <h2 className={SECTION_HEADER_CLASS}>{t('detail.accountState')}</h2>
          <div className={SECTION_BODY_CLASS}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('detail.twoFa')}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {user.totpEnabled ? t('list.twoFaOn') : t('list.twoFaOff')}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('detail.createdAt')}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{formatDate(user.createdAt, { includeTime: true })}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('detail.updatedAt')}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{formatDate(user.updatedAt, { includeTime: true })}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('detail.lastLogin')}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{formatDate(user.lastLogin, { includeTime: true })}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Résumé d'activité */}
        <section className={SECTION_CLASS}>
          <h2 className={SECTION_HEADER_CLASS}>{t('detail.activitySummary')}</h2>
          <div className={SECTION_BODY_CLASS}>
            {activitySummary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activitySummary.totalLogins}</p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70">{t('detail.summary.logins')}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{activitySummary.totalPageViews}</p>
                    <p className="text-xs text-purple-600/70 dark:text-purple-400/70">{t('detail.summary.pageViews')}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{activitySummary.totalActions}</p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70">{t('detail.summary.totalActions')}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {activitySummary.firstLogin ? formatDate(activitySummary.firstLogin, { includeTime: false }) : '—'}
                    </p>
                    <p className="text-xs text-green-600/70 dark:text-green-400/70">{t('detail.summary.firstLogin')}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>{t('detail.summary.lastPasswordChange')}: <span className="font-medium text-gray-900 dark:text-gray-100">{activitySummary.lastPasswordChange ? formatDate(activitySummary.lastPasswordChange, { includeTime: true }) : '—'}</span></p>
                </div>
                {Object.keys(activitySummary.actionBreakdown).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('detail.summary.breakdown')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(activitySummary.actionBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 8)
                        .map(([action, count]) => (
                          <span key={action} className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${getActionBadgeClass(action)}`}>
                            {action} <span className="font-bold">{count}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('detail.noActivity')}</p>
            )}
          </div>
        </section>

        {/* Infos générales */}
        <section className={SECTION_CLASS}>
          <h2 className={SECTION_HEADER_CLASS}>{t('detail.generalInfo')}</h2>
          <div className={SECTION_BODY_CLASS}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-500 dark:text-gray-400">{t('form.telephone')}</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{user.telephone || '—'}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">{t('form.adresse')}</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{user.adresse || '—'}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">{t('form.ville')}</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{user.ville || '—'}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">{t('form.province')}</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{user.province || '—'}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">{t('form.dateNaissance')}</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{formatDate(user.dateNaissance)}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">{t('form.dateEmbauche')}</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{formatDate(user.dateEmbauche)}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">{t('form.typeContrat')}</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{user.typeContrat ? t(`contractType.${user.typeContrat}`) : '—'}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">{t('form.niveauExperience')}</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{user.niveauExperience ? t(`experienceLevel.${user.niveauExperience}`) : '—'}</dd></div>
              {user.superieurHierarchique && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500 dark:text-gray-400">{t('form.superieurHierarchique')}</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{user.superieurHierarchique.prenom} {user.superieurHierarchique.nom}</dd>
                </div>
              )}
            </dl>
            {user.departements?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('detail.departments')}</p>
                <p className="text-gray-900 dark:text-gray-100">{user.departements.map((d) => d.nom).join(', ')}</p>
              </div>
            )}
            {user.specialites?.length > 0 && (
              <div className="mt-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('detail.specialites')}</p>
                <p className="text-gray-900 dark:text-gray-100">{user.specialites.map((s) => s.nom).join(', ')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Affectations */}
        <section className={SECTION_CLASS}>
          <h2 className={SECTION_HEADER_CLASS}>{t('detail.affectations')}</h2>
          <div className={SECTION_BODY_CLASS}>
            {affectations.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('detail.noAffectations')}</p>
            ) : (
              <ul className="space-y-3">
                {affectations.map((a) => (
                  <li key={a.id} className="border-l-4 border-primary/30 pl-4 py-2 bg-gray-50/50 dark:bg-gray-700/30 rounded-r">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{a.equipeNom}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('detail.project')} : {a.projetNom}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(a.dateDebut)} — {formatDate(a.dateFin)} · {a.statut?.replace(/_/g, ' ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Historique d'activité */}
        <section className={`${SECTION_CLASS} lg:col-span-2`}>
          <h2 className={SECTION_HEADER_CLASS}>{t('detail.auditTitle')}</h2>
          <div className={SECTION_BODY_CLASS}>
            {auditLogs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('detail.noAudit')}</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600 text-left text-gray-500 dark:text-gray-400">
                        <th className="py-2 pr-4">{t('detail.columns.date')}</th>
                        <th className="py-2 pr-4">{t('detail.columns.module')}</th>
                        <th className="py-2 pr-4">{t('detail.columns.action')}</th>
                        <th className="py-2 pr-4">{t('detail.columns.ip')}</th>
                        <th className="py-2">{t('detail.columns.details')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(log.createdAt, { includeTime: true })}</td>
                          <td className="py-2.5 pr-4">
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {log.module}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getActionBadgeClass(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-xs text-gray-500 dark:text-gray-400 font-mono">{log.ipAddress || '—'}</td>
                          <td className="py-2.5 text-gray-500 dark:text-gray-400 truncate max-w-[250px]" title={log.details || undefined}>{log.details || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {auditTotalPages > 1 && (
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setAuditPage((p) => Math.max(0, p - 1))}
                      disabled={auditPage === 0}
                      className="text-sm text-primary hover:underline disabled:opacity-50"
                    >
                      {t('detail.prev')}
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('detail.pageInfo', { current: auditPage + 1, total: auditTotalPages })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAuditPage((p) => p + 1)}
                      disabled={auditPage >= auditTotalPages - 1}
                      className="text-sm text-primary hover:underline disabled:opacity-50"
                    >
                      {t('detail.next')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Modal édition */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={t('detail.actions.editUser')}
        size="2xl"
        maxContentHeight="85vh"
      >
        <UserEditForm
          user={user}
          onSuccess={() => {
            setEditModalOpen(false)
            dispatch(fetchUserById(user.id))
            setActionMessage({ type: 'success', text: t('detail.actions.updated') })
            setTimeout(() => setActionMessage(null), 4000)
          }}
          onCancel={() => setEditModalOpen(false)}
        />
      </Modal>

      {/* Modal réinitialiser mot de passe */}
      <Modal
        isOpen={resetPasswordModalOpen}
        onClose={() => { setResetPasswordModalOpen(false); setResetPasswordValue(''); setResetPasswordError(null); }}
        title={t('detail.actions.resetPasswordTitle')}
        size="md"
      >
        <div className="space-y-4">
          {resetPasswordError && (
            <p className="text-sm text-red-600 dark:text-red-400">{resetPasswordError}</p>
          )}
          <Input
            label={t('profile.newPassword')}
            type="password"
            value={resetPasswordValue}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            placeholder="••••••••"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setResetPasswordModalOpen(false); setResetPasswordValue(''); setResetPasswordError(null); }}>
              {t('form.cancel')}
            </Button>
            <Button variant="primary" onClick={handleResetPassword}>
              {t('detail.actions.resetPassword')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmToggleActif}
        title={user?.actif ? t('list.confirmDeactivateTitle') : t('list.confirmActivateTitle')}
        message={user ? t(user.actif ? 'list.confirmDeactivateMessage' : 'list.confirmActivateMessage', { name: fullName(user) }) : ''}
        variant={user?.actif ? 'danger' : 'primary'}
        confirmLabel={user?.actif ? t('list.deactivate') : t('list.activate')}
        onConfirm={handleToggleActif}
        onCancel={() => setConfirmToggleActif(false)}
      />

      <ConfirmDialog
        open={confirmDisable2FA}
        title={t('detail.actions.disable2FATitle')}
        message={t('detail.actions.disable2FAMessage', { name: fullName(user) })}
        variant="danger"
        confirmLabel={t('detail.actions.disable2FA')}
        onConfirm={handleDisable2FA}
        onCancel={() => setConfirmDisable2FA(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={t('detail.actions.deleteTitle')}
        message={t('detail.actions.deleteMessage', { name: fullName(user) })}
        variant="danger"
        confirmLabel={t('detail.actions.delete')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </PageContainer>
  )
}
