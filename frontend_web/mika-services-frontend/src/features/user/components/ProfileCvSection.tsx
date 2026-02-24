import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { documentApi } from '@/api/documentApi'
import { TypeDocument } from '@/types/document'
import type { DocumentFile } from '@/types/document'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAppSelector } from '@/store/hooks'

export const ProfileCvSection = () => {
  const { t } = useTranslation('user')
  const currentUser = useAppSelector((state) => state.user.currentUser)
  const [cvList, setCvList] = useState<DocumentFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCv = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await documentApi.getMyCv()
      setCvList(list)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('profile.cv.errorLoadCv'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCv()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser?.id) return
    setUploading(true)
    setError(null)
    try {
      await documentApi.upload(file, TypeDocument.CV, undefined, undefined, currentUser.id)
      await loadCv()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.cv.errorUploadCv'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDownload = async (id: number, nomOriginal: string) => {
    try {
      const blob = await documentApi.download(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nomOriginal
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError(t('profile.cv.errorDownload'))
    }
  }

  const handleView = async (id: number) => {
    try {
      const blob = await documentApi.download(id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      setError(t('profile.cv.errorView'))
    }
  }

  return (
    <Card title={t('profile.cv.title')} subtitle={t('profile.cv.subtitle')}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg text-small">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary-dark transition-colors text-small font-medium focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-800">
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={handleUpload}
              disabled={uploading}
            />
            {uploading ? t('profile.cv.uploading') : t('profile.cv.addCv')}
          </label>
        </div>
        {loading ? (
          <p className="text-small text-medium dark:text-gray-400">{t('profile.cv.loadingCv')}</p>
        ) : cvList.length === 0 ? (
          <p className="text-small text-medium dark:text-gray-400">{t('profile.cv.emptyCv')}</p>
        ) : (
          <ul className="space-y-2">
            {cvList.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-4 p-3 rounded-lg border border-light dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50"
              >
                <span className="text-body text-dark dark:text-gray-200 truncate flex-1 min-w-0" title={doc.nomOriginal}>
                  {doc.nomOriginal}
                </span>
                <span className="text-small text-medium dark:text-gray-400 shrink-0">{doc.tailleFormatee}</span>
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(doc.id)}
                  >
                    {t('profile.cv.view')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(doc.id, doc.nomOriginal)}
                  >
                    {t('profile.cv.download')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
