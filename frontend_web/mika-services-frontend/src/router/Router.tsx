import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { APP_TARGET } from '@/appTarget'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import App from '@/App'

const ProfilePage = lazy(() => import('@/features/user/pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const ParametresPage = lazy(() => import('@/features/user/pages/ParametresPage').then(m => ({ default: m.ParametresPage })))
const UsersOrganisationPage = lazy(() => import('@/features/user/pages/UsersOrganisationPage').then(m => ({ default: m.UsersOrganisationPage })))
const UserDetailPage = lazy(() => import('@/features/user/pages/UserDetailPage').then(m => ({ default: m.UserDetailPage })))
const ProjetListPage = lazy(() => import('@/features/projet/pages/ProjetListPage').then(m => ({ default: m.ProjetListPage })))
const ProjetDetailPage = lazy(() => import('@/features/projet/pages/ProjetDetailPage').then(m => ({ default: m.ProjetDetailPage })))
const ProjetHistoriquePage = lazy(() => import('@/features/projet/pages/ProjetHistoriquePage').then(m => ({ default: m.ProjetHistoriquePage })))
const ProjetFormPage = lazy(() => import('@/features/projet/pages/ProjetFormPage').then(m => ({ default: m.ProjetFormPage })))
const ProjetDqePage = lazy(() => import('@/features/projet/pages/ProjetDqePage').then(m => ({ default: m.ProjetDqePage })))
const ProjetDocumentsPage = lazy(() => import('@/features/projet/pages/ProjetDocumentsPage'))
const EquipeListPage = lazy(() => import('@/features/equipe/pages/EquipeListPage').then(m => ({ default: m.EquipeListPage })))
const EquipeFormPage = lazy(() => import('@/features/equipe/pages/EquipeFormPage').then(m => ({ default: m.EquipeFormPage })))
const EquipeDetailPage = lazy(() => import('@/features/equipe/pages/EquipeDetailPage').then(m => ({ default: m.EquipeDetailPage })))
const EnginListPage = lazy(() => import('@/features/materiel/pages/EnginListPage').then(m => ({ default: m.EnginListPage })))
const EnginDetailPage = lazy(() => import('@/features/materiel/pages/EnginDetailPage').then(m => ({ default: m.EnginDetailPage })))
const MouvementEnginListPage = lazy(() => import('@/features/materiel/pages/MouvementEnginListPage').then(m => ({ default: m.MouvementEnginListPage })))
const MateriauListPage = lazy(() => import('@/features/materiel/pages/MateriauListPage').then(m => ({ default: m.MateriauListPage })))
const AuditTerrainPage = lazy(() => import('@/features/materiel/pages/AuditTerrainPage').then(m => ({ default: m.AuditTerrainPage })))
const DemandeMaterielListPage = lazy(() => import('@/features/materiel/pages/DemandeMaterielListPage').then(m => ({ default: m.DemandeMaterielListPage })))
const DemandeMaterielFormPage = lazy(() => import('@/features/materiel/pages/DemandeMaterielFormPage').then(m => ({ default: m.DemandeMaterielFormPage })))
const DemandeMaterielDetailPage = lazy(() => import('@/features/materiel/pages/DemandeMaterielDetailPage').then(m => ({ default: m.DemandeMaterielDetailPage })))
const BudgetPage = lazy(() => import('@/features/budget/pages/BudgetPage').then(m => ({ default: m.BudgetPage })))
const PlanningPage = lazy(() => import('@/features/planning/pages/PlanningPage'))
const QualiteReceptionsPage = lazy(() => import('@/features/qualite/pages/ReceptionsTravauxPage'))
const QualiteEssaisLaboPage = lazy(() => import('@/features/qualite/pages/EssaisLaboBetonPage'))
const QualiteLeveeTopoPage = lazy(() => import('@/features/qualite/pages/LeveeTopoPage'))
const QualiteAgrementsPage = lazy(() => import('@/features/qualite/pages/AgrementsPage'))
const QualiteEvenementsPage = lazy(() => import('@/features/qualite/pages/EvenementsPage'))
const QualiteEvenementDetailPage = lazy(() => import('@/features/qualite/pages/EvenementDetailPage'))
const QualiteDocumentsPage = lazy(() => import('@/features/qualite/pages/DocumentsQualitePage'))
const QualiteSynthesePage = lazy(() => import('@/features/qualite/pages/SyntheseMensuellePage'))
const QsheIncidentsPage = lazy(() => import('@/features/qshe/pages/IncidentsPage'))
const QsheDashboardPage = lazy(() => import('@/features/qshe/pages/QsheDashboardPage'))
const QsheInspectionsPage = lazy(() => import('@/features/qshe/pages/InspectionsPage'))
const QsheRisquesPage = lazy(() => import('@/features/qshe/pages/RisquesPage'))
const QsheFormationsPage = lazy(() => import('@/features/qshe/pages/FormationsPage'))
const QsheEpiPage = lazy(() => import('@/features/qshe/pages/EpiPage'))
const QsheCauseriesPage = lazy(() => import('@/features/qshe/pages/CauseriesPage'))
const QshePermisPage = lazy(() => import('@/features/qshe/pages/PermisPage'))
const QsheEnvPage = lazy(() => import('@/features/qshe/pages/EnvironnementPage'))
const QsheFdsPage = lazy(() => import('@/features/qshe/pages/ProduitsChimiquesPage'))
const MessageriePage = lazy(() => import('@/features/communication/pages/MessageriePage'))
const NotificationsPage = lazy(() => import('@/features/communication/pages/NotificationsPage'))
const DocumentPage = lazy(() => import('@/features/document/pages/DocumentPage'))
const FournisseurPage = lazy(() => import('@/features/fournisseur/pages/FournisseurPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const ReunionHebdoListPage = lazy(() => import('@/features/reunionhebdo/pages/ReunionHebdoListPage').then(m => ({ default: m.ReunionHebdoListPage })))
const ReunionHebdoFormPage = lazy(() => import('@/features/reunionhebdo/pages/ReunionHebdoFormPage').then(m => ({ default: m.ReunionHebdoFormPage })))
const ReunionHebdoPVPage = lazy(() => import('@/features/reunionhebdo/pages/ReunionHebdoPVPage').then(m => ({ default: m.ReunionHebdoPVPage })))
const SalleReunionPage = lazy(() => import('@/features/sallereunion/pages/SalleReunionPage').then(m => ({ default: m.SalleReunionPage })))
const SalleMikaLayout = lazy(() => import('@/features/sallereunion/layouts/SalleMikaLayout').then(m => ({ default: m.SalleMikaLayout })))
const RedirectWithId = lazy(() => import('@/features/sallereunion/components/RedirectWithId').then(m => ({ default: m.RedirectWithId })))
const ActivityTrackingPage = lazy(() => import('@/features/user/pages/ActivityTrackingPage').then(m => ({ default: m.ActivityTrackingPage })))
const NotFoundPage = lazy(() => import('@/features/errors/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const ReportingPage = lazy(() => import('@/features/reporting/pages/ReportingPage'))
const BaremePage = lazy(() => import('@/features/bareme/pages/BaremePage').then(m => ({ default: m.BaremePage })))
const BaremeArticleDetailPage = lazy(() => import('@/features/bareme/pages/BaremeArticleDetailPage').then(m => ({ default: m.BaremeArticleDetailPage })))
const BaremeArticleCreatePage = lazy(() => import('@/features/bareme/pages/BaremeArticleCreatePage').then(m => ({ default: m.BaremeArticleCreatePage })))
const BaremeArticleEditPage = lazy(() => import('@/features/bareme/pages/BaremeArticleEditPage').then(m => ({ default: m.BaremeArticleEditPage })))
const TerrainAppPage = lazy(() => import('@/features/terrain/pages/TerrainAppPage').then(m => ({ default: m.TerrainAppPage })))

const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-[#FF6B35] rounded-full animate-spin" />
  </div>
)

function L({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LazyFallback />}>{children}</Suspense>
}

// Build terrain : uniquement l'app mobile, tout le reste redirige vers /terrain.
const terrainRoutes = [
  {
    path: '/terrain/*',
    element: <L><TerrainAppPage /></L>,
  },
  {
    path: '*',
    element: <Navigate to="/terrain" replace />,
  },
]

const webRoutes = [
  {
    path: '/login',
    element: (
      <ProtectedRoute requireAuth={false}>
        <LoginPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <ProtectedRoute requireAuth={false}>
        <ForgotPasswordPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <ProtectedRoute requireAuth={false}>
        <ResetPasswordPage />
      </ProtectedRoute>
    ),
  },
  // ── Application mobile terrain (dev local uniquement — en prod, site séparé mika-terrain) ─────
  ...(APP_TARGET === 'full'
    ? [{ path: '/terrain/*', element: <L><TerrainAppPage /></L> }]
    : []),
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <ProtectedRoute><L><DashboardPage /></L></ProtectedRoute>,
      },
      {
        path: 'profile',
        element: <ProtectedRoute><L><ProfilePage /></L></ProtectedRoute>,
      },
      {
        path: 'parametres',
        element: <ProtectedRoute><L><ParametresPage /></L></ProtectedRoute>,
      },
      {
        path: 'users',
        element: <ProtectedRoute requireAdmin><L><UsersOrganisationPage /></L></ProtectedRoute>,
      },
      {
        path: 'users/:id',
        element: <ProtectedRoute requireAdmin><L><UserDetailPage /></L></ProtectedRoute>,
      },
      {
        path: 'projets',
        element: <ProtectedRoute><L><ProjetListPage /></L></ProtectedRoute>,
      },
      {
        path: 'projets/nouveau',
        element: <ProtectedRoute requireAdmin><L><ProjetFormPage /></L></ProtectedRoute>,
      },
      {
        path: 'projets/:id/historique',
        element: <ProtectedRoute><L><ProjetHistoriquePage /></L></ProtectedRoute>,
      },
      {
        path: 'projets/:id',
        element: <ProtectedRoute><L><ProjetDetailPage /></L></ProtectedRoute>,
      },
      {
        path: 'projets/:id/dqe',
        element: <ProtectedRoute><L><ProjetDqePage /></L></ProtectedRoute>,
      },
      {
        path: 'projets/:id/documents',
        element: <ProtectedRoute><L><ProjetDocumentsPage /></L></ProtectedRoute>,
      },
      {
        path: 'projets/:id/edit',
        element: <ProtectedRoute><L><ProjetFormPage /></L></ProtectedRoute>,
      },
      // ── Salle MIKA (visio + PV) ──────────────────────────────
      {
        path: 'salle-mika',
        element: <ProtectedRoute><L><SalleMikaLayout /></L></ProtectedRoute>,
        children: [
          { index: true, element: <SalleReunionPage /> },
          { path: 'pv', element: <ReunionHebdoListPage /> },
          { path: 'pv/nouveau', element: <ReunionHebdoFormPage /> },
          { path: 'pv/:id', element: <ReunionHebdoPVPage /> },
          { path: 'pv/:id/edit', element: <ReunionHebdoFormPage /> },
        ],
      },
      // ── Redirections legacy /reunions-hebdo → /salle-mika ──
      { path: 'reunions-hebdo', element: <Navigate to="/salle-mika/pv" replace /> },
      { path: 'reunions-hebdo/salle', element: <Navigate to="/salle-mika" replace /> },
      { path: 'reunions-hebdo/nouveau', element: <Navigate to="/salle-mika/pv/nouveau" replace /> },
      { path: 'reunions-hebdo/:id', element: <L><RedirectWithId toBase="/salle-mika/pv" /></L> },
      { path: 'reunions-hebdo/:id/edit', element: <L><RedirectWithId toBase="/salle-mika/pv" suffix="/edit" /></L> },
      {
        path: 'equipes',
        element: <ProtectedRoute><L><EquipeListPage /></L></ProtectedRoute>,
      },
      {
        path: 'equipes/nouveau',
        element: <ProtectedRoute><L><EquipeFormPage /></L></ProtectedRoute>,
      },
      {
        path: 'equipes/:id',
        element: <ProtectedRoute><L><EquipeDetailPage /></L></ProtectedRoute>,
      },
      {
        path: 'equipes/:id/edit',
        element: <ProtectedRoute><L><EquipeFormPage /></L></ProtectedRoute>,
      },
      {
        path: 'engins',
        element: <ProtectedRoute><L><EnginListPage /></L></ProtectedRoute>,
      },
      {
        path: 'engins/:id',
        element: <ProtectedRoute><L><EnginDetailPage /></L></ProtectedRoute>,
      },
      {
        path: 'mouvements',
        element: <ProtectedRoute><L><MouvementEnginListPage /></L></ProtectedRoute>,
      },
      {
        path: 'audit-terrain',
        element: <ProtectedRoute><L><AuditTerrainPage /></L></ProtectedRoute>,
      },
      {
        path: 'dma',
        element: <ProtectedRoute><L><DemandeMaterielListPage /></L></ProtectedRoute>,
      },
      {
        path: 'dma/new',
        element: <ProtectedRoute><L><DemandeMaterielFormPage /></L></ProtectedRoute>,
      },
      {
        path: 'dma/:id',
        element: <ProtectedRoute><L><DemandeMaterielDetailPage /></L></ProtectedRoute>,
      },
      {
        path: 'materiaux',
        element: <ProtectedRoute><L><MateriauListPage /></L></ProtectedRoute>,
      },
      {
        path: 'budget',
        element: <ProtectedRoute><L><BudgetPage /></L></ProtectedRoute>,
      },
      {
        path: 'planning',
        element: <ProtectedRoute><L><PlanningPage /></L></ProtectedRoute>,
      },
      {
        path: 'qualite/receptions',
        element: <ProtectedRoute><L><QualiteReceptionsPage /></L></ProtectedRoute>,
      },
      {
        path: 'qualite/essais-labo',
        element: <ProtectedRoute><L><QualiteEssaisLaboPage /></L></ProtectedRoute>,
      },
      {
        path: 'qualite/levees-topo',
        element: <ProtectedRoute><L><QualiteLeveeTopoPage /></L></ProtectedRoute>,
      },
      {
        path: 'qualite/agrements',
        element: <ProtectedRoute><L><QualiteAgrementsPage /></L></ProtectedRoute>,
      },
      {
        path: 'qualite/evenements',
        element: <ProtectedRoute><L><QualiteEvenementsPage /></L></ProtectedRoute>,
      },
      {
        path: 'qualite/evenements/:id',
        element: <ProtectedRoute><L><QualiteEvenementDetailPage /></L></ProtectedRoute>,
      },
      {
        path: 'qualite/synthese',
        element: <ProtectedRoute><L><QualiteSynthesePage /></L></ProtectedRoute>,
      },
      {
        path: 'qualite/documents',
        element: <ProtectedRoute><L><QualiteDocumentsPage /></L></ProtectedRoute>,
      },
      {
        path: 'qshe',
        element: <ProtectedRoute><L><QsheDashboardPage /></L></ProtectedRoute>,
      },
      {
        path: 'qshe/dashboard',
        element: <ProtectedRoute><L><QsheDashboardPage /></L></ProtectedRoute>,
      },
      {
        path: 'qshe/incidents',
        element: <ProtectedRoute><L><QsheIncidentsPage /></L></ProtectedRoute>,
      },
      {
        path: 'qshe/inspections',
        element: <ProtectedRoute><L><QsheInspectionsPage /></L></ProtectedRoute>,
      },
      {
        path: 'qshe/risques',
        element: <ProtectedRoute><L><QsheRisquesPage /></L></ProtectedRoute>,
      },
      {
        path: 'qshe/formations',
        element: <ProtectedRoute><L><QsheFormationsPage /></L></ProtectedRoute>,
      },
      {
        path: 'qshe/epi',
        element: <ProtectedRoute><L><QsheEpiPage /></L></ProtectedRoute>,
      },
      {
        path: 'qshe/causeries',
        element: <ProtectedRoute><L><QsheCauseriesPage /></L></ProtectedRoute>,
      },
      {
        path: 'qshe/permis',
        element: <ProtectedRoute><L><QshePermisPage /></L></ProtectedRoute>,
      },
      {
        path: 'qshe/environnement',
        element: <ProtectedRoute><L><QsheEnvPage /></L></ProtectedRoute>,
      },
      {
        path: 'qshe/produits-chimiques',
        element: <ProtectedRoute><L><QsheFdsPage /></L></ProtectedRoute>,
      },
      {
        path: 'messagerie',
        element: <ProtectedRoute><L><MessageriePage /></L></ProtectedRoute>,
      },
      {
        path: 'notifications',
        element: <ProtectedRoute><L><NotificationsPage /></L></ProtectedRoute>,
      },
      {
        path: 'reporting',
        element: <ProtectedRoute><L><ReportingPage /></L></ProtectedRoute>,
      },
      {
        path: 'documents',
        element: <ProtectedRoute><L><DocumentPage /></L></ProtectedRoute>,
      },
      {
        path: 'fournisseurs',
        element: <ProtectedRoute><L><FournisseurPage /></L></ProtectedRoute>,
      },
      {
        path: 'bareme',
        element: <ProtectedRoute><L><BaremePage /></L></ProtectedRoute>,
      },
      {
        path: 'bareme/articles/:id',
        element: <ProtectedRoute><L><BaremeArticleDetailPage /></L></ProtectedRoute>,
      },
      {
        path: 'bareme/articles/nouveau',
        element: <ProtectedRoute requireAdmin><L><BaremeArticleCreatePage /></L></ProtectedRoute>,
      },
      {
        path: 'bareme/articles/:id/edit',
        element: <ProtectedRoute requireAdmin><L><BaremeArticleEditPage /></L></ProtectedRoute>,
      },
      {
        path: 'suivi-activite',
        element: <ProtectedRoute requireAdmin><L><ActivityTrackingPage /></L></ProtectedRoute>,
      },
      {
        path: '*',
        element: <ProtectedRoute><L><NotFoundPage /></L></ProtectedRoute>,
      },
    ],
  },
]

const router = createBrowserRouter(APP_TARGET === 'terrain' ? terrainRoutes : webRoutes)

export const AppRouter = () => {
  return <RouterProvider router={router} />
}
