import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/types'
import type { RootState } from '@/store/store'
import { userApi } from '@/api/userApi'
import type { UserCreateRequest, UserUpdateRequest, UserGetAllParams } from '@/api/userApi'
import type { PaginatedResponse } from '@/api/userApi'
import { handleApiError, isNetworkError } from '@/utils/errorHandler'
import { getUsersCache, getUsersCacheIfValid, setUsersCache, clearUsersCache, CACHE_DURATION_MS } from '@/utils/offlineCache'
import { logoutUser } from './authSlice'

interface UserState {
  users: User[]
  currentUser: User | null
  selectedUser: User | null
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  search: string
  actifFilter: boolean | null
  roleIdFilter: number | null
  sort: string
  isLoading: boolean
  error: string | null
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  selectedUser: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  pageSize: 20,
  search: '',
  actifFilter: null,
  roleIdFilter: null,
  sort: 'nom,asc',
  isLoading: false,
  error: null,
}

// Async thunks
export interface FetchUsersParams extends Partial<UserGetAllParams> {
  page?: number
  size?: number
}

function isUnfilteredListRequest(params: FetchUsersParams): boolean {
  return (
    params.search === undefined &&
    params.actif === undefined &&
    params.roleId === undefined
  )
}

export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (params: FetchUsersParams = {}, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const cacheDuration = state.ui.cacheDuration
    const offline = typeof navigator !== 'undefined' && !navigator.onLine
    const unfiltered = isUnfilteredListRequest(params)

    if (offline) {
      const cached = getUsersCache()
      if (cached) return cached as PaginatedResponse<User>
      return rejectWithValue('offline_no_cache')
    }
    if (!unfiltered) {
      const maxAgeMs = CACHE_DURATION_MS[cacheDuration as keyof typeof CACHE_DURATION_MS]
      const cached = getUsersCacheIfValid(maxAgeMs)
      if (cached) return cached as PaginatedResponse<User>
    }
    try {
      const response = await userApi.getAll(params)
      setUsersCache(response)
      return response
    } catch (e) {
      if (isNetworkError(e)) {
        const cached = getUsersCache()
        if (cached) return cached as PaginatedResponse<User>
      }
      throw e
    }
  }
)

export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (id: number) => {
    const user = await userApi.getById(id)
    return user
  }
)

export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async () => {
    const user = await userApi.getMe()
    return user
  }
)

export const createUser = createAsyncThunk(
  'user/createUser',
  async (data: UserCreateRequest, { rejectWithValue }) => {
    try {
      const user = await userApi.create(data)
      clearUsersCache()
      return user
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const updateUser = createAsyncThunk(
  'user/updateUser',
  async ({ id, data }: { id: number; data: UserUpdateRequest }, { rejectWithValue }) => {
    try {
      const user = await userApi.update(id, data)
      clearUsersCache()
      return user
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (id: number, { rejectWithValue }) => {
    try {
      await userApi.delete(id)
      clearUsersCache()
      return id
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload
    },
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload
    },
    setActifFilter: (state, action: PayloadAction<boolean | null>) => {
      state.actifFilter = action.payload
    },
    setRoleIdFilter: (state, action: PayloadAction<number | null>) => {
      state.roleIdFilter = action.payload
    },
    setSort: (state, action: PayloadAction<string>) => {
      state.sort = action.payload
    },
    setFilters: (state, action: PayloadAction<{ search?: string; actif?: boolean | null; roleId?: number | null; sort?: string }>) => {
      if (action.payload.search !== undefined) state.search = action.payload.search
      if (action.payload.actif !== undefined) state.actifFilter = action.payload.actif
      if (action.payload.roleId !== undefined) state.roleIdFilter = action.payload.roleId
      if (action.payload.sort !== undefined) state.sort = action.payload.sort
    },
  },
  extraReducers: (builder) => {
    // Fetch users
    builder.addCase(fetchUsers.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.isLoading = false
      state.users = action.payload.content
      state.totalElements = action.payload.totalElements
      state.totalPages = action.payload.totalPages
      state.currentPage = action.payload.number
    })
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.isLoading = false
      state.error = (typeof action.payload === 'string' ? action.payload : action.error.message) || 'Erreur lors du chargement des utilisateurs'
    })

    // Fetch user by ID
    builder.addCase(fetchUserById.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(fetchUserById.fulfilled, (state, action) => {
      state.isLoading = false
      state.selectedUser = action.payload
    })
    builder.addCase(fetchUserById.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.error.message || 'Erreur lors du chargement de l\'utilisateur'
    })

    // Fetch current user
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.currentUser = action.payload
    })

    // Create user
    builder.addCase(createUser.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(createUser.fulfilled, (state, action) => {
      state.isLoading = false
      state.users.push(action.payload)
    })
    builder.addCase(createUser.rejected, (state, action) => {
      state.isLoading = false
      state.error = (action.payload as string) || action.error.message || 'Erreur lors de la création de l\'utilisateur'
    })

    // Update user
    builder.addCase(updateUser.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.isLoading = false
      const index = state.users.findIndex(u => u.id === action.payload.id)
      if (index !== -1) {
        state.users[index] = action.payload
      }
      if (state.selectedUser?.id === action.payload.id) {
        state.selectedUser = action.payload
      }
      if (state.currentUser?.id === action.payload.id) {
        state.currentUser = action.payload
      }
    })
    builder.addCase(updateUser.rejected, (state, action) => {
      state.isLoading = false
      state.error = (action.payload as string) || action.error.message || 'Erreur lors de la mise à jour de l\'utilisateur'
    })

    // Delete user
    builder.addCase(deleteUser.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.isLoading = false
      state.users = state.users.filter(u => u.id !== action.payload)
      if (state.selectedUser?.id === action.payload) {
        state.selectedUser = null
      }
    })
    builder.addCase(deleteUser.rejected, (state, action) => {
      state.isLoading = false
      state.error = (action.payload as string) || action.error.message || 'Erreur lors de la suppression de l\'utilisateur'
    })

    // Reset currentUser on logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.currentUser = null
      state.selectedUser = null
    })
  },
})

export const {
  setCurrentUser,
  setSelectedUser,
  clearError,
  setPage,
  setPageSize,
  setSearch,
  setActifFilter,
  setRoleIdFilter,
  setSort,
  setFilters,
} = userSlice.actions
export default userSlice.reducer
