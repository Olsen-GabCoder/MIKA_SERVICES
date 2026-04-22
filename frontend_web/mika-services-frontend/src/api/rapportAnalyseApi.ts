import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { RapportAnalyseResponse } from '@/types/rapportAnalyse'

export const rapportAnalyseApi = {
  /**
   * Envoie un rapport (fichier et/ou texte) pour analyse IA.
   * Retourne les données de suivi extraites, prêtes à validation.
   */
  analyser: async (projetId: number, params: { file?: File; texte?: string }): Promise<RapportAnalyseResponse> => {
    const formData = new FormData()
    if (params.file) {
      formData.append('file', params.file)
    }
    if (params.texte) {
      formData.append('texte', params.texte)
    }

    const response = await apiClient.post<RapportAnalyseResponse>(
      API_ENDPOINTS.PROJETS.ANALYSE_RAPPORT(projetId),
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000, // 90s — l'analyse IA peut prendre du temps
      }
    )
    return response.data
  },
}
