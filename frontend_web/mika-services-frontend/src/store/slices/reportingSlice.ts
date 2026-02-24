import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { reportingApi } from '../../api/reportingApi'
import type { GlobalDashboard, ProjetReport } from '../../types/reporting'

interface ReportingState {
  dashboard: GlobalDashboard | null
  projetReport: ProjetReport | null
  loading: boolean
  error: string | null
}

const initialState: ReportingState = {
  dashboard: null,
  projetReport: null,
  loading: false,
  error: null,
}

export const fetchGlobalDashboard = createAsyncThunk(
  'reporting/fetchDashboard',
  async () => {
    return await reportingApi.getGlobalDashboard()
  }
)

export const fetchProjetReport = createAsyncThunk(
  'reporting/fetchProjetReport',
  async (projetId: number) => {
    return await reportingApi.getProjetReport(projetId)
  }
)

const reportingSlice = createSlice({
  name: 'reporting',
  initialState,
  reducers: {
    clearError(state) { state.error = null },
    clearProjetReport(state) { state.projetReport = null },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchGlobalDashboard.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchGlobalDashboard.fulfilled, (state, action) => { state.dashboard = action.payload; state.loading = false })
    builder.addCase(fetchGlobalDashboard.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

    builder.addCase(fetchProjetReport.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchProjetReport.fulfilled, (state, action) => { state.projetReport = action.payload; state.loading = false })
    builder.addCase(fetchProjetReport.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })
  },
})

export const { clearError, clearProjetReport } = reportingSlice.actions
export default reportingSlice.reducer
