import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useFormatDate } from '@/hooks/useFormatDate'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { ProjetDownloadDocumentModal } from '@/features/projet/components/ProjetDownloadDocumentModal'
import { generateProjetDocument } from '@/features/projet/export'
import type { ProjetDocumentPayload, DocumentExportFormat } from '@/features/projet/export/types'
import { PageContainer } from '@/components/layout/PageContainer'
import { fetchProjetById, clearProjetDetail } from '@/store/slices/projetSlice'
import { projetApi, pointBloquantApi } from '@/api/projetApi'
import { reportingApi } from '@/api/reportingApi'
import { ProjetVisualisationsSection } from '@/features/projet/components/ProjetVisualisations'
import type { PointBloquant, Prevision, ModeSuiviMensuel, Priorite, StatutPointBloquant } from '@/types/projet'
import { getTypeProjetDisplay, getProjetTypes } from '@/types/projet'
import type { ProjetReport } from '@/types/reporting'

/** Classes CSS pour la couleur du texte priorité (clair + dark). */
function getPrioriteTextClass(priorite: Priorite | string): string {
  const map: Record<string, string> = {
    BASSE: 'text-gray-600 dark:text-gray-400',
    NORMALE: 'text-blue-600 dark:text-blue-400',
    HAUTE: 'text-amber-700 dark:text-amber-400',
    URGENTE: 'text-orange-700 dark:text-orange-400',
    CRITIQUE: 'text-red-700 dark:text-red-400',
  }
  return `text-xs ${map[priorite] ?? map.NORMALE}`
}

/** Classes CSS pour la couleur du texte statut point bloquant (clair + dark). */
function getStatutPointBloquantTextClass(statut: StatutPointBloquant | string): string {
  const map: Record<string, string> = {
    OUVERT: 'text-amber-700 dark:text-amber-400',
    EN_COURS: 'text-blue-600 dark:text-blue-400',
    RESOLU: 'text-green-700 dark:text-green-400',
    FERME: 'text-gray-600 dark:text-gray-400',
    ESCALADE: 'text-red-700 dark:text-red-400',
  }
  return `text-xs ${map[statut] ?? map.OUVERT}`
}

/** Liste des mois entre dateDebut et dateFin (période du projet). */
function getMoisEntreDates(
  dateDebut?: string | null,
  dateFin?: string | null,
  monthsShort: string[] = ['Janv', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
): { label: string; mois: number; annee: number }[] {
  if (!dateDebut || !dateFin) return []
  const start = new Date(dateDebut)
  const end = new Date(dateFin)
  if (end < start) return []
  const mois: { label: string; mois: number; annee: number }[] = []
  let cur = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cur <= endMonth) {
    mois.push({
      label: `${monthsShort[cur.getMonth()]}-${cur.getFullYear()}`,
      mois: cur.getMonth() + 1,
      annee: cur.getFullYear(),
    })
    cur.setMonth(cur.getMonth() + 1)
  }
  return mois
}

export interface LigneChiffreAffaires {
  label: string
  caPrevisionnel: number
  caRealise: number
  ecart: number
  /** Avancement cumulé en % ; null si aucun CA enregistré pour ce mois (cellule vide) */
  avancementCumule: number | null
}

/** Numéro de la semaine calendaire (ISO 8601) pour une date : 1–53, indépendant du projet. */
function getSemaineCalendaireISO(date: Date): number {
  const d = new Date(date.getTime())
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() || 7 // Lundi = 1, Dimanche = 7
  d.setDate(d.getDate() - day + 4) // Jeudi de la semaine
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d.getTime() - jan1.getTime()) / 86400000) + 1) / 7)
}

/** Semaine calendaire actuelle (numéro de semaine dans l'année), indépendante de la date de début du projet. */
function getSemaineCalendaireActuelle(): { week: number; year: number } {
  const now = new Date()
  return { week: getSemaineCalendaireISO(now), year: now.getFullYear() }
}

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm dark:shadow-none overflow-hidden'
const CARD_HEADER = 'px-5 py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide'
const CARD_BODY = 'p-5'
const TABLE_WRAP = 'w-full min-w-0 overflow-x-auto'
const TABLE_BASE = 'w-full text-sm border-collapse table-fixed'
const TH_BASE = 'py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600'
const TD_BASE = 'py-2.5 px-3 border-b border-gray-100 dark:border-gray-600 text-gray-800 dark:text-gray-200'

