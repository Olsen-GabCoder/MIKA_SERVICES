import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { securiteApi } from '../../api/securiteApi'
import type {
  Incident, IncidentCreateRequest, IncidentUpdateRequest,
  Risque, RisqueCreateRequest, RisqueUpdateRequest,
  SecuriteSummary, PaginatedResponse,
} from '../../types/securite'

interface SecuriteState {
  incidents: Incident[]
  risques: Risque[]
  summary: SecuriteSummary | null
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: SecuriteState = {
  incidents: [],
  risques: [],
  summary: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
}

export const fetchIncidentsByProjet = createAsyncThunk(
  'securite/fetchIncidents',
  async ({ projetId, page, size }: { projetId: number; page?: number; size?: number }) => {
    return await securiteApi.getIncidentsByProjet(projetId, page, size)
  }
)

export const createIncident = createAsyncThunk(
  'securite/createIncident',
  async (request: IncidentCreateRequest) => {
    return await securiteApi.createIncident(request)
  }
)

export const updateIncident = createAsyncThunk(
  'securite/updateIncident',
  async ({ id, request }: { id: number; request: IncidentUpdateRequest }) => {
    return await securiteApi.updateIncident(id, request)
  }
)

export const deleteIncident = createAsyncThunk(
  'securite/deleteIncident',
  async (id: number) => {
    await securiteApi.deleteIncident(id)
    return id
  }
)

export const fetchRisquesByProjet = createAsyncThunk(
  'securite/fetchRisques',
  async ({ projetId, page, size }: { projetId: number; page?: number; size?: number }) => {
    return await securiteApi.getRisquesByProjet(projetId, page, size)
  }
)

export const createRisque = createAsyncThunk(
  'securite/createRisque',
  async (request: RisqueCreateRequest) => {
    return await securiteApi.createRisque(request)
  }
)

export const updateRisque = createAsyncThunk(
  'securite/updateRisque',
  async ({ id, request }: { id: number; request: RisqueUpdateRequest }) => {
    return await securiteApi.updateRisque(id, request)
  }
)

export const deleteRisque = createAsyncThunk(
  'securite/deleteRisque',
  async (id: number) => {
    await securiteApi.deleteRisque(id)
    return id
  }
)

export const fetchSecuriteSummary = createAsyncThunk(
  'securite/fetchSummary',
  async (projetId: number) => {
    return await securiteApi.getSecuriteSummary(projetId)
  }
)

const securiteSlice = createSlice({
  name: 'securite',
  initialState,
  reducers: {
    clearError(state) { state.error = null },
    switchToRisques(_state) { /* used to trigger tab switch in UI */ },
  },
  extraReducers: (builder) => {
    // Incidents
    builder.addCase(fetchIncidentsByProjet.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchIncidentsByProjet.fulfilled, (state, action) => {
      const data = action.payload as PaginatedResponse<Incident>
      state.incidents = data.content
      state.totalElements = data.totalElements
      state.totalPages = data.totalPages
      state.currentPage = data.number
      state.loading = false
    })
    builder.addCase(fetchIncidentsByProjet.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

    builder.addCase(createIncident.fulfilled, (state, action) => { state.incidents.unshift(action.payload) })
    builder.addCase(updateIncident.fulfilled, (state, action) => {
      const idx = state.incidents.findIndex(i => i.id === action.payload.id)
      if (idx !== -1) state.incidents[idx] = action.payload
    })
    builder.addCase(deleteIncident.fulfilled, (state, action) => {
      state.incidents = state.incidents.filter(i => i.id !== action.payload)
    })

    // Risques
    builder.addCase(fetchRisquesByProjet.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchRisquesByProjet.fulfilled, (state, action) => {
      const data = action.payload as PaginatedResponse<Risque>
      state.risques = data.content
      state.totalElements = data.totalElements
      state.totalPages = data.totalPages
      state.currentPage = data.number
      state.loading = false
    })
    builder.addCase(fetchRisquesByProjet.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

    builder.addCase(createRisque.fulfilled, (state, action) => { state.risques.unshift(action.payload) })
    builder.addCase(updateRisque.fulfilled, (state, action) => {
      const idx = state.risques.findIndex(r => r.id === action.payload.id)
      if (idx !== -1) state.risques[idx] = action.payload
    })
    builder.addCase(deleteRisque.fulfilled, (state, action) => {
      state.risques = state.risques.filter(r => r.id !== action.payload)
    })

    // Summary
    builder.addCase(fetchSecuriteSummary.fulfilled, (state, action) => { state.summary = action.payload })
  },
})

export const { clearError } = securiteSlice.actions
export default securiteSlice.reducer
