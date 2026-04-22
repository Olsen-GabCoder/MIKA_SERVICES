import api from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { SyntheseMensuelleResponse } from '@/types/qualiteSynthese'

export const qualiteSyntheseApi = {
  get: (mois: string, projetId?: number) => {
    if (projetId) {
      return api.get<SyntheseMensuelleResponse>(
        API_ENDPOINTS.QUALITE_SYNTHESE.BY_PROJET_MOIS(projetId, mois)
      ).then(r => r.data)
    }
    const params: Record<string, string> = { mois }
    return api.get<SyntheseMensuelleResponse>(
      '/qualite/synthese', { params }
    ).then(r => r.data)
  },
}
