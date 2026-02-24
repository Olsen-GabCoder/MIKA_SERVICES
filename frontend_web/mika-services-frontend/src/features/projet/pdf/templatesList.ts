import type { ProjetPdfTemplate } from './types'

export const PDF_TEMPLATES: ProjetPdfTemplate[] = [
  {
    id: 'fiche',
    label: 'Fiche projet',
    description: 'Une page : identification, montants, dates, responsable, client, localisation. Idéal pour partage rapide.',
  },
  {
    id: 'synthese',
    label: 'Synthèse exécutive',
    description: 'Indicateurs clés, chiffre d\'affaires, alertes et cadre. Pour réunions de pilotage.',
  },
  {
    id: 'rapport-complet',
    label: 'Rapport détaillé',
    description: 'Cadre du marché, CA complet, études, travaux, prévisions, description. Document officiel complet.',
  },
]
