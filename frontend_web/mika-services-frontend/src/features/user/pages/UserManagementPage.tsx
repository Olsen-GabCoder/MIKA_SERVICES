import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PageContainer } from '@/components/layout/PageContainer'
import { setItemsPerPage } from '@/store/slices/uiSlice'
import {
  fetchUsers,
  setPage,
  setSearch,
  setActifFilter,
  setRoleIdFilter,
  setSort,
  clearError,
} from '@/store/slices/userSlice'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { UserList } from '../components/UserList'
import { UserForm } from '../components/UserForm'
import { Modal } from '@/components/ui/Modal'
import { roleApi, type Role } from '@/api/roleApi'
import { getEffectiveConnectionQuality, AUTO_REFRESH_INTERVAL_MS } from '@/utils/connectionQualityPreferences'

export const UserManagementPage = () => {
  const { t } = useTranslation(['common', 'user'])
  const dispatch = useAppDispatch()
  const {
    users,
    totalPages,
    totalElements,
    currentPage,
    search,
    actifFilter,
    roleIdFilter,
    sort,
    isLoading,
    error,
  } = useAppSelector((state) => state.user)
  const { itemsPerPage: pageSize, autoRefreshListsEnabled, connectionQuality } = useAppSelector((state) => state.ui)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])

  useEffect(() => {
    roleApi.getActive().then(setRoles).catch(() => setRoles([]))
  }, [])

  useEffect(() => {
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
  }, [dispatch, currentPage, pageSize, search, actifFilter, roleIdFilter, sort])

  const handlePageChange = (page: number) => {
    dispatch(setPage(page))
  }

  const handlePageSizeChange = (size: number) => {
    dispatch(setItemsPerPage(size))
    dispatch(setPage(0))
  }

  const applyFilter = (fn: () => void) => {
    fn()
    dispatch(setPage(0))
  }

  const refetchUsers = () => {
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
  }

  const refetchUsersRef = useRef(refetchUsers)
  refetchUsersRef.current = refetchUsers
  useEffect(() => {
    if (!autoRefreshListsEnabled) return
    const effective = getEffectiveConnectionQuality(connectionQuality)
    const ms = AUTO_REFRESH_INTERVAL_MS[effective]
    const interval = setInterval(() => refetchUsersRef.current(), ms)
    return () => clearInterval(interval)
  }, [autoRefreshListsEnabled, connectionQuality])

  const handleUserCreated = () => {
    setIsCreateModalOpen(false)
    refetchUsers()
  }

  return (
    <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {t('user:management.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('user:management.subtitle')}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              + {t('user:management.addUser')}
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 flex justify-between items-center">
          <span>{error === 'offline_no_cache' ? t('common:error.offlineNoCache') : error}</span>
          <button
            type="button"
            onClick={() => dispatch(clearError())}
            className="text-red-600 dark:text-red-400 hover:underline text-sm"
          >
            {t('close')}
          </button>
        </div>
      )}

      {isLoading ? (
        <Loading />
      ) : (
        <div className="w-full max-w-none">
          <UserList
            users={users}
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            search={search}
            actifFilter={actifFilter}
            roleIdFilter={roleIdFilter}
            sort={sort}
            roles={roles}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={(v) => applyFilter(() => dispatch(setSearch(v)))}
            onActifFilterChange={(v) => applyFilter(() => dispatch(setActifFilter(v)))}
            onRoleIdFilterChange={(v) => applyFilter(() => dispatch(setRoleIdFilter(v)))}
            onSortChange={(v) => applyFilter(() => dispatch(setSort(v)))}
            onUserUpdated={refetchUsers}
          />
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('user:management.createModalTitle')}
        size="2xl"
        maxContentHeight="75vh"
      >
        <UserForm
          onSuccess={handleUserCreated}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </PageContainer>
  )
}
