import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qualiteReceptionApi } from '@/api/qualiteReceptionApi'
import type {
  DemandeReceptionResponse,
  DemandeReceptionCreateRequest,
  DemandeReceptionUpdateRequest,
  ReceptionSummaryResponse,
} from '@/types/qualiteReception'
import type { NatureReception, SousTypeReception } from '@/types/qualiteReception'

interface State {
  demandes: DemandeReceptionResponse[]
  summary: ReceptionSummaryResponse[]
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: State = {
  demandes: [],
  summary: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
}

export const fetchReceptions = createAsyncThunk(
  'qualiteReception/fetchAll',
  async ({ projetId, page, size, nature, sousType }: {
    projetId?: number; page?: number; size?: number;
    nature?: NatureReception; sousType?: SousTypeReception
  }) => qualiteReceptionApi.getAll({ projetId, page, size, nature, sousType })
)

export const fetchReceptionsByProjet = createAsyncThunk(
  'qualiteReception/fetchByProjet',
  async ({ projetId, page, size, nature, sousType }: {
    projetId: number; page?: number; size?: number;
    nature?: NatureReception; sousType?: SousTypeReception
  }) => qualiteReceptionApi.getByProjet(projetId, page, size, nature, sousType)
)

export const createReception = createAsyncThunk(
  'qualiteReception/create',
  async (req: DemandeReceptionCreateRequest) => qualiteReceptionApi.create(req)
)

export const updateReception = createAsyncThunk(
  'qualiteReception/update',
  async ({ id, req }: { id: number; req: DemandeReceptionUpdateRequest }) =>
    qualiteReceptionApi.update(id, req)
)

export const deleteReception = createAsyncThunk(
  'qualiteReception/delete',
  async (id: number) => { await qualiteReceptionApi.delete(id); return id }
)

export const fetchReceptionSummary = createAsyncThunk(
  'qualiteReception/fetchSummary',
  async ({ projetId, mois }: { projetId: number; mois: string }) =>
    qualiteReceptionApi.getSummary(projetId, mois)
)

const slice = createSlice({
  name: 'qualiteReception',
  initialState,
  reducers: {
    clearError(state) { state.error = null },
  },
  extraReducers: (b) => {
    b.addCase(fetchReceptions.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchReceptions.fulfilled, (s, a) => {
      s.loading = false
      s.demandes = a.payload.content
      s.totalElements = a.payload.totalElements
      s.totalPages = a.payload.totalPages
      s.currentPage = a.payload.number
    })
    b.addCase(fetchReceptions.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(fetchReceptionsByProjet.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchReceptionsByProjet.fulfilled, (s, a) => {
      s.loading = false
      s.demandes = a.payload.content
      s.totalElements = a.payload.totalElements
      s.totalPages = a.payload.totalPages
      s.currentPage = a.payload.number
    })
    b.addCase(fetchReceptionsByProjet.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(createReception.fulfilled, (s, a) => { s.demandes.unshift(a.payload) })

    b.addCase(updateReception.fulfilled, (s, a) => {
      const idx = s.demandes.findIndex(d => d.id === a.payload.id)
      if (idx !== -1) s.demandes[idx] = a.payload
    })

    b.addCase(deleteReception.fulfilled, (s, a) => {
      s.demandes = s.demandes.filter(d => d.id !== a.payload)
    })

    b.addCase(fetchReceptionSummary.fulfilled, (s, a) => { s.summary = a.payload })
  },
})

export const { clearError } = slice.actions
export default slice.reducer
