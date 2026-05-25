import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRoomSession } from '@/contexts/RoomSessionContext'
import { i18n } from '@/i18n'

interface NavigateOverlayProps {
  onClose: () => void
}

interface NavShortcut {
  route: string
  labelFr: string
  labelEn: string
  icon: JSX.Element
  color: string
}

const ic = 'w-5 h-5'

const SHORTCUTS: NavShortcut[] = [
  { route: '/', labelFr: 'Tableau de bord', labelEn: 'Dashboard', color: 'rgba(255,107,53,0.15)', icon: <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
  { route: '/projets', labelFr: 'Projets', labelEn: 'Projects', color: 'rgba(46,82,102,0.25)', icon: <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> },
  { route: '/equipes', labelFr: 'Equipes', labelEn: 'Teams', color: 'rgba(72,181,160,0.15)', icon: <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { route: '/engins', labelFr: 'Equipements', labelEn: 'Equipment', color: 'rgba(46,82,102,0.25)', icon: <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
  { route: '/materiaux', labelFr: 'Materiaux', labelEn: 'Materials', color: 'rgba(255,107,53,0.12)', icon: <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { route: '/budget', labelFr: 'Budget', labelEn: 'Budget', color: 'rgba(72,181,160,0.15)', icon: <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1" /><circle cx="12" cy="12" r="9" /></svg> },
  { route: '/planning', labelFr: 'Planning', labelEn: 'Planning', color: 'rgba(46,82,102,0.25)', icon: <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { route: '/qualite/synthese', labelFr: 'Qualite', labelEn: 'Quality', color: 'rgba(255,107,53,0.12)', icon: <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { route: '/qshe/dashboard', labelFr: 'QSHE', labelEn: 'QSHE', color: 'rgba(72,181,160,0.15)', icon: <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
  { route: '/salle-mika/pv', labelFr: 'PV Reunions', labelEn: 'Meeting Minutes', color: 'rgba(255,107,53,0.15)', icon: <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { route: '/documents', labelFr: 'Documents', labelEn: 'Documents', color: 'rgba(46,82,102,0.25)', icon: <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { route: '/bareme', labelFr: 'Bareme', labelEn: 'Price Schedule', color: 'rgba(72,181,160,0.12)', icon: <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
]

export function NavigateOverlay({ onClose }: NavigateOverlayProps) {
  const { t } = useTranslation('salleReunion')
  const navigate = useNavigate()
  const { dispatch } = useRoomSession()

  const handleNavigate = useCallback((route: string) => {
    dispatch({ type: 'SWITCH_TO_MINI' })
    onClose()
    navigate(route)
  }, [dispatch, navigate, onClose])

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-5 salle-anim-fade">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(10, 14, 19, 0.85)', backdropFilter: 'blur(16px)' }}
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-[520px] rounded-3xl p-8 salle-anim-scale" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-[14px] mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.25)' }}>
            <svg className="w-6 h-6 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-white tracking-[-0.02em]">{t('navigate.title')}</h2>
          <p className="text-[14px] text-white/50 mt-1">{t('navigate.subtitle')}</p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-lg text-[11px] font-semibold text-[#48B5A0]" style={{ background: 'rgba(72,181,160,0.12)', border: '1px solid rgba(72,181,160,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#48B5A0] lobby-live-pulse" />
            {t('navigate.pipBadge')}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {SHORTCUTS.map((s) => (
            <button
              key={s.route}
              onClick={() => handleNavigate(s.route)}
              className="flex flex-col items-center gap-2 p-4 rounded-[14px] text-center transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,107,53,0.3)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
            >
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white" style={{ background: s.color }}>
                {s.icon}
              </div>
              <span className="text-[12px] font-semibold text-white leading-tight">{i18n.language === 'en' ? s.labelEn : s.labelFr}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
