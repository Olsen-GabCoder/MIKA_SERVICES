import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { qsheIncidentApi } from '@/api/qsheIncidentApi'
import type {
  IncidentResponse,
  IncidentCreateRequest,
  IncidentUpdateRequest,
  IncidentSummaryResponse,
  StatutIncident,
} from '@/types/qsheIncident'

interface QsheIncidentState {
  incidents: IncidentResponse[]
  selectedIncident: IncidentResponse | null
  summary: IncidentSummaryResponse | null
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: QsheIncidentState = {
  incidents: [],
  selectedIncident: null,
  summary: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
}

export const fetchIncidentsByProjet = createAsyncThunk(
  'qsheIncident/fetchByProjet',
  async ({ projetId, page, size }: { projetId: number; page?: number; size?: number }) => {
    return qsheIncidentApi.getByProjet(projetId, page, size)
  }
)

export const fetchIncidentById = createAsyncThunk(
  'qsheIncident/fetchById',
  async (id: number) => qsheIncidentApi.getById(id)
)

export const createIncident = createAsyncThunk(
  'qsheIncident/create',
  async (request: IncidentCreateRequest) => qsheIncidentApi.create(request)
)

export const updateIncident = createAsyncThunk(
  'qsheIncident/update',
  async ({ id, request }: { id: number; request: IncidentUpdateRequest }) =>
    qsheIncidentApi.update(id, request)
)

export const deleteIncident = createAsyncThunk(
  'qsheIncident/delete',
  async (id: number) => { await qsheIncidentApi.delete(id); return id }
)

export const changeStatut = createAsyncThunk(
  'qsheIncident/changeStatut',
  async ({ id, statut }: { id: number; statut: StatutIncident }) =>
    qsheIncidentApi.changeStatut(id, statut)
)

export const fetchIncidentSummary = createAsyncThunk(
  'qsheIncident/fetchSummary',
  async (projetId: number) => qsheIncidentApi.getSummary(projetId)
)

const qsheIncidentSlice = createSlice({
  name: 'qsheIncident',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null },
    clearSelected: (state) => { state.selectedIncident = null },
  },
  extraReducers: (builder) => {
    builder
      // fetch list
      .addCase(fetchIncidentsByProjet.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchIncidentsByProjet.fulfilled, (state, { payload }) => {
        state.loading = false
        state.incidents = payload.content
        state.totalElements = payload.totalElements
        state.totalPages = payload.totalPages
        state.currentPage = payload.number
      })
      .addCase(fetchIncidentsByProjet.rejected, (state, { error }) => {
        state.loading = false; state.error = error.message ?? 'Erreur de chargement'
      })
      // fetch one
      .addCase(fetchIncidentById.fulfilled, (state, { payload }) => { state.selectedIncident = payload })
      // create
      .addCase(createIncident.fulfilled, (state, { payload }) => {
        state.incidents = [payload, ...state.incidents]
      })
      // update
      .addCase(updateIncident.fulfilled, (state, { payload }) => {
        state.incidents = state.incidents.map(i => i.id === payload.id ? payload : i)
        if (state.selectedIncident?.id === payload.id) state.selectedIncident = payload
      })
      // delete
      .addCase(deleteIncident.fulfilled, (state, { payload: id }) => {
        state.incidents = state.incidents.filter(i => i.id !== id)
      })
      // change statut
      .addCase(changeStatut.fulfilled, (state, { payload }) => {
        state.incidents = state.incidents.map(i => i.id === payload.id ? payload : i)
      })
      // summary
      .addCase(fetchIncidentSummary.fulfilled, (state, { payload }) => { state.summary = payload })
  },
})

export const { clearError, clearSelected } = qsheIncidentSlice.actions
export default qsheIncidentSlice.reducer