export const ProjetDetailPage = () => {
  const { t } = useTranslation('projet')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((state) => state.auth.user)
  const { projetDetail: projet, loading, error } = useAppSelector((state) => state.projet)
  const [pointsBloquants, setPointsBloquants] = useState<PointBloquant[]>([])
  const [previsions, setPrevisions] = useState<Prevision[]>([])
  const [rapport, setRapport] = useState<ProjetReport | null>(null)
  const [suiviMensuel, setSuiviMensuel] = useState<{ mois: number; annee: number; caPrevisionnel: number; caRealise: number; ecart?: number; avancementCumule?: number }[]>([])
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [exportingDocument, setExportingDocument] = useState(false)
  const [suiviMensuelExpanded, setSuiviMensuelExpanded] = useState(false)

  const monthsShort = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => t(`detail.monthsShort_${i}`))
  const isAdmin = currentUser?.roles?.some((r) => r.code === 'ADMIN' || r.code === 'SUPER_ADMIN') ?? false
  const isChefDeProjet = Boolean(projet?.responsableProjet && currentUser?.id === projet.responsableProjet.id)

  useEffect(() => {
    if (id) dispatch(fetchProjetById(Number(id)))
    return () => { dispatch(clearProjetDetail()) }
  }, [dispatch, id])

  useEffect(() => {
    if (!projet?.id) return
    pointBloquantApi.findByProjet(projet.id).then((res) => setPointsBloquants(res.content ?? [])).catch(() => setPointsBloquants([]))
    projetApi.getPrevisions(projet.id).then(setPrevisions).catch(() => setPrevisions([]))
    reportingApi.getProjetReport(projet.id).then(setRapport).catch(() => setRapport(null))
    projetApi.getSuiviMensuel(projet.id).then((list) => {
      setSuiviMensuel(list.map((r) => ({
        mois: r.mois,
        annee: r.annee,
        caPrevisionnel: typeof r.caPrevisionnel === 'number' ? r.caPrevisionnel : Number(r.caPrevisionnel) || 0,
        caRealise: typeof r.caRealise === 'number' ? r.caRealise : Number(r.caRealise) || 0,
        ecart: typeof r.ecart === 'number' ? r.ecart : Number(r.ecart) || 0,
        avancementCumule: typeof r.avancementCumule === 'number' ? r.avancementCumule : Number(r.avancementCumule) || 0,
      })))
    }).catch(() => setSuiviMensuel([]))
  }, [projet?.id])

  const formatDate = useFormatDate()
  const { formatMontant } = useFormatNumber()

  /** Délai en mois calculé à partir de dateDebut et dateFin */
  const delaiMois = projet?.delaiMois ?? (projet?.dateDebut && projet?.dateFin
    ? Math.max(1, Math.round((new Date(projet.dateFin).getTime() - new Date(projet.dateDebut).getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
    : null)

  const budgetPrevu = rapport?.budget?.budgetTotalPrevu ?? projet?.montantHT ?? 0
  const depensesTotales = rapport?.budget?.depensesTotales ?? 0
  // Tableau de suivi mensuel :
  // - AUTO : synchronisé avec les dates réelles (fallback sur dates prévues)
  // - MANUEL : liste affichée telle quelle (triée par année/mois), sans recalcul de plage de dates
  const modeSuiviMensuel = ((projet?.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO')
  const dateDebutSuivi = projet?.dateDebutReel ?? projet?.dateDebut
  const dateFinSuivi = projet?.dateFinReelle ?? projet?.dateFin

  const moisSuivi = modeSuiviMensuel === 'MANUEL'
    ? suiviMensuel
        .slice()
        .sort((a, b) => (a.annee - b.annee) || (a.mois - b.mois))
        .map((r) => ({ label: `${monthsShort[(r.mois ?? 1) - 1] ?? ''}-${r.annee}`, mois: r.mois, annee: r.annee }))
    : getMoisEntreDates(dateDebutSuivi, dateFinSuivi, monthsShort)

  const bySuivi: Record<string, { caPrevisionnel: number; caRealise: number; ecart: number; avancementCumule: number }> = {}
  suiviMensuel.forEach((r) => {
    bySuivi[`${r.mois}-${r.annee}`] = {
      caPrevisionnel: r.caPrevisionnel,
      caRealise: r.caRealise,
      ecart: r.ecart ?? r.caRealise - r.caPrevisionnel,
      avancementCumule: r.avancementCumule ?? 0,
    }
  })

  let cumulRealise = 0
  const lignesCA: LigneChiffreAffaires[] = moisSuivi.map(({ label, mois, annee }) => {
    const saved = bySuivi[`${mois}-${annee}`]
    const caPrevisionnel = saved?.caPrevisionnel ?? 0
    const caRealise = saved?.caRealise ?? 0
    const ecart = saved?.ecart ?? caRealise - caPrevisionnel
    const hasData = saved != null && (caPrevisionnel !== 0 || caRealise !== 0)
    if (hasData) cumulRealise += caRealise
    const avancementCumule: number | null = hasData && budgetPrevu > 0
      ? Math.round((cumulRealise / budgetPrevu) * 10000) / 100
      : hasData && saved?.avancementCumule != null
        ? saved.avancementCumule
        : null
    return { label, caPrevisionnel, caRealise, ecart, avancementCumule }
  })
  const { week: semaineCalendaire, year: anneeCalendaire } = getSemaineCalendaireActuelle()

  /** Affichage limité du suivi mensuel : nombre de mois visibles par défaut */
  const SUIVI_MENSUEL_INITIAL_MOIS = 12
  const lignesCAVisibles = suiviMensuelExpanded ? lignesCA : lignesCA.slice(0, SUIVI_MENSUEL_INITIAL_MOIS)
  const suiviMensuelHasMore = lignesCA.length > SUIVI_MENSUEL_INITIAL_MOIS
  const totauxCA = lignesCA.length > 0
    ? {
        caPrevisionnel: lignesCA.reduce((s, l) => s + l.caPrevisionnel, 0),
        caRealise: lignesCA.reduce((s, l) => s + l.caRealise, 0),
        ecart: lignesCA.reduce((s, l) => s + l.ecart, 0),
        avancementCumule: (() => { const lastWithPct = [...lignesCA].reverse().find((l) => l.avancementCumule != null); return lastWithPct?.avancementCumule ?? null })(),
      }
    : null

  const handleDownloadDocument = async (format: DocumentExportFormat) => {
    if (!projet) return
    setExportingDocument(true)
    try {
      const baseFilename = `projet-${projet.id}-${projet.nom.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40)}-${new Date().toISOString().slice(0, 10)}`
      const payload: ProjetDocumentPayload = {
        projet,
        rapport,
        lignesCA,
        pointsBloquants,
        previsions,
        budgetPrevu,
        depensesTotales,
        semaineCalendaire,
        anneeCalendaire,
        delaiMois: delaiMois ?? null,
        formatMontant,
        formatDate,
        formatTime: () => formatDate(new Date().toISOString(), { timeOnly: true }),
      }
      await generateProjetDocument(payload, format, baseFilename)
      setDownloadModalOpen(false)
    } finally {
      setExportingDocument(false)
    }
  }

  if (loading) return <PageContainer><div className="text-center text-gray-500 py-12">{t('detail.loading')}</div></PageContainer>
  if (error) return <PageContainer><div className="text-center text-red-500 py-12">{error}</div></PageContainer>
  if (!projet) return <PageContainer><div className="text-center text-gray-500 py-12">{t('detail.notFound')}</div></PageContainer>

  return (
    <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
      <ProjetDownloadDocumentModal
        open={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        onSelectFormat={handleDownloadDocument}
        generating={exportingDocument}
      />

      {/* En-tête du projet */}
      <header className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg mb-6 overflow-hidden">
        <div className="px-6 py-6 md:py-8">
          <button
            onClick={() =>
              navigate('/projets', {
                state: (location.state as { fromListState?: unknown } | null)?.fromListState != null
                  ? { fromListState: (location.state as { fromListState: unknown }).fromListState }
                  : undefined,
              })
            }
            className="text-white/80 hover:text-white text-sm mb-4 flex items-center gap-1"
          >
            ← {t('detail.backToList')}
          </button>
          <p className="text-white/90 text-sm uppercase tracking-wider font-medium">
            {t('detail.managerLabel')} : {projet.responsableProjet ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}` : '—'}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1 leading-tight">
            {projet.numeroMarche ? `${projet.numeroMarche} — ` : ''}{projet.nom}
          </h1>
          <p className="text-white/80 text-sm mt-2">
            {t('detail.numeroMarcheIntitule')} : {projet.numeroMarche ? `${projet.numeroMarche} — ` : ''}{projet.nom}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20">
              {t('detail.statutLabel')} : {t(`enums.statut.${projet.statut}`)}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/25">
              {t('detail.weekLabel', { week: semaineCalendaire, year: anneeCalendaire })}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/projets/${projet.id}/historique`)}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-5 py-2 rounded-lg transition"
            >
              {t('historique.buttonLabel')}
            </button>
            <button
              type="button"
              onClick={() => setDownloadModalOpen(true)}
              disabled={exportingDocument}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-60"
            >
              {exportingDocument ? t('detail.downloadGenerating') : t('detail.downloadDocument')}
            </button>
            {(isChefDeProjet || isAdmin) && (
              <button onClick={() => navigate(`/projets/${projet.id}/edit`)} className="bg-white dark:bg-gray-100 text-primary hover:bg-white/90 dark:hover:bg-gray-200 font-semibold px-5 py-2 rounded-lg shadow">
                {t('detail.editProject')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* LAYOUT PLEINE LARGEUR - TOUTES LES CARTES */}
      <div className="space-y-6">
        
        {/* 1. Informations contractuelles */}
        <section className={CARD}>
          <h2 className={CARD_HEADER}>{t('detail.section1')}</h2>
          <div className={CARD_BODY}>
            <div className={TABLE_WRAP}>
              <table className={TABLE_BASE} style={{ tableLayout: 'fixed' }}>
                <colgroup><col style={{ width: '25%' }} /><col style={{ width: '75%' }} /></colgroup>
                <tbody>
                  <tr><td className={`${TD_BASE} text-gray-600 dark:text-gray-400`}>{t('detail.montantMarche')}</td><td className={`${TD_BASE} font-semibold text-gray-900 dark:text-gray-100`}>{formatMontant(projet.montantHT)} HT</td></tr>
                  <tr><td className={`${TD_BASE} text-gray-600 dark:text-gray-400`}>{t('detail.delai')}</td><td className={`${TD_BASE} font-semibold text-gray-900 dark:text-gray-100`}>{delaiMois != null ? `${delaiMois} ${t('detail.months')}` : '—'}</td></tr>
                  <tr><td className={`${TD_BASE} text-gray-600 dark:text-gray-400`}>{t('detail.dateDebut')}</td><td className={`${TD_BASE} font-semibold text-gray-900 dark:text-gray-100`}>{formatDate(projet.dateDebut)}</td></tr>
                  <tr><td className={`${TD_BASE} text-gray-600 dark:text-gray-400`}>{t('detail.dateFin')}</td><td className={`${TD_BASE} font-semibold text-gray-900 dark:text-gray-100`}>{formatDate(projet.dateFin)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 2. Tableau de suivi mensuel */}
        <section className={CARD}>
          <div className={`${CARD_HEADER} flex items-center justify-between gap-3`}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{t('detail.section2')}</h2>
            {lignesCA.length > 0 && suiviMensuelHasMore && (
              <button
                type="button"
                onClick={() => setSuiviMensuelExpanded((e) => !e)}
                className="text-xs font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary hover:underline shrink-0"
              >
                {suiviMensuelExpanded ? t('detail.showLess') : t('detail.showAllMonths', { count: lignesCA.length })}
              </button>
            )}
          </div>
          <div className={CARD_BODY}>
            {lignesCA.length === 0 ? (
              <p className="text-gray-600 text-sm py-4">
                {modeSuiviMensuel === 'MANUEL' ? t('detail.suiviMensuelEmptyManual') : t('detail.suiviMensuelEmpty')}
              </p>
            ) : (
              <>
                <div className={TABLE_WRAP}>
                  <table className={TABLE_BASE}>
                    <colgroup>
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className={TH_BASE}>{t('detail.colMonth')}</th>
                        <th className={`${TH_BASE} text-right`}>{t('detail.colCaPrevisionnel')}</th>
                        <th className={`${TH_BASE} text-right`}>{t('detail.colCaRealise')}</th>
                        <th className={`${TH_BASE} text-right`}>{t('detail.colEcart')}</th>
                        <th className={`${TH_BASE} text-right`}>{t('detail.colAvancementCumule')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignesCAVisibles.map((ligne) => (
                        <tr key={ligne.label} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/60 transition-colors">
                          <td className={`${TD_BASE} font-medium text-gray-900 dark:text-gray-100`}>{ligne.label}</td>
                          <td className={`${TD_BASE} text-right tabular-nums text-gray-500`}>{ligne.caPrevisionnel === 0 ? '—' : formatMontant(ligne.caPrevisionnel)}</td>
                          <td className={`${TD_BASE} text-right tabular-nums text-gray-500`}>{ligne.caRealise === 0 ? '—' : formatMontant(ligne.caRealise)}</td>
                          <td className={`${TD_BASE} text-right tabular-nums font-medium ${ligne.ecart === 0 ? 'text-gray-500' : ligne.ecart >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{ligne.ecart === 0 ? '—' : formatMontant(ligne.ecart)}</td>
                          <td className={`${TD_BASE} text-right tabular-nums font-semibold text-gray-500 dark:text-gray-400`}>{ligne.avancementCumule == null ? '—' : ligne.avancementCumule === 0 ? '—' : `${ligne.avancementCumule} %`}</td>
                        </tr>
                      ))}
                    </tbody>
                    {totauxCA && (
                      <tfoot>
                        <tr className="bg-primary/10 dark:bg-primary/20 border-t-2 border-primary/30 dark:border-primary/40">
                          <td className="py-3 px-3 text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{t('detail.total')}</td>
                          <td className="py-3 px-3 text-right tabular-nums text-sm font-bold text-gray-900 dark:text-gray-100">{formatMontant(totauxCA.caPrevisionnel)}</td>
                          <td className="py-3 px-3 text-right tabular-nums text-sm font-bold text-gray-900 dark:text-gray-100">{formatMontant(totauxCA.caRealise)}</td>
                          <td className={`py-3 px-3 text-right tabular-nums text-sm font-bold ${totauxCA.ecart === 0 ? 'text-gray-600 dark:text-gray-300' : totauxCA.ecart >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{formatMontant(totauxCA.ecart)}</td>
                          <td className="py-3 px-3 text-right tabular-nums text-sm font-semibold text-gray-700 dark:text-gray-200">{totauxCA.avancementCumule != null ? `${totauxCA.avancementCumule} %` : '—'}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
                <p className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                  {t('detail.suiviMensuelHint', { budget: formatMontant(budgetPrevu), depenses: formatMontant(depensesTotales) })}
                </p>
              </>
            )}
          </div>
        </section>

        {/* 3. État d'avancement des Études */}
        <section className={CARD}>
          <h2 className={CARD_HEADER}>{t('detail.section3')}</h2>
          <div className={CARD_BODY}>
            <div className={TABLE_WRAP}>
              <table className={TABLE_BASE}>
                <colgroup>
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '32%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className={TH_BASE}>{t('detail.colType')}</th>
                    <th className={TH_BASE}>{t('detail.colAvancementPct')}</th>
                    <th className={TH_BASE}>{t('detail.colDepot')}</th>
                    <th className={TH_BASE}>{t('detail.colValidation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(projet.avancementEtudes?.length ?? 0) > 0 ? (
                    projet.avancementEtudes!.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/60 transition-colors">
                        <td className={`${TD_BASE} font-medium text-gray-900 dark:text-gray-100`}>{t(`enums.phaseEtude.${e.phase}`) || e.phase}</td>
                        <td className={`${TD_BASE} tabular-nums`}>{e.avancementPct != null ? `${e.avancementPct} %` : '—'}</td>
                        <td className={TD_BASE}>{formatDate(e.dateDepot)}</td>
                        <td className={TD_BASE}>{e.etatValidation && ['NON_DEPOSE', 'EN_ATTENTE', 'EN_COURS', 'VALIDE', 'REFUSE'].includes(e.etatValidation) ? t(`enums.etatValidationEtude.${e.etatValidation}`) : (e.etatValidation || '—')}</td>
                      </tr>
                    ))
                  ) : (
                    (['APS', 'APD', 'EXE', 'GEOTECHNIQUE', 'HYDRAULIQUE', 'EIES', 'PAES'] as const).map((phase) => (
                      <tr key={phase} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/60 transition-colors">
                        <td className={`${TD_BASE} font-medium text-gray-900 dark:text-gray-100`}>{t(`enums.phaseEtude.${phase}`) || phase}</td>
                        <td className={TD_BASE}>—</td>
                        <td className={TD_BASE}>—</td>
                        <td className={TD_BASE}>—</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. Avancement des travaux — pilotage hebdomadaire */}
        {(() => {
          const tachesRealiseSemaine = previsions.filter(
            (p) => p.semaine === semaineCalendaire && p.annee === anneeCalendaire
          )
          const semaineProchaine = semaineCalendaire < 53 ? semaineCalendaire + 1 : 1
          const anneeProchaine = semaineCalendaire < 53 ? anneeCalendaire : anneeCalendaire + 1
          const tachesPrevuesExplicites = previsions.filter(
            (p) => p.semaine === semaineProchaine && p.annee === anneeProchaine
          )
          const tachesReportees = previsions.filter((p) => {
            const a = p.annee ?? 0
            const s = p.semaine ?? 0
            const isPast = a < anneeCalendaire || (a === anneeCalendaire && s < semaineCalendaire)
            const isIncomplete = p.avancementPct == null || p.avancementPct < 100
            return isPast && isIncomplete
          })
          const avancementsGlobaux = [...tachesRealiseSemaine, ...tachesReportees]
            .map((p) => p.avancementPct)
            .filter((v): v is number => v != null)
          const globalPct = avancementsGlobaux.length > 0
            ? Math.round((avancementsGlobaux.reduce((a, b) => a + b, 0) / avancementsGlobaux.length) * 100) / 100
            : null

          return (
            <section className={CARD}>
              <div className={`${CARD_HEADER} flex items-center justify-between gap-3`}>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  {t('detail.section4')}
                  <span className="ml-2 font-normal normal-case text-primary">
                    — {t('detail.weekInProgress', { week: semaineCalendaire, year: anneeCalendaire })}
                  </span>
                </h2>
                {globalPct != null && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                    {t('detail.section4GlobalProgress', { pct: globalPct })}
                  </span>
                )}
              </div>
              <div className={CARD_BODY}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Colonne gauche : Réalisé semaine en cours + Reportées à faire cette semaine */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                      {t('detail.section4Realise')}
                    </h3>
                    {tachesRealiseSemaine.length > 0 ? (
                      <ul className="space-y-2">
                        {tachesRealiseSemaine.map((p) => (
                          <li key={p.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {p.description || p.type.replace(/_/g, ' ')}
                              </p>
                            </div>
                            {p.avancementPct != null && (
                              <div className="flex-shrink-0 flex items-center gap-1.5">
                                <div className="w-16 h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${p.avancementPct >= 100 ? 'bg-green-500' : p.avancementPct >= 50 ? 'bg-primary' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(100, p.avancementPct)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                  {p.avancementPct} %
                                </span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{t('detail.section4NoRealise')}</p>
                    )}

                    {/* Reportées à faire cette semaine */}
                    {tachesReportees.length > 0 && (
                      <div className="mt-5">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3">
                          {t('detail.section4ReporteesCetteSemaine')}
                        </h3>
                        <ul className="space-y-2">
                          {tachesReportees.map((p) => (
                            <li
                              key={p.id}
                              className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {p.description || p.type.replace(/_/g, ' ')}
                                </p>
                                {p.semaine != null && p.annee != null && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 block">
                                    {t('detail.section4Reportee', { week: p.semaine, year: p.annee })}
                                  </span>
                                )}
                              </div>
                              {p.avancementPct != null && (
                                <div className="flex-shrink-0 flex items-center gap-1.5">
                                  <div className="w-16 h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${p.avancementPct >= 100 ? 'bg-green-500' : p.avancementPct >= 50 ? 'bg-primary' : 'bg-amber-500'}`}
                                      style={{ width: `${Math.min(100, p.avancementPct)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    {p.avancementPct} %
                                  </span>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
                          {t('detail.section4CarryOverNote')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Colonne droite : Prévisions semaine suivante (explicites uniquement) */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                      {t('detail.section4Previsions')}
                      <span className="ml-2 font-normal normal-case text-primary">
                        — {t('detail.weekLabel', { week: semaineProchaine, year: anneeProchaine })}
                      </span>
                    </h3>
                    {tachesPrevuesExplicites.length > 0 ? (
                      <ul className="space-y-2">
                        {tachesPrevuesExplicites.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-start gap-3 p-2.5 rounded-lg border bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {p.description || p.type.replace(/_/g, ' ')}
                              </p>
                            </div>
                            {p.avancementPct != null && (
                              <div className="flex-shrink-0 flex items-center gap-1.5">
                                <div className="w-14 h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${p.avancementPct >= 100 ? 'bg-green-500' : p.avancementPct >= 50 ? 'bg-primary' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(100, p.avancementPct)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                  {p.avancementPct} %
                                </span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{t('detail.section4NoPrevisions')}</p>
                    )}
                  </div>
                </div>

                {/* Points bloquants + Besoins */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t('detail.pointsBloquants')}</h3>
                    {pointsBloquants.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        {pointsBloquants.map((pb) => (
                          <li key={pb.id}>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{pb.titre}</span>
                            {pb.description && <span className="text-gray-600 dark:text-gray-400"> — {pb.description}</span>}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {' '}(<span className={getPrioriteTextClass(pb.priorite)}>{t(`enums.priorite.${pb.priorite}`)}</span>, <span className={getStatutPointBloquantTextClass(pb.statut)}>{t(`enums.statutPointBloquant.${pb.statut}`)}</span>)
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{t('detail.noPointsBloquants')}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t('detail.besoinsMateriel')}</h3>
                      {projet.besoinsMateriel ? (
                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                          {projet.besoinsMateriel.split(/\s*•\s*/).filter(Boolean).map((s, i) => (
                            <li key={i}>{s.trim()}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t('detail.besoinsHumain')}</h3>
                      {projet.besoinsHumain ? (
                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                          {projet.besoinsHumain.split(/\s*•\s*/).filter(Boolean).map((s, i) => (
                            <li key={i}>{s.trim()}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )
        })()}

        {/* 5. Description, observations et propositions */}
        <section className={CARD}>
          <h2 className={CARD_HEADER}>{t('detail.section5')}</h2>
          <div className={CARD_BODY}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('detail.description')}</p>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{projet.description || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('detail.observations')}</p>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{projet.observations || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('detail.propositionsAmelioration')}</p>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{projet.propositionsAmelioration || '—'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Alertes et indicateurs */}
        {(pointsBloquants.length > 0 || (rapport && (rapport.planning.tachesEnRetard > 0 || rapport.securite.risquesCritiques > 0))) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pointsBloquants.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4">
                <span className="font-semibold text-amber-800 dark:text-amber-200">{t('detail.pointsBloquants')}</span>
                <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">{t('detail.pointsToProcess', { count: pointsBloquants.length })}</p>
              </div>
            )}
            {rapport && rapport.planning.tachesEnRetard > 0 && (
              <div className="bg-red-50 dark:bg-red-900/25 border border-red-200 dark:border-red-700/50 rounded-xl p-4">
                <span className="font-semibold text-red-800 dark:text-red-200">{t('detail.retards')}</span>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{t('detail.tasksLate', { count: rapport.planning.tachesEnRetard })}</p>
              </div>
            )}
            {rapport && rapport.securite.risquesCritiques > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/25 border border-orange-200 dark:border-orange-700/50 rounded-xl p-4">
                <span className="font-semibold text-orange-800 dark:text-orange-200">{t('detail.risquesCritiques')}</span>
                <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">{t('detail.risksCount', { count: rapport.securite.risquesCritiques })}</p>
              </div>
            )}
          </div>
        )}

        {/* Synthèse projet */}
        <div className={CARD}>
          <h2 className={CARD_HEADER}>{t('detail.syntheseProjet')}</h2>
          <div className={CARD_BODY}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Avancement physique (indicateur principal, synchronisé avec la fiche projet) */}
              {(() => {
                const avancementPhysique = projet.avancementPhysiquePct ?? projet.avancementGlobal ?? 0
                return (
                  <div className="text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-4xl font-bold text-primary">{avancementPhysique} %</div>
                    <p className="text-xs text-gray-500 mt-1">{t('detail.avancementPhysique')}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2 mx-auto max-w-[180px]">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(avancementPhysique, 100)}%` }} />
                    </div>
                  </div>
                )
              })()}

              {/* Informations du projet */}
              <div className="lg:col-span-2">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <dt className="text-gray-500 dark:text-gray-400">{t('detail.type')}</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{getTypeProjetDisplay(getProjetTypes(projet), projet.typePersonnalise)}</dd>
                  <dt className="text-gray-500">{t('detail.sousProjets')}</dt><dd className="font-medium">{projet.nombreSousProjets}</dd>
                  <dt className="text-gray-500">{t('detail.pointsBloquantsOuverts')}</dt><dd className="font-semibold text-amber-600">{projet.nombrePointsBloquantsOuverts}</dd>
                  <dt className="text-gray-500">{t('detail.delaiConsomme')}</dt><dd className="font-medium">{projet.delaiConsommePct != null ? `${projet.delaiConsommePct} %` : '—'}</dd>
                  <dt className="text-gray-500">{t('detail.sourceFinancement')}</dt><dd className="font-medium truncate" title={projet.sourceFinancement?.replace(/_/g, ' ')}>{projet.sourceFinancement?.replace(/_/g, ' ') || '—'}</dd>
                  <dt className="text-gray-500">{t('detail.partenairePrincipal')}</dt><dd className="font-medium truncate" title={projet.partenairePrincipal}>{projet.partenairePrincipal || '—'}</dd>
                  {projet.createdAt && <><dt className="text-gray-500">{t('detail.createdAt')}</dt><dd className="font-medium">{formatDate(projet.createdAt)}</dd></>}
                  {projet.updatedAt && <><dt className="text-gray-500">{t('detail.updatedAt')}</dt><dd className="font-medium">{formatDate(projet.updatedAt)}</dd></>}
                </dl>
              </div>

              {/* Accès rapide */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">{t('detail.accesRapide')}</h3>
                <div className="flex flex-col gap-2">
                  <Link to={`/budget?projetId=${projet.id}`} className="text-sm text-primary hover:underline">{t('detail.linkBudget')}</Link>
                  <Link to={`/planning?projetId=${projet.id}`} className="text-sm text-primary hover:underline">{t('detail.linkPlanning')}</Link>
                  <Link to={`/qualite?projetId=${projet.id}`} className="text-sm text-primary hover:underline">{t('detail.linkQualite')}</Link>
                  <Link to={`/securite?projetId=${projet.id}`} className="text-sm text-primary hover:underline">{t('detail.linkSecurite')}</Link>
                  <Link to={`/documents?projetId=${projet.id}`} className="text-sm text-primary hover:underline">{t('detail.linkDocuments')}</Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100">
              {/* Client */}
              {projet.client && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">{t('detail.client')}</h3>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{projet.client.nom}</p>
                  <p className="text-xs text-gray-500">{projet.client.type.replace(/_/g, ' ')}</p>
                  {projet.client.contactPrincipal && <p className="text-xs text-gray-600 mt-1">{t('detail.contact')} : {projet.client.contactPrincipal}</p>}
                  {projet.client.telephoneContact && <p className="text-xs text-gray-600">{t('detail.phone')} : {projet.client.telephoneContact}</p>}
                </div>
              )}

              {/* Chef de projet */}
              {projet.responsableProjet && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">{t('detail.manager')}</h3>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{projet.responsableProjet.prenom} {projet.responsableProjet.nom}</p>
                  <p className="text-xs text-gray-500">{projet.responsableProjet.email}</p>
                </div>
              )}

              {/* Localisation */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">{t('detail.localisation')}</h3>
                <p className="text-sm text-gray-700">{[projet.province, projet.ville, projet.quartier].filter(Boolean).join(' · ') || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* VUE STRATÉGIQUE - PLEINE LARGEUR */}
        <div>
          <ProjetVisualisationsSection 
            projet={projet} 
            rapport={rapport} 
            formatMontantFn={formatMontant} 
          />
        </div>
      </div>
    </PageContainer>
  )
}