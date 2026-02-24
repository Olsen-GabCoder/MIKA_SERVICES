/**
 * Export du document projet — Word, Excel ou PDF.
 * Contient l'ensemble des informations de la page détail (sans omission).
 */
import { pdf } from '@react-pdf/renderer'
import React from 'react'
import { ProjetDocumentPdf } from './pdfDocument'
import { buildProjetWord } from './wordDocument'
import { buildProjetExcel } from './excelDocument'
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
      const blob = await buildProjetWord(payload)
      downloadBlob(blob, filename)
      return
    }
    case 'excel': {
      const blob = buildProjetExcel(payload)
      downloadBlob(blob, filename)
      return
    }
    case 'pdf': {
      const doc = React.createElement(ProjetDocumentPdf, { payload })
      const blob = await pdf(doc as React.ReactElement).toBlob()
      downloadBlob(blob, filename)
      return
    }
    default:
      throw new Error(`Format non supporté: ${format}`)
  }
}
