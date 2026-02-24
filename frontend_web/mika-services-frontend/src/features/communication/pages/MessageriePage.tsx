import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import {
  fetchMessagesRecus,
  fetchMessagesEnvoyes,
  envoyerMessage,
} from '../../../store/slices/communicationSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import type { MessageCreateRequest } from '../../../types/communication'

export default function MessageriePage() {
  const { t, i18n } = useTranslation('communication')
  const dispatch = useAppDispatch()
  const { messagesRecus, messagesEnvoyes, loading, error } = useAppSelector(
    (state) => state.communication
  )
  const currentUser = useAppSelector((state) => state.auth.user)
  const users = useAppSelector((state) => state.user.users)
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'

  const [activeTab, setActiveTab] = useState<'recus' | 'envoyes'>('recus')
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [destId, setDestId] = useState<number | ''>('')
  const [sujet, setSujet] = useState('')
  const [contenu, setContenu] = useState('')

  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchMessagesRecus({ userId: currentUser.id }))
      dispatch(fetchMessagesEnvoyes({ userId: currentUser.id }))
    }
  }, [dispatch, currentUser?.id])

  const handleSend = async () => {
    if (!currentUser?.id || !destId || !contenu.trim()) return
    const request: MessageCreateRequest = {
      destinataireId: Number(destId),
      sujet: sujet.trim() || undefined,
      contenu: contenu.trim(),
    }
    await dispatch(envoyerMessage({ expediteurId: currentUser.id, request }))
    setShowComposeModal(false)
    setDestId('')
    setSujet('')
    setContenu('')
    dispatch(fetchMessagesEnvoyes({ userId: currentUser.id }))
  }

  const displayedMessages = activeTab === 'recus' ? messagesRecus : messagesEnvoyes

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('messagerie.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('messagerie.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowComposeModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          {t('messagerie.newMessage')}
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('recus')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'recus' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          {t('messagerie.tabRecus', { count: messagesRecus.length })}
        </button>
        <button
          onClick={() => setActiveTab('envoyes')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'envoyes' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          {t('messagerie.tabEnvoyes', { count: messagesEnvoyes.length })}
        </button>
      </div>

      {/* Liste messages */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('messagerie.loading')}</div>
        ) : displayedMessages.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('messagerie.empty')}</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-600">
            {displayedMessages.map((msg) => (
              <div key={msg.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/70 transition ${!msg.lu && activeTab === 'recus' ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!msg.lu && activeTab === 'recus' && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activeTab === 'recus'
                          ? t('messagerie.from', { name: `${msg.expediteur.prenom} ${msg.expediteur.nom}` })
                          : t('messagerie.to', { name: `${msg.destinataire.prenom} ${msg.destinataire.nom}` })
                        }
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(msg.dateEnvoi)}</span>
                    </div>
                    {msg.sujet && <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{msg.sujet}</p>}
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{msg.contenu}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal composition */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-gray-600 w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('messagerie.newMessage')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('messagerie.destinataire')}</label>
                <select
                  value={destId}
                  onChange={(e) => setDestId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">{t('messagerie.choose')}</option>
                  {users.filter(u => u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('messagerie.sujet')}</label>
                <input
                  type="text"
                  value={sujet}
                  onChange={(e) => setSujet(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  placeholder={t('messagerie.sujetPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('messagerie.message')}</label>
                <textarea
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  rows={5}
                  placeholder={t('messagerie.messagePlaceholder')}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowComposeModal(false); setDestId(''); setSujet(''); setContenu('') }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">{t('messagerie.cancel')}</button>
              <button onClick={handleSend} disabled={!destId || !contenu.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{t('messagerie.send')}</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-200">{error}</div>}
    </PageContainer>
  )
}
