import { useEffect, useState, useCallback, useRef, type DragEvent, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchDocuments, createDocument, deleteDocument, fetchDocumentById } from '@/store/slices/qualiteDocumentSlice'
import { qualiteDocumentApi } from '@/api/qualiteDocumentApi'
import { PageContainer } from '@/components/layout/PageContainer'
import { useConfirm } from '@/contexts/ConfirmContext'
import type { VersionDocumentResponse } from '@/types/qualiteDocument'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'
const INPUT = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent'

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function getFileTypeInfo(typeMime: string | null): { label: string; color: string } {
  if (!typeMime) return { label: '?', color: 'text-gray-400' }
  if (typeMime.includes('pdf')) return { label: 'PDF', color: 'text-red-500' }
  if (typeMime.includes('word') || typeMime.includes('document')) return { label: 'DOC', color: 'text-blue-500' }
  if (typeMime.includes('sheet') || typeMime.includes('excel')) return { label: 'XLS', color: 'text-green-500' }
  if (typeMime.startsWith('image/')) return { label: 'IMG', color: 'text-purple-500' }
  return { label: 'FILE', color: 'text-gray-500' }
}

function DropZone({
  file,
  onFileChange,
  onRemove,
  label,
}: {
  file: File | null
  onFileChange: (f: File | null) => void
  onRemove: () => void
  label: string
}) {
  const { t } = useTranslation('qualite')
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = (e: DragEvent) => { e.preventDefault(); setDragging(false) }
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) onFileChange(dropped)
  }
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    onFileChange(selected)
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatSize(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 whitespace-nowrap"
        >
          {t('documents.removeFile')}
        </button>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          dragging
            ? 'border-[#FF6B35] bg-orange-50 dark:bg-orange-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.57 5.495A3 3 0 0118 19.5H6.75z" />
        </svg>
        <span className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {t('documents.dropzone')}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    </div>
  )
}

