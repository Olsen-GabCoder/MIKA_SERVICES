import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qualiteDocumentApi } from '@/api/qualiteDocumentApi'
import type {
  DocumentQualiteListResponse,
  DocumentQualiteResponse,
  DocumentQualiteUpdateRequest,
} from '@/types/qualiteDocument'

interface State {
  documents: DocumentQualiteListResponse[]
  current: DocumentQualiteResponse | null
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: State = {
  documents: [],
  current: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
}

export const fetchDocuments = createAsyncThunk(
  'qualiteDocument/fetchAll',
  async ({ page, size, actifsOnly }: { page?: number; size?: number; actifsOnly?: boolean }) =>
    qualiteDocumentApi.getAll(page, size, actifsOnly)
)

export const fetchDocumentById = createAsyncThunk(
  'qualiteDocument/fetchById',
  async (id: number) => qualiteDocumentApi.getById(id)
)

export const createDocument = createAsyncThunk(
  'qualiteDocument/create',
  async (params: { titre: string; description?: string; file?: File }) =>
    qualiteDocumentApi.create(params)
)

export const updateDocument = createAsyncThunk(
  'qualiteDocument/update',
  async ({ id, req }: { id: number; req: DocumentQualiteUpdateRequest }) =>
    qualiteDocumentApi.update(id, req)
)

export const deleteDocument = createAsyncThunk(
  'qualiteDocument/delete',
  async (id: number) => { await qualiteDocumentApi.delete(id); return id }
)

const slice = createSlice({
  name: 'qualiteDocument',
  initialState,
  reducers: {
    clearError(state) { state.error = null },
    clearCurrent(state) { state.current = null },
  },
  extraReducers: (b) => {
    b.addCase(fetchDocuments.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(fetchDocuments.fulfilled, (s, a) => {
      s.loading = false
      s.documents = a.payload.content
      s.totalElements = a.payload.totalElements
      s.totalPages = a.payload.totalPages
      s.currentPage = a.payload.number
    })
    b.addCase(fetchDocuments.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Erreur' })

    b.addCase(fetchDocumentById.fulfilled, (s, a) => { s.current = a.payload })

    b.addCase(createDocument.fulfilled, (s, a) => {
      s.documents.unshift(a.payload as unknown as DocumentQualiteListResponse)
    })

    b.addCase(updateDocument.fulfilled, (s, a) => {
      const idx = s.documents.findIndex(d => d.id === a.payload.id)
      if (idx !== -1) {
        s.documents[idx] = a.payload as unknown as DocumentQualiteListResponse
      }
      s.current = a.payload
    })

    b.addCase(deleteDocument.fulfilled, (s, a) => {
      s.documents = s.documents.filter(d => d.id !== a.payload)
      if (s.current?.id === a.payload) s.current = null
    })
  },
})

export const { clearError, clearCurrent } = slice.actions
export default slice.reducer
