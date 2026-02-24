import api from './axios'
import type { Meteo, Previsions } from '../types/meteo'

export const meteoApi = {
  getActuelle: async (ville?: string): Promise<Meteo> => {
    const response = await api.get('/meteo/actuelle', { params: ville ? { ville } : {} })
    return response.data
  },
  getPrevisions: async (ville?: string): Promise<Previsions> => {
    const response = await api.get('/meteo/previsions', { params: ville ? { ville } : {} })
    return response.data
  },
}
