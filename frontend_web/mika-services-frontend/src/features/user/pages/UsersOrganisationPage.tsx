import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { OfflineDisabledButton } from '@/components/pwa/OfflineDisabledButton'
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
import { UserList } from '../components/UserList'
import { UserCreateWizard } from '../components/UserCreateWizard'
import { UsersDashboard } from '../components/UsersDashboard'
import { OrgChartTab } from '../components/OrgChartTab'
import { RolesTab } from '../components/RolesTab'
import { DepartementsTab } from '../components/DepartementsTab'
import { AffectationsChantierTab } from '../components/AffectationsChantierTab'
import { RolesProjetTab } from '../components/RolesProjetTab'
import { roleApi, type Role } from '@/api/roleApi'
import { getEffectiveConnectionQuality, AUTO_REFRESH_INTERVAL_MS } from '@/utils/connectionQualityPreferences'

type OrgTab = 'dashboard' | 'directory' | 'orgchart' | 'roles' | 'projectRoles' | 'departments' | 'teams'

const TABS: { key: OrgTab; soon: boolean }[] = [
  { key: 'dashboard', soon: false },
  { key: 'directory', soon: false },
  { key: 'orgchart', soon: false },
  { key: 'roles', soon: false },
  { key: 'projectRoles', soon: false },
  { key: 'departments', soon: false },
  { key: 'teams', soon: false },
]

export const UsersOrganisationPage = () => {
  const { t } = useTranslation(['common', 'user'])
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<OrgTab>('dashboard')
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
    if (activeTab !== 'directory') return
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
  }, [dispatch, activeTab, currentPage, pageSize, search, actifFilter, roleIdFilter, sort])

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
    if (!autoRefreshListsEnabled || activeTab !== 'directory') return
    const effective = getEffectiveConnectionQuality(connectionQuality)
    const ms = AUTO_REFRESH_INTERVAL_MS[effective]
    const interval = setInterval(() => refetchUsersRef.current(), ms)
    return () => clearInterval(interval)
  }, [autoRefreshListsEnabled, connectionQuality, activeTab])

  const handleUserCreated = () => {
    setIsCreateModalOpen(false)
    if (activeTab === 'directory') refetchUsers()
  }

  return (
    <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          {t('user:org.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('user:org.subtitle')}</p>
      </header>

      {/* Barre d'onglets */}
      <div className="mb-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 sm:px-4 flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap px-4 py-4 text-[15px] font-semibold border-b-2 transition-colors ${
                active
                  ? 'border-[#FF6B35] text-[#FF6B35]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {t(`user:org.tabs.${tab.key}`)}
              {tab.soon && (
                <span className="ml-2 align-[2px] text-[10px] font-extrabold tracking-wider text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5">
                  {t('user:org.soon')}
                </span>
              )}
            </button>
          )
        })}
        <div className="ml-auto shrink-0 py-2 pl-2">
          <OfflineDisabledButton>
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              + {t('user:org.newUser')}
            </Button>
          </OfflineDisabledButton>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <UsersDashboard onNavigateTab={(tab) => setActiveTab(tab as OrgTab)} />
      )}

      {activeTab === 'directory' && (
        <>
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
              isLoading={isLoading}
              onPageChange={(page) => dispatch(setPage(page))}
              onPageSizeChange={(size) => {
                dispatch(setItemsPerPage(size))
                dispatch(setPage(0))
              }}
              onSearchChange={(v) => applyFilter(() => dispatch(setSearch(v)))}
              onActifFilterChange={(v) => applyFilter(() => dispatch(setActifFilter(v)))}
              onRoleIdFilterChange={(v) => applyFilter(() => dispatch(setRoleIdFilter(v)))}
              onSortChange={(v) => applyFilter(() => dispatch(setSort(v)))}
              onUserUpdated={refetchUsers}
            />
          </div>
        </>
      )}

      {activeTab === 'orgchart' && <OrgChartTab />}

      {activeTab === 'roles' && <RolesTab />}

      {activeTab === 'projectRoles' && <RolesProjetTab />}

      {activeTab === 'departments' && <DepartementsTab />}

      {activeTab === 'teams' && <AffectationsChantierTab />}

      <UserCreateWizard
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleUserCreated}
      />
    </PageContainer>
  )
}
