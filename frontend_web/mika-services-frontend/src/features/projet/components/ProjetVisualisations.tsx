import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { i18n } from '@/i18n'
import type { ProjetReport } from '@/types/reporting'

const formatMontant = (montant?: number) =>
  montant != null ? new Intl.NumberFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(montant) : '—'

/** Pourcentage affiché avec 2 décimales (sans troncature ni arrondi implicite au-delà). */
const formatPct = (v: number) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : 0)

/** Jauge circulaire animée (SVG) — lecture stratégique immédiate */
export function RadialGauge({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = '#FF6B35',
  label,
  sublabel,
  delay = 0,
  className = '',
}: {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  label: string
  sublabel?: string
  delay?: number
  className?: string
}) {
  const [mounted, setMounted] = useState(false)
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50 + delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div className={`flex flex-col items-center transition-transform hover:scale-105 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-100"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? offset : circumference}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatPct(pct)} %</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-2 uppercase tracking-wide">{label}</p>
      {sublabel && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  )
}

/** Barres horizontales animées — répartition planning (terminées / en cours / en retard) */
export function PlanningBars({
  terminees,
  enCours,
  enRetard,
  total,
  delay = 0,
  to,
}: {
  terminees: number
  enCours: number
  enRetard: number
  total: number
  delay?: number
  to?: string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100 + delay)
    return () => clearTimeout(t)
  }, [delay])

  const tPct = total ? (terminees / total) * 100 : 0
  const cPct = total ? (enCours / total) * 100 : 0
  const rPct = total ? (enRetard / total) * 100 : 0

  const content = (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-l-full bg-green-500 transition-all duration-700 ease-out"
          style={{ width: mounted ? `${tPct}%` : '0%' }}
        />
        <div
          className="h-full bg-blue-500 transition-all duration-700 ease-out"
          style={{ width: mounted ? `${cPct}%` : '0%' }}
        />
        <div
          className="h-full rounded-r-full bg-red-500 transition-all duration-700 ease-out"
          style={{ width: mounted ? `${rPct}%` : '0%' }}
        />
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Terminées {terminees}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          En cours {enCours}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          En retard {enRetard}
        </span>
      </div>
    </div>
  )

  if (to) return <Link to={to} className="block hover:opacity-90 transition">{content}</Link>
  return content
}

/** Carte KPI avec entrée animée et effet “vivant” */
export function AnimatedKpiCard({
  label,
  value,
  sub,
  color,
  to,
  index = 0,
  pulse = false,
}: {
  label: string
  value: number | string
  sub: string
  color: 'blue' | 'green' | 'purple' | 'orange'
  to?: string
  index?: number
  pulse?: boolean
}) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  }
  const content = (
    <div
      className={`rounded-xl p-5 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br ${colors[color]} ${pulse ? 'animate-pulse-slow' : ''}`}
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'backwards',
      }}
    >
      <p className="text-white/90 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1 tabular-nums">{value}</p>
      <p className="text-white/80 text-xs mt-1 truncate">{sub}</p>
    </div>
  )
  if (to) return <Link to={to} className="block text-left w-full">{content}</Link>
  return <div className="text-left">{content}</div>
}

/** Bloc Budget — graphique barre animé + chiffres */
export function BudgetVisualisation({
  budgetPrevu,
  depenses,
  tauxConsommation,
  projetId,
  formatMontantFn = formatMontant,
}: {
  budgetPrevu: number
  depenses: number
  tauxConsommation: number
  projetId: number
  formatMontantFn?: (n?: number) => string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200)
    return () => clearTimeout(t)
  }, [])

  const pct = Math.min(100, Math.max(0, tauxConsommation))
  const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f97316' : '#22c55e'

  return (
    <Link to={`/budget?projetId=${projetId}`} className="block bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-600 shadow-sm hover:shadow-md hover:border-primary/30 dark:hover:border-primary/50 transition-all overflow-hidden">
      <div className="px-5 py-4 border-b dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/50">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Consommation budget</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Dépensé vs prévu</p>
      </div>
      <div className="p-5">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="h-4 w-full rounded-full bg-gray-100 dark:bg-gray-600 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: mounted ? `${pct}%` : '0%',
                  backgroundColor: color,
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatMontantFn(depenses)}</span>
              <span>{formatMontantFn(budgetPrevu)}</span>
            </div>
          </div>
          <span className="text-2xl font-bold tabular-nums shrink-0" style={{ color }}>{formatPct(pct)} %</span>
        </div>
      </div>
    </Link>
  )
}

/** Bloc Qualité / Sécurité — mini jauges côte à côte */
export function QualiteSecuriteVisualisation({
  tauxConformite,
  ncOuvertes,
  incidentsTotal,
  risquesCritiques,
  projetId,
}: {
  tauxConformite: number
  ncOuvertes: number
  incidentsTotal: number
  risquesCritiques: number
  projetId: number
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <Link to={`/qualite?projetId=${projetId}`} className="block bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-600 shadow-sm hover:shadow-md hover:border-primary/30 dark:hover:border-primary/50 transition-all overflow-hidden">
      <div className="px-5 py-4 border-b dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/50">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Qualité & Sécurité</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Conformité et risques</p>
      </div>
      <div className="p-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Conformité</p>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-600 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-800 ${tauxConformite >= 80 ? 'bg-green-500' : tauxConformite >= 60 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: mounted ? `${tauxConformite}%` : '0%' }}
            />
          </div>
          <p className="text-sm font-bold mt-1">{formatPct(tauxConformite)} %</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">NC ouvertes</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{ncOuvertes}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Incidents</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{incidentsTotal}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Risques critiques</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{risquesCritiques}</p>
        </div>
      </div>
    </Link>
  )
}

/** Carte dédiée : Avancement physique — calculé automatiquement à partir des données PV (chef de projet) */
function CarteAvancementPhysique({
  projet,
  rapport,
}: {
  projet: { id: number; avancementGlobal: number; avancementPhysiquePct?: number }
  rapport: ProjetReport | null
}) {
  const valeur = projet.avancementPhysiquePct ?? projet.avancementGlobal
  const tauxPlanning = rapport?.planning?.tauxAvancement ?? valeur
  return (
    <Link
      to={`/planning?projetId=${projet.id}`}
      className="block rounded-xl p-5 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 animate-fade-in-up"
      style={{ animationDelay: '0ms' }}
    >
      <p className="text-white/90 text-xs font-medium uppercase tracking-wide">Avancement physique</p>
      <p className="text-3xl font-bold mt-1 tabular-nums">{formatPct(valeur)} %</p>
      <p className="text-white/80 text-xs mt-1 truncate">Planning {formatPct(tauxPlanning)} %</p>
    </Link>
  )
}

/** Carte dédiée : Avancement financier — calculé automatiquement (budget + dépenses) */
function CarteAvancementFinancier({
  projet,
  rapport,
  formatMontantFn,
}: {
  projet: { id: number; montantHT?: number }
  rapport: ProjetReport | null
  formatMontantFn: (n?: number) => string
}) {
  const budgetPrevu = rapport?.budget?.budgetTotalPrevu ?? projet.montantHT ?? 0
  const depenses = rapport?.budget?.depensesTotales ?? 0
  const taux = rapport?.budget?.tauxConsommation ?? 0
  return (
    <Link
      to={`/budget?projetId=${projet.id}`}
      className="block rounded-xl p-5 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-green-500 to-green-600 animate-fade-in-up"
      style={{ animationDelay: '80ms' }}
    >
      <p className="text-white/90 text-xs font-medium uppercase tracking-wide">Avancement financier</p>
      <p className="text-3xl font-bold mt-1 tabular-nums">{formatPct(taux)} %</p>
      <p className="text-white/80 text-xs mt-1 truncate">{formatMontantFn(depenses)} / {formatMontantFn(budgetPrevu)}</p>
    </Link>
  )
}

/** Carte dédiée : Qualité — calculée automatiquement (contrôles + conformité) */
function CarteQualite({ rapport, projetId }: { rapport: ProjetReport | null; projetId: number }) {
  const tauxConformite = rapport?.qualite?.tauxConformite ?? 0
  const ncOuvertes = rapport?.qualite?.ncOuvertes ?? 0
  return (
    <Link
      to={`/qualite?projetId=${projetId}`}
      className="block rounded-xl p-5 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-purple-500 to-purple-600 animate-fade-in-up"
      style={{ animationDelay: '160ms' }}
    >
      <p className="text-white/90 text-xs font-medium uppercase tracking-wide">Qualité</p>
      <p className="text-3xl font-bold mt-1 tabular-nums">{formatPct(tauxConformite)} %</p>
      <p className="text-white/80 text-xs mt-1 truncate">{ncOuvertes} NC ouvertes</p>
    </Link>
  )
}

/** Carte dédiée : Sécurité — calculée automatiquement (incidents + risques) */
function CarteSecurite({ rapport, projetId }: { rapport: ProjetReport | null; projetId: number }) {
  const incidentsTotal = rapport?.securite?.incidentsTotal ?? 0
  const risquesCritiques = rapport?.securite?.risquesCritiques ?? 0
  return (
    <Link
      to={`/securite?projetId=${projetId}`}
      className="block rounded-xl p-5 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-orange-500 to-orange-600 animate-fade-in-up"
      style={{ animationDelay: '240ms' }}
    >
      <p className="text-white/90 text-xs font-medium uppercase tracking-wide">Sécurité</p>
      <p className="text-3xl font-bold mt-1 tabular-nums">{incidentsTotal}</p>
      <p className="text-white/80 text-xs mt-1 truncate">{risquesCritiques} risque(s) critique(s)</p>
    </Link>
  )
}

/** Section agrégée : 4 cartes distinctes — Avancement physique, Avancement financier, Qualité, Sécurité */
export function ProjetVisualisationsSection({
  projet,
  rapport,
  formatMontantFn,
}: {
  projet: { id: number; avancementGlobal: number; avancementPhysiquePct?: number; avancementFinancierPct?: number; montantHT?: number }
  rapport: ProjetReport | null
  formatMontantFn: (n?: number) => string
}) {
  return (
    <section className="space-y-5" aria-label="Vue stratégique — indicateurs en temps réel">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Vue stratégique — indicateurs en temps réel</h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/40 px-2.5 py-1 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Données à jour
        </span>
        <p className="text-xs text-gray-500 dark:text-gray-400 w-full mt-0.5">Lecture décisionnelle et évolution du projet — quatre indicateurs clés</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 min-w-0">
        <CarteAvancementPhysique projet={projet} rapport={rapport} />
        <CarteAvancementFinancier projet={projet} rapport={rapport} formatMontantFn={formatMontantFn} />
        <CarteQualite rapport={rapport} projetId={projet.id} />
        <CarteSecurite rapport={rapport} projetId={projet.id} />
      </div>
    </section>
  )
}
