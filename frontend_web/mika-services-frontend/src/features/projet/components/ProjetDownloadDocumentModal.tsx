import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import type { DocumentExportFormat } from '@/features/projet/export/types'

const FORMATS: { id: DocumentExportFormat; labelKey: string; descKey: string; ext: string }[] = [
  { id: 'word', labelKey: 'download.wordLabel', descKey: 'download.wordDesc', ext: '.docx' },
  { id: 'excel', labelKey: 'download.excelLabel', descKey: 'download.excelDesc', ext: '.xlsx' },
  { id: 'pdf', labelKey: 'download.pdfLabel', descKey: 'download.pdfDesc', ext: '.pdf' },
]

export interface ProjetDownloadDocumentModalProps {
  open: boolean
  onClose: () => void
  onSelectFormat: (format: DocumentExportFormat) => Promise<void>
  generating?: boolean
}

export function ProjetDownloadDocumentModal({
  open,
  onClose,
  onSelectFormat,
  generating = false,
}: ProjetDownloadDocumentModalProps) {
  const { t } = useTranslation('projet')

  const handleSelect = (format: DocumentExportFormat) => {
    onSelectFormat(format).then(() => onClose()).catch(() => {})
  }

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
    <Modal isOpen={open} onClose={onClose} title={t('download.title')} size="md" footer={footer}>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('download.subtitle')}
      </p>
      <div className="space-y-3">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handleSelect(f.id)}
            disabled={generating}
            className="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary/70 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-white dark:bg-gray-700/50"
          >
            <span className="font-semibold text-gray-900 dark:text-gray-100 block">{t(f.labelKey)} {f.ext}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 mt-1 block">{t(f.descKey)}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
