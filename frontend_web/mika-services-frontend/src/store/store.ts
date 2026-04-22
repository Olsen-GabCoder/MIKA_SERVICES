import { configureStore } from '@reduxjs/toolkit'
import { notificationSoundMiddleware } from './middleware/notificationSoundMiddleware'
import { offlineQueueMiddleware } from './middleware/offlineQueueMiddleware'
import authReducer from './slices/authSlice'
import userReducer from './slices/userSlice'
import projetReducer from './slices/projetSlice'
import equipeReducer from './slices/equipeSlice'
import enginReducer from './slices/enginSlice'
import mouvementEnginReducer from './slices/mouvementEnginSlice'
import demandeMaterielReducer from './slices/demandeMaterielSlice'
import materiauReducer from './slices/materiauSlice'
import budgetReducer from './slices/budgetSlice'
import planningReducer from './slices/planningSlice'
import qsheIncidentReducer from './slices/qsheIncidentSlice'
import qsheInspectionReducer from './slices/qsheInspectionSlice'
import qsheRisqueReducer from './slices/qsheRisqueSlice'
import qsheCertificationReducer from './slices/qsheCertificationSlice'
import qsheEpiReducer from './slices/qsheEpiSlice'
import qsheCauserieReducer from './slices/qsheCauserieSlice'
import qshePermisReducer from './slices/qshePermisSlice'
import qualiteReceptionReducer from './slices/qualiteReceptionSlice'
import qualiteEssaiLaboReducer from './slices/qualiteEssaiLaboSlice'
import qualiteLeveeTopoReducer from './slices/qualiteLeveeTopoSlice'
import qualiteAgrementReducer from './slices/qualiteAgrementSlice'
import qualiteEvenementReducer from './slices/qualiteEvenementSlice'
import qualiteDocumentReducer from './slices/qualiteDocumentSlice'
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
    mouvementEngin: mouvementEnginReducer,
    demandeMateriel: demandeMaterielReducer,
    materiau: materiauReducer,
    budget: budgetReducer,
    planning: planningReducer,
    qsheIncident: qsheIncidentReducer,
    qsheInspection: qsheInspectionReducer,
    qsheRisque: qsheRisqueReducer,
    qsheCertification: qsheCertificationReducer,
    qsheEpi: qsheEpiReducer,
    qsheCauserie: qsheCauserieReducer,
    qshePermis: qshePermisReducer,
    qualiteReception: qualiteReceptionReducer,
    qualiteEssaiLabo: qualiteEssaiLaboReducer,
    qualiteLeveeTopo: qualiteLeveeTopoReducer,
    qualiteAgrement: qualiteAgrementReducer,
    qualiteEvenement: qualiteEvenementReducer,
    qualiteDocument: qualiteDocumentReducer,
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
    }).concat(notificationSoundMiddleware, offlineQueueMiddleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
