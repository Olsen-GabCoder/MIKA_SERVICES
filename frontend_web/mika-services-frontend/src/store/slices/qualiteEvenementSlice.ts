import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qualiteEvenementApi } from '@/api/qualiteEvenementApi'
import type {
  EvenementQualiteListResponse,
  EvenementQualiteResponse,
  EvenementQualiteCreateRequest,
  TypeEvenement,
  StatutEvenement,
} from '@/types/qualiteEvenement'

interface State {
  evenements: EvenementQualiteListResponse[]
  current: EvenementQualiteResponse | null
  stats: Record<string, number>
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: State = {
  evenements: [],
  current: null,
  stats: {},
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
}

export const fetchEvenements = createAsyncThunk(
  'qualiteEvenement/fetchAll',
  async ({ projetId, page, size, type, statut }: {
    projetId?: number; page?: number; size?: number;
    type?: TypeEvenement; statut?: StatutEvenement
  }) => qualiteEvenementApi.getAll(page, size, projetId, type, statut)
)

export const fetchEvenementsByProjet = createAsyncThunk(
  'qualiteEvenement/fetchByProjet',
  async ({ projetId, page, size, type, statut }: {
    projetId: number; page?: number; size?: number;
    type?: TypeEvenement; statut?: StatutEvenement
  }) => qualiteEvenementApi.getByProjet(projetId, page, size, type, statut)
)

export const fetchEvenementById = createAsyncThunk(
  'qualiteEvenement/fetchById',
  async (id: number) => qualiteEvenementApi.getById(id)
)

export const createEvenement = createAsyncThunk(
  'qualiteEvenement/create',
  async (req: EvenementQualiteCreateRequest) => qualiteEvenementApi.create(req)
)

export const deleteEvenement = createAsyncThunk(
  'qualiteEvenement/delete',
  async (id: number) => { await qualiteEvenementApi.delete(id); return id }
)

export const fetchEvenementStats = createAsyncThunk(
  'qualiteEvenement/fetchStats',
  async (projetId?: number) => qualiteEvenementApi.getStats(projetId)
)

const slice = createSlice({
  name: 'qualiteEvenement',
  initialState,
  reducers: {
    clearError(state) { state.error = null },
    clearCurrent(state) { state.current = null },
    setCurrent(state, action) { state.current = action.payload },
  },
  extraReducers: (b) => {
    b.addCase(fetchEvenements.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchEvenements.fulfilled, (s, a) => {
      s.loading = false
      s.evenements = a.payload.content
      s.totalElements = a.payload.totalElements
      s.totalPages = a.payload.totalPages
      s.currentPage = a.payload.number
    })
    b.addCase(fetchEvenements.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(fetchEvenementsByProjet.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchEvenementsByProjet.fulfilled, (s, a) => {
      s.loading = false
      s.evenements = a.payload.content
      s.totalElements = a.payload.totalElements
      s.totalPages = a.payload.totalPages
      s.currentPage = a.payload.number
    })
    b.addCase(fetchEvenementsByProjet.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(fetchEvenementById.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchEvenementById.fulfilled, (s, a) => { s.loading = false; s.current = a.payload })
    b.addCase(fetchEvenementById.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(createEvenement.fulfilled, (s, a) => {
      s.evenements.unshift(a.payload as unknown as EvenementQualiteListResponse)
    })

    b.addCase(deleteEvenement.fulfilled, (s, a) => {
      s.evenements = s.evenements.filter(e => e.id !== a.payload)
      if (s.current?.id === a.payload) s.current = null
    })

    b.addCase(fetchEvenementStats.fulfilled, (s, a) => { s.stats = a.payload })
  },
})

export const { clearError, clearCurrent, setCurrent } = slice.actions
export default slice.reducer
