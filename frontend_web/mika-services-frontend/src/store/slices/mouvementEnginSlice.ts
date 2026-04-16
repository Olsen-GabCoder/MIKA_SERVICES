import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { mouvementEnginApi } from '@/api/mouvementEnginApi'
import type {
  MouvementEnginSummary,
  MouvementEnginCreateRequest,
  MouvementEnginActionRequest,
  StatutMouvementEngin,
} from '@/types/materiel'

interface MouvementEnginState {
  mouvements: MouvementEnginSummary[]
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  actionLoading: number | null  // id du mouvement en cours d'action
  error: string | null
}

const initialState: MouvementEnginState = {
  mouvements: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  actionLoading: null,
  error: null,
}

export const fetchMouvements = createAsyncThunk(
  'mouvementEngin/fetchAll',
  async (params: {
    page?: number
    size?: number
    statut?: StatutMouvementEngin
    enginId?: number
    projetId?: number
    dateFrom?: string
    dateTo?: string
  } = {}) => {
    return await mouvementEnginApi.findAll(params)
  }
)

export const createMouvement = createAsyncThunk(
  'mouvementEngin/create',
  async (data: MouvementEnginCreateRequest) => {
    return await mouvementEnginApi.create(data)
  }
)

export const confirmerDepartMouvement = createAsyncThunk(
  'mouvementEngin/confirmerDepart',
  async ({ id, body }: { id: number; body?: MouvementEnginActionRequest }) => {
    return await mouvementEnginApi.confirmerDepart(id, body)
  }
)

export const confirmerReceptionMouvement = createAsyncThunk(
  'mouvementEngin/confirmerReception',
  async ({ id, body }: { id: number; body?: MouvementEnginActionRequest }) => {
    return await mouvementEnginApi.confirmerReception(id, body)
  }
)

export const annulerMouvement = createAsyncThunk(
  'mouvementEngin/annuler',
  async ({ id, body }: { id: number; body?: MouvementEnginActionRequest }) => {
    return await mouvementEnginApi.annuler(id, body)
  }
)

function replaceInList(list: MouvementEnginSummary[], updated: MouvementEnginSummary): MouvementEnginSummary[] {
  return list.map((m) => (m.id === updated.id ? updated : m))
}

const mouvementEnginSlice = createSlice({
  name: 'mouvementEngin',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchMouvements.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchMouvements.fulfilled, (state, action) => {
        state.loading = false
        state.mouvements = action.payload.content
        state.totalElements = action.payload.totalElements
        state.totalPages = action.payload.totalPages
        state.currentPage = action.payload.number
      })
      .addCase(fetchMouvements.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Erreur chargement mouvements'
      })
      // create
      .addCase(createMouvement.fulfilled, (state, action) => {
        state.mouvements = [action.payload, ...state.mouvements]
        state.totalElements += 1
      })
      // confirmerDepart
      .addCase(confirmerDepartMouvement.pending, (state, action) => {
        state.actionLoading = action.meta.arg.id
      })
      .addCase(confirmerDepartMouvement.fulfilled, (state, action) => {
        state.actionLoading = null
        state.mouvements = replaceInList(state.mouvements, action.payload)
      })
      .addCase(confirmerDepartMouvement.rejected, (state, action) => {
        state.actionLoading = null
        state.error = action.error.message || 'Erreur confirmation départ'
      })
      // confirmerReception
      .addCase(confirmerReceptionMouvement.pending, (state, action) => {
        state.actionLoading = action.meta.arg.id
      })
      .addCase(confirmerReceptionMouvement.fulfilled, (state, action) => {
        state.actionLoading = null
        state.mouvements = replaceInList(state.mouvements, action.payload)
      })
      .addCase(confirmerReceptionMouvement.rejected, (state, action) => {
        state.actionLoading = null
        state.error = action.error.message || 'Erreur confirmation réception'
      })
      // annuler
      .addCase(annulerMouvement.pending, (state, action) => {
        state.actionLoading = action.meta.arg.id
      })
      .addCase(annulerMouvement.fulfilled, (state, action) => {
        state.actionLoading = null
        state.mouvements = replaceInList(state.mouvements, action.payload)
      })
      .addCase(annulerMouvement.rejected, (state, action) => {
        state.actionLoading = null
        state.error = action.error.message || 'Erreur annulation'
      })
  },
})

export const { clearError } = mouvementEnginSlice.actions
export default mouvementEnginSlice.reducer
