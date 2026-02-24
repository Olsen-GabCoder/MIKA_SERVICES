import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { documentApi } from '../../api/documentApi'
import type { DocumentFile, PaginatedResponse } from '../../types/document'
import { TypeDocument } from '../../types/document'

interface DocumentState {
  documents: DocumentFile[]
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  uploading: boolean
  error: string | null
}

const initialState: DocumentState = {
  documents: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  uploading: false,
  error: null,
}

export const fetchDocuments = createAsyncThunk(
  'document/fetchAll',
  async ({ page, size }: { page?: number; size?: number }) => {
    return await documentApi.getAll(page, size)
  }
)

export const fetchDocumentsByProjet = createAsyncThunk(
  'document/fetchByProjet',
  async ({ projetId, page, size }: { projetId: number; page?: number; size?: number }) => {
    return await documentApi.getByProjet(projetId, page, size)
  }
)

export const uploadDocument = createAsyncThunk(
  'document/upload',
  async (params: { file: File; typeDocument: TypeDocument; description?: string; projetId?: number; userId?: number }) => {
    return await documentApi.upload(params.file, params.typeDocument, params.description, params.projetId, params.userId)
  }
)

export const deleteDocument = createAsyncThunk(
  'document/delete',
  async (id: number) => {
    await documentApi.delete(id)
    return id
  }
)

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    clearError(state) { state.error = null },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDocuments.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchDocuments.fulfilled, (state, action) => {
      const data = action.payload as PaginatedResponse<DocumentFile>
      state.documents = data.content
      state.totalElements = data.totalElements
      state.totalPages = data.totalPages
      state.currentPage = data.number
      state.loading = false
    })
    builder.addCase(fetchDocuments.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

    builder.addCase(fetchDocumentsByProjet.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchDocumentsByProjet.fulfilled, (state, action) => {
      const data = action.payload as PaginatedResponse<DocumentFile>
      state.documents = data.content
      state.totalElements = data.totalElements
      state.totalPages = data.totalPages
      state.currentPage = data.number
      state.loading = false
    })
    builder.addCase(fetchDocumentsByProjet.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

    builder.addCase(uploadDocument.pending, (state) => { state.uploading = true; state.error = null })
    builder.addCase(uploadDocument.fulfilled, (state, action) => { state.documents.unshift(action.payload); state.uploading = false })
    builder.addCase(uploadDocument.rejected, (state, action) => { state.uploading = false; state.error = action.error.message || 'Erreur' })

    builder.addCase(deleteDocument.fulfilled, (state, action) => {
      state.documents = state.documents.filter(d => d.id !== action.payload)
    })
  },
})

export const { clearError } = documentSlice.actions
export default documentSlice.reducer
