import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '@/contexts/ConfirmContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PageContainer } from '@/components/layout/PageContainer'
import { fetchProjetById, clearProjetDetail } from '@/store/slices/projetSlice'
import { documentApi } from '@/api/documentApi'
import { TypeDocument } from '@/types/document'
import type { DocumentFile } from '@/types/document'
import { canEditProjetEffective } from '@/utils/authRoles'
import { useFormatDate } from '@/hooks/useFormatDate'

// ── Icons ────────────────────────────────────────────────────────────
const IconBack = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)
const IconUpload = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
)
const IconDownload = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)
const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)
const IconFile = ({ mime }: { mime: string | null }) => {
  const isPdf = mime?.includes('pdf')
  const isImage = mime?.startsWith('image/')
  const isWord = mime?.includes('word') || mime?.includes('.document')
  const isExcel = mime?.includes('sheet') || mime?.includes('excel')
  if (isPdf) return <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 text-xs font-bold shrink-0">PDF</div>
  if (isImage) return <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-xs font-bold shrink-0">IMG</div>
  if (isWord) return <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">DOC</div>
  if (isExcel) return <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">XLS</div>
  return <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-bold shrink-0">FIC</div>
}

// ── Type badge colors ────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  PLAN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  RAPPORT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  PHOTO: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  CONTRAT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  FACTURE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  PV_REUNION: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  FICHE_TECHNIQUE: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  FICHE_MISSION: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  AUTRE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

