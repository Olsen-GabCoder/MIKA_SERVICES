import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchGlobalDashboard } from '@/store/slices/reportingSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import { fetchEquipes } from '@/store/slices/equipeSlice'
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
  const location = useLocation()
  const dispatch = useAppDispatch()
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed)
  const theme = useAppSelector((state) => state.ui.theme)

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
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 mika-theme-bg dark:text-gray-100 min-w-0 p-4 sm:p-6 lg:p-8 relative overflow-auto" data-theme={theme}>
          <ThemeGate key={location.pathname}>{children}</ThemeGate>
        </main>
      </div>
      <Footer />
    </div>
  )
}
