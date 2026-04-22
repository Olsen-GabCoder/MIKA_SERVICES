import type { IncidentSummaryResponse } from './qsheIncident'

export interface ActionCorrectiveSummaryResponse {
  totalActions: number
  actionsEnRetard: number
  actionsOuvertes: number
  actionsVerifiees: number
  tauxCloture: number
  parType: Record<string, number>
  parPriorite: Record<string, number>
}

export interface QsheDashboardResponse {
  incidents: IncidentSummaryResponse
  actions: ActionCorrectiveSummaryResponse
  tauxFrequence: number | null
  tauxGravite: number | null
  heuresTravaillees: number | null
  joursDepuisDernierAT: number | null
}
