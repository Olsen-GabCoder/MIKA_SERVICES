import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { planningApi } from '../../api/planningApi'
import type { Tache, TacheCreateRequest, TacheUpdateRequest, PaginatedResponse } from '../../types/planning'

interface PlanningState {
  taches: Tache[]
  tacheDetail: Tache | null
  mesTaches: Tache[]
  tachesEnRetard: Tache[]
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: PlanningState = {
  taches: [],
  tacheDetail: null,
  mesTaches: [],
  tachesEnRetard: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
}

export const fetchTachesByProjet = createAsyncThunk(
  'planning/fetchByProjet',
  async ({ projetId, page, size }: { projetId: number; page?: number; size?: number }) => {
    return await planningApi.getTachesByProjet(projetId, page, size)
  }
)

export const fetchMesTaches = createAsyncThunk(
  'planning/fetchMesTaches',
  async (userId: number) => {
    return await planningApi.getMesTaches(userId)
  }
)

export const fetchTachesEnRetard = createAsyncThunk(
  'planning/fetchEnRetard',
  async () => {
    return await planningApi.getTachesEnRetard()
  }
)

export const createTache = createAsyncThunk(
  'planning/create',
  async (request: TacheCreateRequest) => {
    return await planningApi.createTache(request)
  }
)

export const updateTache = createAsyncThunk(
  'planning/update',
  async ({ id, request }: { id: number; request: TacheUpdateRequest }) => {
    return await planningApi.updateTache(id, request)
  }
)

export const deleteTache = createAsyncThunk(
  'planning/delete',
  async (id: number) => {
    await planningApi.deleteTache(id)
    return id
  }
)

const planningSlice = createSlice({
  name: 'planning',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
    clearTacheDetail(state) {
      state.tacheDetail = null
    },
  },
  extraReducers: (builder) => {
    // fetchTachesByProjet
    builder.addCase(fetchTachesByProjet.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchTachesByProjet.fulfilled, (state, action) => {
      const data = action.payload as PaginatedResponse<Tache>
      state.taches = data.content
      state.totalElements = data.totalElements
      state.totalPages = data.totalPages
      state.currentPage = data.number
      state.loading = false
    })
    builder.addCase(fetchTachesByProjet.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

    // fetchMesTaches
    builder.addCase(fetchMesTaches.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchMesTaches.fulfilled, (state, action) => { state.mesTaches = action.payload; state.loading = false })
    builder.addCase(fetchMesTaches.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

    // fetchTachesEnRetard
    builder.addCase(fetchTachesEnRetard.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchTachesEnRetard.fulfilled, (state, action) => { state.tachesEnRetard = action.payload; state.loading = false })
    builder.addCase(fetchTachesEnRetard.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

    // createTache
    builder.addCase(createTache.fulfilled, (state, action) => { state.taches.unshift(action.payload) })

    // updateTache
    builder.addCase(updateTache.fulfilled, (state, action) => {
      const idx = state.taches.findIndex(t => t.id === action.payload.id)
      if (idx !== -1) state.taches[idx] = action.payload
      if (state.tacheDetail?.id === action.payload.id) state.tacheDetail = action.payload
    })

    // deleteTache
    builder.addCase(deleteTache.fulfilled, (state, action) => {
      state.taches = state.taches.filter(t => t.id !== action.payload)
    })
  },
})

export const { clearError, clearTacheDetail } = planningSlice.actions
export default planningSlice.reducer
