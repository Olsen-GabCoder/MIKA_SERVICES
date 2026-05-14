import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export interface QuickAccessProps {
  tachesEnRetard: number
  stocksBas: number
  messagesNonLus: number
}

const tiles = [
  { key: 'projets', href: '/projets', icon: <path d="M3 7h18M3 12h18M3 17h12" /> },
  { key: 'planning', href: '/planning', icon: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>, badgeKey: 'tachesEnRetard' as const },
  { key: 'budget', href: '/budget', icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" /> },
  { key: 'engins', href: '/engins', icon: <path d="M5 12V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5M3 12h18l-2 7H5l-2-7z" />, badgeKey: 'stocksBas' as const },
  { key: 'materiaux', href: '/materiaux', icon: <path d="M20 7h-9M20 17h-9M4 7h.01M4 12h.01M4 17h.01M14 12h6" /> },
  { key: 'messagerie', href: '/messagerie', icon: <><path d="M17 8h2a2 2 0 0 1 2 2v9l-4-3H9a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h8z" /><path d="M3 3h8a2 2 0 0 1 2 2v3" /></>, badgeKey: 'messagesNonLus' as const },
  { key: 'equipes', href: '/equipes', icon: <><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></> },
  { key: 'documents', href: '/documents', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></> },
]

export function QuickAccess({ tachesEnRetard, stocksBas, messagesNonLus }: QuickAccessProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const counts = { tachesEnRetard, stocksBas, messagesNonLus }

  return (
    <div className="col-span-12 lg:col-span-8 rounded-xl p-4" style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 330ms both' }}>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>{t('db.transversal.quickAccess')}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tiles.map(tile => {
          const count = tile.badgeKey ? counts[tile.badgeKey] : 0
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => navigate(tile.href)}
              className="relative p-3.5 rounded-[10px] flex flex-col gap-3.5 min-h-[84px] text-left border-0 cursor-pointer transition-all duration-150 hover:-translate-y-px"
              style={{ background: 'var(--db-subtle)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--db-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--db-subtle)')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ color: 'var(--db-t2)' }}>{tile.icon}</svg>
              <span className="text-[12.5px] font-medium" style={{ color: 'var(--db-t1)' }}>
                {t(`db.transversal.tile.${tile.key}`)}
              </span>
              {count > 0 && (
                <span className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full grid place-items-center text-white text-[10px] font-semibold db-num" style={{ background: 'var(--db-orange)' }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
