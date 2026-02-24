import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCurrentUser } from '@/store/slices/userSlice'
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { PageContainer } from '@/components/layout/PageContainer'
import { ProfileForm } from '../components/ProfileForm'
import { ProfileCvSection } from '../components/ProfileCvSection'
import { ProfilePasswordSection } from '../components/ProfilePasswordSection'
import { Profile2FASection } from '../components/Profile2FASection'
import { ProfileSessionsSection } from '../components/ProfileSessionsSection'

export const ProfilePage = () => {
  const { t } = useTranslation('user')
  const dispatch = useAppDispatch()
  const { currentUser, isLoading } = useAppSelector((state) => state.user)
  const { user: authUser } = useAppSelector((state) => state.auth)

  // Utiliser auth.user en secours pour éviter écran "Chargement" ou "Aucune info" après 2FA / refresh
  const userForDisplay = currentUser ?? authUser

  useEffect(() => {
    if (!currentUser && authUser) {
      dispatch(fetchCurrentUser())
    }
  }, [dispatch, currentUser, authUser])

  if (isLoading && !currentUser && !authUser) {
    return <Loading />
  }

  if (!userForDisplay) {
    return (
      <PageContainer>
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400">Aucune information utilisateur disponible</p>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="full" className="w-full space-y-6 bg-gray-50/80 dark:bg-gray-900/80">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mon Profil</h1>

      {userForDisplay?.mustChangePassword && (
        <div
          className="p-4 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
          role="alert"
        >
          <p className="font-medium">{t('profile.mustChangePasswordAlert')}</p>
        </div>
      )}

      <ProfileForm user={userForDisplay}>
        <ProfileCvSection />
        <ProfilePasswordSection />
        <Profile2FASection />
        <ProfileSessionsSection />
      </ProfileForm>
    </PageContainer>
  )
}
