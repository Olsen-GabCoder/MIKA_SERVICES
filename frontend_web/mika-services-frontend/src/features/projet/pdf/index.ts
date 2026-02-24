import { pdf } from '@react-pdf/renderer'
import React from 'react'
import { ProjetPdfFiche } from './templates/ProjetPdfFiche'
import { ProjetPdfSynthese } from './templates/ProjetPdfSynthese'
import { ProjetPdfRapportComplet } from './templates/ProjetPdfRapportComplet'
import type { ProjetPdfData, ProjetPdfTemplateId } from './types'

export type { ProjetPdfData, ProjetPdfTemplateId, ProjetPdfTemplate } from './types'
export { PDF_TEMPLATES } from './templatesList'

const TEMPLATE_MAP = {
  fiche: ProjetPdfFiche,
  synthese: ProjetPdfSynthese,
  'rapport-complet': ProjetPdfRapportComplet,
} as const

export async function generateProjetPdf(
  templateId: ProjetPdfTemplateId,
  data: ProjetPdfData,
  filename: string
): Promise<void> {
  const Template = TEMPLATE_MAP[templateId]
  if (!Template) throw new Error(`Template inconnu: ${templateId}`)
  const doc = React.createElement(Template, { data })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdf() expects Document root; our templates return Document
  const blob = await pdf(doc as any).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
