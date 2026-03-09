/**
 * Export PDF du procès-verbal — même niveau de présentation que le document projet.
 */
import type { PVDocumentPayload } from './types'

export type { PVDocumentPayload, ProjetDonneesSemaine } from './types'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

/**
 * Génère et télécharge le PV au format PDF.
 * Le payload doit déjà contenir les données projet (prévisions, points bloquants) pour chaque point.
 */
export async function generatePVDocument(payload: PVDocumentPayload): Promise<void> {
  const [{ pdf }, React, { PVDocumentPdf }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('react'),
    import('./pdfDocument'),
  ])
  const doc = React.createElement(PVDocumentPdf, { payload })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(doc as any).toBlob()
  const filename = `PV-reunion-${payload.reunion.dateReunion}-${payload.reunion.id}.pdf`
  downloadBlob(blob, filename)
}
