import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import frCommon from './locales/fr/common.json'
import frLayout from './locales/fr/layout.json'
import frAuth from './locales/fr/auth.json'
import frUser from './locales/fr/user.json'
import frProjet from './locales/fr/projet.json'
import frEquipe from './locales/fr/equipe.json'
import frReunionHebdo from './locales/fr/reunionHebdo.json'
import frMateriel from './locales/fr/materiel.json'
import frCommunication from './locales/fr/communication.json'
import frBudget from './locales/fr/budget.json'
import frPlanning from './locales/fr/planning.json'
import frQualite from './locales/fr/qualite.json'
import frSecurite from './locales/fr/securite.json'
import frReporting from './locales/fr/reporting.json'
import frDocument from './locales/fr/document.json'
import frFournisseur from './locales/fr/fournisseur.json'
import frBareme from './locales/fr/bareme.json'
import frParametres from './locales/fr/parametres.json'
import enCommon from './locales/en/common.json'
import enLayout from './locales/en/layout.json'
import enAuth from './locales/en/auth.json'
import enUser from './locales/en/user.json'
import enProjet from './locales/en/projet.json'
import enEquipe from './locales/en/equipe.json'
import enReunionHebdo from './locales/en/reunionHebdo.json'
import enMateriel from './locales/en/materiel.json'
import enCommunication from './locales/en/communication.json'
import enBudget from './locales/en/budget.json'
import enPlanning from './locales/en/planning.json'
import enQualite from './locales/en/qualite.json'
import enSecurite from './locales/en/securite.json'
import enReporting from './locales/en/reporting.json'
import enDocument from './locales/en/document.json'
import enFournisseur from './locales/en/fournisseur.json'
import enBareme from './locales/en/bareme.json'
import enParametres from './locales/en/parametres.json'

const LOCALE_KEY = 'mika-locale'
export type Locale = 'fr' | 'en'

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'fr'
  const fromWindow = (window as unknown as { __INITIAL_LOCALE__?: string }).__INITIAL_LOCALE__
  if (fromWindow === 'fr' || fromWindow === 'en') return fromWindow
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored === 'fr' || stored === 'en') return stored
  return 'fr'
}

const resources = {
  fr: {
    common: frCommon as Record<string, unknown>,
    layout: frLayout as Record<string, unknown>,
    auth: frAuth as Record<string, unknown>,
    user: frUser as Record<string, unknown>,
    projet: frProjet as Record<string, unknown>,
    equipe: frEquipe as Record<string, unknown>,
    reunionHebdo: frReunionHebdo as Record<string, unknown>,
    materiel: frMateriel as Record<string, unknown>,
    communication: frCommunication as Record<string, unknown>,
    budget: frBudget as Record<string, unknown>,
    planning: frPlanning as Record<string, unknown>,
    qualite: frQualite as Record<string, unknown>,
    securite: frSecurite as Record<string, unknown>,
    reporting: frReporting as Record<string, unknown>,
    document: frDocument as Record<string, unknown>,
    fournisseur: frFournisseur as Record<string, unknown>,
    bareme: frBareme as Record<string, unknown>,
    parametres: frParametres as Record<string, unknown>,
  },
  en: {
    common: enCommon as Record<string, unknown>,
    layout: enLayout as Record<string, unknown>,
    auth: enAuth as Record<string, unknown>,
    user: enUser as Record<string, unknown>,
    projet: enProjet as Record<string, unknown>,
    equipe: enEquipe as Record<string, unknown>,
    reunionHebdo: enReunionHebdo as Record<string, unknown>,
    materiel: enMateriel as Record<string, unknown>,
    communication: enCommunication as Record<string, unknown>,
    budget: enBudget as Record<string, unknown>,
    planning: enPlanning as Record<string, unknown>,
    qualite: enQualite as Record<string, unknown>,
    securite: enSecurite as Record<string, unknown>,
    reporting: enReporting as Record<string, unknown>,
    document: enDocument as Record<string, unknown>,
    fournisseur: enFournisseur as Record<string, unknown>,
    bareme: enBareme as Record<string, unknown>,
    parametres: enParametres as Record<string, unknown>,
  },
}

const initialLocale = getInitialLocale()

/** Promesse résolue quand i18n est prêt (pour attendre avant le premier rendu, évite le flash). */
export const i18nReady = i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  fallbackLng: 'fr',
  defaultNS: 'common',
  ns: ['common', 'layout', 'auth', 'user', 'projet', 'equipe', 'reunionHebdo', 'materiel', 'communication', 'budget', 'planning', 'qualite', 'securite', 'reporting', 'document', 'fournisseur', 'bareme', 'parametres'],
  interpolation: {
    escapeValue: false,
  },
})

/** Applique la langue au document (attribut lang). À appeler au bootstrap et à chaque changement de langue. */
export function applyLocaleToDocument(locale: Locale): void {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
}

applyLocaleToDocument(initialLocale)

export { i18n }
export { LOCALE_KEY, getInitialLocale }
