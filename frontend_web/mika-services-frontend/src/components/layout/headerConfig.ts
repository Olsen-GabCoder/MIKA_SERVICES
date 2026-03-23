/**
 * Configuration des clés i18n (namespace layout) pour breadcrumbs et titres de section.
 * Les libellés sont résolus via t() dans Header.
 */

export interface BreadcrumbSegment {
  path: string
  /** Clé i18n layout (ex. breadcrumb.dashboard). */
  labelKey: string
}

/** Clés des segments de chemin (premier niveau) */
const SEGMENT_LABEL_KEYS: Record<string, string> = {
  '': 'breadcrumb.dashboard',
  profile: 'breadcrumb.profile',
  users: 'breadcrumb.users',
  projets: 'breadcrumb.projets',
  chantiers: 'breadcrumb.chantiers',
  equipes: 'breadcrumb.equipes',
  engins: 'breadcrumb.engins',
  materiaux: 'breadcrumb.materiaux',
  budget: 'breadcrumb.budget',
  planning: 'breadcrumb.planning',
  qualite: 'breadcrumb.qualite',
  securite: 'breadcrumb.securite',
  messagerie: 'breadcrumb.messagerie',
  notifications: 'breadcrumb.notifications',
  reporting: 'breadcrumb.reporting',
  documents: 'breadcrumb.documents',
  fournisseurs: 'breadcrumb.fournisseurs',
  bareme: 'breadcrumb.bareme',
  articles: 'breadcrumb.detail',
}

/** Clés pour sous-routes (nouveau, edit) par segment parent */
const SUB_LABEL_KEYS: Record<string, Record<string, string>> = {
  projets: { nouveau: 'breadcrumb.nouveauProjet', edit: 'breadcrumb.edit' },
  chantiers: { nouveau: 'breadcrumb.nouveauChantier', edit: 'breadcrumb.edit' },
  equipes: { nouveau: 'breadcrumb.nouvelleEquipe', edit: 'breadcrumb.edit' },
  articles: { nouveau: 'breadcrumb.nouveau', edit: 'breadcrumb.edit' },
}

const isIdSegment = (s: string) => /^[a-f0-9-]{36}$/i.test(s) || /^\d+$/.test(s)

/**
 * Construit les segments de breadcrumb à partir du pathname.
 * Chaque segment a une labelKey à traduire avec t('layout:' + labelKey) ou t(labelKey) si ns layout.
 */
export function getBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  const result: BreadcrumbSegment[] = [{ path: '/', labelKey: 'breadcrumb.dashboard' }]
  let path = ''

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    path += `/${seg}`

    const parent = segments[i - 1]
    let labelKey: string

    if (seg === 'nouveau' || seg === 'edit') {
      labelKey = parent && SUB_LABEL_KEYS[parent]?.[seg] ? SUB_LABEL_KEYS[parent][seg] : seg === 'edit' ? 'breadcrumb.edit' : seg
    } else if (isIdSegment(seg) && parent && (parent === 'projets' || parent === 'chantiers' || parent === 'equipes')) {
      labelKey = 'breadcrumb.detail'
    } else {
      labelKey = SEGMENT_LABEL_KEYS[seg] ?? seg
    }

    result.push({ path, labelKey })
  }

  return result
}

/** Clé i18n du titre de section (premier niveau). */
export function getSectionTitleKey(pathname: string): string {
  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  if (segments.length === 0) return 'breadcrumb.dashboard'
  return SEGMENT_LABEL_KEYS[segments[0]] ?? segments[0]
}
