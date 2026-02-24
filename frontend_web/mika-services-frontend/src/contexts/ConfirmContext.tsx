import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'

export interface ConfirmOptions {
  /** Clé i18n du titre (namespace common par défaut). */
  titleKey?: string
  /** Clé i18n du message (namespace common par défaut). */
  messageKey: string
  /** Paramètres d'interpolation pour le message (ex. {{ name }}). */
  messageParams?: Record<string, string>
  /** Namespace pour title et message (défaut: common). */
  ns?: string
  /** Si true, affiche un seul bouton OK (remplace alert()). */
  alertOnly?: boolean
}

type ConfirmResolve = (value: boolean) => void

interface ConfirmState {
  isOpen: boolean
  titleKey: string
  messageKey: string
  messageParams?: Record<string, string>
  ns: string
  alertOnly: boolean
}

const defaultState: ConfirmState = {
  isOpen: false,
  titleKey: 'confirm.title',
  messageKey: '',
  messageParams: undefined,
  ns: 'common',
  alertOnly: false,
}

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common')
  const [state, setState] = useState<ConfirmState>(defaultState)
  const resolveRef = useRef<ConfirmResolve | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    const ns = options.ns ?? 'common'
    const titleKey = options.titleKey ?? 'confirm.title'
    const messageKey = options.messageKey
    const messageParams = options.messageParams
    const alertOnly = options.alertOnly ?? false
    setState({
      isOpen: true,
      titleKey,
      messageKey,
      messageParams,
      ns,
      alertOnly,
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

  const title = state.messageKey ? t(state.titleKey) : ''
  const message = state.messageKey ? t(state.messageKey, state.messageParams) : ''

  const footer = state.alertOnly ? (
    <button
      type="button"
      onClick={() => handleClose(true)}
      className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium"
    >
      {t('confirm.ok')}
    </button>
  ) : (
    <>
      <button
        type="button"
        onClick={() => handleClose(false)}
        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
      >
        {t('confirm.cancel')}
      </button>
      <button
        type="button"
        onClick={() => handleClose(true)}
        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
      >
        {t('confirm.delete')}
      </button>
    </>
  )

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        isOpen={state.isOpen}
        onClose={() => handleClose(state.alertOnly)}
        title={title}
        size="sm"
        footer={footer}
      >
        <p className="text-gray-700 dark:text-gray-300">{message}</p>
      </Modal>
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
