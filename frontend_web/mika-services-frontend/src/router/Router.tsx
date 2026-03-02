import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { ProfilePage } from '@/features/user/pages/ProfilePage'
import { ParametresPage } from '@/features/user/pages/ParametresPage'
import { UserManagementPage } from '@/features/user/pages/UserManagementPage'
import { UserDetailPage } from '@/features/user/pages/UserDetailPage'
import { ProjetListPage } from '@/features/projet/pages/ProjetListPage'
import { ProjetDetailPage } from '@/features/projet/pages/ProjetDetailPage'
import { ProjetHistoriquePage } from '@/features/projet/pages/ProjetHistoriquePage'
import { ProjetFormPage } from '@/features/projet/pages/ProjetFormPage'
import { EquipeListPage } from '@/features/equipe/pages/EquipeListPage'
import { EquipeFormPage } from '@/features/equipe/pages/EquipeFormPage'
import { EquipeDetailPage } from '@/features/equipe/pages/EquipeDetailPage'
import { EnginListPage } from '@/features/materiel/pages/EnginListPage'
import { MateriauListPage } from '@/features/materiel/pages/MateriauListPage'
import { BudgetPage } from '@/features/budget/pages/BudgetPage'
import PlanningPage from '@/features/planning/pages/PlanningPage'
import QualitePage from '@/features/qualite/pages/QualitePage'
import SecuritePage from '@/features/securite/pages/SecuritePage'
import MessageriePage from '@/features/communication/pages/MessageriePage'
import NotificationsPage from '@/features/communication/pages/NotificationsPage'

import DocumentPage from '@/features/document/pages/DocumentPage'
import FournisseurPage from '@/features/fournisseur/pages/FournisseurPage'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import { ReunionHebdoListPage } from '@/features/reunionhebdo/pages/ReunionHebdoListPage'
import { ReunionHebdoFormPage } from '@/features/reunionhebdo/pages/ReunionHebdoFormPage'
import { ReunionHebdoPVPage } from '@/features/reunionhebdo/pages/ReunionHebdoPVPage'
import { NotFoundPage } from '@/features/errors/pages/NotFoundPage'
import App from '@/App'

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
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'parametres',
        element: (
          <ProtectedRoute>
            <ParametresPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users/:id',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <UserDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'projets',
        element: (
          <ProtectedRoute>
            <ProjetListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'projets/nouveau',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <ProjetFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'projets/:id/historique',
        element: (
          <ProtectedRoute>
            <ProjetHistoriquePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'projets/:id',
        element: (
          <ProtectedRoute>
            <ProjetDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'projets/:id/edit',
        element: (
          <ProtectedRoute>
            <ProjetFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reunions-hebdo',
        element: (
          <ProtectedRoute>
            <ReunionHebdoListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reunions-hebdo/nouveau',
        element: (
          <ProtectedRoute>
            <ReunionHebdoFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reunions-hebdo/:id',
        element: (
          <ProtectedRoute>
            <ReunionHebdoPVPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reunions-hebdo/:id/edit',
        element: (
          <ProtectedRoute>
            <ReunionHebdoFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'equipes',
        element: (
          <ProtectedRoute>
            <EquipeListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'equipes/nouveau',
        element: (
          <ProtectedRoute>
            <EquipeFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'equipes/:id',
        element: (
          <ProtectedRoute>
            <EquipeDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'equipes/:id/edit',
        element: (
          <ProtectedRoute>
            <EquipeFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'engins',
        element: (
          <ProtectedRoute>
            <EnginListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'materiaux',
        element: (
          <ProtectedRoute>
            <MateriauListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'budget',
        element: (
          <ProtectedRoute>
            <BudgetPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'planning',
        element: (
          <ProtectedRoute>
            <PlanningPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'qualite',
        element: (
          <ProtectedRoute>
            <QualitePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'securite',
        element: (
          <ProtectedRoute>
            <SecuritePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'messagerie',
        element: (
          <ProtectedRoute>
            <MessageriePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'documents',
        element: (
          <ProtectedRoute>
            <DocumentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'fournisseurs',
        element: (
          <ProtectedRoute>
            <FournisseurPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: (
          <ProtectedRoute>
            <NotFoundPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
])

export const AppRouter = () => {
  return <RouterProvider router={router} />
}
