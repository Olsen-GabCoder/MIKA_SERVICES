import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@/types'
import { getRoleLabel, getInitials, fullName } from '@/utils/userDisplay'
import { userApi } from '@/api/userApi'
import { useAppDispatch } from '@/store/hooks'
import { fetchCurrentUser } from '@/store/slices/userSlice'
import { setUser } from '@/store/slices/authSlice'

interface ProfileHeaderProps {
  user: User
}

export const ProfileHeader = ({ user }: ProfileHeaderProps) => {
  const { t } = useTranslation('user')
  const dispatch = useAppDispatch()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
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

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-light dark:border-gray-600 shadow-sm">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="block rounded-full overflow-hidden w-24 h-24 border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          aria-label={t('profile.changePhoto')}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-secondary/10 dark:bg-white/10 flex items-center justify-center text-2xl font-semibold text-secondary dark:text-white">
              {getInitials(user)}
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handlePhotoChange}
          disabled={uploading}
        />
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white text-xs">
            {t('profile.uploading')}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-dark dark:text-gray-100 truncate">{fullName(user)}</h1>
        <p className="text-body text-secondary dark:text-gray-400 mt-0.5">{getRoleLabel(user)}</p>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-small text-medium dark:text-gray-300">
          <div>
            <dt className="inline font-medium text-dark dark:text-gray-200">{t('profile.matriculeLabel')} :</dt>
            <dd className="inline ml-1">{user.matricule}</dd>
          </div>
          {yearDebut && (
            <div>
              <dt className="inline font-medium text-dark dark:text-gray-200">{t('profile.yearDebutLabel')} :</dt>
              <dd className="inline ml-1">{yearDebut}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
