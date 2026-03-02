import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { PageContainer } from '@/components/layout/PageContainer'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchDocuments, fetchDocumentsByProjet, uploadDocument, deleteDocument } from '../../../store/slices/documentSlice'
import { TypeDocument } from '../../../types/document'
import { documentApi } from '../../../api/documentApi'
import { useFormatDate } from '@/hooks/useFormatDate'

const typeColors: Record<TypeDocument, string> = {
  [TypeDocument.PLAN]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  [TypeDocument.RAPPORT]: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  [TypeDocument.PHOTO]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200',
  [TypeDocument.CONTRAT]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200',
  [TypeDocument.FACTURE]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
  [TypeDocument.PV_REUNION]: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-200',
  [TypeDocument.FICHE_TECHNIQUE]: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200',
  [TypeDocument.FICHE_MISSION]: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200',
  [TypeDocument.CV]: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200',
  [TypeDocument.PERMIS]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  [TypeDocument.ATTESTATION]: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-200',
  [TypeDocument.AUTRE]: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
}

export default function DocumentPage() {
  const { t } = useTranslation('document')
  const formatDate = useFormatDate()
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { documents, loading, uploading, error, totalPages, currentPage } = useAppSelector((state) => state.document)
  const projets = useAppSelector((state) => state.projet.projets)
  const currentUser = useAppSelector((state) => state.auth.user)

  const [selectedProjetId, setSelectedProjetId] = useState<number | ''>('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [filterType, setFilterType] = useState<TypeDocument | ''>('')

  // Upload form
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [upType, setUpType] = useState<TypeDocument>(TypeDocument.AUTRE)
  const [upDescription, setUpDescription] = useState('')

  useEffect(() => {
    if (selectedProjetId) {
      dispatch(fetchDocumentsByProjet({ projetId: Number(selectedProjetId) }))
    } else {
      dispatch(fetchDocuments({}))
    }
  }, [dispatch, selectedProjetId])

  const handleUpload = async () => {
    if (!selectedFile) return
    await dispatch(uploadDocument({
      file: selectedFile,
      typeDocument: upType,
      description: upDescription.trim() || undefined,
      projetId: selectedProjetId ? Number(selectedProjetId) : undefined,
      userId: currentUser?.id,
    }))
    setShowUploadModal(false)
    resetUploadForm()
  }

  const handleDownload = async (id: number, nomOriginal: string) => {
    try {
      const blob = await documentApi.download(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nomOriginal
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      await confirm({ messageKey: 'confirm.downloadError', alertOnly: true })
    }
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'confirm.deleteDocument' })) {
      await dispatch(deleteDocument(id))
    }
  }

  const resetUploadForm = () => {
    setSelectedFile(null)
    setUpType(TypeDocument.AUTRE)
    setUpDescription('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const filteredDocs = filterType ? documents.filter(d => d.typeDocument === filterType) : documents

  return (
    <PageContainer size="wide" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          {t('upload')}
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projectLabel')}</label>
          <select
            value={selectedProjetId}
            onChange={(e) => setSelectedProjetId(e.target.value ? Number(e.target.value) : '')}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">{t('selectProject')}</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterType('')} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterType === '' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{t('filterAll')}</button>
          {Object.values(TypeDocument).map(typ => (
            <button key={typ} onClick={() => setFilterType(typ)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterType === typ ? 'bg-primary-600 text-white' : `${typeColors[typ]} hover:opacity-80`}`}>{t(`type.${typ}`)}</button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('loading')}</div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('empty')}</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-600">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="mika-tile p-4 hover:bg-gray-50 dark:hover:bg-gray-700/70 transition">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{doc.nomOriginal}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[doc.typeDocument]}`}>{t(`type.${doc.typeDocument}`)}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{doc.tailleFormatee}</span>
                      {doc.projetNom && <span>{t('projectLabel')} {doc.projetNom}</span>}
                      {doc.uploadeParNom && <span>{t('by')} {doc.uploadeParNom}</span>}
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                    {doc.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{doc.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownload(doc.id, doc.nomOriginal)} className="text-xs text-primary-600 hover:text-primary-800 font-medium transition">{t('download')}</button>
                    <button onClick={() => handleDelete(doc.id)} className="text-xs text-red-500 hover:text-red-700 transition">{t('delete')}</button>
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
                onClick={() => selectedProjetId ? dispatch(fetchDocumentsByProjet({ projetId: Number(selectedProjetId), page: i })) : dispatch(fetchDocuments({ page: i }))}
                className={`px-3 py-1 rounded text-sm ${currentPage === i ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-gray-600 w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('modalTitle')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('file')}</label>
                <input
                  ref={fileRef}
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('typeDocument')} *</label>
                  <select value={upType} onChange={(e) => setUpType(e.target.value as TypeDocument)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100">
                    {Object.values(TypeDocument).map(typ => (<option key={typ} value={typ}>{t(`type.${typ}`)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projectLabel')}</label>
                  <select value={selectedProjetId} onChange={(e) => setSelectedProjetId(e.target.value ? Number(e.target.value) : '')} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100">
                    <option value="">—</option>
                    {projets.map(p => (<option key={p.id} value={p.id}>{p.nom}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
                <textarea value={upDescription} onChange={(e) => setUpDescription(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowUploadModal(false); resetUploadForm() }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">{t('cancel')}</button>
              <button onClick={handleUpload} disabled={!selectedFile || uploading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {uploading ? t('uploading') : t('send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-200">{error}</div>}
    </PageContainer>
  )
}
