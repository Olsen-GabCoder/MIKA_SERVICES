import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { ReplayResult } from '@/utils/offlineQueue'

interface SyncState {
  isReplaying: boolean
  lastReplayResult: ReplayResult | null
}

const initialState: SyncState = {
  isReplaying: false,
  lastReplayResult: null,
}

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    replayStarted(state) {
      state.isReplaying = true
    },
    replayFinished(state, action: PayloadAction<ReplayResult>) {
      state.isReplaying = false
      state.lastReplayResult = action.payload
    },
  },
})

export const { replayStarted, replayFinished } = syncSlice.actions
export default syncSlice.reducer
