import { useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'

/* ── Icons ── */
function IconInfo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

function IconAlertTriangle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
    </svg>
  )
}

function IconBookOpen({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  )
}

function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function IconFileText({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  )
}

/* ── PageGuide: bandeau contextuel ── */
export type PageGuideVariant = 'welcome' | 'contextual' | 'warning'

export interface PageGuideProps {
  /** Variante visuelle */
  variant?: PageGuideVariant
  /** Message principal */
  message: string
  /** Cle unique pour la persistance du dismiss (ex: "incidents-welcome") */
  dismissKey?: string
  /** Actions optionnelles */
  actions?: Array<{ label: string; onClick: () => void; primary?: boolean }>
  /** Forcer l'affichage meme si deja dismiss */
  force?: boolean
}

const STORAGE_PREFIX = 'mika_guide_dismissed_'

export function PageGuide({ variant = 'contextual', message, dismissKey, actions, force }: PageGuideProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (force || !dismissKey) return false
    try { return localStorage.getItem(STORAGE_PREFIX + dismissKey) === '1' } catch { return false }
  })

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    if (dismissKey) {
      try { localStorage.setItem(STORAGE_PREFIX + dismissKey, '1') } catch { /* noop */ }
    }
  }, [dismissKey])

  if (dismissed) return null

  const styles = {
    welcome: {
      container: 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50',
      icon: 'text-blue-500 dark:text-blue-400',
      text: 'text-blue-800 dark:text-blue-300',
      IconComponent: IconBookOpen,
    },
    contextual: {
      container: 'bg-gray-50/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
      icon: 'text-gray-500 dark:text-gray-400',
      text: 'text-gray-700 dark:text-gray-300',
      IconComponent: IconInfo,
    },
    warning: {
      container: 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50',
      icon: 'text-amber-500 dark:text-amber-400',
      text: 'text-amber-800 dark:text-amber-300',
      IconComponent: IconAlertTriangle,
    },
  }

  const s = styles[variant]
  const { IconComponent } = s

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${s.container} mb-4`}>
      <span className={`mt-0.5 ${s.icon}`}>
        <IconComponent size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${s.text}`}>{message}</p>
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={a.onClick}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  a.primary
                    ? 'bg-primary text-white hover:bg-primary-dark shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {dismissKey && (
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Fermer"
        >
          <IconX size={14} />
        </button>
      )}
    </div>
  )
}

/* ── EmptyState: etat vide enrichi ── */
export interface EmptyStateProps {
  /** Titre principal */
  title: string
  /** Description */
  description?: string
  /** Bouton d'action */
  action?: { label: string; onClick: () => void }
  /** Astuce affichee sous l'action */
  tip?: string
  /** Icone personnalisee (par defaut : fichier) */
  icon?: ReactNode
}

function IconLightbulb({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5C8.26 12.26 8.72 13.02 8.91 14" />
    </svg>
  )
}

export function EmptyState({ title, description, action, tip, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="mb-4">
        {icon ?? <IconFileText size={48} />}
      </div>
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed mb-4">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark shadow-sm transition-colors"
        >
          {action.label}
        </button>
      )}
      {tip && (
        <div className="flex items-center gap-2 mt-4 text-gray-400 dark:text-gray-500">
          <IconLightbulb size={13} />
          <p className="text-xs italic">{tip}</p>
        </div>
      )}
    </div>
  )
}

/* ── useFirstVisit: hook pour detecter la premiere visite d'une page ── */
const FIRST_VISIT_PREFIX = 'mika_first_visit_'

export function useFirstVisit(pageKey: string): { isFirstVisit: boolean; markVisited: () => void } {
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    try { return !localStorage.getItem(FIRST_VISIT_PREFIX + pageKey) } catch { return true }
  })

  const markVisited = useCallback(() => {
    setIsFirstVisit(false)
    try { localStorage.setItem(FIRST_VISIT_PREFIX + pageKey, '1') } catch { /* noop */ }
  }, [pageKey])

  useEffect(() => {
    if (isFirstVisit) {
      const timer = setTimeout(markVisited, 30000)
      return () => clearTimeout(timer)
    }
  }, [isFirstVisit, markVisited])

  return { isFirstVisit, markVisited }
}
