import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { budgetApi } from '@/api/budgetApi'
import type { Depense, BudgetSummary, DepenseCreateRequest } from '@/types/budget'

interface BudgetState {
  depenses: Depense[]
  budgetSummary: BudgetSummary | null
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: BudgetState = {
  depenses: [], budgetSummary: null,
  totalElements: 0, totalPages: 0, currentPage: 0, loading: false, error: null,
}

export const fetchDepensesByProjet = createAsyncThunk(
  'budget/fetchDepensesByProjet',
  async ({ projetId, page = 0, size = 20 }: { projetId: number; page?: number; size?: number }) => {
    return await budgetApi.findDepensesByProjet(projetId, page, size)
  }
)

export const fetchBudgetSummary = createAsyncThunk(
  'budget/fetchSummary',
  async (projetId: number) => { return await budgetApi.getBudgetSummary(projetId) }
)

export const createDepense = createAsyncThunk(
  'budget/createDepense',
  async (data: DepenseCreateRequest) => { return await budgetApi.createDepense(data) }
)

export const deleteDepense = createAsyncThunk(
  'budget/deleteDepense',
  async (id: number) => { await budgetApi.deleteDepense(id); return id }
)

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    clearBudgetSummary: (state) => { state.budgetSummary = null },
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepensesByProjet.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchDepensesByProjet.fulfilled, (state, action) => {
        state.loading = false; state.depenses = action.payload.content
        state.totalElements = action.payload.totalElements; state.totalPages = action.payload.totalPages
        state.currentPage = action.payload.number
      })
      .addCase(fetchDepensesByProjet.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })
      .addCase(fetchBudgetSummary.fulfilled, (state, action) => { state.budgetSummary = action.payload })
      .addCase(deleteDepense.fulfilled, (state, action) => { state.depenses = state.depenses.filter((d) => d.id !== action.payload) })
  },
})

export const { clearBudgetSummary, clearError } = budgetSlice.actions
export default budgetSlice.reducer
