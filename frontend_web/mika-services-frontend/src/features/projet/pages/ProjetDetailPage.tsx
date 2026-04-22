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
import { ProjetChatbotDrawer, ChatbotFloatingButton } from '@/features/projet/components/ProjetChatbotDrawer'
import { fetchProjetById, clearProjetDetail } from '@/store/slices/projetSlice'
import { projetApi, pointBloquantApi } from '@/api/projetApi'
import { reportingApi } from '@/api/reportingApi'
import { ProjetVisualisationsSection } from '@/features/projet/components/ProjetVisualisations'
import type { PointBloquant, Prevision, ModeSuiviMensuel, StatutPointBloquant } from '@/types/projet'
import { getTypeProjetDisplay, getProjetTypes } from '@/types/projet'
import type { ProjetReport } from '@/types/reporting'
import { canEditProjetEffective } from '@/utils/authRoles'


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

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden'
const CARD_HEADER = 'px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-3 border-l-[5px] border-l-primary'
const CARD_TITLE = 'text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide'
const CARD_BODY = 'p-6'
const TABLE_WRAP = 'w-full overflow-x-auto'
const TABLE_BASE = 'w-full text-sm border-collapse'
const TH_BASE = 'py-3 px-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/60 border-b-2 border-gray-200 dark:border-gray-600'
const TD_BASE = 'py-3 px-4 border-b border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm'

