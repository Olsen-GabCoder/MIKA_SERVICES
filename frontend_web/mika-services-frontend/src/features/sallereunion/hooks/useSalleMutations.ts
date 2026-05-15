import { useMutation, useQueryClient } from '@tanstack/react-query'
import { salleReunionApi } from '@/api/salleReunionApi'
import type { SalleReunion } from '@/types/salleReunion'

export function useOuvrirSalle() {
  const qc = useQueryClient()
  return useMutation<SalleReunion, Error>({
    mutationFn: salleReunionApi.ouvrir,
    onSuccess: (data) => {
      qc.setQueryData(['salle-reunion'], data)
    },
  })
}

export function useFermerSalle() {
  const qc = useQueryClient()
  return useMutation<SalleReunion, Error>({
    mutationFn: salleReunionApi.fermer,
    onSuccess: (data) => {
      qc.setQueryData(['salle-reunion'], data)
    },
  })
}
