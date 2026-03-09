/**
 * Semaine calendaire ISO 8601 à partir d'une date.
 * Utilisé pour lier la réunion hebdo (date) aux données projet (prévisions par semaine).
 */

export function getSemaineCalendaireISO(date: Date): number {
  const d = new Date(date.getTime())
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 4)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d.getTime() - jan1.getTime()) / 86400000) + 1) / 7)
}

export function getWeekYearFromDateString(dateStr: string): { week: number; year: number } {
  const date = new Date(dateStr + 'T12:00:00')
  return { week: getSemaineCalendaireISO(date), year: date.getFullYear() }
}
