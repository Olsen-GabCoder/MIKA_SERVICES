/**
 * Export du document projet — Word, Excel ou PDF.
 * Tous les modules lourds (xlsx, docx, @react-pdf) sont chargés dynamiquement
 * pour ne pas alourdir le bundle initial.
 */
import type { ProjetDocumentPayload, DocumentExportFormat } from './types'

export type { ProjetDocumentPayload, DocumentExportFormat } from './types'

const EXT: Record<DocumentExportFormat, string> = {
  word: '.docx',
  excel: '.xlsx',
  pdf: '.pdf',
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function generateProjetDocument(
  payload: ProjetDocumentPayload,
  format: DocumentExportFormat,
  baseFilename: string
): Promise<void> {
  const filename = baseFilename.endsWith(EXT[format]) ? baseFilename : `${baseFilename}${EXT[format]}`

  switch (format) {
    case 'word': {
      const { buildProjetWord } = await import('./wordDocument')
      const blob = await buildProjetWord(payload)
      downloadBlob(blob, filename)
      return
    }
    case 'excel': {
      const { buildProjetExcel } = await import('./excelDocument')
      const blob = await buildProjetExcel(payload)
      downloadBlob(blob, filename)
      return
    }
    case 'pdf': {
      const [{ pdf }, React, { ProjetDocumentPdf }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('react'),
        import('./pdfDocument'),
      ])
      const doc = React.createElement(ProjetDocumentPdf, { payload })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(doc as any).toBlob()
      downloadBlob(blob, filename)
      return
    }
    default:
      throw new Error(`Format non supporté: ${format}`)
  }
}
