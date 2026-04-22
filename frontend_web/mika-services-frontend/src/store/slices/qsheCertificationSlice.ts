import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { qsheCertificationApi } from '@/api/qsheCertificationApi'
import type { CertificationResponse, CertificationCreateRequest, CertificationSummaryResponse } from '@/types/qsheCertification'

interface State {
  certifications: CertificationResponse[]; expirant: CertificationResponse[]; summary: CertificationSummaryResponse | null
  totalElements: number; totalPages: number; currentPage: number; loading: boolean; error: string | null
}
const initialState: State = { certifications: [], expirant: [], summary: null, totalElements: 0, totalPages: 0, currentPage: 0, loading: false, error: null }

export const fetchCertificationsByUser = createAsyncThunk('qsheCert/fetchByUser', async ({ userId, page, size }: { userId: number; page?: number; size?: number }) => qsheCertificationApi.getByUser(userId, page, size))
export const createCertification = createAsyncThunk('qsheCert/create', (req: CertificationCreateRequest) => qsheCertificationApi.create(req))
export const deleteCertification = createAsyncThunk('qsheCert/delete', async (id: number) => { await qsheCertificationApi.delete(id); return id })
export const fetchExpirant = createAsyncThunk('qsheCert/expirant', (jours: number) => qsheCertificationApi.getExpirant(jours))
export const fetchCertSummary = createAsyncThunk('qsheCert/summary', () => qsheCertificationApi.getSummary())

const slice = createSlice({
  name: 'qsheCert', initialState,
  reducers: { clearError: s => { s.error = null } },
  extraReducers: b => {
    b.addCase(fetchCertificationsByUser.pending, s => { s.loading = true; s.error = null })
     .addCase(fetchCertificationsByUser.fulfilled, (s, { payload: p }) => { s.loading = false; s.certifications = p.content; s.totalElements = p.totalElements; s.totalPages = p.totalPages; s.currentPage = p.number })
     .addCase(fetchCertificationsByUser.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? 'Erreur' })
     .addCase(createCertification.fulfilled, (s, { payload }) => { s.certifications = [payload, ...s.certifications] })
     .addCase(deleteCertification.fulfilled, (s, { payload: id }) => { s.certifications = s.certifications.filter(c => c.id !== id) })
     .addCase(fetchExpirant.fulfilled, (s, { payload }) => { s.expirant = payload })
     .addCase(fetchCertSummary.fulfilled, (s, { payload }) => { s.summary = payload })
  },
})
export const { clearError } = slice.actions
export default slice.reducer
