import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qualiteEssaiLaboApi } from '@/api/qualiteEssaiLaboApi'
import type {
  EssaiLaboBetonResponse,
  EssaiLaboBetonCreateRequest,
  EssaiLaboBetonUpdateRequest,
} from '@/types/qualiteEssaiLabo'

interface State {
  essais: EssaiLaboBetonResponse[]
  current: EssaiLaboBetonResponse | null
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: State = {
  essais: [],
  current: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
}

export const fetchEssais = createAsyncThunk(
  'qualiteEssaiLabo/fetchAll',
  async ({ projetId, page, size }: {
    projetId?: number; page?: number; size?: number
  }) => qualiteEssaiLaboApi.getAll({ projetId, page, size })
)

export const fetchEssaisByProjet = createAsyncThunk(
  'qualiteEssaiLabo/fetchByProjet',
  async ({ projetId, page, size }: { projetId: number; page?: number; size?: number }) =>
    qualiteEssaiLaboApi.getByProjet(projetId, page, size)
)

export const fetchEssaiByProjetAndMois = createAsyncThunk(
  'qualiteEssaiLabo/fetchByProjetAndMois',
  async ({ projetId, mois }: { projetId: number; mois: string }) =>
    qualiteEssaiLaboApi.getByProjetAndMois(projetId, mois)
)

export const createEssai = createAsyncThunk(
  'qualiteEssaiLabo/create',
  async (req: EssaiLaboBetonCreateRequest) => qualiteEssaiLaboApi.create(req)
)

export const updateEssai = createAsyncThunk(
  'qualiteEssaiLabo/update',
  async ({ id, req }: { id: number; req: EssaiLaboBetonUpdateRequest }) =>
    qualiteEssaiLaboApi.update(id, req)
)

export const deleteEssai = createAsyncThunk(
  'qualiteEssaiLabo/delete',
  async (id: number) => { await qualiteEssaiLaboApi.delete(id); return id }
)

const slice = createSlice({
  name: 'qualiteEssaiLabo',
  initialState,
  reducers: {
    clearError(state) { state.error = null },
    clearCurrent(state) { state.current = null },
  },
  extraReducers: (b) => {
    b.addCase(fetchEssais.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchEssais.fulfilled, (s, a) => {
      s.loading = false
      s.essais = a.payload.content
      s.totalElements = a.payload.totalElements
      s.totalPages = a.payload.totalPages
      s.currentPage = a.payload.number
    })
    b.addCase(fetchEssais.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(fetchEssaisByProjet.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchEssaisByProjet.fulfilled, (s, a) => {
      s.loading = false
      s.essais = a.payload.content
      s.totalElements = a.payload.totalElements
      s.totalPages = a.payload.totalPages
      s.currentPage = a.payload.number
    })
    b.addCase(fetchEssaisByProjet.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(fetchEssaiByProjetAndMois.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchEssaiByProjetAndMois.fulfilled, (s, a) => {
      s.loading = false
      s.current = a.payload
    })
    b.addCase(fetchEssaiByProjetAndMois.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(createEssai.fulfilled, (s, a) => { s.essais.unshift(a.payload); s.current = a.payload })

    b.addCase(updateEssai.fulfilled, (s, a) => {
      const idx = s.essais.findIndex(e => e.id === a.payload.id)
      if (idx !== -1) s.essais[idx] = a.payload
      s.current = a.payload
    })

    b.addCase(deleteEssai.fulfilled, (s, a) => {
      s.essais = s.essais.filter(e => e.id !== a.payload)
      if (s.current?.id === a.payload) s.current = null
    })
  },
})

export const { clearError, clearCurrent } = slice.actions
export default slice.reducer
