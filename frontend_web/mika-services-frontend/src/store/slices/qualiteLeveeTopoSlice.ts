import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qualiteLeveeTopoApi } from '@/api/qualiteLeveeTopoApi'
import type {
  LeveeTopoResponse,
  LeveeTopoCreateRequest,
  LeveeTopoUpdateRequest,
} from '@/types/qualiteLeveeTopo'

interface State {
  levees: LeveeTopoResponse[]
  current: LeveeTopoResponse | null
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: State = {
  levees: [],
  current: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
}

export const fetchLevees = createAsyncThunk(
  'qualiteLeveeTopo/fetchAll',
  async ({ projetId, page, size }: { projetId?: number; page?: number; size?: number }) =>
    qualiteLeveeTopoApi.getAll(page, size, projetId)
)

export const fetchLeveesByProjet = createAsyncThunk(
  'qualiteLeveeTopo/fetchByProjet',
  async ({ projetId, page, size }: { projetId: number; page?: number; size?: number }) =>
    qualiteLeveeTopoApi.getByProjet(projetId, page, size)
)

export const fetchLeveeByProjetAndMois = createAsyncThunk(
  'qualiteLeveeTopo/fetchByProjetAndMois',
  async ({ projetId, mois }: { projetId: number; mois: string }) =>
    qualiteLeveeTopoApi.getByProjetAndMois(projetId, mois)
)

export const createLevee = createAsyncThunk(
  'qualiteLeveeTopo/create',
  async (req: LeveeTopoCreateRequest) => qualiteLeveeTopoApi.create(req)
)

export const updateLevee = createAsyncThunk(
  'qualiteLeveeTopo/update',
  async ({ id, req }: { id: number; req: LeveeTopoUpdateRequest }) =>
    qualiteLeveeTopoApi.update(id, req)
)

export const deleteLevee = createAsyncThunk(
  'qualiteLeveeTopo/delete',
  async (id: number) => { await qualiteLeveeTopoApi.delete(id); return id }
)

const slice = createSlice({
  name: 'qualiteLeveeTopo',
  initialState,
  reducers: {
    clearError(state) { state.error = null },
    clearCurrent(state) { state.current = null },
  },
  extraReducers: (b) => {
    b.addCase(fetchLevees.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchLevees.fulfilled, (s, a) => {
      s.loading = false
      s.levees = a.payload.content
      s.totalElements = a.payload.totalElements
      s.totalPages = a.payload.totalPages
      s.currentPage = a.payload.number
    })
    b.addCase(fetchLevees.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(fetchLeveesByProjet.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchLeveesByProjet.fulfilled, (s, a) => {
      s.loading = false
      s.levees = a.payload.content
      s.totalElements = a.payload.totalElements
      s.totalPages = a.payload.totalPages
      s.currentPage = a.payload.number
    })
    b.addCase(fetchLeveesByProjet.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(fetchLeveeByProjetAndMois.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchLeveeByProjetAndMois.fulfilled, (s, a) => {
      s.loading = false
      s.current = a.payload
    })
    b.addCase(fetchLeveeByProjetAndMois.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(createLevee.fulfilled, (s, a) => { s.levees.unshift(a.payload); s.current = a.payload })

    b.addCase(updateLevee.fulfilled, (s, a) => {
      const idx = s.levees.findIndex(e => e.id === a.payload.id)
      if (idx !== -1) s.levees[idx] = a.payload
      s.current = a.payload
    })

    b.addCase(deleteLevee.fulfilled, (s, a) => {
      s.levees = s.levees.filter(e => e.id !== a.payload)
      if (s.current?.id === a.payload) s.current = null
    })
  },
})

export const { clearError, clearCurrent } = slice.actions
export default slice.reducer
