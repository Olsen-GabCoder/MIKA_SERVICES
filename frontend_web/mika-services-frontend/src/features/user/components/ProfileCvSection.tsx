import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { documentApi } from '@/api/documentApi'
import { TypeDocument } from '@/types/document'
import type { DocumentFile } from '@/types/document'
import { useAppSelector } from '@/store/hooks'
import { ProfileSectionCard, ProfileSectionCardHeader } from './ProfileSectionCard'

const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-3.5 h-3.5" aria-hidden="true">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
)

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-3.5 h-3.5" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-3.5 h-3.5" aria-hidden="true">
    <polyline points="8 17 12 21 16 17"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
  </svg>
)

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const EmptyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    className="w-9 h-9 opacity-30" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="18" x2="12" y2="12"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
)

export const ProfileCvSection = () => {
  const { t } = useTranslation('user')
  const currentUser = useAppSelector((state) => state.user.currentUser)
  const [cvList, setCvList] = useState<DocumentFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => { loadCv() }, [])

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
    <ProfileSectionCard
      className="animate-fade-in-up"
      header={
        <ProfileSectionCardHeader
          icon={<FileTextIcon />}
          title={t('profile.cv.title')}
          subtitle={t('profile.cv.subtitle')}
        />
      }
    >
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm font-medium" role="alert">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}

        <label
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border-2 border-dashed border-primary bg-primary/10 text-primary cursor-pointer transition-colors hover:bg-primary/20 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <UploadIcon />
          )}
          {uploading ? t('profile.cv.uploading') : t('profile.cv.addCv')}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-700/60 animate-pulse" />
            ))}
          </div>
        ) : cvList.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-7 text-gray-500 dark:text-gray-400">
            <EmptyIcon />
            <p className="text-sm font-medium text-center">{t('profile.cv.emptyCv')}</p>
            <p className="text-xs text-center opacity-80">{t('profile.cv.emptyHint') ?? 'Ajoutez votre CV au format PDF'}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {cvList.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="flex-shrink-0 w-9 h-10 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex flex-col items-center justify-center text-[10px] font-extrabold gap-0.5">
                  <FileTextIcon />
                  <span>PDF</span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={doc.nomOriginal}>
                    {doc.nomOriginal}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {doc.tailleFormatee}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => handleView(doc.id)}
                  >
                    <EyeIcon />
                    {t('profile.cv.view')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => handleDownload(doc.id, doc.nomOriginal)}
                  >
                    <DownloadIcon />
                    {t('profile.cv.download')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
    </ProfileSectionCard>
  )
}
