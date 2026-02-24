import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qualiteApi } from '../../api/qualiteApi'
import type {
  ControleQualite,
  ControleQualiteCreateRequest,
  ControleQualiteUpdateRequest,
  NonConformite,
  NonConformiteCreateRequest,
  NonConformiteUpdateRequest,
  QualiteSummary,
  PaginatedResponse,
} from '../../types/qualite'

interface QualiteState {
  controles: ControleQualite[]
  nonConformites: NonConformite[]
  ncEnRetard: NonConformite[]
  summary: QualiteSummary | null
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: QualiteState = {
  controles: [],
  nonConformites: [],
  ncEnRetard: [],
  summary: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
}

export const fetchControlesByProjet = createAsyncThunk(
  'qualite/fetchControles',
  async ({ projetId, page, size }: { projetId: number; page?: number; size?: number }) => {
    return await qualiteApi.getControlesByProjet(projetId, page, size)
  }
)

export const createControle = createAsyncThunk(
  'qualite/createControle',
  async (request: ControleQualiteCreateRequest) => {
    return await qualiteApi.createControle(request)
  }
)

export const updateControle = createAsyncThunk(
  'qualite/updateControle',
  async ({ id, request }: { id: number; request: ControleQualiteUpdateRequest }) => {
    return await qualiteApi.updateControle(id, request)
  }
)

export const deleteControle = createAsyncThunk(
  'qualite/deleteControle',
  async (id: number) => {
    await qualiteApi.deleteControle(id)
    return id
  }
)

export const fetchNcByControle = createAsyncThunk(
  'qualite/fetchNc',
  async ({ controleId, page, size }: { controleId: number; page?: number; size?: number }) => {
    return await qualiteApi.getNcByControle(controleId, page, size)
  }
)

export const fetchNcEnRetard = createAsyncThunk(
  'qualite/fetchNcEnRetard',
  async () => {
    return await qualiteApi.getNcEnRetard()
  }
)

export const createNonConformite = createAsyncThunk(
  'qualite/createNc',
  async (request: NonConformiteCreateRequest) => {
    return await qualiteApi.createNonConformite(request)
  }
)

export const updateNonConformite = createAsyncThunk(
  'qualite/updateNc',
  async ({ id, request }: { id: number; request: NonConformiteUpdateRequest }) => {
    return await qualiteApi.updateNonConformite(id, request)
  }
)

export const deleteNonConformite = createAsyncThunk(
  'qualite/deleteNc',
  async (id: number) => {
    await qualiteApi.deleteNonConformite(id)
    return id
  }
)

export const fetchQualiteSummary = createAsyncThunk(
  'qualite/fetchSummary',
  async (projetId: number) => {
    return await qualiteApi.getQualiteSummary(projetId)
  }
)

const qualiteSlice = createSlice({
  name: 'qualite',
  initialState,
  reducers: {
    clearError(state) { state.error = null },
  },
  extraReducers: (builder) => {
    // fetchControlesByProjet
    builder.addCase(fetchControlesByProjet.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchControlesByProjet.fulfilled, (state, action) => {
      const data = action.payload as PaginatedResponse<ControleQualite>
      state.controles = data.content
      state.totalElements = data.totalElements
      state.totalPages = data.totalPages
      state.currentPage = data.number
      state.loading = false
    })
    builder.addCase(fetchControlesByProjet.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

    // createControle
    builder.addCase(createControle.fulfilled, (state, action) => { state.controles.unshift(action.payload) })

    // updateControle
    builder.addCase(updateControle.fulfilled, (state, action) => {
      const idx = state.controles.findIndex(c => c.id === action.payload.id)
      if (idx !== -1) state.controles[idx] = action.payload
    })

    // deleteControle
    builder.addCase(deleteControle.fulfilled, (state, action) => {
      state.controles = state.controles.filter(c => c.id !== action.payload)
    })

    // fetchNcByControle
    builder.addCase(fetchNcByControle.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchNcByControle.fulfilled, (state, action) => {
      const data = action.payload as PaginatedResponse<NonConformite>
      state.nonConformites = data.content
      state.loading = false
    })
    builder.addCase(fetchNcByControle.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

    // fetchNcEnRetard
    builder.addCase(fetchNcEnRetard.fulfilled, (state, action) => { state.ncEnRetard = action.payload })

    // createNonConformite
    builder.addCase(createNonConformite.fulfilled, (state, action) => { state.nonConformites.unshift(action.payload) })

    // updateNonConformite
    builder.addCase(updateNonConformite.fulfilled, (state, action) => {
      const idx = state.nonConformites.findIndex(nc => nc.id === action.payload.id)
      if (idx !== -1) state.nonConformites[idx] = action.payload
    })

    // deleteNonConformite
    builder.addCase(deleteNonConformite.fulfilled, (state, action) => {
      state.nonConformites = state.nonConformites.filter(nc => nc.id !== action.payload)
    })

    // fetchQualiteSummary
    builder.addCase(fetchQualiteSummary.fulfilled, (state, action) => { state.summary = action.payload })
  },
})

export const { clearError } = qualiteSlice.actions
export default qualiteSlice.reducer
