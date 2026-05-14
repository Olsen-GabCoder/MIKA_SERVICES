import { useMutation, useQueryClient } from '@tanstack/react-query'
import { salleReunionApi } from '@/api/salleReunionApi'
import type { SalleReunion } from '@/types/salleReunion'

export function useOuvrirSalle() {
  const qc = useQueryClient()
  return useMutation<SalleReunion, Error>({
    mutationFn: salleReunionApi.ouvrir,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salle-reunion'] }) },
  })
}

export function useFermerSalle() {
  const qc = useQueryClient()
  return useMutation<SalleReunion, Error>({
    mutationFn: salleReunionApi.fermer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salle-reunion'] }) },
  })
}
