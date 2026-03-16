import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { projetApi, clientApi } from '@/api/projetApi'
import type { ProjetListFilters, ProjetSortKey, SortDirection } from '@/api/projetApi'
import type {
  Projet, ProjetSummary, ProjetCreateRequest, ProjetUpdateRequest,
  Client, ClientCreateRequest, ClientUpdateRequest
} from '@/types/projet'
import type { PageResponse } from '@/types/projet'
import { getProjetsCache, setProjetsCache, clearProjetsCache } from '@/utils/offlineCache'
import { isNetworkError } from '@/utils/errorHandler'

/** Normalise le champ types pour l’affichage liste (API peut renvoyer type et/ou types). */
function normalizeProjetTypes(p: ProjetSummary): ProjetSummary {
  const types = p.types?.length ? p.types : (p.type ? [p.type] : [])
  return { ...p, types }
}

// ============================================
// State
// ============================================
interface ProjetState {
  projets: ProjetSummary[]
  /** Projets dont l'utilisateur connecté est responsable (pour Planning, réservé aux chefs de projet) */
  mesProjets: ProjetSummary[]
  projetDetail: Projet | null
  clients: Client[]
  totalElements: number
  totalPages: number
  currentPage: number
  /** Dernière page demandée (pending) : on n'applique fulfilled que si la réponse correspond (évite race conditions) */
  pendingListPage: number | null
  loading: boolean
  error: string | null
}

const initialState: ProjetState = {
  projets: [],
  mesProjets: [],
  projetDetail: null,
  clients: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  pendingListPage: null,
  loading: false,
  error: null,
}

// ============================================
// Async Thunks - Projets
// ============================================
export const fetchProjets = createAsyncThunk(
  'projet/fetchAll',
  async (
    arg: { page?: number; size?: number; sortBy?: ProjetSortKey; sortDir?: SortDirection } & ProjetListFilters = {},
    { rejectWithValue }
  ) => {
    const offline = typeof navigator !== 'undefined' && !navigator.onLine
    if (offline) {
      const cached = getProjetsCache()
      if (cached) return cached as PageResponse<ProjetSummary>
      return rejectWithValue('offline_no_cache')
    }
    const { page = 0, size = 20, sortBy, sortDir, ...filters } = arg
    const hasFilters = filters.statut != null || filters.type != null || filters.clientId != null || filters.responsableId != null
    const sort = sortBy && sortDir ? { sortBy, sortDir } : undefined
    try {
      const result = await projetApi.findAll(page, size, hasFilters ? filters : undefined, sort)
      setProjetsCache(result)
      return result
    } catch (e) {
      if (isNetworkError(e)) {
        const cached = getProjetsCache()
        if (cached) return cached as PageResponse<ProjetSummary>
      }
      throw e
    }
  }
)

export const fetchProjetById = createAsyncThunk(
  'projet/fetchById',
  async (id: number) => {
    return await projetApi.findById(id)
  }
)

export const searchProjets = createAsyncThunk(
  'projet/search',
  async (
    arg: { q: string; page?: number; size?: number; sortBy?: ProjetSortKey; sortDir?: SortDirection } & ProjetListFilters,
    { rejectWithValue }
  ) => {
    const offline = typeof navigator !== 'undefined' && !navigator.onLine
    if (offline) {
      const cached = getProjetsCache()
      if (cached) return cached as PageResponse<ProjetSummary>
      return rejectWithValue('offline_no_cache')
    }
    const { q, page = 0, size = 20, sortBy, sortDir, ...filters } = arg
    const hasFilters = filters.statut != null || filters.type != null || filters.clientId != null || filters.responsableId != null
    const sort = sortBy && sortDir ? { sortBy, sortDir } : undefined
    try {
      const result = await projetApi.search(q, page, size, hasFilters ? filters : undefined, sort)
      setProjetsCache(result)
      return result
    } catch (e) {
      if (isNetworkError(e)) {
        const cached = getProjetsCache()
        if (cached) return cached as PageResponse<ProjetSummary>
      }
      throw e
    }
  }
)

export const createProjet = createAsyncThunk(
  'projet/create',
  async (data: ProjetCreateRequest) => {
    const result = await projetApi.create(data)
    clearProjetsCache()
    return result
  }
)

export const updateProjet = createAsyncThunk(
  'projet/update',
  async ({ id, data }: { id: number; data: ProjetUpdateRequest }) => {
    const result = await projetApi.update(id, data)
    clearProjetsCache()
    return result
  }
)

export const deleteProjet = createAsyncThunk(
  'projet/delete',
  async (id: number) => {
    await projetApi.delete(id)
    clearProjetsCache()
    return id
  }
)

/** Projets où l'utilisateur est responsable (pour Planning : seuls les chefs de projet planifient leurs projets) */
export const fetchProjetsByResponsable = createAsyncThunk(
  'projet/fetchByResponsable',
  async (userId: number) => {
    return await projetApi.findByResponsable(userId)
  }
)

