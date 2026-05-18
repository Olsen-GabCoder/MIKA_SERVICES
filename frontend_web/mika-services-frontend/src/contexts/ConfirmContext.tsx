import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface ConfirmOptions {
  /** Clé i18n du titre (namespace common par défaut). */
  titleKey?: string
  /** Titre brut (prioritaire sur titleKey). */
  title?: string
  /** Clé i18n du message (namespace common par défaut). */
  messageKey?: string
  /** Message brut (prioritaire sur messageKey). */
  message?: string
  /** Paramètres d'interpolation pour le message (ex. {{ name }}). */
  messageParams?: Record<string, string>
  /** Namespace pour title et message (défaut: common). */
  ns?: string
  /** Si true, affiche un seul bouton OK (remplace alert()). */
  alertOnly?: boolean
  /** Libellé du bouton de confirmation. */
  confirmLabel?: string
  /** Variante visuelle (danger = bouton rouge, warning = bouton orange). */
  variant?: 'danger' | 'warning' | 'default'
}

type ConfirmResolve = (value: boolean) => void

interface ConfirmState {
  isOpen: boolean
  titleKey: string
  titleRaw?: string
  messageKey: string
  messageRaw?: string
  messageParams?: Record<string, string>
  ns: string
  alertOnly: boolean
  confirmLabel?: string
  variant: 'danger' | 'warning' | 'default'
}

const defaultState: ConfirmState = {
  isOpen: false,
  titleKey: 'confirm.title',
  messageKey: '',
  messageParams: undefined,
  ns: 'common',
  alertOnly: false,
  variant: 'default',
}

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null)

/* ── Icônes inline (pas de dépendance externe) ── */

function DangerIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
      <svg className="h-7 w-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </div>
  )
}

function WarningIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
      <svg className="h-7 w-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>
  )
}

function InfoIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
      <svg className="h-7 w-7 text-primary dark:text-primary-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    </div>
  )
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common')
  const [state, setState] = useState<ConfirmState>(defaultState)
  const resolveRef = useRef<ConfirmResolve | null>(null)
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setState({
      isOpen: true,
      titleKey: options.titleKey ?? 'confirm.title',
      titleRaw: options.title,
      messageKey: options.messageKey ?? '',
      messageRaw: options.message,
      messageParams: options.messageParams,
      ns: options.ns ?? 'common',
      alertOnly: options.alertOnly ?? false,
      confirmLabel: options.confirmLabel,
      variant: options.variant ?? 'default',
    })
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleClose = useCallback((value: boolean) => {
    resolveRef.current?.(value)
    resolveRef.current = null
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  // Focus le bouton principal à l'ouverture + Escape pour fermer
  useEffect(() => {
    if (!state.isOpen) return
    const timer = setTimeout(() => confirmBtnRef.current?.focus(), 80)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose(state.alertOnly)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
    }
  }, [state.isOpen, state.alertOnly, handleClose])

  if (!state.isOpen) return <ConfirmContext.Provider value={confirm}>{children}</ConfirmContext.Provider>

  const title = state.titleRaw ?? (state.messageKey || state.messageRaw ? t(state.titleKey, { ns: state.ns }) : '')
  const message = state.messageRaw ?? (state.messageKey ? t(state.messageKey, { ...state.messageParams, ns: state.ns }) : '')

  const isDanger = state.variant === 'danger'
  const isWarning = state.variant === 'warning'

  const confirmBtnClass = isDanger
    ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white'
    : isWarning
      ? 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400 text-white'
      : 'bg-primary hover:bg-primary-dark focus-visible:ring-primary text-white'

  const defaultConfirmLabel = state.alertOnly
    ? t('confirm.ok')
    : isDanger
      ? t('confirm.delete')
      : t('confirm.ok')

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 salle-anim-fade"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={() => handleClose(state.alertOnly)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

        {/* Card — compact, carré, centré */}
        <div
          className="relative z-10 w-full max-w-[340px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-black/40 border border-gray-200/60 dark:border-gray-700/60 salle-anim-scale overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-7 pb-2 text-center">
            {/* Icône */}
            {isDanger ? <DangerIcon /> : isWarning ? <WarningIcon /> : <InfoIcon />}

            {/* Titre */}
            {title && (
              <h3
                id="confirm-title"
                className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h3>
            )}

            {/* Message */}
            {message && (
              <p
                id="confirm-message"
                className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
              >
                {message}
              </p>
            )}
          </div>

          {/* Boutons */}
          <div className={`px-6 pt-4 pb-6 ${state.alertOnly ? 'flex justify-center' : 'grid grid-cols-2 gap-3'}`}>
            {!state.alertOnly && (
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                {t('confirm.cancel')}
              </button>
            )}
            <button
              ref={confirmBtnRef}
              type="button"
              onClick={() => handleClose(true)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${confirmBtnClass}`}
            >
              {state.confirmLabel ?? defaultConfirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return context
}
