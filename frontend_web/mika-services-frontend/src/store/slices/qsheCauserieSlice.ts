import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { qsheCauserieApi } from '@/api/qsheCauserieApi'
import type { CauserieResponse, CauserieCreateRequest, CauserieSummaryResponse } from '@/types/qsheCauserie'

interface State {
  causeries: CauserieResponse[]; summary: CauserieSummaryResponse | null
  totalElements: number; totalPages: number; currentPage: number; loading: boolean; error: string | null
}
const initialState: State = { causeries: [], summary: null, totalElements: 0, totalPages: 0, currentPage: 0, loading: false, error: null }

export const fetchCauseriesByProjet = createAsyncThunk('qsheCauserie/fetchByProjet', async ({ projetId, page, size }: { projetId: number; page?: number; size?: number }) => qsheCauserieApi.getByProjet(projetId, page, size))
export const createCauserie = createAsyncThunk('qsheCauserie/create', (req: CauserieCreateRequest) => qsheCauserieApi.create(req))
export const deleteCauserie = createAsyncThunk('qsheCauserie/delete', async (id: number) => { await qsheCauserieApi.delete(id); return id })
export const fetchCauserieSummary = createAsyncThunk('qsheCauserie/summary', (projetId: number) => qsheCauserieApi.getSummary(projetId))

const slice = createSlice({
  name: 'qsheCauserie', initialState,
  reducers: { clearError: s => { s.error = null } },
  extraReducers: b => {
    b.addCase(fetchCauseriesByProjet.pending, s => { s.loading = true; s.error = null })
     .addCase(fetchCauseriesByProjet.fulfilled, (s, { payload: p }) => { s.loading = false; s.causeries = p.content; s.totalElements = p.totalElements; s.totalPages = p.totalPages; s.currentPage = p.number })
     .addCase(fetchCauseriesByProjet.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? 'Erreur' })
     .addCase(createCauserie.fulfilled, (s, { payload }) => { s.causeries = [payload, ...s.causeries] })
     .addCase(deleteCauserie.fulfilled, (s, { payload: id }) => { s.causeries = s.causeries.filter(c => c.id !== id) })
     .addCase(fetchCauserieSummary.fulfilled, (s, { payload }) => { s.summary = payload })
  },
})
export const { clearError } = slice.actions
export default slice.reducer
