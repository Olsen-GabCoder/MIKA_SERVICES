import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import {
  fetchNotifications,
  marquerNotifLue,
  marquerToutesNotifLues,
} from '../../../store/slices/communicationSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import { TypeNotification, type Notification } from '../../../types/communication'
import { useFormatDate } from '@/hooks/useFormatDate'

const typeColors: Record<TypeNotification, string> = {
  [TypeNotification.INFO]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  [TypeNotification.ALERTE]: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  [TypeNotification.TACHE_ASSIGNEE]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200',
  [TypeNotification.INCIDENT]: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  [TypeNotification.NON_CONFORMITE]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  [TypeNotification.ECHEANCE]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
  [TypeNotification.STOCK_BAS]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
  [TypeNotification.MESSAGE]: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  [TypeNotification.SYSTEME]: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
}

export default function NotificationsPage() {
  const { t } = useTranslation('communication')
  const dispatch = useAppDispatch()
  const formatDate = useFormatDate()
  const { notifications, notificationsNonLuesCount, loading, totalPages, currentPage } = useAppSelector(
    (state) => state.communication
  )
  const currentUser = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchNotifications({ userId: currentUser.id }))
    }
  }, [dispatch, currentUser?.id])

  const handleMarkRead = (notifId: number) => {
    if (currentUser?.id) {
      dispatch(marquerNotifLue({ notifId, userId: currentUser.id }))
    }
  }

  const handleMarkAllRead = () => {
    if (currentUser?.id) {
      dispatch(marquerToutesNotifLues(currentUser.id))
    }
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('notifications.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {notificationsNonLuesCount > 0
              ? t('notifications.unreadCount', { count: notificationsNonLuesCount })
              : t('notifications.allRead')
            }
          </p>
        </div>
        {notificationsNonLuesCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium transition"
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('notifications.loading')}</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('notifications.empty')}</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-600">
            {notifications.map((notif: Notification) => (
              <div
                key={notif.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/70 transition cursor-pointer ${!notif.lu ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                onClick={() => !notif.lu && handleMarkRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  {!notif.lu && <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[notif.typeNotification as TypeNotification]}`}>
                        {t(`notifications.type.${notif.typeNotification}`)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(notif.dateCreation, { includeTime: true })}</span>
                    </div>
                    <p className={`text-sm ${!notif.lu ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {notif.titre}
                    </p>
                    {notif.contenu && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{notif.contenu}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t dark:border-gray-600">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => currentUser?.id && dispatch(fetchNotifications({ userId: currentUser.id, page: i }))}
                className={`px-3 py-1 rounded text-sm ${currentPage === i ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
