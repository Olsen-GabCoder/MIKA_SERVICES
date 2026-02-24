import type { DocumentExportFormat } from '@/features/projet/export/types'

const FORMATS: { id: DocumentExportFormat; label: string; description: string; ext: string }[] = [
  {
    id: 'word',
    label: 'Word',
    description: 'Document .docx structuré, éditable, idéal pour validation administrative et transmission officielle.',
    ext: '.docx',
  },
  {
    id: 'excel',
    label: 'Excel',
    description: 'Classeur .xlsx avec feuilles par section (suivi mensuel, études, points bloquants, etc.).',
    ext: '.xlsx',
  },
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Document .pdf fixe, prêt à l\'impression et à l\'archivage.',
    ext: '.pdf',
  },
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
  if (!open) return null

  const handleSelect = (format: DocumentExportFormat) => {
    onSelectFormat(format).then(() => onClose()).catch(() => {})
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 shadow-xl dark:shadow-none border border-gray-200 dark:border-gray-600 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-document-title"
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
          <h2 id="download-document-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Télécharger le document
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choisissez le format de téléchargement. Le document contiendra l’ensemble des informations de la page (informations générales, financières, délais, indicateurs, tableaux).
          </p>
        </div>
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleSelect(f.id)}
              disabled={generating}
              className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary/70 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-white dark:bg-gray-700/50"
            >
              <span className="font-semibold text-gray-900 dark:text-gray-100 block">{f.label} {f.ext}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1 block">{f.description}</span>
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
