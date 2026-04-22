import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qualiteAgrementApi } from '@/api/qualiteAgrementApi'
import type {
  AgrementMarcheResponse,
  AgrementMarcheCreateRequest,
  AgrementMarcheUpdateRequest,
  AgrementSummaryResponse,
  StatutAgrement,
} from '@/types/qualiteAgrement'

interface State {
  agrements: AgrementMarcheResponse[]
  summary: AgrementSummaryResponse | null
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: State = {
  agrements: [],
  summary: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
}

export const fetchAgrements = createAsyncThunk(
  'qualiteAgrement/fetchAll',
  async ({ projetId, page, size, statut }: {
    projetId?: number; page?: number; size?: number; statut?: StatutAgrement
  }) => qualiteAgrementApi.getAll({ projetId, page, size, statut })
)

export const fetchAgrementsByProjet = createAsyncThunk(
  'qualiteAgrement/fetchByProjet',
  async ({ projetId, page, size, statut }: {
    projetId: number; page?: number; size?: number; statut?: StatutAgrement
  }) => qualiteAgrementApi.getByProjet(projetId, page, size, statut)
)

export const createAgrement = createAsyncThunk(
  'qualiteAgrement/create',
  async (req: AgrementMarcheCreateRequest) => qualiteAgrementApi.create(req)
)

export const updateAgrement = createAsyncThunk(
  'qualiteAgrement/update',
  async ({ id, req }: { id: number; req: AgrementMarcheUpdateRequest }) =>
    qualiteAgrementApi.update(id, req)
)

export const deleteAgrement = createAsyncThunk(
  'qualiteAgrement/delete',
  async (id: number) => { await qualiteAgrementApi.delete(id); return id }
)

export const fetchAgrementSummary = createAsyncThunk(
  'qualiteAgrement/fetchSummary',
  async ({ projetId, mois }: { projetId: number; mois: string }) =>
    qualiteAgrementApi.getSummary(projetId, mois)
)

const slice = createSlice({
  name: 'qualiteAgrement',
  initialState,
  reducers: {
    clearError(state) { state.error = null },
  },
  extraReducers: (b) => {
    b.addCase(fetchAgrements.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchAgrements.fulfilled, (s, a) => {
      s.loading = false
      s.agrements = a.payload.content
      s.totalElements = a.payload.totalElements
      s.totalPages = a.payload.totalPages
      s.currentPage = a.payload.number
    })
    b.addCase(fetchAgrements.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(fetchAgrementsByProjet.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchAgrementsByProjet.fulfilled, (s, a) => {
      s.loading = false
      s.agrements = a.payload.content
      s.totalElements = a.payload.totalElements
      s.totalPages = a.payload.totalPages
      s.currentPage = a.payload.number
    })
    b.addCase(fetchAgrementsByProjet.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(createAgrement.fulfilled, (s, a) => { s.agrements.unshift(a.payload) })

    b.addCase(updateAgrement.fulfilled, (s, a) => {
      const idx = s.agrements.findIndex(d => d.id === a.payload.id)
      if (idx !== -1) s.agrements[idx] = a.payload
    })

    b.addCase(deleteAgrement.fulfilled, (s, a) => {
      s.agrements = s.agrements.filter(d => d.id !== a.payload)
    })

    b.addCase(fetchAgrementSummary.fulfilled, (s, a) => { s.summary = a.payload })
  },
})

export const { clearError } = slice.actions
export default slice.reducer
