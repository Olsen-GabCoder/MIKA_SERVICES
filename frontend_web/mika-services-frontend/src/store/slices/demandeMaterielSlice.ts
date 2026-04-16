import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { demandeMaterielApi } from '@/api/demandeMaterielApi'
import type {
  DemandeMateriel,
  DemandeMaterielHistorique,
  DemandeMaterielCreateRequest,
  StatutDemandeMateriel,
} from '@/types/materiel'

interface DemandeMaterielState {
  dmas: DemandeMateriel[]
  dmaDetail: DemandeMateriel | null
  historique: DemandeMaterielHistorique[]
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  actionLoading: number | null
  error: string | null
}

const initialState: DemandeMaterielState = {
  dmas: [],
  dmaDetail: null,
  historique: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  actionLoading: null,
  error: null,
}

export const fetchDmas = createAsyncThunk(
  'dma/fetchAll',
  async (params: { page?: number; size?: number; statut?: StatutDemandeMateriel; projetId?: number } = {}) => {
    return await demandeMaterielApi.findAll(params)
  }
)

export const fetchDmaById = createAsyncThunk('dma/fetchById', async (id: number) => {
  return await demandeMaterielApi.findById(id)
})

export const fetchDmaHistorique = createAsyncThunk('dma/fetchHistorique', async (id: number) => {
  return await demandeMaterielApi.findHistorique(id)
})

export const createDma = createAsyncThunk('dma/create', async (data: DemandeMaterielCreateRequest) => {
  return await demandeMaterielApi.create(data)
})

export const validerChantierDma = createAsyncThunk(
  'dma/validerChantier',
  async ({ id, approuve, commentaire }: { id: number; approuve: boolean; commentaire?: string }) => {
    return await demandeMaterielApi.validerChantier(id, approuve, commentaire)
  }
)

export const validerProjetDma = createAsyncThunk(
  'dma/validerProjet',
  async ({ id, approuve, commentaire }: { id: number; approuve: boolean; commentaire?: string }) => {
    return await demandeMaterielApi.validerProjet(id, approuve, commentaire)
  }
)

export const prendreEnChargeDma = createAsyncThunk(
  'dma/prendreEnCharge',
  async ({ id, commentaire }: { id: number; commentaire?: string }) => {
    return await demandeMaterielApi.prendreEnCharge(id, commentaire)
  }
)

export const demanderComplementDma = createAsyncThunk(
  'dma/demanderComplement',
  async ({ id, commentaire }: { id: number; commentaire?: string }) => {
    return await demandeMaterielApi.demanderComplement(id, commentaire)
  }
)

export const completerDma = createAsyncThunk(
  'dma/completer',
  async ({ id, commentaire }: { id: number; commentaire?: string }) => {
    return await demandeMaterielApi.completer(id, commentaire)
  }
)

export const commanderDma = createAsyncThunk(
  'dma/commander',
  async ({ id, commandeId }: { id: number; commandeId?: number }) => {
    return await demandeMaterielApi.commander(id, commandeId)
  }
)

export const livrerDma = createAsyncThunk(
  'dma/livrer',
  async ({ id, commentaire }: { id: number; commentaire?: string }) => {
    return await demandeMaterielApi.livrer(id, commentaire)
  }
)

export const cloturerDma = createAsyncThunk(
  'dma/cloturer',
  async ({ id, commentaire }: { id: number; commentaire?: string }) => {
    return await demandeMaterielApi.cloturer(id, commentaire)
  }
)

export const rejeterDma = createAsyncThunk(
  'dma/rejeter',
  async ({ id, commentaire }: { id: number; commentaire: string }) => {
    return await demandeMaterielApi.rejeter(id, commentaire)
  }
)

function updateDetail(state: DemandeMaterielState, updated: DemandeMateriel) {
  state.actionLoading = null
  state.dmaDetail = updated
  const idx = state.dmas.findIndex((d) => d.id === updated.id)
  if (idx !== -1) state.dmas[idx] = updated
}

