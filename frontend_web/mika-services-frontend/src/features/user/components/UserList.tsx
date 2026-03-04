import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/store/hooks'
import type { User } from '@/types'
import type { Role } from '@/api/roleApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { fullName } from '@/utils/userDisplay'
import { updateUser } from '@/store/slices/userSlice'
import type { UserUpdateRequest } from '@/api/userApi'
import { useFormatDate } from '@/hooks/useFormatDate'

interface UserListProps {
  users: User[]
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  search: string
  actifFilter: boolean | null
  roleIdFilter: number | null
  sort: string
  roles: Role[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSearchChange: (value: string) => void
  onActifFilterChange: (value: boolean | null) => void
  onRoleIdFilterChange: (value: number | null) => void
  onSortChange: (sort: string) => void
  onUserUpdated?: () => void
}

export const UserList = ({
  users,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  search,
  actifFilter,
  roleIdFilter,
  sort,
  roles,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onActifFilterChange,
  onRoleIdFilterChange,
  onSortChange,
  onUserUpdated,
}: UserListProps) => {
  const { t } = useTranslation('user')
  const formatDate = useFormatDate()
  const dispatch = useAppDispatch()
  const [toggleActifUser, setToggleActifUser] = useState<User | null>(null)
  const [openActionsId, setOpenActionsId] = useState<number | null>(null)
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const [searchInput, setSearchInput] = useState(search)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setOpenActionsId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = setTimeout(() => onSearchChange(value), 400)
    },
    [onSearchChange]
  )

  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentOrder] = sort.split(',')
      const nextOrder = currentField === field && currentOrder === 'asc' ? 'desc' : 'asc'
      onSortChange(`${field},${nextOrder}`)
    },
    [sort, onSortChange]
  )

  const getSortIndicator = (field: string) => {
    const [currentField, order] = sort.split(',')
    if (currentField !== field) return null
    return order === 'asc' ? ' ↑' : ' ↓'
  }

  const handleConfirmToggleActif = useCallback(() => {
    if (!toggleActifUser) return
    const data: UserUpdateRequest = {
      nom: toggleActifUser.nom,
      prenom: toggleActifUser.prenom,
      email: toggleActifUser.email,
      actif: !toggleActifUser.actif,
    }
    dispatch(updateUser({ id: toggleActifUser.id, data }))
      .unwrap()
      .then(() => {
        setToggleActifUser(null)
        onUserUpdated?.()
      })
      .catch(() => {})
  }, [dispatch, toggleActifUser, onUserUpdated])

  const pageSizeOptions = [10, 20, 25, 50, 100]

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
        <Input
          placeholder={t('list.filters.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="min-w-0 w-full sm:min-w-[200px] sm:max-w-xs"
        />
        <select
          value={actifFilter === null ? '' : actifFilter ? 'true' : 'false'}
          onChange={(e) => {
            const v = e.target.value
            onActifFilterChange(v === '' ? null : v === 'true')
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
        >
          <option value="">{t('list.filters.statusAll')}</option>
          <option value="true">{t('detail.active')}</option>
          <option value="false">{t('detail.inactive')}</option>
        </select>
        <select
          value={roleIdFilter ?? ''}
          onChange={(e) => {
            const v = e.target.value
            onRoleIdFilterChange(v === '' ? null : Number(v))
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
        >
          <option value="">{t('list.filters.roleAll')}</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Vue cartes mobile */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-600">
        {users.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
            {t('list.emptyNoUsers')}
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/users/${user.id}`} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-primary truncate block">
                    {fullName(user)}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
                <span
                  className={`shrink-0 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    user.actif
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                  }`}
                >
                  {user.actif ? t('detail.active') : t('detail.inactive')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                {user.matricule && <span>{user.matricule}</span>}
                <span>{user.roles?.map((r) => r.nom).join(', ') || t('list.noRoles')}</span>
                {user.totpEnabled && <span className="text-green-600 dark:text-green-400">2FA</span>}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Link to={`/users/${user.id}`}>
                  <Button variant="outline" size="sm">{t('list.view')}</Button>
                </Link>
                <Link to={`/users/${user.id}`} state={{ openEdit: true }}>
                  <Button variant="outline" size="sm">{t('list.edit')}</Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setToggleActifUser(user)}
                >
                  {user.actif ? t('list.deactivate') : t('list.activate')}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tableau desktop */}
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button type="button" onClick={() => handleSort('nom')} className="hover:text-gray-900 dark:hover:text-white">
                  {t('list.columns.name')}{getSortIndicator('nom')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button type="button" onClick={() => handleSort('email')} className="hover:text-gray-900 dark:hover:text-white">
                  {t('list.columns.email')}{getSortIndicator('email')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('list.columns.matricule')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('list.columns.roles')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button type="button" onClick={() => handleSort('actif')} className="hover:text-gray-900 dark:hover:text-white">
                  {t('list.columns.status')}{getSortIndicator('actif')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('list.columns.twoFa')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button type="button" onClick={() => handleSort('lastLogin')} className="hover:text-gray-900 dark:hover:text-white">
                  {t('list.columns.lastLogin')}{getSortIndicator('lastLogin')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button type="button" onClick={() => handleSort('createdAt')} className="hover:text-gray-900 dark:hover:text-white">
                  {t('list.columns.createdAt')}{getSortIndicator('createdAt')}
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('list.columns.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {users.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  {t('list.emptyNoUsers')}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {fullName(user)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{user.matricule}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {user.roles?.map((r) => r.nom).join(', ') || t('list.noRoles')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        user.actif
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                      }`}
                    >
                      {user.actif ? t('detail.active') : t('detail.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {user.totpEnabled ? t('list.twoFaOn') : t('list.twoFaOff')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(user.lastLogin, { includeTime: true })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(user.createdAt, { includeTime: true })}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {/* Desktop: boutons alignés */}
                    <div className="hidden md:flex flex-wrap items-center justify-end gap-1.5">
                      <Link to={`/users/${user.id}`}>
                        <Button variant="outline" size="sm">
                          {t('list.view')}
                        </Button>
                      </Link>
                      <Link to={`/users/${user.id}`} state={{ openEdit: true }}>
                        <Button variant="outline" size="sm">
                          {t('list.edit')}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setToggleActifUser(user)}
                        title={user.actif ? t('list.deactivate') : t('list.activate')}
                      >
                        {user.actif ? t('list.deactivate') : t('list.activate')}
                      </Button>
                    </div>
                    {/* Mobile: menu déroulant */}
                    <div className="md:hidden relative" ref={openActionsId === user.id ? actionsMenuRef : undefined}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOpenActionsId((id) => (id === user.id ? null : user.id))}
                        aria-haspopup="true"
                        aria-expanded={openActionsId === user.id}
                      >
                        {t('list.columns.actions')} ▾
                      </Button>
                      {openActionsId === user.id && (
                        <div className="absolute right-0 top-full mt-1 z-10 min-w-[160px] py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                          <Link
                            to={`/users/${user.id}`}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setOpenActionsId(null)}
                          >
                            {t('list.view')}
                          </Link>
                          <Link
                            to={`/users/${user.id}`}
                            state={{ openEdit: true }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setOpenActionsId(null)}
                          >
                            {t('list.edit')}
                          </Link>
                          <button
                            type="button"
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => {
                              setToggleActifUser(user)
                              setOpenActionsId(null)
                            }}
                          >
                            {user.actif ? t('list.deactivate') : t('list.activate')}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination + taille de page */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 py-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            {t('list.paginationTotal', { total: totalElements })}
          </span>
          <label className="hidden sm:flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            {t('list.pageSize')}
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            {t('detail.prev')}
          </Button>
          <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
            {t('detail.pageInfo', { current: currentPage + 1, total: totalPages || 1 })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            {t('detail.next')}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={toggleActifUser !== null}
        title={toggleActifUser?.actif ? t('list.confirmDeactivateTitle') : t('list.confirmActivateTitle')}
        message={
          toggleActifUser
            ? t(toggleActifUser.actif ? 'list.confirmDeactivateMessage' : 'list.confirmActivateMessage', {
                name: fullName(toggleActifUser),
              })
            : ''
        }
        variant={toggleActifUser?.actif ? 'danger' : 'primary'}
        confirmLabel={toggleActifUser?.actif ? t('list.deactivate') : t('list.activate')}
        onConfirm={handleConfirmToggleActif}
        onCancel={() => setToggleActifUser(null)}
      />
    </div>
  )
}
