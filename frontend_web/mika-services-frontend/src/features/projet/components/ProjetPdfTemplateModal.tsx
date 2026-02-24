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
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-template-title"
      >
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 id="pdf-template-title" className="text-lg font-semibold text-gray-900">
            Choisir le modèle du document PDF
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Sélectionnez la structure du document à générer. Le PDF ne contiendra aucun élément d'interface (boutons, liens).
          </p>
        </div>
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {PDF_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl.id)}
              disabled={generating}
              className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="font-semibold text-gray-900 block">{tpl.label}</span>
              <span className="text-sm text-gray-600 mt-1 block">{tpl.description}</span>
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
