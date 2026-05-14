import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { auditApi } from '@/api/userApi'

const PAGE_LABELS: Record<string, string> = {
  '/': 'Tableau de bord',
  '/projets': 'Projets',
  '/salle-mika': 'Salle MIKA',
  '/salle-mika/pv': 'Salle MIKA - Procès-verbaux',
  '/equipes': 'Équipes',
  '/engins': 'Engins & Matériel',
  '/materiaux': 'Matériaux & Stocks',
  '/budget': 'Budget & Finances',
  '/planning': 'Planning & Tâches',
  '/qualite': 'Qualité & Conformité',
  '/securite': 'Sécurité & Prévention',
  '/messagerie': 'Messagerie',
  '/notifications': 'Notifications',
  '/documents': 'Documents',
  '/fournisseurs': 'Fournisseurs',
  '/users': 'Gestion des utilisateurs',
  '/profile': 'Mon profil',
  '/parametres': 'Paramètres',
  '/reporting': 'Reporting & Analyse',
  '/suivi-activite': 'Suivi d\'activité',
}

function getPageLabel(pathname: string): string {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname]
  if (pathname.match(/^\/projets\/\d+\/edit$/)) return 'Modification projet'
  if (pathname.match(/^\/projets\/nouveau$/)) return 'Nouveau projet'
  if (pathname.match(/^\/projets\/\d+\/historique$/)) return 'Historique projet'
  if (pathname.match(/^\/projets\/\d+$/)) return 'Détail projet'
  if (pathname.match(/^\/users\/\d+$/)) return 'Détail utilisateur'
  if (pathname.match(/^\/equipes\/\d+\/edit$/)) return 'Modification équipe'
  if (pathname.match(/^\/equipes\/nouveau$/)) return 'Nouvelle équipe'
  if (pathname.match(/^\/equipes\/\d+$/)) return 'Détail équipe'
  if (pathname.match(/^\/salle-mika\/pv\/\d+\/edit$/)) return 'Salle MIKA - Édition PV'
  if (pathname.match(/^\/salle-mika\/pv\/nouveau$/)) return 'Salle MIKA - Nouveau PV'
  if (pathname.match(/^\/salle-mika\/pv\/\d+$/)) return 'Salle MIKA - Détail PV'
  return pathname
}

const DEBOUNCE_MS = 2000

export function usePageTracking(enabled: boolean) {
  const location = useLocation()
  const lastTracked = useRef<string>('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return
    const path = location.pathname
    if (path === '/login' || path.startsWith('/forgot-password') || path.startsWith('/reset-password')) return
    if (path === lastTracked.current) return

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      lastTracked.current = path
      const label = getPageLabel(path)
      auditApi.trackPageView(label).catch(() => {})
    }, DEBOUNCE_MS)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [location.pathname, enabled])
}
