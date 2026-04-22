import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { qsheEpiApi } from '@/api/qsheEpiApi'
import type { EpiResponse, EpiCreateRequest, EpiSummaryResponse } from '@/types/qsheEpi'

interface State {
  epis: EpiResponse[]; expires: EpiResponse[]; stockBas: EpiResponse[]; summary: EpiSummaryResponse | null
  totalElements: number; totalPages: number; currentPage: number; loading: boolean; error: string | null
}
const initialState: State = { epis: [], expires: [], stockBas: [], summary: null, totalElements: 0, totalPages: 0, currentPage: 0, loading: false, error: null }

export const fetchEpis = createAsyncThunk('qsheEpi/fetchAll', async ({ page, size }: { page?: number; size?: number }) => qsheEpiApi.getAll(page, size))
export const createEpi = createAsyncThunk('qsheEpi/create', (req: EpiCreateRequest) => qsheEpiApi.create(req))
export const deleteEpi = createAsyncThunk('qsheEpi/delete', async (id: number) => { await qsheEpiApi.delete(id); return id })
export const fetchExpires = createAsyncThunk('qsheEpi/expires', () => qsheEpiApi.getExpires())
export const fetchStockBas = createAsyncThunk('qsheEpi/stockBas', () => qsheEpiApi.getStockBas())
export const fetchEpiSummary = createAsyncThunk('qsheEpi/summary', () => qsheEpiApi.getSummary())

const slice = createSlice({
  name: 'qsheEpi', initialState,
  reducers: { clearError: s => { s.error = null } },
  extraReducers: b => {
    b.addCase(fetchEpis.pending, s => { s.loading = true; s.error = null })
     .addCase(fetchEpis.fulfilled, (s, { payload: p }) => { s.loading = false; s.epis = p.content; s.totalElements = p.totalElements; s.totalPages = p.totalPages; s.currentPage = p.number })
     .addCase(fetchEpis.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? 'Erreur' })
     .addCase(createEpi.fulfilled, (s, { payload }) => { s.epis = [payload, ...s.epis] })
     .addCase(deleteEpi.fulfilled, (s, { payload: id }) => { s.epis = s.epis.filter(e => e.id !== id) })
     .addCase(fetchExpires.fulfilled, (s, { payload }) => { s.expires = payload })
     .addCase(fetchStockBas.fulfilled, (s, { payload }) => { s.stockBas = payload })
     .addCase(fetchEpiSummary.fulfilled, (s, { payload }) => { s.summary = payload })
  },
})
export const { clearError } = slice.actions
export default slice.reducer