export const ProjetDetailPage = () => {
  const { t } = useTranslation('projet')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((state) => state.auth.user)
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const { projetDetail: projet, loading, error } = useAppSelector((state) => state.projet)
  const [pointsBloquants, setPointsBloquants] = useState<PointBloquant[]>([])
  const [previsions, setPrevisions] = useState<Prevision[]>([])
  const [rapport, setRapport] = useState<ProjetReport | null>(null)
  const [suiviMensuel, setSuiviMensuel] = useState<{ mois: number; annee: number; caPrevisionnel: number; caRealise: number; ecart?: number; avancementCumule?: number }[]>([])
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [exportingDocument, setExportingDocument] = useState(false)
  const [suiviMensuelExpanded, setSuiviMensuelExpanded] = useState(false)
  const [chatbotOpen, setChatbotOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<Parameters<typeof ProjetChatbotDrawer>[0]['messages']>(() => {
    try {
      const stored = sessionStorage.getItem(`mika-chat-${id}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.map((m: Record<string, unknown>) => ({ ...m, timestamp: new Date(m.timestamp as string) }))
      }
    } catch { /* ignore */ }
    return []
  })

  // Persist chat messages to sessionStorage
  useEffect(() => {
    if (chatMessages.length > 0) {
      try {
        sessionStorage.setItem(`mika-chat-${id}`, JSON.stringify(chatMessages))
      } catch { /* quota exceeded — ignore */ }
    }
  }, [chatMessages, id])


  const monthsShort = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => t(`detail.monthsShort_${i}`))
  const canEditProjet =
    projet != null &&
    canEditProjetEffective(currentUser, accessToken, projet.responsableProjet?.id ?? projet.responsableProjetId)

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

  /** Délai consommé effectif : valeur backend si disponible et non nulle, sinon calcul frontend. */
  const delaiConsommePctEffectif = (() => {
    if (projet.delaiConsommePct != null && projet.delaiConsommePct > 0) return projet.delaiConsommePct
    if (projet.dateDebut && projet.dateFin) {
      const debut = new Date(projet.dateDebut).getTime()
      const fin = new Date(projet.dateFin).getTime()
      const total = fin - debut
      if (total <= 0) return projet.delaiConsommePct ?? 0
      return Math.max(0, Math.round(((Date.now() - debut) / total) * 10000) / 100)
    }
    return projet.delaiConsommePct ?? 0
  })()

  /** Nombre de points bloquants ouverts calculé depuis les données locales (source de vérité). */
  const nombrePBOuverts = pointsBloquants.filter(
    (pb) => pb.statut !== 'RESOLU' && pb.statut !== 'FERME'
  ).length

  return (
    <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
      <ProjetDownloadDocumentModal
        open={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        onSelectFormat={handleDownloadDocument}
        generating={exportingDocument}
      />

      {/* En-tête du projet */}
      <header className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md mb-6 overflow-hidden">
        {/* Bande accent orange en haut */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-orange-400 to-amber-400" />

        <div className="px-6 py-6 md:py-8">
          {/* Bouton retour */}
          <button
            onClick={() =>
              navigate('/projets', {
                state: (location.state as { fromListState?: unknown } | null)?.fromListState != null
                  ? { fromListState: (location.state as { fromListState: unknown }).fromListState }
                  : undefined,
              })
            }
            className="inline-flex items-center gap-1.5 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-orange-400 text-sm mb-5 transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('detail.backToList')}
          </button>

          {/* Titre + statut */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Icône projet */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-orange-100 dark:from-primary/25 dark:to-orange-900/30 flex items-center justify-center shadow-md shadow-primary/10">
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                {/* Responsable */}
                {projet.responsableProjet && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {(projet.responsableProjet.prenom?.[0] ?? '') + (projet.responsableProjet.nom?.[0] ?? '')}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{projet.responsableProjet.prenom} {projet.responsableProjet.nom}</p>
                  </div>
                )}
                <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {projet.nom}
                </h1>
                {projet.numeroMarche && (
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 font-mono">
                    {t('detail.numeroMarcheIntitule')} : {projet.numeroMarche}
                  </p>
                )}
              </div>
            </div>

            {/* Statut + semaine */}
            <div className="flex-shrink-0 flex flex-col items-start lg:items-end gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-4 py-1.5 rounded-full text-sm font-extrabold border ${
                  projet.statut === 'EN_COURS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/40' :
                  projet.statut === 'PLANIFIE' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700/40' :
                  projet.statut === 'TERMINE' ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-700/40' :
                  projet.statut === 'SUSPENDU' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/40' :
                  projet.statut === 'ABANDONNE' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/40' :
                  projet.statut === 'RECEPTION_PROVISOIRE' ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-700/40' :
                  projet.statut === 'RECEPTION_DEFINITIVE' ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-700/40' :
                  'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                }`}>
                  {t(`enums.statut.${projet.statut}`)}
                </span>
                {delaiConsommePctEffectif > 100 && projet.statut === 'EN_COURS' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-sm">
                    {t('detail.enRetard')}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {t('detail.weekLabel', { week: semaineCalendaire, year: anneeCalendaire })}
              </span>
            </div>
          </div>

          {/* KPI pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              {
                label: t('detail.avancementPhysique'),
                value: `${projet.avancementPhysiquePct ?? projet.avancementGlobal ?? 0} %`,
                color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200/60 dark:border-orange-700/30 text-primary dark:text-orange-400',
                icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
              },
              {
                label: t('detail.montantMarche'),
                value: formatMontant(projet.montantHT),
                color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-700/30 text-emerald-700 dark:text-emerald-400',
                icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              },
              {
                label: t('detail.delai'),
                value: delaiMois ? `${delaiMois} ${t('detail.months')}` : '—',
                color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200/60 dark:border-blue-700/30 text-blue-700 dark:text-blue-400',
                icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              },
              {
                label: t('detail.pointsBloquants'),
                value: String(pointsBloquants.length),
                color: pointsBloquants.length > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200/60 dark:border-red-700/30 text-red-700 dark:text-red-400' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400',
                icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
              },
            ].map((kpi) => (
              <div key={kpi.label} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border min-w-0 flex-shrink ${kpi.color}`}>
                <div className="flex-shrink-0">{kpi.icon}</div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">{kpi.label}</p>
                  <p className="font-bold text-sm leading-tight truncate">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Boutons d'action */}
          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => navigate(`/projets/${projet.id}/historique`)}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('historique.buttonLabel')}
            </button>
            <button
              type="button"
              onClick={() => setDownloadModalOpen(true)}
              disabled={exportingDocument}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-700 disabled:opacity-60"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exportingDocument ? t('detail.downloadGenerating') : t('detail.downloadDocument')}
            </button>
            {canEditProjet && (
              <button
                onClick={() => navigate(`/projets/${projet.id}/edit`)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-bold px-5 py-2 rounded-xl shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
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
          <div className={CARD_HEADER}><span className={CARD_TITLE}>{t('detail.section1')}</span></div>
          <div className={CARD_BODY}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: t('detail.montantMarche'),
                  value: projet.montantHT != null ? `${formatMontant(projet.montantHT)} HT` : '—',
                  icon: (
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  accent: 'border-l-emerald-400',
                },
                {
                  label: t('detail.delai'),
                  value: delaiMois != null ? `${delaiMois} ${t('detail.months')}` : '—',
                  icon: (
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  accent: 'border-l-blue-400',
                },
                {
                  label: t('detail.dateDebut'),
                  value: formatDate(projet.dateDebut),
                  icon: (
                    <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  accent: 'border-l-violet-400',
                },
                {
                  label: t('detail.dateFin'),
                  value: formatDate(projet.dateFin),
                  icon: (
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ),
                  accent: 'border-l-primary',
                },
              ].map((item) => (
                <div key={item.label} className={`flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600 border-l-4 ${item.accent}`}>
                  <div className="flex-shrink-0">{item.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-semibold">{item.label}</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Tableau de suivi mensuel */}
        <section className={CARD}>
          <div className={`${CARD_HEADER} justify-between`}>
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={CARD_TITLE}>{t('detail.section2')}</span>
            </div>
            {lignesCA.length > 0 && suiviMensuelHasMore && (
              <button
                type="button"
                onClick={() => setSuiviMensuelExpanded((e) => !e)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-full px-3 py-1 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors shrink-0"
              >
                {suiviMensuelExpanded ? (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                    {t('detail.showLess')}
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    {t('detail.showAllMonths', { count: lignesCA.length })}
                  </>
                )}
              </button>
            )}
          </div>
          <div className={CARD_BODY}>
            {lignesCA.length === 0 ? (
              <div className="flex items-center gap-3 py-6 text-gray-500 dark:text-gray-400">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18" />
                </svg>
                <p className="text-sm">{modeSuiviMensuel === 'MANUEL' ? t('detail.suiviMensuelEmptyManual') : t('detail.suiviMensuelEmpty')}</p>
              </div>
            ) : (
              <>
                <div className={TABLE_WRAP}>
                  <table className={`${TABLE_BASE} table-auto`}>
                    <colgroup>
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '22%' }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-600">
                        <th className={`${TH_BASE} bg-gray-50 dark:bg-gray-700/80`}>
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {t('detail.colMonth')}
                          </span>
                        </th>
                        <th className={`${TH_BASE} text-right bg-gray-50 dark:bg-gray-700/80`}>{t('detail.colCaPrevisionnel')}</th>
                        <th className={`${TH_BASE} text-right bg-gray-50 dark:bg-gray-700/80`}>{t('detail.colCaRealise')}</th>
                        <th className={`${TH_BASE} text-right bg-gray-50 dark:bg-gray-700/80`}>{t('detail.colEcart')}</th>
                        <th className={`${TH_BASE} text-right bg-gray-50 dark:bg-gray-700/80`}>{t('detail.colAvancementCumule')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {lignesCAVisibles.map((ligne, idx) => {
                        const hasData = ligne.caPrevisionnel !== 0 || ligne.caRealise !== 0
                        return (
                        <tr
                          key={ligne.label}
                          className={`hover:bg-primary/[0.03] dark:hover:bg-primary/10 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''} ${!hasData ? 'opacity-40' : ''}`}
                        >
                          <td className={`${TD_BASE} border-none font-semibold text-gray-900 dark:text-white`}>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                              {ligne.label}
                            </span>
                          </td>
                          <td className={`${TD_BASE} border-none text-right tabular-nums text-gray-600 dark:text-gray-300`}>
                            {ligne.caPrevisionnel === 0 ? <span className="text-gray-300 dark:text-gray-600">—</span> : formatMontant(ligne.caPrevisionnel)}
                          </td>
                          <td className={`${TD_BASE} border-none text-right tabular-nums font-medium text-gray-700 dark:text-gray-200`}>
                            {ligne.caRealise === 0 ? <span className="text-gray-300 dark:text-gray-600">—</span> : formatMontant(ligne.caRealise)}
                          </td>
                          <td className={`${TD_BASE} border-none text-right`}>
                            {ligne.ecart === 0 ? (
                              <span className="text-gray-300 dark:text-gray-600 tabular-nums">—</span>
                            ) : (
                              <span className={`inline-flex items-center justify-end gap-1 tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full border ${ligne.ecart >= 0 ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
                                {ligne.ecart >= 0 ? (
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                ) : (
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                )}
                                {formatMontant(Math.abs(ligne.ecart))}
                              </span>
                            )}
                          </td>
                          <td className={`${TD_BASE} border-none`}>
                            {ligne.avancementCumule == null ? (
                              <span className="text-gray-300 dark:text-gray-600 tabular-nums float-right">—</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden shrink-0">
                                  <div
                                    className="h-2 rounded-full bg-gradient-to-r from-primary to-amber-400 transition-all duration-500"
                                    style={{ width: `${Math.min(ligne.avancementCumule, 100)}%` }}
                                  />
                                </div>
                                <span className="tabular-nums text-xs font-bold text-gray-700 dark:text-gray-200 shrink-0">{ligne.avancementCumule} %</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                      })}
                    </tbody>
                    {totauxCA && (
                      <tfoot>
                        <tr className="bg-gradient-to-r from-primary/10 to-orange-50/60 dark:from-primary/20 dark:to-gray-800 border-t-2 border-primary/30 dark:border-primary/40">
                          <td className="py-3 px-3 text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
                              {t('detail.total')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-sm font-bold text-gray-900 dark:text-gray-100">{formatMontant(totauxCA.caPrevisionnel)}</td>
                          <td className="py-3 px-3 text-right tabular-nums text-sm font-bold text-gray-900 dark:text-gray-100">{formatMontant(totauxCA.caRealise)}</td>
                          <td className="py-3 px-3 text-right">
                            {totauxCA.ecart === 0 ? (
                              <span className="tabular-nums text-sm font-bold text-gray-500">{formatMontant(totauxCA.ecart)}</span>
                            ) : (
                              <span className={`inline-flex items-center justify-end gap-1 tabular-nums text-xs font-bold px-2.5 py-1 rounded-full border ${totauxCA.ecart >= 0 ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'}`}>
                                {totauxCA.ecart >= 0 ? (
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                ) : (
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                )}
                                {formatMontant(Math.abs(totauxCA.ecart))}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {totauxCA.avancementCumule != null ? (
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-white/60 dark:bg-gray-600 rounded-full h-2 overflow-hidden shrink-0 border border-primary/20">
                                  <div
                                    className="h-2 rounded-full bg-gradient-to-r from-primary to-amber-400 transition-all duration-500"
                                    style={{ width: `${Math.min(totauxCA.avancementCumule, 100)}%` }}
                                  />
                                </div>
                                <span className="tabular-nums text-sm font-bold text-primary dark:text-primary-light shrink-0">{totauxCA.avancementCumule} %</span>
                              </div>
                            ) : '—'}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t('detail.suiviMensuelHint', { budget: formatMontant(budgetPrevu), depenses: formatMontant(depensesTotales) })}</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 3. État d'avancement des Études */}
        <section className={CARD}>
          <div className={CARD_HEADER}><span className={CARD_TITLE}>{t('detail.section3')}</span></div>
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
                    <th className={`${TH_BASE} w-28`}>{t('detail.colAvancementPct')}</th>
                    <th className={TH_BASE}>{t('detail.colDepot')}</th>
                    <th className={`${TH_BASE} whitespace-normal leading-tight`}>{t('detail.colValidation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(projet.avancementEtudes?.length ?? 0) > 0 ? (
                    projet.avancementEtudes!.map((e) => {
                      const hasEtudeData = e.avancementPct != null || e.dateDepot || e.etatValidation
                      return (
                      <tr key={e.id} className={`hover:bg-gray-50/60 dark:hover:bg-gray-700/60 transition-colors ${!hasEtudeData ? 'opacity-50' : ''}`}>
                        <td className={`${TD_BASE} font-medium text-gray-900 dark:text-gray-100`}>{t(`enums.phaseEtude.${e.phase}`) || e.phase}</td>
                        <td className={`${TD_BASE} tabular-nums`}>
                          {e.avancementPct != null ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="text-sm font-semibold">{e.avancementPct} %</span>
                              <div className="w-10 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(e.avancementPct, 100)}%` }} />
                              </div>
                            </span>
                          ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className={TD_BASE}>{formatDate(e.dateDepot) || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                        <td className={TD_BASE}>{e.etatValidation && ['NON_DEPOSE', 'EN_ATTENTE', 'EN_COURS', 'VALIDE', 'REFUSE'].includes(e.etatValidation) ? t(`enums.etatValidationEtude.${e.etatValidation}`) : (e.etatValidation || <span className="text-gray-300 dark:text-gray-600">—</span>)}</td>
                      </tr>
                      )
                    })
                  ) : (
                    (['APS', 'APD', 'EXE', 'GEOTECHNIQUE', 'HYDRAULIQUE', 'EIES', 'PAES'] as const).map((phase) => (
                      <tr key={phase} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/60 transition-colors opacity-50">
                        <td className={`${TD_BASE} font-medium text-gray-900 dark:text-gray-100`}>{t(`enums.phaseEtude.${phase}`) || phase}</td>
                        <td className={TD_BASE}><span className="text-gray-300 dark:text-gray-600">—</span></td>
                        <td className={TD_BASE}><span className="text-gray-300 dark:text-gray-600">—</span></td>
                        <td className={TD_BASE}><span className="text-gray-300 dark:text-gray-600">—</span></td>
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
          // Limite le report à 4 semaines en arrière pour éviter de noyer l'affichage
          const MAX_SEMAINES_REPORT = 4
          const tachesReportees = previsions.filter((p) => {
            const a = p.annee ?? 0
            const s = p.semaine ?? 0
            const isPast = a < anneeCalendaire || (a === anneeCalendaire && s < semaineCalendaire)
            if (!isPast) return false
            const isIncomplete = p.avancementPct == null || p.avancementPct < 100
            if (!isIncomplete) return false
            // Exclure les tâches antérieures à MAX_SEMAINES_REPORT semaines
            const weekAbs = a * 53 + s
            const minWeekAbs = anneeCalendaire * 53 + semaineCalendaire - MAX_SEMAINES_REPORT
            return weekAbs >= minWeekAbs
          })
          const avancementsGlobaux = [...tachesRealiseSemaine, ...tachesReportees]
            .map((p) => p.avancementPct)
            .filter((v): v is number => v != null)
          const globalPct = avancementsGlobaux.length > 0
            ? Math.round((avancementsGlobaux.reduce((a, b) => a + b, 0) / avancementsGlobaux.length) * 100) / 100
            : null

          return (
            <section className={CARD}>
              <div className={`${CARD_HEADER} justify-between`}>
                <span className={CARD_TITLE}>
                  {t('detail.section4')}
                  <span className="ml-2 font-normal normal-case text-primary">
                    — {t('detail.weekInProgress', { week: semaineCalendaire, year: anneeCalendaire })}
                  </span>
                </span>
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
                    <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200 mb-3">
                      {t('detail.section4Realise')}
                    </h3>
                    {tachesRealiseSemaine.length > 0 ? (
                      <ul className="space-y-2">
                        {tachesRealiseSemaine.map((p) => (
                          <li key={p.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
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
                              className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-700/50"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
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
                    <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200 mb-3">
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
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
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
                    <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200 mb-2">{t('detail.pointsBloquants')}</h3>
                    {pointsBloquants.length > 0 ? (
                      <div className="space-y-2">
                        {pointsBloquants.map((pb) => {
                          const isCritical = pb.priorite === 'CRITIQUE' || pb.priorite === 'URGENTE'
                          const isResolved = pb.statut === 'RESOLU' || pb.statut === 'FERME'
                          return (
                            <div key={pb.id} className={`flex items-start gap-3 p-3 rounded-xl border ${isResolved ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600' : isCritical ? 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-700/40' : 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-700/30'}`}>
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${isResolved ? 'bg-gray-400' : isCritical ? 'bg-red-500' : 'bg-amber-500'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{pb.titre}</p>
                                {pb.description && <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{pb.description}</p>}
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isCritical ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                                    {t(`enums.priorite.${pb.priorite}`)}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 ${getStatutPointBloquantTextClass(pb.statut)}`}>
                                    {t(`enums.statutPointBloquant.${pb.statut}`)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('detail.noPointsBloquants')}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200 mb-2">{t('detail.besoinsMateriel')}</h3>
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
                      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200 mb-2">{t('detail.besoinsHumain')}</h3>
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
          <div className={CARD_HEADER}><span className={CARD_TITLE}>{t('detail.section5')}</span></div>
          <div className={CARD_BODY}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">{t('detail.description')}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{projet.description || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">{t('detail.observations')}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{projet.observations || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">{t('detail.propositionsAmelioration')}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{projet.propositionsAmelioration || '—'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Alertes et indicateurs */}
        {(pointsBloquants.length > 0 || (rapport && (rapport.planning?.tachesEnRetard > 0 || rapport.securite?.risquesCritiques > 0))) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pointsBloquants.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4">
                <span className="font-bold text-amber-900 dark:text-amber-200">{t('detail.pointsBloquants')}</span>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">{t('detail.pointsToProcess', { count: pointsBloquants.length })}</p>
              </div>
            )}
            {rapport && rapport.planning?.tachesEnRetard > 0 && (
              <div className="bg-red-50 dark:bg-red-900/25 border border-red-200 dark:border-red-700/50 rounded-xl p-4">
                <span className="font-bold text-red-900 dark:text-red-200">{t('detail.retards')}</span>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">{t('detail.tasksLate', { count: rapport.planning?.tachesEnRetard })}</p>
              </div>
            )}
            {rapport && rapport.securite?.risquesCritiques > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/25 border border-orange-200 dark:border-orange-700/50 rounded-xl p-4">
                <span className="font-bold text-orange-900 dark:text-orange-200">{t('detail.risquesCritiques')}</span>
                <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">{t('detail.risksCount', { count: rapport.securite?.risquesCritiques })}</p>
              </div>
            )}
          </div>
        )}

        {/* Synthèse projet */}
        <div className={CARD}>
          <div className={CARD_HEADER}><span className={CARD_TITLE}>{t('detail.syntheseProjet')}</span></div>
          <div className={CARD_BODY}>
            {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Avancement physique */}
            {(() => {
              const v = projet.avancementPhysiquePct ?? projet.avancementGlobal ?? 0
              return (
                <div className="bg-gradient-to-br from-primary/10 to-orange-50 dark:from-primary/20 dark:to-orange-900/20 border-2 border-primary/20 dark:border-primary/30 rounded-2xl p-5 text-center">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-primary">{v}%</div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-1">{t('detail.avancementPhysique')}</p>
                  <div className="w-full bg-primary/15 rounded-full h-2.5 mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-orange-400 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(v, 100)}%` }} />
                  </div>
                </div>
              )
            })()}
            {/* Avancement financier */}
            {(() => {
              const v = projet.avancementFinancierPct ?? 0
              return (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200/60 dark:border-emerald-700/40 rounded-2xl p-5 text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{v}%</div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-1">{t('detail.avancementFinancier')}</p>
                  <div className="w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full h-2.5 mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(v, 100)}%` }} />
                  </div>
                </div>
              )
            })()}
            {/* Délai consommé */}
            {(() => {
              const v = delaiConsommePctEffectif
              const isOverrun = v > 100
              return (
                <div className={`bg-gradient-to-br ${isOverrun ? 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/60 dark:border-red-700/40' : 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/60 dark:border-blue-700/40'} border-2 rounded-2xl p-5 text-center`}>
                  <div className={`w-10 h-10 rounded-xl ${isOverrun ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} flex items-center justify-center mx-auto mb-3`}>
                    <svg className={`w-5 h-5 ${isOverrun ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className={`text-3xl font-bold ${isOverrun ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>{v}%</div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-1">{t('detail.delaiConsomme')}</p>
                  <div className={`w-full ${isOverrun ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} rounded-full h-2.5 mt-3 overflow-hidden`}>
                    <div className={`${isOverrun ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-blue-500 to-indigo-400'} h-full rounded-full transition-all duration-700`} style={{ width: `${Math.min(v, 100)}%` }} />
                  </div>
                </div>
              )
            })()}
            {/* Points bloquants */}
            {(() => {
              const count = nombrePBOuverts
              const isAlert = count > 0
              return (
                <div className={`bg-gradient-to-br ${isAlert ? 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/60 dark:border-amber-700/40' : 'from-gray-50 to-slate-50 dark:from-gray-700/30 dark:to-slate-700/20 border-gray-200 dark:border-gray-600'} border-2 rounded-2xl p-5 text-center`}>
                  <div className={`w-10 h-10 rounded-xl ${isAlert ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'} flex items-center justify-center mx-auto mb-3`}>
                    <svg className={`w-5 h-5 ${isAlert ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className={`text-3xl font-bold ${isAlert ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>{count}</div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-1">{t('detail.pointsBloquantsOuverts')}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">{isAlert ? 'À traiter' : 'Aucun blocage'}</p>
                </div>
              )
            })()}
          </div>

          {/* Informations + Accès rapide */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Infos projet */}
            <div className="lg:col-span-2">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm items-start">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 self-start">{t('detail.type')}</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white min-w-0 break-words self-start">{getTypeProjetDisplay(getProjetTypes(projet), projet.typePersonnalise)}</dd>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 self-start">{t('detail.sousProjets')}</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white self-start">{projet.nombreSousProjets}</dd>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 self-start">{t('detail.sourceFinancement')}</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white min-w-0 break-words self-start">
                  {projet.sourceFinancement ? t(`enums.sourceFinancement.${projet.sourceFinancement}`) : '—'}
                </dd>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 self-start">{t('detail.partenairePrincipal')}</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white min-w-0 break-words self-start">{projet.partenairePrincipal || '—'}</dd>
                {projet.createdAt && <><dt className="text-sm font-medium text-gray-500 dark:text-gray-400 self-start">{t('detail.createdAt')}</dt><dd className="text-sm font-semibold text-gray-900 dark:text-white self-start">{formatDate(projet.createdAt)}</dd></>}
                {projet.updatedAt && <><dt className="text-sm font-medium text-gray-500 dark:text-gray-400 self-start">{t('detail.updatedAt')}</dt><dd className="text-sm font-semibold text-gray-900 dark:text-white self-start">{formatDate(projet.updatedAt)}</dd></>}
              </dl>
            </div>

            {/* Accès rapide — pill buttons */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('detail.accesRapide')}</h3>
              <div className="flex flex-wrap gap-2.5">
                {[
                  {
                    to: `/budget?projetId=${projet.id}`, label: t('detail.linkBudget'),
                    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/40',
                    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                  },
                  {
                    to: `/planning?projetId=${projet.id}`, label: t('detail.linkPlanning'),
                    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700/40',
                    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                  },
                  {
                    to: `/qualite?projetId=${projet.id}`, label: t('detail.linkQualite'),
                    color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-700/40',
                    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                  },
                  {
                    to: `/securite?projetId=${projet.id}`, label: t('detail.linkSecurite'),
                    color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700/40',
                    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
                  },
                  {
                    to: `/documents?projetId=${projet.id}`, label: t('detail.linkDocuments'),
                    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/40',
                    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
                  },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${link.color}`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Client + Chef de projet + Localisation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t-2 border-gray-100 dark:border-gray-700">
            {projet.client && (
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('detail.client')}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{projet.client.nom}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t(`enums.typeClient.${projet.client.type}`)}</p>
                {projet.client.contactPrincipal && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('detail.contact')} : {projet.client.contactPrincipal}</p>}
                {projet.client.telephoneContact && <p className="text-xs text-gray-500 dark:text-gray-400">{t('detail.phone')} : {projet.client.telephoneContact}</p>}
              </div>
            )}
            {projet.responsableProjet && (
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('detail.manager')}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                    {(projet.responsableProjet.prenom?.[0] ?? '') + (projet.responsableProjet.nom?.[0] ?? '')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{projet.responsableProjet.prenom} {projet.responsableProjet.nom}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{projet.responsableProjet.email}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('detail.localisation')}</p>
              {(projet.province || projet.ville || projet.quartier) ? (
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{[projet.province, projet.ville, projet.quartier].filter(Boolean).join(' · ')}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-3 text-center">
                  <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{t('detail.localisationAbsente')}</p>
                  {canEditProjet && (
                    <Link
                      to={`/projets/${projet.id}/edit`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      {t('detail.addLocalisation')}
                    </Link>
                  )}
                </div>
              )}
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

      {/* Assistant IA Chatbot */}
      {canEditProjet && (
        <>
          <ChatbotFloatingButton onClick={() => setChatbotOpen(true)} />
          <ProjetChatbotDrawer
            isOpen={chatbotOpen}
            onClose={() => setChatbotOpen(false)}
            projetId={projet.id}
            projetNom={projet.nom}
            messages={chatMessages}
            setMessages={setChatMessages}
          />
        </>
      )}
    </PageContainer>
  )
}