/**
 * Export DQE — orchestrateur PDF / Excel.
 * Chargement dynamique des modules lourds pour ne pas alourdir le bundle.
 */
import type { DqeChapitre } from '@/types/dqe'
import type { Projet } from '@/types/projet'

export type DqeExportFormat = 'pdf' | 'excel'

export interface DqeExportPayload {
  projet: Projet
  chapitres: DqeChapitre[]
  formatMontant: (n?: number) => string
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function generateDqeDocument(
  payload: DqeExportPayload,
  format: DqeExportFormat,
  baseFilename: string
): Promise<void> {
  const ext = format === 'pdf' ? '.pdf' : '.xlsx'
  const filename = baseFilename.endsWith(ext) ? baseFilename : `${baseFilename}${ext}`

  if (format === 'excel') {
    const { buildDqeExcel } = await import('./dqeExcelDocument')
    const blob = await buildDqeExcel(payload)
    downloadBlob(blob, filename)
  } else {
    const [{ pdf }, React, { DqeDocumentPdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('react'),
      import('./dqePdfDocument'),
    ])
    const doc = React.createElement(DqeDocumentPdf, { payload })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(doc as any).toBlob()
    downloadBlob(blob, filename)
  }
}
