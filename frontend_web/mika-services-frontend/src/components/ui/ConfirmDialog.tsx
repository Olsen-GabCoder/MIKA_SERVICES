import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
  /** Si true, un seul bouton (OK) — pour remplacer alert(). */
  alertOnly?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Boîte de confirmation modale (remplace window.confirm et alert).
 * Les textes sont passés déjà traduits par le parent (t('common:confirm.xxx')).
 */
export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'primary',
  alertOnly = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const { t } = useTranslation('common')
  if (!open) return null

  const confirmClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-primary hover:bg-primary-dark text-white'

  const footer = alertOnly ? (
    <button
      type="button"
      onClick={onConfirm}
      className={`px-4 py-2 rounded-lg font-medium ${confirmClass}`}
    >
      {confirmLabel ?? t('confirm.ok')}
    </button>
  ) : (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
      >
        {cancelLabel ?? t('confirm.cancel')}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className={`px-4 py-2 rounded-lg font-medium ${confirmClass}`}
      >
        {confirmLabel ?? t('confirm.title')}
      </button>
    </>
  )

  return (
    <Modal
      isOpen={open}
      onClose={alertOnly ? onConfirm : onCancel}
      title={title}
      size="sm"
      footer={footer}
    >
      <p className="text-gray-700 dark:text-gray-300">{message}</p>
    </Modal>
  )
}
