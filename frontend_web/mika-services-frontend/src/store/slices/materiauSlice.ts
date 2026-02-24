import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { materiauApi } from '@/api/materiauApi'
import type { MateriauSummary, Materiau, MateriauCreateRequest } from '@/types/materiel'

interface MateriauState {
  materiaux: MateriauSummary[]
  materiauDetail: Materiau | null
  stockBasList: MateriauSummary[]
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: MateriauState = {
  materiaux: [], materiauDetail: null, stockBasList: [],
  totalElements: 0, totalPages: 0, currentPage: 0, loading: false, error: null,
}

export const fetchMateriaux = createAsyncThunk('materiau/fetchAll', async ({ page = 0, size = 20 }: { page?: number; size?: number } = {}) => {
  return await materiauApi.findAll(page, size)
})

export const fetchMateriauById = createAsyncThunk('materiau/fetchById', async (id: number) => { return await materiauApi.findById(id) })

export const fetchStockBas = createAsyncThunk('materiau/fetchStockBas', async () => { return await materiauApi.findStockBas() })

export const createMateriau = createAsyncThunk('materiau/create', async (data: MateriauCreateRequest) => { return await materiauApi.create(data) })

export const deleteMateriau = createAsyncThunk('materiau/delete', async (id: number) => { await materiauApi.delete(id); return id })

const materiauSlice = createSlice({
  name: 'materiau',
  initialState,
  reducers: {
    clearMateriauDetail: (state) => { state.materiauDetail = null },
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMateriaux.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchMateriaux.fulfilled, (state, action) => {
        state.loading = false; state.materiaux = action.payload.content
        state.totalElements = action.payload.totalElements; state.totalPages = action.payload.totalPages
        state.currentPage = action.payload.number
      })
      .addCase(fetchMateriaux.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })
      .addCase(fetchMateriauById.fulfilled, (state, action) => { state.materiauDetail = action.payload })
      .addCase(fetchStockBas.fulfilled, (state, action) => { state.stockBasList = action.payload })
      .addCase(deleteMateriau.fulfilled, (state, action) => { state.materiaux = state.materiaux.filter((m) => m.id !== action.payload) })
  },
})

export const { clearMateriauDetail, clearError } = materiauSlice.actions
export default materiauSlice.reducer
