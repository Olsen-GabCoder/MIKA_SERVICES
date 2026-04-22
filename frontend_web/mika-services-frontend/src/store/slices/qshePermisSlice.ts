import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { qshePermisApi } from '@/api/qshePermisApi'
import type { PermisTravailResponse, PermisTravailCreateRequest, PermisTravailSummaryResponse } from '@/types/qshePermis'

interface State {
  permis: PermisTravailResponse[]; summary: PermisTravailSummaryResponse | null
  totalElements: number; totalPages: number; currentPage: number; loading: boolean; error: string | null
}
const initialState: State = { permis: [], summary: null, totalElements: 0, totalPages: 0, currentPage: 0, loading: false, error: null }

export const fetchPermisByProjet = createAsyncThunk('qshePermis/fetchByProjet', async ({ projetId, page, size }: { projetId: number; page?: number; size?: number }) => qshePermisApi.getByProjet(projetId, page, size))
export const createPermis = createAsyncThunk('qshePermis/create', (req: PermisTravailCreateRequest) => qshePermisApi.create(req))
export const deletePermis = createAsyncThunk('qshePermis/delete', async (id: number) => { await qshePermisApi.delete(id); return id })
export const fetchPermisSummary = createAsyncThunk('qshePermis/summary', (projetId: number) => qshePermisApi.getSummary(projetId))

const slice = createSlice({
  name: 'qshePermis', initialState,
  reducers: { clearError: s => { s.error = null } },
  extraReducers: b => {
    b.addCase(fetchPermisByProjet.pending, s => { s.loading = true; s.error = null })
     .addCase(fetchPermisByProjet.fulfilled, (s, { payload: p }) => { s.loading = false; s.permis = p.content; s.totalElements = p.totalElements; s.totalPages = p.totalPages; s.currentPage = p.number })
     .addCase(fetchPermisByProjet.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? 'Erreur' })
     .addCase(createPermis.fulfilled, (s, { payload }) => { s.permis = [payload, ...s.permis] })
     .addCase(deletePermis.fulfilled, (s, { payload: id }) => { s.permis = s.permis.filter(p => p.id !== id) })
     .addCase(fetchPermisSummary.fulfilled, (s, { payload }) => { s.summary = payload })
  },
})
export const { clearError } = slice.actions
export default slice.reducer