// ============================================
// Async Thunks - Clients
// ============================================
export const fetchClients = createAsyncThunk(
  'projet/fetchClients',
  async ({ page = 0, size = 100 }: { page?: number; size?: number } = {}) => {
    return await clientApi.findAll(page, size)
  }
)

export const createClient = createAsyncThunk(
  'projet/createClient',
  async (data: ClientCreateRequest) => {
    return await clientApi.create(data)
  }
)

export const updateClient = createAsyncThunk(
  'projet/updateClient',
  async ({ id, data }: { id: number; data: ClientUpdateRequest }) => {
    return await clientApi.update(id, data)
  }
)

// ============================================
// Slice
// ============================================
const projetSlice = createSlice({
  name: 'projet',
  initialState,
  reducers: {
    clearProjetDetail: (state) => {
      state.projetDetail = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch projets
      .addCase(fetchProjets.pending, (state, action) => {
        state.loading = true
        state.error = null
        const requestedPage = action.meta.arg.page ?? 0
        state.pendingListPage = requestedPage
        if (requestedPage !== state.currentPage) {
          state.projets = []
        }
      })
      .addCase(fetchProjets.fulfilled, (state, action) => {
        state.loading = false
        const requestedPage = state.pendingListPage ?? 0
        const responsePage = Number(action.payload?.number)
        if (Number.isNaN(responsePage) || responsePage !== requestedPage) {
          state.pendingListPage = null
          return
        }
        state.pendingListPage = null
        state.projets = (action.payload.content ?? []).map(normalizeProjetTypes)
        state.totalElements = Number(action.payload.totalElements) || 0
        state.totalPages = Math.max(0, Number(action.payload.totalPages) || 0)
        state.currentPage = responsePage >= 0 ? responsePage : 0
      })
      .addCase(fetchProjets.rejected, (state, action) => {
        state.loading = false
        state.pendingListPage = null
        state.error = (typeof action.payload === 'string' ? action.payload : action.error.message) || 'Erreur lors du chargement des projets'
      })
      // Fetch projet by ID
      .addCase(fetchProjetById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjetById.fulfilled, (state, action) => {
        state.loading = false
        const p = action.payload
        state.projetDetail = p.types?.length ? p : { ...p, types: p.type ? [p.type] : [] }
      })
      .addCase(fetchProjetById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Erreur lors du chargement du projet'
      })
      // Search projets
      .addCase(searchProjets.pending, (state, action) => {
        state.loading = true
        state.error = null
        const requestedPage = action.meta.arg.page ?? 0
        state.pendingListPage = requestedPage
        if (requestedPage !== state.currentPage) {
          state.projets = []
        }
      })
      .addCase(searchProjets.fulfilled, (state, action) => {
        state.loading = false
        const requestedPage = state.pendingListPage ?? 0
        const responsePage = Number(action.payload?.number)
        if (Number.isNaN(responsePage) || responsePage !== requestedPage) {
          state.pendingListPage = null
          return
        }
        state.pendingListPage = null
        state.projets = (action.payload.content ?? []).map(normalizeProjetTypes)
        state.totalElements = Number(action.payload.totalElements) || 0
        state.totalPages = Math.max(0, Number(action.payload.totalPages) || 0)
        state.currentPage = responsePage >= 0 ? responsePage : 0
      })
      .addCase(searchProjets.rejected, (state, action) => {
        state.loading = false
        state.pendingListPage = null
        state.error = (typeof action.payload === 'string' ? action.payload : action.error.message) || 'Erreur lors de la recherche'
      })
      // Create projet
      .addCase(createProjet.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(createProjet.rejected, (state, action) => {
        state.error = action.error.message || 'Erreur lors de la création du projet'
      })
      // Update projet
      .addCase(updateProjet.fulfilled, (state, action) => {
        const p = action.payload
        state.projetDetail = p.types?.length ? p : { ...p, types: p.type ? [p.type] : [] }
      })
      // Delete projet
      .addCase(deleteProjet.fulfilled, (state, action) => {
        state.projets = state.projets.filter((p) => p.id !== action.payload)
      })
      // Fetch projets par responsable (pour Planning)
      .addCase(fetchProjetsByResponsable.fulfilled, (state, action) => {
        state.mesProjets = (action.payload ?? []).map(normalizeProjetTypes)
      })
      .addCase(fetchProjetsByResponsable.rejected, (state) => {
        state.mesProjets = []
      })
      // Fetch clients
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.clients = action.payload.content
      })
      // Create client
      .addCase(createClient.fulfilled, (state, action) => {
        state.clients.push(action.payload)
      })
  },
})

export const { clearProjetDetail, clearError } = projetSlice.actions
export default projetSlice.reducer
