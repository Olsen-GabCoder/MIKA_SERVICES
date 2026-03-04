import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchGlobalDashboard } from '@/store/slices/reportingSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import { fetchEquipes } from '@/store/slices/equipeSlice'
import { closeMobileMenu } from '@/store/slices/uiSlice'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { ThemeGate } from './ThemeGate'
import { USE_MOCK } from '@/config/mock'

interface LayoutProps {
  children: ReactNode
}

/** Hauteurs du layout (header et footer revalorisés pour hiérarchie visuelle) */
const LAYOUT_HEADER_HEIGHT = '4.5rem'   // h-[4.5rem]
const LAYOUT_FOOTER_HEIGHT = '3.5rem'   // footer plus lisible
const SIDEBAR_WIDTH_COLLAPSED = '4rem'  // w-16
const SIDEBAR_WIDTH_EXPANDED = '16rem'  // w-64

export const Layout = ({ children }: LayoutProps) => {
  const { t } = useTranslation('common')
  const location = useLocation()
  const dispatch = useAppDispatch()
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed)
  const mobileMenuOpen = useAppSelector((state) => state.ui.mobileMenuOpen)
  const theme = useAppSelector((state) => state.ui.theme)
  const offlineModeEnabled = useAppSelector((state) => state.ui.offlineModeEnabled)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    if (!USE_MOCK) return
    dispatch(fetchGlobalDashboard())
    dispatch(fetchProjets({ page: 0, size: 100 }))
    dispatch(fetchEquipes({ page: 0, size: 50 }))
  }, [dispatch])

  const layoutVars = {
    '--layout-header-height': LAYOUT_HEADER_HEIGHT,
    '--layout-sidebar-width': sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
    '--layout-footer-height': LAYOUT_FOOTER_HEIGHT,
  } as React.CSSProperties

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={layoutVars}>
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Backdrop mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => dispatch(closeMobileMenu())}
            aria-hidden
          />
        )}
        <Sidebar />
        <main className="flex-1 mika-theme-bg dark:text-gray-100 min-w-0 p-3 sm:p-6 lg:p-8 relative overflow-auto" data-theme={theme}>
          {offlineModeEnabled && !isOnline && (
            <div className="mb-4 py-2.5 px-4 rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-sm font-medium flex items-center gap-2" role="status">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
              </svg>
              {t('offlineBanner')}
            </div>
          )}
          <ThemeGate key={location.pathname}>{children}</ThemeGate>
        </main>
      </div>
      <Footer />
    </div>
  )
}