const demandeMaterielSlice = createSlice({
  name: 'dma',
  initialState,
  reducers: {
    clearDmaDetail: (state) => { state.dmaDetail = null; state.historique = [] },
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDmas.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchDmas.fulfilled, (state, action) => {
        state.loading = false
        state.dmas = action.payload.content
        state.totalElements = action.payload.totalElements
        state.totalPages = action.payload.totalPages
        state.currentPage = action.payload.number
      })
      .addCase(fetchDmas.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

      .addCase(fetchDmaById.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchDmaById.fulfilled, (state, action) => { state.loading = false; state.dmaDetail = action.payload })
      .addCase(fetchDmaById.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

      .addCase(fetchDmaHistorique.fulfilled, (state, action) => { state.historique = action.payload })

      .addCase(createDma.fulfilled, (state, action) => {
        state.dmas = [action.payload, ...state.dmas]
        state.totalElements += 1
      })

      // Toutes les actions workflow suivent le même pattern
      .addCase(validerChantierDma.pending, (state, a) => { state.actionLoading = a.meta.arg.id })
      .addCase(validerChantierDma.fulfilled, (state, a) => updateDetail(state, a.payload))
      .addCase(validerChantierDma.rejected, (state, a) => { state.actionLoading = null; state.error = a.error.message || 'Erreur' })

      .addCase(validerProjetDma.pending, (state, a) => { state.actionLoading = a.meta.arg.id })
      .addCase(validerProjetDma.fulfilled, (state, a) => updateDetail(state, a.payload))
      .addCase(validerProjetDma.rejected, (state, a) => { state.actionLoading = null; state.error = a.error.message || 'Erreur' })

      .addCase(prendreEnChargeDma.pending, (state, a) => { state.actionLoading = a.meta.arg.id })
      .addCase(prendreEnChargeDma.fulfilled, (state, a) => updateDetail(state, a.payload))
      .addCase(prendreEnChargeDma.rejected, (state, a) => { state.actionLoading = null; state.error = a.error.message || 'Erreur' })

      .addCase(demanderComplementDma.pending, (state, a) => { state.actionLoading = a.meta.arg.id })
      .addCase(demanderComplementDma.fulfilled, (state, a) => updateDetail(state, a.payload))
      .addCase(demanderComplementDma.rejected, (state, a) => { state.actionLoading = null; state.error = a.error.message || 'Erreur' })

      .addCase(completerDma.pending, (state, a) => { state.actionLoading = a.meta.arg.id })
      .addCase(completerDma.fulfilled, (state, a) => updateDetail(state, a.payload))
      .addCase(completerDma.rejected, (state, a) => { state.actionLoading = null; state.error = a.error.message || 'Erreur' })

      .addCase(commanderDma.pending, (state, a) => { state.actionLoading = a.meta.arg.id })
      .addCase(commanderDma.fulfilled, (state, a) => updateDetail(state, a.payload))
      .addCase(commanderDma.rejected, (state, a) => { state.actionLoading = null; state.error = a.error.message || 'Erreur' })

      .addCase(livrerDma.pending, (state, a) => { state.actionLoading = a.meta.arg.id })
      .addCase(livrerDma.fulfilled, (state, a) => updateDetail(state, a.payload))
      .addCase(livrerDma.rejected, (state, a) => { state.actionLoading = null; state.error = a.error.message || 'Erreur' })

      .addCase(cloturerDma.pending, (state, a) => { state.actionLoading = a.meta.arg.id })
      .addCase(cloturerDma.fulfilled, (state, a) => updateDetail(state, a.payload))
      .addCase(cloturerDma.rejected, (state, a) => { state.actionLoading = null; state.error = a.error.message || 'Erreur' })

      .addCase(rejeterDma.pending, (state, a) => { state.actionLoading = a.meta.arg.id })
      .addCase(rejeterDma.fulfilled, (state, a) => updateDetail(state, a.payload))
      .addCase(rejeterDma.rejected, (state, a) => { state.actionLoading = null; state.error = a.error.message || 'Erreur' })
  },
})

export const { clearDmaDetail, clearError } = demandeMaterielSlice.actions
export default demandeMaterielSlice.reducer
