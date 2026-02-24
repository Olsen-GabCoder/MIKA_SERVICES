import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { messageApi, notificationApi } from '../../api/communicationApi'
import type { Message, MessageCreateRequest, Notification, PaginatedResponse } from '../../types/communication'

interface CommunicationState {
  messagesRecus: Message[]
  messagesEnvoyes: Message[]
  conversation: Message[]
  notifications: Notification[]
  notificationsNonLues: Notification[]
  messagesNonLusCount: number
  notificationsNonLuesCount: number
  totalElements: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
}

const initialState: CommunicationState = {
  messagesRecus: [],
  messagesEnvoyes: [],
  conversation: [],
  notifications: [],
  notificationsNonLues: [],
  messagesNonLusCount: 0,
  notificationsNonLuesCount: 0,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
}

export const fetchMessagesRecus = createAsyncThunk(
  'communication/fetchRecus',
  async ({ userId, page, size }: { userId: number; page?: number; size?: number }) => {
    return await messageApi.getRecus(userId, page, size)
  }
)

export const fetchMessagesEnvoyes = createAsyncThunk(
  'communication/fetchEnvoyes',
  async ({ userId, page, size }: { userId: number; page?: number; size?: number }) => {
    return await messageApi.getEnvoyes(userId, page, size)
  }
)

export const fetchConversation = createAsyncThunk(
  'communication/fetchConversation',
  async ({ userId1, userId2 }: { userId1: number; userId2: number }) => {
    return await messageApi.getConversation(userId1, userId2)
  }
)

export const envoyerMessage = createAsyncThunk(
  'communication/envoyerMessage',
  async ({ expediteurId, request }: { expediteurId: number; request: MessageCreateRequest }) => {
    return await messageApi.envoyer(expediteurId, request)
  }
)

export const fetchMessagesNonLusCount = createAsyncThunk(
  'communication/fetchMsgNonLusCount',
  async (userId: number) => {
    return await messageApi.countNonLus(userId)
  }
)

export const fetchNotifications = createAsyncThunk(
  'communication/fetchNotifications',
  async ({ userId, page, size }: { userId: number; page?: number; size?: number }) => {
    return await notificationApi.getMesNotifications(userId, page, size)
  }
)

export const fetchNotificationsNonLues = createAsyncThunk(
  'communication/fetchNotifNonLues',
  async (userId: number) => {
    return await notificationApi.getNonLues(userId)
  }
)

export const fetchNotificationsNonLuesCount = createAsyncThunk(
  'communication/fetchNotifCount',
  async (userId: number) => {
    return await notificationApi.countNonLues(userId)
  }
)

export const marquerNotifLue = createAsyncThunk(
  'communication/marquerNotifLue',
  async ({ notifId, userId }: { notifId: number; userId: number }) => {
    return await notificationApi.marquerLue(notifId, userId)
  }
)

export const marquerToutesNotifLues = createAsyncThunk(
  'communication/marquerToutesLues',
  async (userId: number) => {
    await notificationApi.marquerToutesLues(userId)
    return userId
  }
)

const communicationSlice = createSlice({
  name: 'communication',
  initialState,
  reducers: {
    clearError(state) { state.error = null },
    addRealtimeMessage(state, action) {
      state.messagesRecus.unshift(action.payload)
      state.messagesNonLusCount += 1
    },
    addRealtimeNotification(state, action) {
      state.notificationsNonLues.unshift(action.payload)
      state.notificationsNonLuesCount += 1
    },
  },
  extraReducers: (builder) => {
    // Messages reçus
    builder.addCase(fetchMessagesRecus.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchMessagesRecus.fulfilled, (state, action) => {
      const data = action.payload as PaginatedResponse<Message>
      state.messagesRecus = data.content
      state.totalElements = data.totalElements
      state.totalPages = data.totalPages
      state.currentPage = data.number
      state.loading = false
    })
    builder.addCase(fetchMessagesRecus.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

    // Messages envoyés
    builder.addCase(fetchMessagesEnvoyes.fulfilled, (state, action) => {
      const data = action.payload as PaginatedResponse<Message>
      state.messagesEnvoyes = data.content
    })

    // Conversation
    builder.addCase(fetchConversation.fulfilled, (state, action) => {
      const data = action.payload as PaginatedResponse<Message>
      state.conversation = data.content
    })

    // Envoyer
    builder.addCase(envoyerMessage.fulfilled, (state, action) => {
      state.messagesEnvoyes.unshift(action.payload)
      state.conversation.push(action.payload)
    })

    // Compteurs
    builder.addCase(fetchMessagesNonLusCount.fulfilled, (state, action) => { state.messagesNonLusCount = action.payload })
    builder.addCase(fetchNotificationsNonLuesCount.fulfilled, (state, action) => { state.notificationsNonLuesCount = action.payload })

    // Notifications
    builder.addCase(fetchNotifications.pending, (state) => { state.loading = true })
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      const data = action.payload as PaginatedResponse<Notification>
      state.notifications = data.content
      state.totalElements = data.totalElements
      state.totalPages = data.totalPages
      state.currentPage = data.number
      state.loading = false
    })
    builder.addCase(fetchNotifications.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur' })

    builder.addCase(fetchNotificationsNonLues.fulfilled, (state, action) => { state.notificationsNonLues = action.payload })

    builder.addCase(marquerNotifLue.fulfilled, (state, action) => {
      const idx = state.notificationsNonLues.findIndex(n => n.id === action.payload.id)
      if (idx !== -1) state.notificationsNonLues.splice(idx, 1)
      state.notificationsNonLuesCount = Math.max(0, state.notificationsNonLuesCount - 1)
    })

    builder.addCase(marquerToutesNotifLues.fulfilled, (state) => {
      state.notificationsNonLues = []
      state.notificationsNonLuesCount = 0
    })
  },
})

export const { clearError, addRealtimeMessage, addRealtimeNotification } = communicationSlice.actions
export default communicationSlice.reducer
