import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fournisseurApi } from '../../api/fournisseurApi'
import type { Fournisseur, Commande } from '../../types/fournisseur'

interface FournisseurState {
  fournisseurs: Fournisseur[]
  commandes: Commande[]
  totalFournisseurs: number
  totalCommandes: number
  loading: boolean
  error: string | null
}

const initialState: FournisseurState = {
  fournisseurs: [], commandes: [],
  totalFournisseurs: 0, totalCommandes: 0,
  loading: false, error: null,
}

export const fetchFournisseurs = createAsyncThunk('fournisseur/fetchAll', async (page?: number) => {
  return await fournisseurApi.getAll(page)
})

export const fetchCommandes = createAsyncThunk('fournisseur/fetchCommandes', async (page?: number) => {
  return await fournisseurApi.getAllCommandes(page)
})

export const createFournisseur = createAsyncThunk('fournisseur/create', async (data: { nom: string; adresse?: string; telephone?: string; email?: string; contactNom?: string; specialite?: string }) => {
  return await fournisseurApi.create(data)
})

export const deleteFournisseur = createAsyncThunk('fournisseur/delete', async (id: number) => {
  await fournisseurApi.delete(id); return id
})

const fournisseurSlice = createSlice({
  name: 'fournisseur',
  initialState,
  reducers: { clearError(state) { state.error = null } },
  extraReducers: (builder) => {
    builder.addCase(fetchFournisseurs.pending, (s) => { s.loading = true; s.error = null })
    builder.addCase(fetchFournisseurs.fulfilled, (s, a) => { s.fournisseurs = a.payload.content; s.totalFournisseurs = a.payload.totalElements; s.loading = false })
    builder.addCase(fetchFournisseurs.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Erreur' })

    builder.addCase(fetchCommandes.pending, (s) => { s.loading = true })
    builder.addCase(fetchCommandes.fulfilled, (s, a) => { s.commandes = a.payload.content; s.totalCommandes = a.payload.totalElements; s.loading = false })
    builder.addCase(fetchCommandes.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Erreur' })

    builder.addCase(createFournisseur.fulfilled, (s, a) => { s.fournisseurs.unshift(a.payload) })
    builder.addCase(deleteFournisseur.fulfilled, (s, a) => { s.fournisseurs = s.fournisseurs.filter(f => f.id !== a.payload) })
  },
})

export const { clearError } = fournisseurSlice.actions
export default fournisseurSlice.reducer
