import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import App from '@/App'

const ProfilePage = lazy(() => import('@/features/user/pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const ParametresPage = lazy(() => import('@/features/user/pages/ParametresPage').then(m => ({ default: m.ParametresPage })))
const UserManagementPage = lazy(() => import('@/features/user/pages/UserManagementPage').then(m => ({ default: m.UserManagementPage })))
const UserDetailPage = lazy(() => import('@/features/user/pages/UserDetailPage').then(m => ({ default: m.UserDetailPage })))
const ProjetListPage = lazy(() => import('@/features/projet/pages/ProjetListPage').then(m => ({ default: m.ProjetListPage })))
const ProjetDetailPage = lazy(() => import('@/features/projet/pages/ProjetDetailPage').then(m => ({ default: m.ProjetDetailPage })))
const ProjetHistoriquePage = lazy(() => import('@/features/projet/pages/ProjetHistoriquePage').then(m => ({ default: m.ProjetHistoriquePage })))
const ProjetFormPage = lazy(() => import('@/features/projet/pages/ProjetFormPage').then(m => ({ default: m.ProjetFormPage })))
const EquipeListPage = lazy(() => import('@/features/equipe/pages/EquipeListPage').then(m => ({ default: m.EquipeListPage })))
const EquipeFormPage = lazy(() => import('@/features/equipe/pages/EquipeFormPage').then(m => ({ default: m.EquipeFormPage })))
const EquipeDetailPage = lazy(() => import('@/features/equipe/pages/EquipeDetailPage').then(m => ({ default: m.EquipeDetailPage })))
const EnginListPage = lazy(() => import('@/features/materiel/pages/EnginListPage').then(m => ({ default: m.EnginListPage })))
const MateriauListPage = lazy(() => import('@/features/materiel/pages/MateriauListPage').then(m => ({ default: m.MateriauListPage })))
const BudgetPage = lazy(() => import('@/features/budget/pages/BudgetPage').then(m => ({ default: m.BudgetPage })))
const PlanningPage = lazy(() => import('@/features/planning/pages/PlanningPage'))
const QualitePage = lazy(() => import('@/features/qualite/pages/QualitePage'))
const SecuritePage = lazy(() => import('@/features/securite/pages/SecuritePage'))
const MessageriePage = lazy(() => import('@/features/communication/pages/MessageriePage'))
const NotificationsPage = lazy(() => import('@/features/communication/pages/NotificationsPage'))
const DocumentPage = lazy(() => import('@/features/document/pages/DocumentPage'))
const FournisseurPage = lazy(() => import('@/features/fournisseur/pages/FournisseurPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const ReunionHebdoListPage = lazy(() => import('@/features/reunionhebdo/pages/ReunionHebdoListPage').then(m => ({ default: m.ReunionHebdoListPage })))
const ReunionHebdoFormPage = lazy(() => import('@/features/reunionhebdo/pages/ReunionHebdoFormPage').then(m => ({ default: m.ReunionHebdoFormPage })))
const ReunionHebdoPVPage = lazy(() => import('@/features/reunionhebdo/pages/ReunionHebdoPVPage').then(m => ({ default: m.ReunionHebdoPVPage })))
const ActivityTrackingPage = lazy(() => import('@/features/user/pages/ActivityTrackingPage').then(m => ({ default: m.ActivityTrackingPage })))
const NotFoundPage = lazy(() => import('@/features/errors/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const ReportingPage = lazy(() => import('@/features/reporting/pages/ReportingPage'))
const BaremePage = lazy(() => import('@/features/bareme/pages/BaremePage').then(m => ({ default: m.BaremePage })))
const BaremeArticleDetailPage = lazy(() => import('@/features/bareme/pages/BaremeArticleDetailPage').then(m => ({ default: m.BaremeArticleDetailPage })))

const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-[#FF6B35] rounded-full animate-spin" />
  </div>
)

function L({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LazyFallback />}>{children}</Suspense>
}

const router = createBrowserRouter([
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
        element: <ProtectedRoute requireAdmin><L><UserManagementPage /></L></ProtectedRoute>,
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
        path: 'projets/:id/edit',
        element: <ProtectedRoute><L><ProjetFormPage /></L></ProtectedRoute>,
      },
      {
        path: 'reunions-hebdo',
        element: <ProtectedRoute><L><ReunionHebdoListPage /></L></ProtectedRoute>,
      },
      {
        path: 'reunions-hebdo/nouveau',
        element: <ProtectedRoute><L><ReunionHebdoFormPage /></L></ProtectedRoute>,
      },
      {
        path: 'reunions-hebdo/:id',
        element: <ProtectedRoute><L><ReunionHebdoPVPage /></L></ProtectedRoute>,
      },
      {
        path: 'reunions-hebdo/:id/edit',
        element: <ProtectedRoute><L><ReunionHebdoFormPage /></L></ProtectedRoute>,
      },
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
        path: 'qualite',
        element: <ProtectedRoute><L><QualitePage /></L></ProtectedRoute>,
      },
      {
        path: 'securite',
        element: <ProtectedRoute><L><SecuritePage /></L></ProtectedRoute>,
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
        path: 'suivi-activite',
        element: <ProtectedRoute requireAdmin><L><ActivityTrackingPage /></L></ProtectedRoute>,
      },
      {
        path: '*',
        element: <ProtectedRoute><L><NotFoundPage /></L></ProtectedRoute>,
      },
    ],
  },
])

export const AppRouter = () => {
  return <RouterProvider router={router} />
}
