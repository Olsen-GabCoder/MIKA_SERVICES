import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import userReducer from './slices/userSlice'
import projetReducer from './slices/projetSlice'
import equipeReducer from './slices/equipeSlice'
import enginReducer from './slices/enginSlice'
import materiauReducer from './slices/materiauSlice'
import budgetReducer from './slices/budgetSlice'
import planningReducer from './slices/planningSlice'
import qualiteReducer from './slices/qualiteSlice'
import securiteReducer from './slices/securiteSlice'
import communicationReducer from './slices/communicationSlice'
import reportingReducer from './slices/reportingSlice'
import documentReducer from './slices/documentSlice'
import fournisseurReducer from './slices/fournisseurSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    projet: projetReducer,
    equipe: equipeReducer,
    engin: enginReducer,
    materiau: materiauReducer,
    budget: budgetReducer,
    planning: planningReducer,
    qualite: qualiteReducer,
    securite: securiteReducer,
    communication: communicationReducer,
    reporting: reportingReducer,
    document: documentReducer,
    fournisseur: fournisseurReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