// ── Component ────────────────────────────────────────────────────────
export default function ProjetDocumentsPage() {
  const { t } = useTranslation(['projet', 'document'])
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const formatDate = useFormatDate()
  const currentUser = useAppSelector((s) => s.auth.user)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { projetDetail: projet, loading: projetLoading } = useAppSelector((s) => s.projet)

  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<TypeDocument | ''>('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState<TypeDocument>('AUTRE')
  const [uploadDesc, setUploadDesc] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canEdit = projet != null && canEditProjetEffective(currentUser, accessToken, projet.responsableProjet?.id ?? projet.responsableProjetId)

  // Load project + documents
  useEffect(() => {
    if (id) dispatch(fetchProjetById(Number(id)))
    return () => { dispatch(clearProjetDetail()) }
  }, [dispatch, id])

  const loadDocuments = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await documentApi.getByProjet(Number(id), 0, 200)
      setDocuments(res.content ?? [])
    } catch { setDocuments([]) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  // Filtered docs
  const filtered = useMemo(() => {
    if (!filterType) return documents
    return documents.filter((d) => d.typeDocument === filterType)
  }, [documents, filterType])

  // Stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = {}
    let totalSize = 0
    documents.forEach((d) => {
      byType[d.typeDocument] = (byType[d.typeDocument] || 0) + 1
      totalSize += d.tailleOctets
    })
    return { total: documents.length, byType, totalSize }
  }, [documents])

  const formatSize = (bytes: number) => {
    if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} Go`
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} Mo`
    if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} Ko`
    return `${bytes} o`
  }

  // Upload handler
  const handleUpload = async () => {
    if (!uploadFile || !id) return
    setUploading(true)
    setError(null)
    try {
      await documentApi.upload(uploadFile, uploadType, uploadDesc || undefined, Number(id))
      setShowUploadModal(false)
      setUploadFile(null)
      setUploadType('AUTRE')
      setUploadDesc('')
      await loadDocuments()
    } catch (e) {
      setError((e as Error).message || 'Erreur lors de l\'envoi')
    } finally { setUploading(false) }
  }

  // Download
  const handleDownload = async (doc: DocumentFile) => {
    try {
      const blob = await documentApi.download(doc.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.nomOriginal
      a.click()
      URL.revokeObjectURL(url)
    } catch { setError('Erreur de téléchargement') }
  }

  // Delete
  const handleDelete = async (doc: DocumentFile) => {
    if (!(await confirm({ messageKey: 'confirm.deleteDocument' }))) return
    try {
      await documentApi.delete(doc.id)
      await loadDocuments()
    } catch { setError('Erreur de suppression') }
  }

  // Drag & drop on page
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!canEdit) return
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setUploadFile(file)
      setShowUploadModal(true)
    }
  }

  if (!id) return <PageContainer><p className="text-gray-500">ID projet manquant</p></PageContainer>
  if (projetLoading) return <PageContainer><div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" /><div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" /></div></PageContainer>

  return (
    <PageContainer
      size="full"
      className="bg-gray-50/80 dark:bg-gray-900/80"
    >
      {/* Drop overlay */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (canEdit) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="relative"
      >
        {dragOver && (
          <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 text-center border-2 border-dashed border-primary">
              <IconUpload />
              <p className="text-lg font-bold text-primary mt-3">{t('document:dropHere', 'Déposez le fichier ici')}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 dark:from-gray-800 dark:to-gray-900 dark:ring-1 dark:ring-amber-500/30 text-white shadow-lg mb-6 overflow-hidden">
          <div className="px-6 py-6 md:py-8">
            <button
              type="button"
              onClick={() => navigate(`/projets/${id}`)}
              className="text-white/80 hover:text-white text-sm mb-4 flex items-center gap-1.5 transition-colors"
            >
              <IconBack /> {t('projet:detail.backToDetail', 'Retour au projet')}
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-white/90 text-sm uppercase tracking-wider font-medium">
                  {t('document:subtitle', 'Documents du projet')}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold mt-1 leading-tight">
                  {projet?.nom ?? '...'}
                </h1>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg border border-white/20"
                >
                  <IconUpload />
                  {t('document:upload')}
                </button>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 px-5 py-3 text-red-700 dark:text-red-200 text-sm">
            {error}
            <button type="button" onClick={() => setError(null)} className="ml-3 font-bold">&times;</button>
          </div>
        )}

        {/* Stats KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats.total}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('document:statsTotal', 'Documents')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{formatSize(stats.totalSize)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('document:statsSize', 'Taille totale')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{Object.keys(stats.byType).length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('document:statsTypes', 'Types')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stats.byType['PLAN'] ?? 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('document:type.PLAN')}</p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t('document:filterLabel', 'Filtrer')} :</span>
          <button
            type="button"
            onClick={() => setFilterType('')}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${filterType === '' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            {t('document:filterAll')} ({stats.total})
          </button>
          {Object.entries(stats.byType).sort(([, a], [, b]) => b - a).map(([type, count]) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type as TypeDocument)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${filterType === type ? 'bg-primary text-white shadow-sm' : `${TYPE_COLORS[type] ?? TYPE_COLORS.AUTRE} border border-transparent`}`}
            >
              {t(`document:type.${type}`)} ({count})
            </button>
          ))}
        </div>

        {/* Document list */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              {filterType ? t(`document:type.${filterType}`) : t('document:title')} ({filtered.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-3 text-gray-500 dark:text-gray-400">{t('document:loading')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-300 font-medium">{t('document:empty')}</p>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition"
                >
                  <IconUpload />
                  {t('document:upload')}
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group"
                >
                  <IconFile mime={doc.typeMime} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {doc.nomOriginal}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${TYPE_COLORS[doc.typeDocument] ?? TYPE_COLORS.AUTRE}`}>
                        {t(`document:type.${doc.typeDocument}`)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{doc.tailleFormatee}</span>
                      {doc.uploadeParNom && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('document:by')} {doc.uploadeParNom}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(doc.createdAt, { monthStyle: 'short' })}
                      </span>
                    </div>
                    {doc.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{doc.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      title={t('document:download')}
                    >
                      <IconDownload />
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDelete(doc)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title={t('document:delete')}
                      >
                        <IconTrash />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Drag hint */}
        {canEdit && documents.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
            {t('document:dragHint', 'Glissez-déposez un fichier n\'importe où sur cette page pour l\'ajouter.')}
          </p>
        )}
      </div>

      {/* Upload modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-gray-600 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('document:modalTitle')}</h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files?.[0]
                  if (file) setUploadFile(file)
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${uploadFile ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setUploadFile(file)
                  }}
                />
                {uploadFile ? (
                  <div>
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{uploadFile.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatSize(uploadFile.size)}</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setUploadFile(null) }} className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium">
                      {t('document:changeFile', 'Changer de fichier')}
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{t('document:dropOrClick', 'Cliquez ou glissez un fichier ici')}</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, images — max 50 Mo</p>
                  </div>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('document:typeDocument')}</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as TypeDocument)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary transition"
                >
                  {Object.values(TypeDocument).map((type) => (
                    <option key={type} value={type}>{t(`document:type.${type}`)}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('document:description')}</label>
                <textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary resize-none transition"
                  placeholder={t('document:descPlaceholder', 'Description optionnelle...')}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadDesc('') }}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                {t('document:cancel')}
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-50 transition shadow-sm"
              >
                {uploading ? t('document:uploading') : t('document:send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
