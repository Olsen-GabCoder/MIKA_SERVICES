import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchReceptions,
  createReception,
  deleteReception,
  fetchReceptionSummary,
} from '@/store/slices/qualiteReceptionSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import {
  NatureReception,
  SousTypeReception,
} from '@/types/qualiteReception'
import type { DemandeReceptionCreateRequest } from '@/types/qualiteReception'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

const statutColors: Record<string, string> = {
  ETABLIE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  EN_ATTENTE_MDC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ACCORDEE_SANS_RESERVE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  ACCORDEE_AVEC_RESERVE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  REJETEE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function ReceptionsTravauxPage() {
  const { t } = useTranslation('qualite')
  const dispatch = useAppDispatch()
  const projets = useAppSelector(s => s.projet.projets)
  const { demandes, summary, loading, totalPages, currentPage } = useAppSelector(s => s.qualiteReception)
  const [projetId, setProjetId] = useState<number | null>(null)
  const [natureFilter, setNatureFilter] = useState<NatureReception | ''>('')
  const [sousTypeFilter, setSousTypeFilter] = useState<SousTypeReception | ''>('')
  const [page, setPage] = useState(0)
  const [showCreate, setShowCreate] = useState(false)

  // Form state
  const [formTitre, setFormTitre] = useState('')
  const [formNature, setFormNature] = useState<NatureReception>(NatureReception.TOPOGRAPHIE)
  const [formSousType, setFormSousType] = useState<SousTypeReception>(SousTypeReception.TERRASSEMENT)
  const [formZone, setFormZone] = useState('')
  const [formDate, setFormDate] = useState('')

  const currentMois = new Date().toISOString().slice(0, 7)

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])

  const loadData = useCallback(() => {
    dispatch(fetchReceptions({
      projetId: projetId ?? undefined,
      page,
      nature: natureFilter || undefined,
      sousType: sousTypeFilter || undefined,
    }))
    if (projetId) {
      dispatch(fetchReceptionSummary({ projetId, mois: currentMois }))
    }
  }, [dispatch, projetId, page, natureFilter, sousTypeFilter, currentMois])

  useEffect(() => { loadData() }, [loadData])

  const handleCreate = async () => {
    if (!projetId || !formTitre.trim()) return
    const req: DemandeReceptionCreateRequest = {
      projetId,
      titre: formTitre.trim(),
      nature: formNature,
      sousType: formSousType,
      zoneOuvrage: formZone.trim() || undefined,
      dateDemande: formDate || undefined,
    }
    await dispatch(createReception(req))
    setShowCreate(false)
    setFormTitre('')
    setFormZone('')
    setFormDate('')
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('receptions.confirmDelete'))) return
    await dispatch(deleteReception(id))
    loadData()
  }

  // KPI from summary
  const kpi = { total: 0, etablies: 0, enAttente: 0, accordees: 0, rejetees: 0 }
  summary.forEach(s => {
    kpi.total += s.total
    kpi.etablies += s.parStatut?.ETABLIE ?? 0
    kpi.enAttente += s.parStatut?.EN_ATTENTE_MDC ?? 0
    kpi.accordees += (s.parStatut?.ACCORDEE_SANS_RESERVE ?? 0) + (s.parStatut?.ACCORDEE_AVEC_RESERVE ?? 0)
    kpi.rejetees += s.parStatut?.REJETEE ?? 0
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('receptions.title')}</h1>
        {projetId && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#e55a28] transition self-start sm:self-auto"
          >
            + {t('receptions.create')}
          </button>
        )}
      </div>

      {/* Project filter + KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={`${CARD} col-span-2 sm:col-span-1`}>
          <div className={`${BODY} flex flex-col justify-center h-full`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('receptions.projet')}</p>
            <select
              value={projetId ?? ''}
              onChange={e => { setProjetId(e.target.value ? Number(e.target.value) : null); setPage(0) }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            >
              <option value="">{t('receptions.allProjets')}</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
        </div>
        {[
          { label: t('receptions.kpi.total'), value: kpi.total, color: 'text-gray-900 dark:text-white' },
          { label: t('receptions.kpi.etablies'), value: kpi.etablies, color: 'text-gray-600 dark:text-gray-300' },
          { label: t('receptions.kpi.enAttente'), value: kpi.enAttente, color: 'text-blue-600 dark:text-blue-400' },
          { label: t('receptions.kpi.accordees'), value: kpi.accordees, color: 'text-green-600 dark:text-green-400' },
          { label: t('receptions.kpi.rejetees'), value: kpi.rejetees, color: 'text-red-600 dark:text-red-400' },
        ].map(k => (
          <div key={k.label} className={CARD + ' p-4 text-center'}>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={natureFilter}
          onChange={e => { setNatureFilter(e.target.value as NatureReception | ''); setPage(0) }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-2 text-gray-900 dark:text-white"
        >
          <option value="">{t('receptions.nature')} — Tous</option>
          {Object.values(NatureReception).map(n => (
            <option key={n} value={n}>{t(`receptions.natures.${n}`)}</option>
          ))}
        </select>
        <select
          value={sousTypeFilter}
          onChange={e => { setSousTypeFilter(e.target.value as SousTypeReception | ''); setPage(0) }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-2 text-gray-900 dark:text-white"
        >
          <option value="">{t('receptions.sousType')} — Tous</option>
          {Object.values(SousTypeReception).map(st => (
            <option key={st} value={st}>{t(`receptions.sousTypes.${st}`)}</option>
          ))}
        </select>
      </div>

      {/* Liste */}
      <div className={CARD}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-[#FF6B35] rounded-full animate-spin" />
          </div>
        ) : demandes.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-12">{t('receptions.empty')}</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {demandes.map(d => (
              <div key={d.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{d.reference}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColors[d.statut] ?? ''}`}>
                      {t(`receptions.statuts.${d.statut}`)}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white mt-1 truncate">
                    {d.titre}
                    {!projetId && <span className="text-sm text-gray-500 dark:text-gray-400 font-normal"> — {d.projetNom}</span>}
                  </p>
                  <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                    <span>{t(`receptions.natures.${d.nature}`)}</span>
                    <span>{t(`receptions.sousTypes.${d.sousType}`)}</span>
                    {d.zoneOuvrage && <span>{d.zoneOuvrage}</span>}
                    {d.dateDemande && <span>{d.dateDemande}</span>}
                    {d.demandeurNom && <span>{d.demandeurNom}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 shrink-0"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-3 border-t border-gray-100 dark:border-gray-700">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-40">
              &larr;
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 self-center">
              {currentPage + 1} / {totalPages}
            </span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-40">
              &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Modal création */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className={CARD + ' w-full max-w-lg p-6'} onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('receptions.create')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('receptions.titre')} *</label>
                <input
                  type="text" value={formTitre} onChange={e => setFormTitre(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  maxLength={300}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('receptions.nature')} *</label>
                  <select
                    value={formNature} onChange={e => setFormNature(e.target.value as NatureReception)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    {Object.values(NatureReception).map(n => (
                      <option key={n} value={n}>{t(`receptions.natures.${n}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('receptions.sousType')} *</label>
                  <select
                    value={formSousType} onChange={e => setFormSousType(e.target.value as SousTypeReception)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    {Object.values(SousTypeReception).map(st => (
                      <option key={st} value={st}>{t(`receptions.sousTypes.${st}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('receptions.zoneOuvrage')}</label>
                <input
                  type="text" value={formZone} onChange={e => setFormZone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('receptions.dateDemande')}</label>
                <input
                  type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                Annuler
              </button>
              <button onClick={handleCreate} disabled={!formTitre.trim()}
                className="px-4 py-2 rounded-lg bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#e55a28] transition disabled:opacity-50">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