export default function DocumentsQualitePage() {
  const { t } = useTranslation('qualite')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()

  const { documents, current, totalPages, loading } = useAppSelector(s => s.qualiteDocument)

  const [page, setPage] = useState(0)
  const [actifsOnly, setActifsOnly] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showVersion, setShowVersion] = useState(false)

  // Create form
  const [formTitre, setFormTitre] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formFile, setFormFile] = useState<File | null>(null)

  // Version form
  const [versionFile, setVersionFile] = useState<File | null>(null)
  const [versionComment, setVersionComment] = useState('')

  const loadData = useCallback(() => {
    dispatch(fetchDocuments({ page, actifsOnly }))
  }, [dispatch, page, actifsOnly])

  useEffect(() => { loadData() }, [loadData])

  const handleCreate = async () => {
    if (!formTitre.trim()) return
    await dispatch(createDocument({
      titre: formTitre,
      description: formDesc || undefined,
      file: formFile ?? undefined,
    }))
    setShowCreate(false)
    setFormTitre(''); setFormDesc(''); setFormFile(null)
    loadData()
  }

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      titleKey: 'documents.confirmDeleteTitle',
      messageKey: 'documents.confirmDelete',
      ns: 'qualite',
    })
    if (!ok) return
    await dispatch(deleteDocument(id)); loadData()
  }

  const openDetail = async (id: number) => {
    await dispatch(fetchDocumentById(id))
    setShowDetail(true)
  }

  const handleAddVersion = async () => {
    if (!current || !versionFile) return
    await qualiteDocumentApi.ajouterVersion(current.id, {
      file: versionFile, commentaire: versionComment || undefined,
    })
    await dispatch(fetchDocumentById(current.id))
    setShowVersion(false)
    setVersionFile(null); setVersionComment('')
    loadData()
  }

  const handleDownload = async (v: VersionDocumentResponse) => {
    if (!current) return
    try {
      const blob = await qualiteDocumentApi.download(current.id, v.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = v.nomOriginal
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // silently fail
    }
  }

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('documents.title')}</h1>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors shadow-sm">
          {t('documents.create')}
        </button>
      </div>

      {/* Filter */}
      <div className={CARD}>
        <div className={BODY}>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={actifsOnly} onChange={e => { setActifsOnly(e.target.checked); setPage(0) }} className="rounded border-gray-300" />
            {t('documents.actifsOnly')}
          </label>
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">
          <div className="w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-[#FF6B35] rounded-full animate-spin mx-auto" />
        </div>
      ) : documents.length === 0 ? (
        <div className="p-8 text-center text-gray-400">{t('documents.empty')}</div>
      ) : (
        <div className={CARD}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600 text-left text-gray-600 dark:text-gray-400">
                  <th className="py-3 px-4 font-medium">{t('documents.code')}</th>
                  <th className="py-3 px-4 font-medium">{t('documents.titre')}</th>
                  <th className="py-3 px-4 font-medium">{t('documents.typeFile')}</th>
                  <th className="py-3 px-4 font-medium">{t('documents.version')}</th>
                  <th className="py-3 px-4 font-medium">{t('documents.statut')}</th>
                  <th className="py-3 px-4 font-medium">{t('documents.dateModif')}</th>
                  <th className="py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {documents.map(d => {
                  const ft = getFileTypeInfo(d.typeMime)
                  return (
                    <tr key={d.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => openDetail(d.id)}>
                      <td className="py-3 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">{d.codeDocument}</td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{d.titre}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${ft.color}`}>{ft.label}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">v{d.versionCourante}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${d.actif ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {d.actif ? t('documents.actif') : t('documents.archive')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{d.updatedAt?.substring(0, 10) ?? '\u2014'}</td>
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 text-xs">{t('documents.delete')}</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1 rounded text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40">
            &larr;
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1 rounded text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40">
            &rarr;
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 overflow-y-auto p-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:border dark:border-gray-600 w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('documents.create')}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('documents.titre')}</label>
              <input value={formTitre} onChange={e => setFormTitre(e.target.value)}
                className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('documents.description')}</label>
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2}
                className={INPUT} />
            </div>
            <DropZone
              file={formFile}
              onFileChange={setFormFile}
              onRemove={() => setFormFile(null)}
              label={t('documents.fileSelected')}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowCreate(false); setFormFile(null) }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {t('documents.cancel')}
              </button>
              <button onClick={handleCreate} disabled={!formTitre.trim()}
                className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] disabled:opacity-50 transition-colors shadow-sm">
                {t('documents.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && current && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 overflow-y-auto p-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:border dark:border-gray-600 w-full max-w-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{current.codeDocument} — {current.titre}</h2>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">&times;</button>
            </div>
            {current.description && <p className="text-sm text-gray-600 dark:text-gray-400">{current.description}</p>}
            <div className="text-sm text-gray-700 dark:text-gray-300"><strong>{t('documents.versionCourante')}:</strong> v{current.versionCourante}</div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="font-medium text-gray-900 dark:text-white">{t('documents.historique')}</h3>
              <button onClick={() => setShowVersion(true)}
                className="px-3 py-1.5 bg-[#FF6B35] text-white rounded-lg text-sm hover:bg-[#e55a2b] transition-colors shadow-sm">
                {t('documents.nouvelleVersion')}
              </button>
            </div>

            <div className="space-y-2">
              {current.versions.map(v => {
                const ft = getFileTypeInfo(v.typeMime)
                return (
                  <div key={v.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white">v{v.numeroVersion}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${ft.color}`}>{ft.label}</span>
                        <span className="text-gray-600 dark:text-gray-400 truncate">{v.nomOriginal}</span>
                        <span className="text-gray-400 text-xs whitespace-nowrap">{formatSize(v.tailleOctets)}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">{v.createdAt?.substring(0, 10)}</span>
                        <button
                          onClick={() => handleDownload(v)}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {t('documents.download')}
                        </button>
                      </div>
                    </div>
                    {v.commentaire && <p className="text-gray-600 dark:text-gray-400 mt-1">{v.commentaire}</p>}
                    {v.auteurNom && <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{v.auteurNom}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* New Version Modal */}
      {showVersion && (
        <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-black/50 overflow-y-auto p-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:border dark:border-gray-600 w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('documents.nouvelleVersion')}</h2>
            <DropZone
              file={versionFile}
              onFileChange={setVersionFile}
              onRemove={() => setVersionFile(null)}
              label={t('documents.fileSelected')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('documents.commentaire')}</label>
              <textarea value={versionComment} onChange={e => setVersionComment(e.target.value)} rows={2}
                className={INPUT} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowVersion(false); setVersionFile(null) }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {t('documents.cancel')}
              </button>
              <button onClick={handleAddVersion} disabled={!versionFile}
                className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] disabled:opacity-50 transition-colors shadow-sm">
                {t('documents.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
