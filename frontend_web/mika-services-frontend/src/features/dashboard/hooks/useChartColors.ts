import { useMemo } from 'react'
import { useAppSelector } from '@/store/hooks'

interface ChartColors {
  /** 8 couleurs principales pour les series de donnees */
  series: string[]
  /** Couleur de la grille cartesienne */
  grid: string
  /** Couleur des labels d'axes */
  tick: string
  /** Fond des tooltips */
  tooltipBg: string
  /** Bordure des tooltips */
  tooltipBorder: string
}

const LIGHT: ChartColors = {
  series: [
    '#2E5266', // secondary
    '#48B5A0', // teal
    '#FF6B35', // accent
    '#F0C15A', // gold
    '#8B5CF6', // violet
    '#E85D75', // rose
    '#06B6D4', // cyan
    '#6366F1', // indigo
  ],
  grid: '#E5E7EB',
  tick: '#94A3B8',
  tooltipBg: 'rgba(255, 255, 255, 0.95)',
  tooltipBorder: '#F1F5F9',
}

const DARK: ChartColors = {
  series: [
    '#4A8DA8',
    '#5FCDB8',
    '#FF8255',
    '#F5D078',
    '#A78BFA',
    '#F08098',
    '#22D3EE',
    '#818CF8',
  ],
  grid: 'rgba(63, 63, 70, 0.4)',
  tick: '#71717A',
  tooltipBg: 'rgba(24, 24, 27, 0.95)',
  tooltipBorder: '#3F3F46',
}

/**
 * Retourne la palette recharts adaptee au theme courant (clair/sombre).
 * Lit le theme depuis Redux uiSlice.theme.
 */
export function useChartColors(): ChartColors {
  const theme = useAppSelector(s => s.ui.theme)
  return useMemo(() => (theme === 'dark' ? DARK : LIGHT), [theme])
}
