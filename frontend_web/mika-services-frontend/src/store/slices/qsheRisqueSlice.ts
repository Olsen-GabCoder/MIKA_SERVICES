import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { qsheRisqueApi } from '@/api/qsheRisqueApi'
import type { RisqueResponse, RisqueCreateRequest, RisqueUpdateRequest, RisqueSummaryResponse } from '@/types/qsheRisque'

interface State {
  risques: RisqueResponse[]; summary: RisqueSummaryResponse | null
  totalElements: number; totalPages: number; currentPage: number
  loading: boolean; error: string | null
}
const initialState: State = { risques: [], summary: null, totalElements: 0, totalPages: 0, currentPage: 0, loading: false, error: null }

export const fetchRisquesByProjet = createAsyncThunk('qsheRisque/fetchByProjet', async ({ projetId, page, size }: { projetId: number; page?: number; size?: number }) => qsheRisqueApi.getByProjet(projetId, page, size))
export const createRisque = createAsyncThunk('qsheRisque/create', (req: RisqueCreateRequest) => qsheRisqueApi.create(req))
export const updateRisque = createAsyncThunk('qsheRisque/update', ({ id, req }: { id: number; req: RisqueUpdateRequest }) => qsheRisqueApi.update(id, req))
export const deleteRisque = createAsyncThunk('qsheRisque/delete', async (id: number) => { await qsheRisqueApi.delete(id); return id })
export const fetchRisqueSummary = createAsyncThunk('qsheRisque/summary', (projetId: number) => qsheRisqueApi.getSummary(projetId))

const slice = createSlice({
  name: 'qsheRisque', initialState,
  reducers: { clearError: s => { s.error = null } },
  extraReducers: b => {
    b.addCase(fetchRisquesByProjet.pending, s => { s.loading = true; s.error = null })
     .addCase(fetchRisquesByProjet.fulfilled, (s, { payload: p }) => { s.loading = false; s.risques = p.content; s.totalElements = p.totalElements; s.totalPages = p.totalPages; s.currentPage = p.number })
     .addCase(fetchRisquesByProjet.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? 'Erreur' })
     .addCase(createRisque.fulfilled, (s, { payload }) => { s.risques = [payload, ...s.risques] })
     .addCase(updateRisque.fulfilled, (s, { payload }) => { s.risques = s.risques.map(r => r.id === payload.id ? payload : r) })
     .addCase(deleteRisque.fulfilled, (s, { payload: id }) => { s.risques = s.risques.filter(r => r.id !== id) })
     .addCase(fetchRisqueSummary.fulfilled, (s, { payload }) => { s.summary = payload })
  },
})
export const { clearError } = slice.actions
export default slice.reducer
