import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchEvenements, createEvenement, deleteEvenement, fetchEvenementStats } from '@/store/slices/qualiteEvenementSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import { TypeEvenement, CategorieEvenement, OrigineEvenement, StatutEvenement } from '@/types/qualiteEvenement'
import type { EvenementQualiteCreateRequest } from '@/types/qualiteEvenement'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

const statutColors: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  DETECTEE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  EN_TRAITEMENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
  EN_VERIFICATION: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200',
  LEVEE: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  ANALYSEE: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-200',
  CLOTUREE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200',
}

const typeColors: Record<string, string> = {
  NC: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  RC: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  PPI: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
}

const catColors: Record<string, string> = {
  QUALITE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  SECURITE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  ENVIRONNEMENT: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

export default function EvenementsPage() {
  const { t } = useTranslation('qualite')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const { evenements, stats, totalPages, currentPage, loading } = useAppSelector(s => s.qualiteEvenement)
  const projets = useAppSelector(s => s.projet.projets)

  const [projetId, setProjetId] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<TypeEvenement | ''>('')
  const [filterStatut, setFilterStatut] = useState<StatutEvenement | ''>('')
  const [page, setPage] = useState(0)
  const [showModal, setShowModal] = useState(false)

  // Form
  const [formType, setFormType] = useState<TypeEvenement>(TypeEvenement.NC)
  const [formCategories, setFormCategories] = useState<Set<CategorieEvenement>>(new Set([CategorieEvenement.QUALITE]))
  const [formOrigine, setFormOrigine] = useState<OrigineEvenement>(OrigineEvenement.TRAVAUX)
  const [formDescription, setFormDescription] = useState('')
  const [formOuvrage, setFormOuvrage] = useState('')
  const [formCctp, setFormCctp] = useState(false)
  const [formFournisseur, setFormFournisseur] = useState('')
  const [formBc, setFormBc] = useState('')
  const [formBl, setFormBl] = useState('')

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])

  const loadData = useCallback(() => {
    dispatch(fetchEvenements({
      projetId: projetId ?? undefined,
      page,
      type: filterType || undefined,
      statut: filterStatut || undefined,
    }))
    dispatch(fetchEvenementStats(projetId ?? undefined))
  }, [dispatch, projetId, page, filterType, filterStatut])

  useEffect(() => { loadData() }, [loadData])

  const toggleCat = (cat: CategorieEvenement) => {
    const next = new Set(formCategories)
    if (next.has(cat)) { if (next.size > 1) next.delete(cat) } else next.add(cat)
    setFormCategories(next)
  }

  const handleSubmit = async () => {
    if (!projetId || !formDescription.trim()) return
    const req: EvenementQualiteCreateRequest = {
      projetId,
      typeEvenement: formType,
      categories: [...formCategories],
      origine: formOrigine,
      description: formDescription,
      ouvrageConcerne: formOuvrage || undefined,
      controleExigeCctp: formCctp,
      fournisseurNom: formFournisseur || undefined,
      numeroBc: formBc || undefined,
      numeroBl: formBl || undefined,
    }
    await dispatch(createEvenement(req))
    setShowModal(false)
    setFormDescription(''); setFormOuvrage(''); setFormFournisseur(''); setFormBc(''); setFormBl('')
    setFormCctp(false); setFormCategories(new Set([CategorieEvenement.QUALITE]))
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'evenements.confirmDelete', ns: 'qualite' })) {
      await dispatch(deleteEvenement(id)); loadData()
    }
  }

  const totalEvts = stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0

  const filteredEvenements = evenements.filter(ev => {
    if (filterType && ev.typeEvenement !== filterType) return false
    if (filterStatut && ev.statut !== filterStatut) return false
    return true
  })

  const KpiCard = ({ value, label, accent = '' }: { value: number | string; label: string; accent?: string }) => (
    <div className={CARD}>
      <div className={`${BODY} text-center`}>
        <p className={`text-xl sm:text-2xl font-bold tabular-nums ${accent || 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('evenements.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('evenements.subtitle')}</p>
        </div>
        {projetId && (
          <button onClick={() => setShowModal(true)}
            className="bg-[#FF6B35] text-white px-4 py-2.5 rounded-lg hover:bg-[#e55a2b] font-medium shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
            <span className="text-lg leading-none">+</span> {t('evenements.create')}
          </button>
        )}
      </div>

      {/* Project filter + KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className={`${CARD} col-span-2 lg:col-span-1`}>
          <div className={`${BODY} flex flex-col justify-center h-full`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('evenements.projet')}</p>
            <select value={projetId ?? ''} onChange={e => { setProjetId(e.target.value ? Number(e.target.value) : null); setPage(0) }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent">
              <option value="">{t('evenements.allProjets')}</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
        </div>
        <KpiCard value={totalEvts} label={t('evenements.kpi.total')} accent="text-blue-600 dark:text-blue-400" />
        <KpiCard value={(stats.EN_TRAITEMENT ?? 0) + (stats.EN_VERIFICATION ?? 0)} label={t('evenements.kpi.enCours')} accent="text-amber-600 dark:text-amber-400" />
        <KpiCard value={stats.CLOTUREE ?? 0} label={t('evenements.kpi.cloturees')} accent="text-green-600 dark:text-green-400" />
        <KpiCard value={totalEvts - (stats.CLOTUREE ?? 0)} label={t('evenements.kpi.ouvertes')} accent="text-red-600 dark:text-red-400" />
      </div>

      {/* Type filter chips */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setFilterType(''); setPage(0) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!filterType ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {t('evenements.allTypes')} ({evenements.length})
          </button>
          {Object.values(TypeEvenement).map(v => {
            const count = evenements.filter(ev => ev.typeEvenement === v).length
            return (
              <button key={v} onClick={() => { setFilterType(v); setPage(0) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterType === v ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {t(`evenements.types.${v}`)} ({count})
              </button>
            )
          })}
        </div>

        {/* Statut filter chips */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setFilterStatut(''); setPage(0) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!filterStatut ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {t('evenements.allStatuts')} ({evenements.length})
          </button>
          {Object.values(StatutEvenement).map(s => {
            const count = evenements.filter(ev => ev.statut === s).length
            return (
              <button key={s} onClick={() => { setFilterStatut(s); setPage(0) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatut === s ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {t(`evenements.statuts.${s}`)} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Event list */}
      <div className={CARD}>
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="inline-block w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-[#FF6B35] rounded-full animate-spin" />
          </div>
        ) : filteredEvenements.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{t('evenements.empty')}</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEvenements.map(ev => (
              <div key={ev.id}
                onClick={() => navigate(`/qualite/evenements/${ev.id}`)}
                className="px-4 py-3 sm:px-5 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">{ev.reference}</span>
                      {!projetId && <span className="text-xs text-gray-400 dark:text-gray-500">— {ev.projetNom}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs mt-1.5">
                      <span className={`px-2 py-0.5 rounded-md font-medium ${typeColors[ev.typeEvenement] ?? ''}`}>{ev.typeEvenement}</span>
                      {ev.categories.map(c => (
                        <span key={c} className={`px-2 py-0.5 rounded-md font-medium ${catColors[c] ?? ''}`}>{c[0]}</span>
                      ))}
                      <span className={`px-2 py-0.5 rounded-md font-medium ${statutColors[ev.statut] ?? ''}`}>{t(`evenements.statuts.${ev.statut}`)}</span>
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{t(`evenements.origines.${ev.origine}`)}</span>
                      {ev.ouvrageConcerne && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 max-w-[150px] truncate">{ev.ouvrageConcerne}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleDelete(ev.id)}
                      className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 transition">{t('evenements.delete')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-3 border-t border-gray-200 dark:border-gray-700">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-40 transition">&larr;</button>
            <span className="text-sm text-gray-500 dark:text-gray-400 self-center tabular-nums">{page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-40 transition">&rarr;</button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 overflow-y-auto p-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:border dark:border-gray-600 w-full max-w-2xl p-5 sm:p-6 my-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('evenements.create')}</h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('evenements.type')}</label>
                  <select value={formType} onChange={e => setFormType(e.target.value as TypeEvenement)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent">
                    {Object.values(TypeEvenement).map(v => <option key={v} value={v}>{t(`evenements.types.${v}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('evenements.origine')}</label>
                  <select value={formOrigine} onChange={e => setFormOrigine(e.target.value as OrigineEvenement)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent">
                    {Object.values(OrigineEvenement).map(v => <option key={v} value={v}>{t(`evenements.origines.${v}`)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('evenements.categories')}</label>
                <div className="flex gap-3">
                  {Object.values(CategorieEvenement).map(c => (
                    <label key={c} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                      <input type="checkbox" checked={formCategories.has(c)} onChange={() => toggleCat(c)}
                        className="rounded border-gray-300 dark:border-gray-600 text-[#FF6B35] focus:ring-[#FF6B35]" />
                      {t(`evenements.cats.${c}`)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('evenements.description')}</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('evenements.ouvrage')}</label>
                  <input value={formOuvrage} onChange={e => setFormOuvrage(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={formCctp} onChange={e => setFormCctp(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-[#FF6B35] focus:ring-[#FF6B35]" />
                    {t('evenements.cctp')}
                  </label>
                </div>
              </div>

              {/* Bloc sous-traitance */}
              <details className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer px-4 py-3">{t('evenements.sousTraitance')}</summary>
                <div className="grid grid-cols-3 gap-3 px-4 pb-4">
                  <input placeholder={t('evenements.fournisseur')} value={formFournisseur} onChange={e => setFormFournisseur(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent" />
                  <input placeholder={t('evenements.bc')} value={formBc} onChange={e => setFormBc(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent" />
                  <input placeholder={t('evenements.bl')} value={formBl} onChange={e => setFormBl(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent" />
                </div>
              </details>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition">
                {t('evenements.cancel')}
              </button>
              <button onClick={handleSubmit} disabled={!formDescription.trim()}
                className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] disabled:opacity-50 text-sm font-medium shadow-sm transition">
                {t('evenements.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
