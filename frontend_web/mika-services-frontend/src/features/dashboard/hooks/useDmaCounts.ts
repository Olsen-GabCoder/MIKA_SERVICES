import { useQueries } from '@tanstack/react-query'
import { demandeMaterielApi } from '@/api/demandeMaterielApi'
import { useIsOnline } from '@/hooks/useConnectivity'
import type { StatutDemandeMateriel } from '@/types/materiel'

const DMA_STATUTS: StatutDemandeMateriel[] = [
  'SOUMISE',
  'EN_VALIDATION_CHANTIER',
  'EN_VALIDATION_PROJET',
  'PRISE_EN_CHARGE',
]

const STALE_TIME = 5 * 60 * 1000

export interface DmaCounts {
  soumise: number
  enValidation: number
  priseEnCharge: number
  total: number
}

export function useDmaCounts(): {
  counts: DmaCounts
  loading: boolean
  error: Error | null
} {
  const isOnline = useIsOnline()

  const queries = useQueries({
    queries: DMA_STATUTS.map(statut => ({
      queryKey: ['dashboard', 'dma-count', statut] as const,
      queryFn: () => demandeMaterielApi.findAll({ statut, size: 1 }),
      staleTime: STALE_TIME,
      refetchInterval: STALE_TIME,
      enabled: isOnline,
    })),
  })

  const soumise = queries[0].data?.totalElements ?? 0
  const enValidation =
    (queries[1].data?.totalElements ?? 0) +
    (queries[2].data?.totalElements ?? 0)
  const priseEnCharge = queries[3].data?.totalElements ?? 0
  const total = soumise + enValidation + priseEnCharge

  return {
    counts: { soumise, enValidation, priseEnCharge, total },
    loading: queries.some(q => q.isLoading),
    error: (queries.find(q => q.error)?.error as Error) ?? null,
  }
}
