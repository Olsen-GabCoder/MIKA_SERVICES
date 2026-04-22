import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { qsheInspectionApi } from '@/api/qsheInspectionApi'
import type { InspectionResponse, InspectionCreateRequest, InspectionUpdateRequest, ChecklistTemplateResponse } from '@/types/qsheInspection'

interface State {
  inspections: InspectionResponse[]
  selected: InspectionResponse | null
  templates: ChecklistTemplateResponse[]
  totalElements: number; totalPages: number; currentPage: number
  loading: boolean; error: string | null
}

const initialState: State = {
  inspections: [], selected: null, templates: [],
  totalElements: 0, totalPages: 0, currentPage: 0, loading: false, error: null,
}

export const fetchInspectionsByProjet = createAsyncThunk(
  'qsheInspection/fetchByProjet',
  async ({ projetId, page, size }: { projetId: number; page?: number; size?: number }) =>
    qsheInspectionApi.getByProjet(projetId, page, size)
)
export const fetchInspectionById = createAsyncThunk('qsheInspection/fetchById', (id: number) => qsheInspectionApi.getById(id))
export const createInspection = createAsyncThunk('qsheInspection/create', (req: InspectionCreateRequest) => qsheInspectionApi.create(req))
export const updateInspection = createAsyncThunk('qsheInspection/update', ({ id, req }: { id: number; req: InspectionUpdateRequest }) => qsheInspectionApi.update(id, req))
export const deleteInspection = createAsyncThunk('qsheInspection/delete', async (id: number) => { await qsheInspectionApi.delete(id); return id })
export const fetchTemplates = createAsyncThunk('qsheInspection/fetchTemplates', () => qsheInspectionApi.getTemplates())

const slice = createSlice({
  name: 'qsheInspection', initialState,
  reducers: { clearError: s => { s.error = null }, clearSelected: s => { s.selected = null } },
  extraReducers: b => {
    b.addCase(fetchInspectionsByProjet.pending, s => { s.loading = true; s.error = null })
     .addCase(fetchInspectionsByProjet.fulfilled, (s, { payload: p }) => {
       s.loading = false; s.inspections = p.content; s.totalElements = p.totalElements; s.totalPages = p.totalPages; s.currentPage = p.number
     })
     .addCase(fetchInspectionsByProjet.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? 'Erreur' })
     .addCase(fetchInspectionById.fulfilled, (s, { payload }) => { s.selected = payload })
     .addCase(createInspection.fulfilled, (s, { payload }) => { s.inspections = [payload, ...s.inspections] })
     .addCase(updateInspection.fulfilled, (s, { payload }) => {
       s.inspections = s.inspections.map(i => i.id === payload.id ? payload : i)
       if (s.selected?.id === payload.id) s.selected = payload
     })
     .addCase(deleteInspection.fulfilled, (s, { payload: id }) => { s.inspections = s.inspections.filter(i => i.id !== id) })
     .addCase(fetchTemplates.fulfilled, (s, { payload }) => { s.templates = payload })
  },
})

export const { clearError, clearSelected } = slice.actions
export default slice.reducer
