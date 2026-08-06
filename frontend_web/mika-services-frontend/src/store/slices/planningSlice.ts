import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { planningApi } from '../../api/planningApi'
import { handleApiError } from '@/utils/errorHandler'
import { clearPlanningCache } from '@/utils/offlineCache'
import type { Tache, TacheCreateRequest, TacheUpdateRequest } from '../../types/planning'

interface PlanningState {
  taches: Tache[]
  tacheDetail: Tache | null
  mesTaches: Tache[]
  tachesEnRetard: Tache[]
  loading: boolean
  loadingMesTaches: boolean
  loadingEnRetard: boolean
  error: string | null
}

const initialState: PlanningState = {
  taches: [],
  tacheDetail: null,
  mesTaches: [],
  tachesEnRetard: [],
  loading: false,
  loadingMesTaches: false,
  loadingEnRetard: false,
  error: null,
}

export const fetchTachesByProjet = createAsyncThunk(
  'planning/fetchByProjet',
  async ({ projetId }: { projetId: number }, { rejectWithValue }) => {
    try {
      return await planningApi.getAllTachesByProjet(projetId)
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
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
    // fetchTachesByProjet (toutes les tâches, sans pagination)
    builder.addCase(fetchTachesByProjet.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchTachesByProjet.fulfilled, (state, action) => {
      state.taches = action.payload
      state.loading = false
    })
    builder.addCase(fetchTachesByProjet.rejected, (state, action) => { state.loading = false; state.error = handleApiError(action.error) })

    // fetchMesTaches
    builder.addCase(fetchMesTaches.pending, (state) => { state.loadingMesTaches = true })
    builder.addCase(fetchMesTaches.fulfilled, (state, action) => { state.mesTaches = action.payload; state.loadingMesTaches = false })
    builder.addCase(fetchMesTaches.rejected, (state, action) => { state.loadingMesTaches = false; state.error = handleApiError(action.error) })

    // fetchTachesEnRetard
    builder.addCase(fetchTachesEnRetard.pending, (state) => { state.loadingEnRetard = true })
    builder.addCase(fetchTachesEnRetard.fulfilled, (state, action) => { state.tachesEnRetard = action.payload; state.loadingEnRetard = false })
    builder.addCase(fetchTachesEnRetard.rejected, (state, action) => { state.loadingEnRetard = false; state.error = handleApiError(action.error) })

    // createTache
    builder.addCase(createTache.fulfilled, (state, action) => {
      state.taches.unshift(action.payload)
      clearPlanningCache(action.payload.projetId)
    })

    // updateTache
    builder.addCase(updateTache.fulfilled, (state, action) => {
      const updated = action.payload
      const idx = state.taches.findIndex(t => t.id === updated.id)
      if (idx !== -1) state.taches[idx] = updated
      if (state.tacheDetail?.id === updated.id) state.tacheDetail = updated
      const idxMes = state.mesTaches.findIndex(t => t.id === updated.id)
      if (idxMes !== -1) state.mesTaches[idxMes] = updated
      const idxRetard = state.tachesEnRetard.findIndex(t => t.id === updated.id)
      if (idxRetard !== -1) {
        if (updated.enRetard) { state.tachesEnRetard[idxRetard] = updated }
        else { state.tachesEnRetard.splice(idxRetard, 1) }
      }
      clearPlanningCache(updated.projetId)
    })

    // deleteTache
    builder.addCase(deleteTache.fulfilled, (state, action) => {
      const deletedId = action.payload
      const deleted = state.taches.find(t => t.id === deletedId)
      state.taches = state.taches.filter(t => t.id !== deletedId)
      state.mesTaches = state.mesTaches.filter(t => t.id !== deletedId)
      state.tachesEnRetard = state.tachesEnRetard.filter(t => t.id !== deletedId)
      if (deleted) clearPlanningCache(deleted.projetId)
    })
  },
})

export const { clearError, clearTacheDetail } = planningSlice.actions
export default planningSlice.reducer
