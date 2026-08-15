import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/store/hooks'
import { createEngin, updateEngin } from '@/store/slices/enginSlice'
import { enginApi } from '@/api/enginApi'
import type { Engin, EnginCreateRequest, TypeEngin } from '@/types/materiel'
import { handleApiError } from '@/utils/errorHandler'
import { useToast } from '@/contexts/ToastContext'

const ALL_TYPES: TypeEngin[] = [
  'PELLETEUSE', 'BULLDOZER', 'NIVELEUSE', 'COMPACTEUR', 'CAMION_BENNE', 'CAMION_CITERNE',
  'GRUE', 'CHARGEUSE', 'RETROCHARGEUSE', 'BETONNIERE', 'FINISSEUR',
  'GROUPE_ELECTROGENE', 'POMPE', 'FOREUSE', 'CONCASSEUR', 'AUTRE',
]

interface Props {
  engin?: Engin
  onClose: () => void
  onSuccess: () => void
}

export function EnginFormModal({ engin, onClose, onSuccess }: Props) {
  const { t } = useTranslation('materiel')
  const dispatch = useAppDispatch()
  const toast = useToast()
  const isEdit = !!engin

  const [form, setForm] = useState<EnginCreateRequest>({
    code: engin?.code ?? '',
    nom: engin?.nom ?? '',
    type: engin?.type ?? 'PELLETEUSE',
    marque: engin?.marque ?? '',
    modele: engin?.modele ?? '',
    immatriculation: engin?.immatriculation ?? '',
    numeroSerie: engin?.numeroSerie ?? '',
    anneeFabrication: engin?.anneeFabrication,
    proprietaire: engin?.proprietaire ?? '',
    estLocation: engin?.estLocation ?? false,
    coutLocationJournalier: engin?.coutLocationJournalier,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing photo for edit mode
  useEffect(() => {
    if (!isEdit || !engin?.photo) return
    let objectUrl: string | null = null
    enginApi.getPhotoBlob(engin.id).then(blob => {
      if (!blob) return
      objectUrl = URL.createObjectURL(blob)
      setPhotoPreview(objectUrl)
    })
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [isEdit, engin?.id, engin?.photo])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setPhotoFile(file)
    // Preview
    const url = URL.createObjectURL(file)
    setPhotoPreview(prev => { if (prev) URL.revokeObjectURL(prev); return url })
  }

  const handleChange = (field: keyof EnginCreateRequest, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.nom.trim()) {
      setError(t('form.errorRequired'))
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      let enginId: number
      if (isEdit) {
        const result = await dispatch(updateEngin({ id: engin.id, data: form })).unwrap()
        enginId = result.id
      } else {
        const result = await dispatch(createEngin(form)).unwrap()
        enginId = result.id
      }
      // Upload photo if selected
      if (photoFile) {
        try {
          await enginApi.uploadPhoto(enginId, photoFile)
        } catch {
          // Don't fail the whole operation if photo upload fails
          toast({ message: 'Engin sauvegardé mais erreur lors de l\'upload de la photo', variant: 'warning' })
          onSuccess()
          return
        }
      }
      toast({ message: isEdit ? t('form.updateSuccess') : t('form.createSuccess'), variant: 'success' })
      onSuccess()
    } catch (err: unknown) {
      setError(handleApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {isEdit ? t('form.titleEdit') : t('form.titleCreate')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {/* Photo upload zone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Photo de l'engin
            </label>
            <div
              className="relative w-full h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary cursor-pointer overflow-hidden transition-colors duration-200 group"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="text-white text-center">
                      <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span className="text-xs font-semibold">Changer la photo</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="text-xs font-semibold">Cliquer pour ajouter une photo</span>
                  <span className="text-[10px] mt-1 text-gray-400">JPG, PNG — max 5 Mo</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('form.code')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => handleChange('code', e.target.value)}
                disabled={isEdit}
                placeholder="ENG-001"
                className={inputCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}
              />
            </div>

            {/* Nom */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('form.nom')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder={t('form.nomPlaceholder')}
                className={inputCls}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('form.type')} <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value as TypeEngin)}
                className={inputCls}
              >
                {ALL_TYPES.map((ty) => (
                  <option key={ty} value={ty}>{t(`engin.type.${ty}`)}</option>
                ))}
              </select>
            </div>

            {/* Marque */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.marque')}</label>
              <input
                type="text"
                value={form.marque ?? ''}
                onChange={(e) => handleChange('marque', e.target.value)}
                placeholder="Caterpillar, Volvo..."
                className={inputCls}
              />
            </div>

            {/* Modèle */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.modele')}</label>
              <input
                type="text"
                value={form.modele ?? ''}
                onChange={(e) => handleChange('modele', e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Immatriculation */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.immatriculation')}</label>
              <input
                type="text"
                value={form.immatriculation ?? ''}
                onChange={(e) => handleChange('immatriculation', e.target.value)}
                placeholder="LB-1234-A"
                className={inputCls}
              />
            </div>

            {/* Numéro de série */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.numeroSerie')}</label>
              <input
                type="text"
                value={form.numeroSerie ?? ''}
                onChange={(e) => handleChange('numeroSerie', e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Année */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.anneeFabrication')}</label>
              <input
                type="number"
                value={form.anneeFabrication ?? ''}
                onChange={(e) => handleChange('anneeFabrication', e.target.value ? Number(e.target.value) : undefined)}
                min={1970}
                max={new Date().getFullYear()}
                className={inputCls}
              />
            </div>

            {/* Propriétaire */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.proprietaire')}</label>
              <input
                type="text"
                value={form.proprietaire ?? ''}
                onChange={(e) => handleChange('proprietaire', e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Coût location */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.coutLocation')}</label>
              <input
                type="number"
                value={form.coutLocationJournalier ?? ''}
                onChange={(e) => handleChange('coutLocationJournalier', e.target.value ? Number(e.target.value) : undefined)}
                min={0}
                step="0.01"
                className={inputCls}
              />
            </div>
          </div>

          {/* Location toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.estLocation ?? false}
                onChange={(e) => handleChange('estLocation', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-primary transition-colors duration-200" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.estLocation')}</span>
          </label>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
          >
            {t('form.cancel')}
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm shadow-primary/20"
          >
            {submitting ? t('form.saving') : isEdit ? t('form.update') : t('form.create')}
          </button>
        </div>
      </div>
    </div>
  )
}
