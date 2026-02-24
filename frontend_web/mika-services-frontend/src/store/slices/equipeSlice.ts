import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { equipeApi } from '@/api/chantierApi'
import type { Equipe, EquipeCreateRequest, EquipeUpdateRequest, PageResponse } from '@/types/chantier'

interface EquipeState {
  equipes: Equipe[]
  equipeDetail: Equipe | null
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: EquipeState = {
  equipes: [],
  equipeDetail: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
}

export const fetchEquipes = createAsyncThunk(
  'equipe/fetchAll',
  async ({ page = 0, size = 20 }: { page?: number; size?: number } = {}) => {
    return await equipeApi.findAll(page, size)
  }
)

export const fetchEquipeById = createAsyncThunk(
  'equipe/fetchById',
  async (id: number) => equipeApi.findById(id)
)

export const createEquipe = createAsyncThunk(
  'equipe/create',
  async (data: EquipeCreateRequest) => equipeApi.create(data)
)

export const updateEquipe = createAsyncThunk(
  'equipe/update',
  async ({ id, data }: { id: number; data: EquipeUpdateRequest }) => equipeApi.update(id, data)
)

export const deleteEquipe = createAsyncThunk(
  'equipe/delete',
  async (id: number) => {
    await equipeApi.delete(id)
    return id
  }
)

const equipeSlice = createSlice({
  name: 'equipe',
  initialState,
  reducers: {
    clearEquipeDetail: (state) => {
      state.equipeDetail = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEquipes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEquipes.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload as PageResponse<Equipe>
        state.equipes = payload.content
        state.totalElements = payload.totalElements
        state.totalPages = payload.totalPages
        state.currentPage = payload.number
      })
      .addCase(fetchEquipes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Erreur'
      })
      .addCase(fetchEquipeById.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchEquipeById.fulfilled, (state, action) => {
        state.loading = false
        state.equipeDetail = action.payload
      })
      .addCase(fetchEquipeById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Erreur'
      })
      .addCase(createEquipe.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createEquipe.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(createEquipe.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Erreur'
      })
      .addCase(updateEquipe.pending, (state) => {
        state.loading = true
      })
      .addCase(updateEquipe.fulfilled, (state, action) => {
        state.loading = false
        state.equipeDetail = action.payload
      })
      .addCase(updateEquipe.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Erreur'
      })
      .addCase(deleteEquipe.fulfilled, (state, action) => {
        state.equipes = state.equipes.filter((e) => e.id !== action.payload)
      })
  },
})

export const { clearEquipeDetail, clearError } = equipeSlice.actions
export default equipeSlice.reducer
