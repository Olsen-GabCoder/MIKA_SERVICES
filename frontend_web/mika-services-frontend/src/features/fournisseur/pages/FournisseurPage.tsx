import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchFournisseurs, fetchCommandes, createFournisseur, deleteFournisseur } from '../../../store/slices/fournisseurSlice'
import { PageContainer } from '@/components/layout/PageContainer'
const statutColors: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200', ENVOYEE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  CONFIRMEE: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200', EN_LIVRAISON: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
  LIVREE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200', ANNULEE: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
}

export default function FournisseurPage() {
  const { t, i18n } = useTranslation('fournisseur')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { fournisseurs, commandes, loading, error, totalFournisseurs, totalCommandes } = useAppSelector(s => s.fournisseur)
  const [tab, setTab] = useState<'fournisseurs' | 'commandes'>('fournisseurs')
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'
  const [showModal, setShowModal] = useState(false)
  const [formNom, setFormNom] = useState(''); const [formTel, setFormTel] = useState('')
  const [formEmail, setFormEmail] = useState(''); const [formSpec, setFormSpec] = useState('')
  const [formAdresse, setFormAdresse] = useState(''); const [formContact, setFormContact] = useState('')

  useEffect(() => {
    dispatch(fetchFournisseurs())
    dispatch(fetchCommandes())
  }, [dispatch])

  const handleCreate = async () => {
    if (!formNom.trim()) return
    await dispatch(createFournisseur({
      nom: formNom, telephone: formTel || undefined, email: formEmail || undefined,
      specialite: formSpec || undefined, adresse: formAdresse || undefined, contactNom: formContact || undefined,
    }))
    setShowModal(false); resetForm()
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'confirm.deleteFournisseur' })) await dispatch(deleteFournisseur(id))
  }

  const resetForm = () => { setFormNom(''); setFormTel(''); setFormEmail(''); setFormSpec(''); setFormAdresse(''); setFormContact('') }

  const formatMontant = (v: number | null) => v ? new Intl.NumberFormat(locale, { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(v) : '—'

  return (
    <PageContainer size="wide" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle', { suppliers: totalFournisseurs, orders: totalCommandes })}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
          {t('newSupplier')}
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b dark:border-gray-600">
        <button onClick={() => setTab('fournisseurs')} className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === 'fournisseurs' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 dark:text-gray-400'}`}>
          {t('tabSuppliers', { count: fournisseurs.length })}
        </button>
        <button onClick={() => setTab('commandes')} className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === 'commandes' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 dark:text-gray-400'}`}>
          {t('tabCommandes', { count: commandes.length })}
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('loading')}</div>
      ) : tab === 'fournisseurs' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 divide-y dark:divide-gray-600">
          {fournisseurs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('emptySuppliers')}</div>
          ) : fournisseurs.map(f => (
            <div key={f.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/70 transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{f.code}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{f.nom}</h3>
                    {!f.actif && <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 px-2 py-0.5 rounded-full">{t('inactif')}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {f.specialite && <span>{f.specialite}</span>}
                    {f.telephone && <span>{f.telephone}</span>}
                    {f.email && <span>{f.email}</span>}
                    <span>{t('ordersCount', { count: f.nbCommandes })}</span>
                    {f.noteEvaluation != null && <span>{t('note', { value: f.noteEvaluation })}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(f.id)} className="text-xs text-red-500 hover:text-red-700">{t('delete')}</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 divide-y dark:divide-gray-600">
          {commandes.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('emptyCommandes')}</div>
          ) : commandes.map(cmd => (
            <div key={cmd.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/70 transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{cmd.reference}</span>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{cmd.designation}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statutColors[cmd.statut]}`}>{t(`statut.${cmd.statut}`)}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>{t('supplier')}: {cmd.fournisseurNom}</span>
                    {cmd.projetNom && <span>{t('project')}: {cmd.projetNom}</span>}
                    <span>{t('amount')}: {formatMontant(cmd.montantTotal)}</span>
                    {cmd.dateCommande && <span>{t('orderedOn')} {cmd.dateCommande}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-gray-600 w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('modalTitle')}</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('nom')}</label><input value={formNom} onChange={e => setFormNom(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('telephone')}</label><input value={formTel} onChange={e => setFormTel(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label><input value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('contact')}</label><input value={formContact} onChange={e => setFormContact(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('specialite')}</label><input value={formSpec} onChange={e => setFormSpec(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adresse')}</label><textarea value={formAdresse} onChange={e => setFormAdresse(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" rows={2} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); resetForm() }} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">{t('cancel')}</button>
              <button onClick={handleCreate} disabled={!formNom.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{t('create')}</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-200">{error}</div>}
    </PageContainer>
  )
}
