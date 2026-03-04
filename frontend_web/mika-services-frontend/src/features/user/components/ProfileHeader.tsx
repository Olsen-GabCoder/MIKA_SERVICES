import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@/types'
import { getRoleLabel, getInitials, fullName } from '@/utils/userDisplay'
import { userApi } from '@/api/userApi'
import { useAppDispatch } from '@/store/hooks'
import { fetchCurrentUser } from '@/store/slices/userSlice'
import { setUser } from '@/store/slices/authSlice'
import { PROFILE_CARD_CLASS, ProfileCardAccent } from './ProfileSectionCard'

interface ProfileHeaderProps {
  user: User
}

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-3.5 h-3.5" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

const SpinnerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    className="w-[18px] h-[18px] animate-spin" aria-hidden="true">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
)

export const ProfileHeader = ({ user }: ProfileHeaderProps) => {
  const { t } = useTranslation('user')
  const dispatch = useAppDispatch()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [hover, setHover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const yearDebut = user.dateEmbauche
    ? new Date(user.dateEmbauche).getFullYear()
    : null

  useEffect(() => {
    if (!user.photo) {
      setPhotoUrl(null)
      return () => {}
    }
    let objectUrl: string | null = null
    userApi.getPhotoBlob().then((blob) => {
      if (!blob) return
      objectUrl = URL.createObjectURL(blob)
      setPhotoUrl(objectUrl)
    })
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [user.photo])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const updatedUser = await userApi.uploadPhoto(file)
      dispatch(setUser(updatedUser))
      dispatch(fetchCurrentUser())
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const initials = getInitials(user)

  return (
    <div className={`${PROFILE_CARD_CLASS} animate-fade-in-up`}>
      <ProfileCardAccent />
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-7 p-6 sm:px-8">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="block w-24 h-24 rounded-full overflow-hidden border-[3px] border-gray-200 dark:border-gray-600 bg-primary/10 dark:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:border-primary dark:hover:border-primary transition-all duration-200"
            aria-label={t('profile.changePhoto')}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary dark:text-white">
                {initials}
              </span>
            )}
            <div
              className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white transition-opacity duration-200 ${
                hover && !uploading ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden
            >
              <CameraIcon />
            </div>
          </button>

          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center text-white z-10">
              <SpinnerIcon />
            </div>
          )}

          {!uploading && (
            <div
              className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center border-2 border-white dark:border-gray-800"
              aria-hidden
            >
              <CameraIcon />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="absolute w-px h-px overflow-hidden opacity-0 -m-px"
            onChange={handlePhotoChange}
            disabled={uploading}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {fullName(user)}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {getRoleLabel(user)}
            </span>
            {yearDebut != null && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                {t('profile.sinceLabel', { year: yearDebut }) ?? `Depuis ${yearDebut}`}
              </span>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 sm:flex sm:flex-wrap border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="flex flex-col gap-0.5 px-3 sm:px-4 py-2.5 flex-1 min-w-0 border-r border-b sm:border-b-0 border-gray-200 dark:border-gray-600 last:border-r-0">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('profile.matriculeLabel')}
              </dt>
              <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {user.matricule}
              </dd>
            </div>
            {yearDebut != null && (
              <div className="flex flex-col gap-0.5 px-3 sm:px-4 py-2.5 flex-1 min-w-0 border-r border-b sm:border-b-0 border-gray-200 dark:border-gray-600 last:border-r-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('profile.yearDebutLabel')}
                </dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {yearDebut}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}
