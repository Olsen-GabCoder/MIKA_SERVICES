import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { affectationUtilisateurApi } from '@/api/chantierApi'
import {
  roleProjetApi,
  type RoleProjet,
  type RoleProjetRequest,
  type FamilleRoleProjet,
} from '@/api/organisationApi'
import { Loading } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { handleApiError } from '@/utils/errorHandler'
import { FAMILLE_ORDER } from '@/utils/rolesProjet'

/** Référentiel des rôles projet : CRUD réservé aux administrateurs. */
export const RolesProjetTab = () => {
  const { t } = useTranslation(['user'])
  const [roles, setRoles] = useState<RoleProjet[]>([])
  const [usageByPoste, setUsageByPoste] = useState<Map<string, number>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Modal création/édition
  const [editRole, setEditRole] = useState<RoleProjet | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formNom, setFormNom] = useState('')
  const [formFamille, setFormFamille] = useState<FamilleRoleProjet>('DIRECTION_PROJET')
  const [formCumulable, setFormCumulable] = useState(false)
  const [formDescription, setFormDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Confirmation activation/désactivation
  const [toggleTarget, setToggleTarget] = useState<RoleProjet | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = () => {
    setIsLoading(true)
    Promise.all([
      roleProjetApi.getAll(),
      affectationUtilisateurApi.getEnCours().catch(() => []),
    ])
      .then(([rs, affs]) => {
        setRoles(rs)
        const usage = new Map<string, number>()
        for (const a of affs) {
          const key = a.poste.trim().toLowerCase()
          usage.set(key, (usage.get(key) ?? 0) + 1)
        }
        setUsageByPoste(usage)
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  const rolesByFamille = useMemo(() => {
    const q = search.trim().toLowerCase()
    const map = new Map<FamilleRoleProjet, RoleProjet[]>()
    for (const famille of FAMILLE_ORDER) {
      const list = roles
        .filter((r) => r.famille === famille)
        .filter((r) => showInactive || r.actif)
        .filter((r) => !q || r.nom.toLowerCase().includes(q))
        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))
      if (list.length > 0) map.set(famille, list)
    }
    return map
  }, [roles, search, showInactive])

  const openCreate = () => {
    setEditRole(null)
    setFormNom('')
    setFormFamille('DIRECTION_PROJET')
    setFormCumulable(false)
    setFormDescription('')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEdit = (role: RoleProjet) => {
    setEditRole(role)
    setFormNom(role.nom)
    setFormFamille(role.famille)
    setFormCumulable(role.cumulable)
    setFormDescription(role.description ?? '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formNom.trim()) {
      setFormError(t('user:org.rolesProjet.nomRequired'))
      return
    }
    setIsSubmitting(true)
    setFormError(null)
    const payload: RoleProjetRequest = {
      nom: formNom.trim(),
      famille: formFamille,
      cumulable: formCumulable,
      description: formDescription.trim() || undefined,
    }
    try {
      if (editRole) await roleProjetApi.update(editRole.id, payload)
      else await roleProjetApi.create(payload)
      setIsModalOpen(false)
      load()
    } catch (e) {
      setFormError(handleApiError(e))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async () => {
    if (!toggleTarget) return
    setActionError(null)
    try {
      await roleProjetApi.toggleActif(toggleTarget.id)
      setToggleTarget(null)
      load()
    } catch (e) {
      setToggleTarget(null)
      setActionError(handleApiError(e))
    }
  }

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm">
        {t('user:org.dash.error')}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {actionError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm">
          {actionError}
        </div>
      )}

      {/* En-tête + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-gray-900 dark:text-gray-100">
            {t('user:org.rolesProjet.title')}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('user:org.rolesProjet.subtitle')}
          </div>
        </div>
        <Button variant="primary" onClick={openCreate}>
          + {t('user:org.rolesProjet.newRole')}
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('user:org.rolesProjet.search')}
          className="w-full sm:w-72 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
        />
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-[#FF6B35]"
          />
          {t('user:org.rolesProjet.showInactive')}
        </label>
      </div>

      {/* Rôles groupés par famille */}
      {rolesByFamille.size === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {t('user:org.rolesProjet.empty')}
          </p>
        </div>
      ) : (
        [...rolesByFamille.entries()].map(([famille, list]) => (
          <div
            key={famille}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
          >
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-300 flex items-center justify-between">
              <span>{t(`user:org.affect.famille.${famille}`)}</span>
              <span className="text-gray-400 font-bold">{list.length}</span>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {list.map((role) => {
                const usage = usageByPoste.get(role.nom.trim().toLowerCase()) ?? 0
                return (
                  <li key={role.id} className="px-4 py-2.5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(role)}
                      className="flex-1 min-w-0 text-left group"
                      title={t('user:org.rolesProjet.edit')}
                    >
                      <span
                        className={`text-sm font-semibold group-hover:text-[#FF6B35] ${
                          role.actif ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 line-through'
                        }`}
                      >
                        {role.nom}
                      </span>
                      {role.description && (
                        <span className="block text-xs text-gray-400 truncate">{role.description}</span>
                      )}
                    </button>

                    {usage > 0 && (
                      <span className="shrink-0 text-[11px] font-bold text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">
                        {t('user:org.rolesProjet.usageCount', { count: usage })}
                      </span>
                    )}
                    <span
                      className={`shrink-0 text-[11px] font-bold rounded-full px-2 py-0.5 border ${
                        role.cumulable
                          ? 'text-[#6BBF59] border-[#6BBF59]'
                          : 'text-gray-400 border-gray-300 dark:border-gray-600'
                      }`}
                      title={role.cumulable ? t('user:org.rolesProjet.cumulableHint') : t('user:org.rolesProjet.exclusifHint')}
                    >
                      {role.cumulable ? t('user:org.rolesProjet.cumulable') : t('user:org.rolesProjet.exclusif')}
                    </span>
                    {!role.actif && (
                      <span className="shrink-0 text-[11px] font-bold rounded-full px-2 py-0.5 border text-[#E63946] border-[#E63946]">
                        {t('user:org.rolesProjet.inactive')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setToggleTarget(role)}
                      className={`shrink-0 text-xs font-bold ${
                        role.actif ? 'text-gray-400 hover:text-[#E63946]' : 'text-gray-400 hover:text-[#6BBF59]'
                      }`}
                    >
                      {role.actif ? t('user:org.rolesProjet.deactivate') : t('user:org.rolesProjet.reactivate')}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))
      )}

      {/* Modal création/édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editRole ? t('user:org.rolesProjet.editTitle') : t('user:org.rolesProjet.createTitle')}
      >
        <div className="flex flex-col gap-3">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm">
              {formError}
            </div>
          )}

          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('user:org.rolesProjet.nom')} *
            <input
              type="text"
              value={formNom}
              onChange={(e) => setFormNom(e.target.value)}
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </label>

          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('user:org.rolesProjet.famille')} *
            <select
              value={formFamille}
              onChange={(e) => setFormFamille(e.target.value as FamilleRoleProjet)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              {FAMILLE_ORDER.map((f) => (
                <option key={f} value={f}>
                  {t(`user:org.affect.famille.${f}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-start gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={formCumulable}
              onChange={(e) => setFormCumulable(e.target.checked)}
              className="mt-0.5 accent-[#FF6B35]"
            />
            <span>
              {t('user:org.rolesProjet.cumulableLabel')}
              <span className="block text-xs font-normal text-gray-400">
                {t('user:org.rolesProjet.cumulableHint')}
              </span>
            </span>
          </label>

          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('user:org.rolesProjet.description')}
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </label>

          <div className="flex justify-end gap-2 mt-1">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('user:org.affect.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '…' : t('user:org.rolesProjet.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation activation/désactivation */}
      <ConfirmDialog
        open={toggleTarget !== null}
        title={
          toggleTarget?.actif
            ? t('user:org.rolesProjet.deactivateTitle')
            : t('user:org.rolesProjet.reactivateTitle')
        }
        message={
          toggleTarget?.actif
            ? t('user:org.rolesProjet.deactivateMessage', { nom: toggleTarget?.nom ?? '' })
            : t('user:org.rolesProjet.reactivateMessage', { nom: toggleTarget?.nom ?? '' })
        }
        variant={toggleTarget?.actif ? 'danger' : 'primary'}
        confirmLabel={
          toggleTarget?.actif ? t('user:org.rolesProjet.deactivate') : t('user:org.rolesProjet.reactivate')
        }
        onConfirm={handleToggle}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  )
}
