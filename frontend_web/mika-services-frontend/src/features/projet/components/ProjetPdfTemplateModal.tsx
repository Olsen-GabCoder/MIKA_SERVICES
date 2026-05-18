import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { PDF_TEMPLATES } from '@/features/projet/pdf/templatesList'
import type { ProjetPdfTemplateId } from '@/features/projet/pdf/types'

export interface ProjetPdfTemplateModalProps {
  open: boolean
  onClose: () => void
  onSelect: (templateId: ProjetPdfTemplateId) => void
  generating?: boolean
}

export function ProjetPdfTemplateModal({
  open,
  onClose,
  onSelect,
  generating = false,
}: ProjetPdfTemplateModalProps) {
  const { t } = useTranslation('projet')

  const footer = (
    <button
      type="button"
      onClick={onClose}
      className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
    >
      {t('common:confirm.cancel')}
    </button>
  )

  return (
    <Modal isOpen={open} onClose={onClose} title={t('pdfTemplate.title')} size="md" footer={footer}>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('pdfTemplate.subtitle')}
      </p>
      <div className="space-y-3">
        {PDF_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelect(tpl.id)}
            disabled={generating}
            className="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary/70 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-white dark:bg-gray-700/50"
          >
            <span className="font-semibold text-gray-900 dark:text-gray-100 block">{tpl.label}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 mt-1 block">{tpl.description}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
