import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useAppDispatch } from '@/store/hooks'
import { fetchEngins } from '@/store/slices/enginSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import { projetApi } from '@/api/projetApi'
import { enginApi } from '@/api/enginApi'
import type { ProjetSummary } from '@/types/projet'
import type { EnginSummary } from '@/types/materiel'
import { MaterielModuleTabs } from '../components/MaterielModuleTabs'
import { EnginFormModal } from '../components/EnginFormModal'
import FleetDonutChart from '../components/FleetDonutChart'
import { useCountUp } from '../hooks/useCountUp'

/* ═══════════════════════════════════════════════════════════════════════
   ANIMATED FLOATING PARTICLES — Subtle background orbs
   ═══════════════════════════════════════════════════════════════════════ */

function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 150 + Math.random() * 250,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 5,
      color: ['rgba(232,90,42,0.06)', 'rgba(59,130,246,0.05)', 'rgba(16,185,129,0.04)',
              'rgba(139,92,246,0.04)', 'rgba(245,158,11,0.04)', 'rgba(236,72,153,0.03)'][i],
    })),
  [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full blur-3xl"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -25, 15, -10, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ANIMATED GAUGE — Circular progress ring for utilization rate
   ═══════════════════════════════════════════════════════════════════════ */

function AnimatedGauge({ value, label, size = 120 }: { value: number; label: string; size?: number }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const animatedValue = useCountUp(value, 1800, 400)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth="6"
          className="stroke-gray-100 dark:stroke-gray-700/60"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth="6" strokeLinecap="round"
          stroke="url(#gaugeGradient)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (circumference * value) / 100 }}
          transition={{ duration: 2, ease: 'easeOut', delay: 0.5 }}
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E85A2A" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
          {animatedValue}%
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-0.5">
          {label}
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   3D TILT KPI CARD — Glass card with mouse-follow tilt
   ═══════════════════════════════════════════════════════════════════════ */

interface KpiDef {
  label: string
  value: number
  suffix?: string
  icon: React.ReactNode
  gradient: string
  iconBg: string
  glowColor: string
  pulse?: boolean
}

function TiltKpiCard({ kpi, index, total }: { kpi: KpiDef; index: number; total: number }) {
  const animated = useCountUp(kpi.value, 1600, 200 + index * 150)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useSpring(useTransform(y, [-100, 100], [6, -6]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-100, 100], [-6, 6]), { stiffness: 300, damping: 30 })

  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - rect.left - rect.width / 2)
    y.set(e.clientY - rect.top - rect.height / 2)
  }, [x, y])

  const handleLeave = useCallback(() => { x.set(0); y.set(0) }, [x, y])

  // Progress bar based on ratio to total
  const ratio = total > 0 ? Math.min(100, Math.round((kpi.value / total) * 100)) : 0

  return (
    <motion.div
      className="cockpit-glass relative group rounded-2xl p-5 overflow-hidden cursor-default"
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.15 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      whileHover={{ scale: 1.03 }}
    >
      {/* Glow orb behind icon */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-700"
        style={{ background: kpi.glowColor }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-2.5">
            {kpi.label}
          </p>
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={animated}
              className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none"
            >
              {animated}
            </motion.span>
            {kpi.suffix && (
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500">{kpi.suffix}</span>
            )}
            {kpi.pulse && kpi.value > 0 && (
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </div>
        </div>
        <motion.div
          className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${kpi.iconBg} shadow-sm`}
          whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
        >
          {kpi.icon}
        </motion.div>
      </div>

      {/* Animated progress bar */}
      <div className="relative z-10 mt-4 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700/40 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: kpi.glowColor }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, ratio)}%` }}
          transition={{ duration: 1.2, delay: 0.6 + index * 0.1, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ACTIVITY FEED — Animated alert/status items with stagger
   ═══════════════════════════════════════════════════════════════════════ */

function ActivityFeed({
  projetsSuspendus,
  nbEnginsPanne,
  nbEnTransit,
  projetsActifs,
}: {
  projetsSuspendus: ProjetSummary[]
  nbEnginsPanne: number
  nbEnTransit: number
  projetsActifs: number
}) {
  const navigate = useNavigate()

  const items: { icon: React.ReactNode; text: string; color: string; ringColor: string; action?: () => void }[] = []

  if (nbEnginsPanne > 0) {
    items.push({
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      text: `${nbEnginsPanne} engin${nbEnginsPanne > 1 ? 's' : ''} en panne / maintenance`,
      color: 'text-red-500 bg-red-50 dark:bg-red-900/20',
      ringColor: 'ring-red-200 dark:ring-red-800/40',
    })
  }

  if (nbEnTransit > 0) {
    items.push({
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75M8.25 18.75h6" />
        </svg>
      ),
      text: `${nbEnTransit} engin${nbEnTransit > 1 ? 's' : ''} en transit inter-chantier`,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
      ringColor: 'ring-indigo-200 dark:ring-indigo-800/40',
      action: () => navigate('/mouvements'),
    })
  }

  projetsSuspendus.slice(0, 2).forEach((p) => {
    items.push({
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: `${p.nom} — Projet suspendu`,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
      ringColor: 'ring-amber-200 dark:ring-amber-800/40',
      action: () => navigate(`/projets/${p.id}`),
    })
  })

  if (items.length === 0) {
    items.push({
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: `${projetsActifs} projets actifs — Tout est opérationnel`,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
      ringColor: 'ring-emerald-200 dark:ring-emerald-800/40',
    })
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <motion.div
          key={i}
          onClick={item.action}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl ring-1 transition-colors
                      ${item.ringColor}
                      ${item.action ? 'cursor-pointer' : ''}
                      bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
          whileHover={item.action ? { x: 4, scale: 1.01 } : {}}
        >
          <motion.div
            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}
            animate={i === 0 && items[0].color.includes('red') ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {item.icon}
          </motion.div>
          <p className="text-[13px] text-gray-700 dark:text-gray-300 font-medium flex-1 min-w-0 truncate">
            {item.text}
          </p>
          {item.action && (
            <motion.svg
              className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </motion.svg>
          )}
        </motion.div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   QUICK ACCESS — Animated shortcut cards
   ═══════════════════════════════════════════════════════════════════════ */

function QuickAccessGrid() {
  const { t } = useTranslation('materiel')
  const navigate = useNavigate()

  const shortcuts = [
    {
      label: t('module.navMouvements'), desc: 'Ordres de transfert', to: '/mouvements',
      color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>,
    },
    {
      label: t('module.navDma'), desc: 'Demandes appro.', to: '/dma',
      color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    },
    {
      label: t('module.navMateriaux'), desc: 'Stocks & seuils', to: '/materiaux',
      color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {shortcuts.map((s, i) => (
        <motion.button
          key={s.to}
          onClick={() => navigate(s.to)}
          className="group rounded-xl p-4 text-left bg-white/50 dark:bg-gray-800/40 backdrop-blur-sm
                     border border-gray-100 dark:border-gray-700/40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
          whileHover={{ y: -4, scale: 1.04, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.12)' }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div
            className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.bg} ${s.color}`}
            whileHover={{ rotate: 12 }}
          >
            {s.icon}
          </motion.div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{s.label}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.desc}</p>
        </motion.button>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   TOP PROJETS — Compact rows with entrance animation
   ═══════════════════════════════════════════════════════════════════════ */

const STATUT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  EN_COURS:             { label: 'En cours',   color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-500' },
  PLANIFIE:             { label: 'Planifié',   color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-500' },
  EN_ATTENTE:           { label: 'En attente', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500' },
  SUSPENDU:             { label: 'Suspendu',   color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-500' },
  TERMINE:              { label: 'Terminé',    color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-500' },
  RECEPTION_PROVISOIRE: { label: 'Réc. prov.', color: 'text-teal-600 dark:text-teal-400',   bg: 'bg-teal-500' },
  RECEPTION_DEFINITIVE: { label: 'Réc. déf.',  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' },
}

function CompactProjetRow({ projet, index }: { projet: ProjetSummary; index: number }) {
  const navigate = useNavigate()
  const nbEngins = projet.nombreEnginsAffectes ?? 0
  const cfg = STATUT_CFG[projet.statut] ?? { label: projet.statut, color: 'text-gray-500', bg: 'bg-gray-400' }

  return (
    <motion.div
      onClick={() => navigate(`/projets/${projet.id}`)}
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer
                 bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm
                 border border-gray-100 dark:border-gray-700/40"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.9 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        x: 6,
        backgroundColor: 'rgba(232, 90, 42, 0.03)',
        borderColor: 'rgba(232, 90, 42, 0.2)',
        boxShadow: '0 4px 20px -4px rgba(0,0,0,0.08)',
      }}
    >
      {/* Colored bar */}
      <motion.div
        className={`w-1.5 h-9 rounded-full ${cfg.bg} flex-shrink-0`}
        whileHover={{ scaleY: 1.3 }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{projet.nom}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {projet.ville && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {projet.ville}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color} bg-gray-50 dark:bg-gray-700/40`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-28 flex-shrink-0 hidden sm:block">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>Avancement</span>
          <span className="font-bold text-gray-600 dark:text-gray-300">{Math.round(projet.avancementGlobal)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, projet.avancementGlobal)}%` }}
            transition={{ duration: 1, delay: 1.2 + index * 0.08, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Engins badge */}
      <div className="flex-shrink-0 w-14 text-right">
        <p className="text-xl font-black text-primary dark:text-primary-light tabular-nums leading-none">
          {nbEngins}
        </p>
        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold">engins</p>
      </div>

      <motion.svg
        className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        animate={{ x: [0, 2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </motion.svg>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   LIVE CLOCK — Top-right timestamp pulsing
   ═══════════════════════════════════════════════════════════════════════ */

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100/80 dark:bg-gray-800/60 backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 tabular-nums">
        {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="text-[10px] text-gray-400 dark:text-gray-500">LIVE</span>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   SKELETON LOADER — Beautiful loading state
   ═══════════════════════════════════════════════════════════════════════ */

function CockpitSkeleton() {
  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0">
      <div className="cockpit-mesh-bg relative flex-1 min-h-0 overflow-y-auto p-1">
        <FloatingParticles />
        <div className="relative z-10">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-3 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
          </div>
          {/* KPIs skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="cockpit-glass rounded-2xl p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              >
                <div className="flex justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-7 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </motion.div>
            ))}
          </div>
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="cockpit-glass rounded-2xl h-72 animate-pulse" />
            <div className="cockpit-glass rounded-2xl h-72 animate-pulse" />
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ███████  MAIN  PAGE  ███████
   Cockpit de Pilotage — Module Matériel
   ═══════════════════════════════════════════════════════════════════════ */

export const EnginListPage = () => {
  const { t } = useTranslation('materiel')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [projets, setProjets] = useState<ProjetSummary[]>([])
  const [engins, setEngins] = useState<EnginSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      projetApi.findAll(0, 200),
      enginApi.findAll(0, 500),
    ]).then(([projetsPage, enginsPage]) => {
      if (!cancelled) {
        setProjets(projetsPage.content)
        setEngins(enginsPage.content)
        setLoading(false)
      }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const kpis = useMemo(() => ({
    total: engins.length,
    enService: engins.filter((e) => e.statut === 'EN_SERVICE').length,
    disponibles: engins.filter((e) => e.statut === 'DISPONIBLE').length,
    enPanne: engins.filter((e) => e.statut === 'EN_PANNE' || e.statut === 'EN_MAINTENANCE').length,
    enTransit: engins.filter((e) => e.statut === 'EN_TRANSIT').length,
  }), [engins])

  const donutData = useMemo(() => {
    const counts: Record<string, number> = {}
    engins.forEach((e) => { counts[e.statut] = (counts[e.statut] || 0) + 1 })
    return Object.entries(counts).map(([statut, count]) => ({ statut, count }))
  }, [engins])

  const projetsSuspendus = useMemo(() => projets.filter((p) => p.statut === 'SUSPENDU'), [projets])
  const projetsActifs = useMemo(() => projets.filter((p) => p.statut === 'EN_COURS').length, [projets])
  const topProjets = useMemo(
    () => projets
      .filter((p) => (p.nombreEnginsAffectes ?? 0) > 0)
      .sort((a, b) => (b.nombreEnginsAffectes ?? 0) - (a.nombreEnginsAffectes ?? 0))
      .slice(0, 6),
    [projets],
  )

  const tauxUtilisation = useMemo(() => {
    if (kpis.total === 0) return 0
    return Math.round((kpis.enService / kpis.total) * 100)
  }, [kpis])

  const tauxDisponibilite = useMemo(() => {
    if (kpis.total === 0) return 0
    return Math.round(((kpis.disponibles + kpis.enService) / kpis.total) * 100)
  }, [kpis])

  const kpiCards: KpiDef[] = [
    {
      label: 'Parc total', value: kpis.total,
      gradient: 'bg-gradient-to-br from-gray-500/5 to-transparent',
      iconBg: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300',
      glowColor: 'rgba(107, 114, 128, 0.3)',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
    },
    {
      label: 'En service', value: kpis.enService,
      gradient: 'bg-gradient-to-br from-blue-500/5 to-transparent',
      iconBg: 'bg-blue-50 dark:bg-blue-900/25 text-blue-500',
      glowColor: 'rgba(59, 130, 246, 0.3)',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    },
    {
      label: 'Disponibles', value: kpis.disponibles,
      gradient: 'bg-gradient-to-br from-green-500/5 to-transparent',
      iconBg: 'bg-green-50 dark:bg-green-900/20 text-green-500',
      glowColor: 'rgba(34, 197, 94, 0.3)',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    },
    {
      label: 'En panne', value: kpis.enPanne, pulse: true,
      gradient: 'bg-gradient-to-br from-red-500/5 to-transparent',
      iconBg: 'bg-red-50 dark:bg-red-900/20 text-red-500',
      glowColor: 'rgba(239, 68, 68, 0.3)',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    },
    {
      label: 'En transit', value: kpis.enTransit,
      gradient: 'bg-gradient-to-br from-violet-500/5 to-transparent',
      iconBg: 'bg-violet-50 dark:bg-violet-900/20 text-violet-500',
      glowColor: 'rgba(139, 92, 246, 0.3)',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75M8.25 18.75h6" /></svg>,
    },
  ]

  if (loading) return <CockpitSkeleton />

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0">
      <div className="cockpit-mesh-bg relative flex-1 min-h-0 overflow-y-auto pb-8">

        {/* Floating background particles */}
        <FloatingParticles />

        <div className="relative z-10">

          {/* ══════════════ HEADER ══════════════ */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3.5">
                <motion.div
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                  </svg>
                </motion.div>
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    Pilotage Matériel
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Vue d'ensemble du parc engins et ressources
                  </p>
                </div>
              </div>
              <MaterielModuleTabs />
            </motion.div>

            <motion.div
              className="flex items-center gap-3 self-start"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <LiveClock />
              <motion.button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-sm
                           shadow-lg shadow-primary/25"
                whileHover={{ scale: 1.05, boxShadow: '0 12px 30px -4px rgba(232, 90, 42, 0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t('engin.create')}
              </motion.button>
            </motion.div>
          </div>

          {/* ══════════════ KPI CARDS ══════════════ */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {kpiCards.map((kpi, i) => (
              <TiltKpiCard key={kpi.label} kpi={kpi} index={i} total={kpis.total} />
            ))}
          </div>

          {/* ══════════════ MIDDLE — Gauges + Donut + Alerts ══════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

            {/* Gauges column */}
            <motion.div
              className="lg:col-span-3 cockpit-glass rounded-2xl p-6 flex flex-col items-center justify-center gap-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <AnimatedGauge value={tauxUtilisation} label="Utilisation" size={130} />

              <div className="w-full h-px bg-gray-200 dark:bg-gray-700/60" />

              <AnimatedGauge value={tauxDisponibilite} label="Disponibilité" size={110} />

              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center font-medium">
                Indicateurs temps réel du parc
              </p>
            </motion.div>

            {/* Donut chart */}
            {donutData.length > 0 && (
              <motion.div
                className="lg:col-span-5 cockpit-glass rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                      <path d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Répartition du parc</h2>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Par statut opérationnel</p>
                  </div>
                </div>
                <FleetDonutChart data={donutData} total={kpis.total} />
              </motion.div>
            )}

            {/* Right column — Alerts + Quick access */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <motion.div
                className="cockpit-glass rounded-2xl p-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  </motion.div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Alertes & activité</h2>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Situation en temps réel</p>
                  </div>
                </div>
                <ActivityFeed
                  projetsSuspendus={projetsSuspendus}
                  nbEnginsPanne={kpis.enPanne}
                  nbEnTransit={kpis.enTransit}
                  projetsActifs={projetsActifs}
                />
              </motion.div>

              <motion.div
                className="cockpit-glass rounded-2xl p-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Accès rapides</h2>
                <QuickAccessGrid />
              </motion.div>
            </div>
          </div>

          {/* ══════════════ TOP PROJETS ══════════════ */}
          {topProjets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center text-secondary dark:text-secondary-light">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Projets avec engins</h2>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {topProjets.length} projet{topProjets.length > 1 ? 's' : ''} avec engins affectés
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => navigate('/projets')}
                  className="text-xs font-bold text-primary hover:text-primary-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Voir tous &rarr;
                </motion.button>
              </div>
              <div className="space-y-2">
                {topProjets.map((p, i) => (
                  <CompactProjetRow key={p.id} projet={p} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <EnginFormModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              dispatch(fetchEngins({ page: 0, size: 20 }))
            }}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  )
}
