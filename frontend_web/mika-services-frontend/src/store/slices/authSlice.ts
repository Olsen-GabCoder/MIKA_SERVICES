import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/types'
import { authApi, isLogin2FAPending } from '@/api/authApi'
import type { LoginRequest } from '@/api/authApi'
import { getAccessToken, setAccessToken, removeAccessToken } from '@/utils/tokenStorage'
import { setCurrentUserCache, getCurrentUserCache, clearCurrentUserCache } from '@/utils/offlineCache'
import { isNetworkError } from '@/utils/errorHandler'

/** État intermédiaire après login quand 2FA est requis */
export interface TwoFactorPending {
  tempToken: string
  rememberMe: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  /** Non null si le login a renvoyé requires2FA : il faut appeler verify2FA avec le code */
  twoFactorPending: TwoFactorPending | null
}

const initialState: AuthState = {
  user: null,
  accessToken: getAccessToken(),
  refreshToken: null,
  isAuthenticated: !!getAccessToken(),
  isLoading: false,
  error: null,
  twoFactorPending: null,
}

// Async thunks
export const fetchUserFromToken = createAsyncThunk(
  'auth/fetchUserFromToken',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.getMe()
      setCurrentUserCache(user)
      return user
    } catch (error) {
      if (isNetworkError(error)) {
        const cached = getCurrentUserCache() as User | null
        if (cached) return cached
      }
      return rejectWithValue(error)
    }
  }
)

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials)
      return response
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
      if (axiosErr.response?.status === 429) {
        return rejectWithValue({ code: 'RATE_LIMIT' as const })
      }
      if (axiosErr.response?.status === 423) {
        return rejectWithValue({ code: 'ACCOUNT_LOCKED' as const })
      }
      throw err
    }
  }
)

export const verify2FA = createAsyncThunk(
  'auth/verify2FA',
  async (payload: { tempToken: string; code: string; rememberMe?: boolean }) => {
    const response = await authApi.verify2FA(payload.tempToken, payload.code, payload.rememberMe ?? false)
    return response
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async () => {
    const response = await authApi.refreshToken()
    return response
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    await authApi.logout()
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string; refreshToken?: string }>) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken ?? null
      state.isAuthenticated = true
      state.error = null
      setAccessToken(action.payload.accessToken)
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      state.twoFactorPending = null
      removeAccessToken()
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
    },
    clearTwoFactorPending: (state) => {
      state.twoFactorPending = null
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false
      if (isLogin2FAPending(action.payload)) {
        state.twoFactorPending = { tempToken: action.payload.tempToken, rememberMe: (action.meta.arg as LoginRequest).rememberMe ?? false }
        state.user = null
        state.accessToken = null
        state.isAuthenticated = false
      } else {
        state.twoFactorPending = null
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = null
        state.isAuthenticated = true
        setCurrentUserCache(action.payload.user)
      }
    })
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false
      state.twoFactorPending = null
      const payload = action.payload as { code?: string } | undefined
      state.error =
        payload?.code === 'RATE_LIMIT'
          ? 'RATE_LIMIT'
          : payload?.code === 'ACCOUNT_LOCKED'
            ? 'ACCOUNT_LOCKED'
            : action.error.message || 'Erreur de connexion'
      state.isAuthenticated = false
    })

    // Verify 2FA (après login quand 2FA activé)
    builder.addCase(verify2FA.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(verify2FA.fulfilled, (state, action) => {
      state.isLoading = false
      state.twoFactorPending = null
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = null
      state.isAuthenticated = true
      setCurrentUserCache(action.payload.user)
    })
    builder.addCase(verify2FA.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.error.message || 'Code 2FA invalide'
    })

    // Refresh token
    builder.addCase(refreshToken.fulfilled, (state, action) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = null
      state.user = action.payload.user
      setCurrentUserCache(action.payload.user)
    })

    // Restaurer l'utilisateur au rechargement (token présent mais user null)
    builder.addCase(fetchUserFromToken.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(fetchUserFromToken.fulfilled, (state, action) => {
      state.isLoading = false
      state.user = action.payload
    })
    builder.addCase(fetchUserFromToken.rejected, (state, action) => {
      state.isLoading = false
      // Si le serveur est juste injoignable, garder la session intacte
      const err = action.payload as { code?: string; response?: { status?: number } } | undefined
      const isNetwork = !err?.response?.status
      if (isNetwork && state.accessToken) {
        return
      }
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      removeAccessToken()
    })

    // Refresh token — ne jamais casser la session si le serveur est injoignable
    builder.addCase(refreshToken.rejected, () => {
      // no-op : garder l'état intact, le prochain refresh résoudra
    })

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.twoFactorPending = null
      clearCurrentUserCache()
    })
  },
})

export const { setCredentials, logout, setError, clearError, setUser, clearTwoFactorPending } = authSlice.actions
export default authSlice.reducer
