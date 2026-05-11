import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

// ── File type config ─────────────────────────────────────────────────
const FILE_META: Record<string, { label: string; bg: string; text: string; ring: string; gradient: string }> = {
  pdf:   { label: 'PDF',  bg: 'bg-red-50 dark:bg-red-950/40',       text: 'text-red-600 dark:text-red-400',       ring: 'ring-red-200 dark:ring-red-800',       gradient: 'from-red-500 to-rose-600' },
  image: { label: 'IMG',  bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-200 dark:ring-violet-800', gradient: 'from-violet-500 to-purple-600' },
  word:  { label: 'DOC',  bg: 'bg-blue-50 dark:bg-blue-950/40',     text: 'text-blue-600 dark:text-blue-400',     ring: 'ring-blue-200 dark:ring-blue-800',     gradient: 'from-blue-500 to-indigo-600' },
  excel: { label: 'XLS',  bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800', gradient: 'from-emerald-500 to-teal-600' },
  other: { label: 'FIC',  bg: 'bg-gray-50 dark:bg-gray-800',       text: 'text-gray-500 dark:text-gray-400',     ring: 'ring-gray-200 dark:ring-gray-700',     gradient: 'from-gray-400 to-gray-500' },
}
function getFileMeta(mime: string | null) {
  if (mime?.includes('pdf')) return FILE_META.pdf
  if (mime?.startsWith('image/')) return FILE_META.image
  if (mime?.includes('word') || mime?.includes('.document')) return FILE_META.word
  if (mime?.includes('sheet') || mime?.includes('excel')) return FILE_META.excel
  return FILE_META.other
}

const TYPE_COLORS: Record<string, string> = {
  PLAN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  RAPPORT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  PHOTO: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  CONTRAT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  FACTURE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  PV_REUNION: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  FICHE_TECHNIQUE: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  FICHE_MISSION: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  AUTRE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}
const TYPE_BAR_COLORS: Record<string, string> = {
  PLAN: 'bg-blue-500', RAPPORT: 'bg-emerald-500', PHOTO: 'bg-violet-500',
  CONTRAT: 'bg-amber-500', FACTURE: 'bg-rose-500', PV_REUNION: 'bg-indigo-500',
  FICHE_TECHNIQUE: 'bg-cyan-500', FICHE_MISSION: 'bg-teal-500', AUTRE: 'bg-gray-400',
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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<TypeDocument | ''>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState<TypeDocument | ''>('AUTRE')
  const [customType, setCustomType] = useState('')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [typeSearch, setTypeSearch] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typeInputRef = useRef<HTMLInputElement>(null)

  const canEdit = projet != null && canEditProjetEffective(currentUser, accessToken, projet.responsableProjet?.id ?? projet.responsableProjetId)

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

  const filtered = useMemo(() => {
    if (!filterType) return documents
    return documents.filter((d) => d.typeDocument === filterType)
  }, [documents, filterType])

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

  const handleUpload = async () => {
    if (!uploadFile || !id) return
    setUploading(true)
    setUploadProgress(0)
    setError(null)
    const interval = setInterval(() => setUploadProgress((p) => Math.min(p + Math.random() * 20, 90)), 200)
    try {
      const isCustom = uploadType === '' || !!customType
      const finalType: TypeDocument = isCustom ? 'AUTRE' : (uploadType as TypeDocument)
      const finalDesc = isCustom && customType
        ? (uploadDesc ? `[${customType}] ${uploadDesc}` : `[${customType}]`)
        : (uploadDesc || undefined)
      await documentApi.upload(uploadFile, finalType, finalDesc, Number(id))
      setUploadProgress(100)
      setTimeout(() => {
        setShowUploadModal(false)
        setUploadFile(null)
        setUploadType('AUTRE')
        setCustomType('')
        setTypeSearch('')
        setUploadDesc('')
        setUploadProgress(0)
        loadDocuments()
      }, 400)
    } catch (e) {
      setError((e as Error).message || 'Erreur lors de l\'envoi')
    } finally { clearInterval(interval); setUploading(false) }
  }

  const handleDownload = async (doc: DocumentFile) => {
    try {
      const blob = await documentApi.download(doc.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = doc.nomOriginal; a.click()
      URL.revokeObjectURL(url)
    } catch { setError('Erreur de téléchargement') }
  }

  const handleDelete = async (doc: DocumentFile) => {
    if (!(await confirm({ messageKey: 'confirm.deleteDocument' }))) return
    try { await documentApi.delete(doc.id); await loadDocuments() }
    catch { setError('Erreur de suppression') }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    if (!canEdit) return
    const file = e.dataTransfer.files?.[0]
    if (file) { setUploadFile(file); setShowUploadModal(true) }
  }

  if (!id) return <PageContainer><p className="text-gray-500">ID projet manquant</p></PageContainer>
  if (projetLoading) return (
    <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}</div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
    </PageContainer>
  )

  return (
    <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
      <div
        onDragOver={(e) => { e.preventDefault(); if (canEdit) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragOver && (
          <div className="fixed inset-0 z-50 bg-primary/5 backdrop-blur-md flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-16 text-center border-2 border-dashed border-primary animate-pulse">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('document:dropHere')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">PDF, Word, Excel, images — max 50 Mo</p>
            </div>
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="relative rounded-2xl overflow-hidden shadow-xl mb-8">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 dark:from-gray-800 dark:via-gray-900 dark:to-gray-950" />
          <div className="absolute inset-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="absolute inset-0 dark:ring-1 dark:ring-inset dark:ring-amber-500/20 rounded-2xl" />

          <div className="relative px-6 py-8 md:px-8 md:py-10">
            <button
              type="button"
              onClick={() => navigate(`/projets/${id}`)}
              className="text-white/70 hover:text-white text-sm mb-5 flex items-center gap-2 transition-colors group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              {t('projet:detail.backToDetail', 'Retour au projet')}
            </button>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="text-white/80 text-sm uppercase tracking-widest font-semibold">{t('document:subtitle')}</p>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
                  {projet?.nom ?? '...'}
                </h1>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-amber-700 dark:bg-gray-800 dark:text-amber-400 rounded-xl font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  {t('document:upload')}
                </button>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 px-5 py-3.5 text-red-700 dark:text-red-200 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="ml-3 font-bold text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}

        {/* ── KPIs ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { value: stats.total, label: t('document:statsTotal'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>, color: 'from-gray-600 to-gray-800 dark:from-gray-600 dark:to-gray-700' },
            { value: formatSize(stats.totalSize), label: t('document:statsSize'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" /></svg>, color: 'from-amber-500 to-orange-600' },
            { value: Object.keys(stats.byType).length, label: t('document:statsTypes'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>, color: 'from-blue-500 to-indigo-600' },
            { value: stats.byType['PLAN'] ?? 0, label: t('document:type.PLAN'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>, color: 'from-emerald-500 to-teal-600' },
          ].map((kpi) => (
            <div key={kpi.label} className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${kpi.color} rounded-bl-[2rem] opacity-10 group-hover:opacity-15 transition-opacity`} />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white mb-3 shadow-sm`}>
                {kpi.icon}
              </div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums tracking-tight">{kpi.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-semibold uppercase tracking-wider">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ── Type breakdown bar ──────────────────────────────────── */}
        {stats.total > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('document:filterLabel')}</p>
              {/* View toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                <button type="button" onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Grille">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button type="button" onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Liste">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>
            </div>
            {/* Stacked bar */}
            <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-700 flex overflow-hidden mb-3">
              {Object.entries(stats.byType).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                <div key={type} className={`${TYPE_BAR_COLORS[type] ?? 'bg-gray-400'} transition-all duration-500`} style={{ width: `${(count / stats.total) * 100}%` }} title={`${t(`document:type.${type}`)} (${count})`} />
              ))}
            </div>
            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === '' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {t('document:filterAll')} ({stats.total})
              </button>
              {Object.entries(stats.byType).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                <button key={type} type="button" onClick={() => setFilterType(type as TypeDocument)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === type ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm' : `${TYPE_COLORS[type] ?? TYPE_COLORS.AUTRE}`}`}>
                  {t(`document:type.${type}`)} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Document grid / list ────────────────────────────────── */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">{t('document:loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm py-20 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0H9.75m0 0H9m.75 0v3m3-3v3M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{t('document:empty')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">{t('document:dragHint')}</p>
            {canEdit && (
              <button type="button" onClick={() => setShowUploadModal(true)}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                {t('document:upload')}
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((doc) => {
              const meta = getFileMeta(doc.typeMime)
              return (
                <div key={doc.id} className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 overflow-hidden">
                  {/* Top color stripe */}
                  <div className={`h-1 bg-gradient-to-r ${meta.gradient}`} />
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl ${meta.bg} ring-1 ${meta.ring} flex items-center justify-center ${meta.text} text-sm font-extrabold shrink-0`}>
                        {meta.label}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate leading-tight" title={doc.nomOriginal}>
                          {doc.nomOriginal}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${TYPE_COLORS[doc.typeDocument] ?? TYPE_COLORS.AUTRE}`}>
                            {t(`document:type.${doc.typeDocument}`)}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{doc.tailleFormatee}</span>
                        </div>
                      </div>
                    </div>

                    {doc.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">{doc.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="min-w-0">
                        {doc.uploadeParNom && <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{doc.uploadeParNom}</p>}
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(doc.createdAt, { monthStyle: 'short' })}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => handleDownload(doc)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors" title={t('document:download')}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                        {canEdit && (
                          <button type="button" onClick={() => handleDelete(doc)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={t('document:delete')}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((doc) => {
                const meta = getFileMeta(doc.typeMime)
                return (
                  <li key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors group">
                    <div className={`w-11 h-11 rounded-xl ${meta.bg} ring-1 ${meta.ring} flex items-center justify-center ${meta.text} text-xs font-extrabold shrink-0`}>
                      {meta.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{doc.nomOriginal}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${TYPE_COLORS[doc.typeDocument] ?? TYPE_COLORS.AUTRE}`}>
                          {t(`document:type.${doc.typeDocument}`)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{doc.tailleFormatee}</span>
                        {doc.uploadeParNom && <span className="text-xs text-gray-500 dark:text-gray-400">{t('document:by')} {doc.uploadeParNom}</span>}
                        <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(doc.createdAt, { monthStyle: 'short' })}</span>
                      </div>
                      {doc.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{doc.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button type="button" onClick={() => handleDownload(doc)} className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors" title={t('document:download')}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                      {canEdit && (
                        <button type="button" onClick={() => handleDelete(doc)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={t('document:delete')}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {canEdit && documents.length > 0 && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-4 text-center font-medium">{t('document:dragHint')}</p>
        )}
      </div>

      {/* ── Upload modal ──────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-none dark:border dark:border-gray-600 w-full max-w-lg overflow-hidden">
            {/* Modal header with gradient */}
            <div className="px-6 py-5 bg-gradient-to-r from-amber-500 to-orange-600 dark:from-gray-700 dark:to-gray-800">
              <h2 className="text-lg font-bold text-white dark:text-gray-100">{t('document:modalTitle')}</h2>
              <p className="text-sm text-white/70 dark:text-gray-400 mt-0.5">{projet?.nom}</p>
            </div>
            <div className="p-6 space-y-5">
              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setUploadFile(f) }}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${uploadFile ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
              >
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadFile(f) }} />
                {uploadFile ? (
                  <div>
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${getFileMeta(uploadFile.type).gradient} flex items-center justify-center text-white text-lg font-extrabold shadow-lg`}>
                      {getFileMeta(uploadFile.type).label}
                    </div>
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-base">{uploadFile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatSize(uploadFile.size)}</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setUploadFile(null) }} className="mt-3 text-xs text-red-500 hover:text-red-700 font-semibold">
                      {t('document:changeFile')}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">{t('document:dropOrClick')}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, Word, Excel, images — max 50 Mo</p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="space-y-1.5">
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 text-right tabular-nums">{Math.round(uploadProgress)} %</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('document:typeDocument')}</label>
                  <div className="relative">
                    <input
                      ref={typeInputRef}
                      type="text"
                      value={customType || (uploadType ? t(`document:type.${uploadType}`) : '')}
                      onChange={(e) => {
                        const v = e.target.value
                        setTypeSearch(v)
                        setCustomType(v)
                        setUploadType('')
                        setShowTypeDropdown(true)
                      }}
                      onFocus={() => { setTypeSearch(''); setShowTypeDropdown(true) }}
                      onBlur={() => setTimeout(() => setShowTypeDropdown(false), 200)}
                      placeholder={t('document:typePlaceholder', 'Choisir ou saisir un type...')}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary transition text-sm pr-10"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {showTypeDropdown && (() => {
                    const q = typeSearch.toLowerCase()
                    const matchingTypes = Object.values(TypeDocument).filter((type) =>
                      !q || t(`document:type.${type}`).toLowerCase().includes(q) || type.toLowerCase().includes(q)
                    )
                    const hasExactMatch = Object.values(TypeDocument).some((type) =>
                      t(`document:type.${type}`).toLowerCase() === q
                    )
                    return (
                      <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        {matchingTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setUploadType(type)
                              setCustomType('')
                              setTypeSearch('')
                              setShowTypeDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2.5 ${uploadType === type ? 'bg-primary/5 text-primary font-semibold' : 'text-gray-700 dark:text-gray-200'}`}
                          >
                            <span className={`inline-flex w-6 h-6 rounded-md items-center justify-center text-[9px] font-bold ${TYPE_COLORS[type] ?? TYPE_COLORS.AUTRE}`}>
                              {t(`document:type.${type}`).slice(0, 2).toUpperCase()}
                            </span>
                            {t(`document:type.${type}`)}
                          </button>
                        ))}
                        {q && !hasExactMatch && (
                          <>
                            {matchingTypes.length > 0 && <div className="border-t border-gray-100 dark:border-gray-700" />}
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setCustomType(typeSearch)
                                setUploadType('')
                                setShowTypeDropdown(false)
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-2.5 text-amber-700 dark:text-amber-400"
                            >
                              <span className="inline-flex w-6 h-6 rounded-md items-center justify-center text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">+</span>
                              {t('document:typeCustom', 'Nouveau type :')} <span className="font-bold">&laquo; {typeSearch} &raquo;</span>
                            </button>
                          </>
                        )}
                        {matchingTypes.length === 0 && !q && (
                          <p className="px-4 py-3 text-sm text-gray-400">{t('document:typeEmpty', 'Aucun type trouvé')}</p>
                        )}
                      </div>
                    )
                  })()}
                  {customType && !uploadType && (
                    <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {t('document:typeCustomHint', 'Type personnalisé — sera enregistré comme « Autre »')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('document:description')}</label>
                  <textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary resize-none transition text-sm"
                    placeholder={t('document:descPlaceholder')} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
              <button type="button" onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadDesc(''); setUploadProgress(0) }}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition text-sm">
                {t('document:cancel')}
              </button>
              <button type="button" onClick={handleUpload} disabled={!uploadFile || uploading}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                {uploading ? t('document:uploading') : t('document:send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
