import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { enginApi } from '@/api/enginApi'
import type { EnginSummary, Engin, EnginCreateRequest } from '@/types/materiel'

interface EnginState {
  engins: EnginSummary[]
  enginDetail: Engin | null
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: EnginState = {
  engins: [], enginDetail: null, totalElements: 0, totalPages: 0, currentPage: 0, loading: false, error: null,
}

export const fetchEngins = createAsyncThunk('engin/fetchAll', async ({ page = 0, size = 20 }: { page?: number; size?: number } = {}) => {
  return await enginApi.findAll(page, size)
})

export const fetchEnginById = createAsyncThunk('engin/fetchById', async (id: number) => { return await enginApi.findById(id) })

export const createEngin = createAsyncThunk('engin/create', async (data: EnginCreateRequest) => { return await enginApi.create(data) })

export const deleteEngin = createAsyncThunk('engin/delete', async (id: number) => { await enginApi.delete(id); return id })

const enginSlice = createSlice({
  name: 'engin',
  initialState,
  reducers: {
    clearEnginDetail: (state) => { state.enginDetail = null },
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEngins.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchEngins.fulfilled, (state, action) => {
        state.loading = false; state.engins = action.payload.content
        state.totalElements = action.payload.totalElements; state.totalPages = action.payload.totalPages
        state.currentPage = action.payload.number
      })
      .addCase(fetchEngins.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })
      .addCase(fetchEnginById.fulfilled, (state, action) => { state.loading = false; state.enginDetail = action.payload })
      .addCase(deleteEngin.fulfilled, (state, action) => { state.engins = state.engins.filter((e) => e.id !== action.payload) })
  },
})

export const { clearEnginDetail, clearError } = enginSlice.actions
export default enginSlice.reducer
