import { useCallback, useEffect, useState } from 'react'
import { meteoApi } from '@/api/meteoApi'
import type { Meteo, Previsions } from '@/types/meteo'

interface UseMeteoReturn {
  meteo: Meteo | null
  previsions: Previsions | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook encapsulant les appels meteoApi.
 * Fetch au mount, pas de polling automatique (sera ajoute en D4).
 */
export function useMeteo(): UseMeteoReturn {
  const [meteo, setMeteo] = useState<Meteo | null>(null)
  const [previsions, setPrevisions] = useState<Previsions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [m, p] = await Promise.all([
        meteoApi.getActuelle(),
        meteoApi.getPrevisions(),
      ])
      setMeteo(m)
      setPrevisions(p)
    } catch {
      setError('meteo_error')
      setMeteo(null)
      setPrevisions(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { meteo, previsions, loading, error, refetch }
}
