import { type ReactNode } from 'react'
import { HoverCard } from './HoverCard'

/* ── Icone info (cercle i) ── */
function IconInfo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

/* ── Icone ampoule (tip) ── */
function IconLightbulb({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5C8.26 12.26 8.72 13.02 8.91 14" />
    </svg>
  )
}

/* ── Glossaire BTP ── */
export interface GlossaryEntry {
  full: string
  definition: string
  tip?: string
}

export const BTP_GLOSSARY: Record<string, GlossaryEntry> = {
  dqe: {
    full: 'Devis Quantitatif et Estimatif',
    definition: 'Document qui liste tous les travaux d\'un projet avec leurs quantites et prix unitaires. C\'est la base du budget projet.',
    tip: 'Vous pouvez importer un DQE depuis un fichier Excel ou PDF via l\'assistant IA.',
  },
  nc: {
    full: 'Non-Conformite',
    definition: 'Ecart constate entre le resultat obtenu et les exigences specifiees (qualite, normes, cahier des charges).',
    tip: 'Une NC doit etre traitee et cloturee. Elle peut generer une action corrective (CAPA).',
  },
  rc: {
    full: 'Remarque Constructive',
    definition: 'Observation d\'amelioration identifiee lors d\'un controle ou d\'une inspection. Moins grave qu\'une NC.',
  },
  ppi: {
    full: 'Proposition de Progres et d\'Innovation',
    definition: 'Suggestion d\'amelioration proactive, sans non-conformite constatee. Valorise l\'amelioration continue.',
  },
  duerp: {
    full: 'Document Unique d\'Evaluation des Risques Professionnels',
    definition: 'Document obligatoire qui recense tous les risques pour la sante et la securite des travailleurs.',
    tip: 'Le DUERP doit etre mis a jour au moins une fois par an ou lors de tout changement significatif.',
  },
  epi: {
    full: 'Equipement de Protection Individuelle',
    definition: 'Materiel porte par le travailleur pour se proteger : casque, gants, gilet, lunettes, chaussures, harnais.',
    tip: 'Verifiez regulierement les dates de peremption des EPI.',
  },
  capa: {
    full: 'Corrective And Preventive Action',
    definition: 'Action mise en place pour corriger une non-conformite et empecher sa recurrence.',
    tip: 'Une CAPA est toujours liee a une source : incident, inspection ou NC.',
  },
  dma: {
    full: 'Demande de Materiel et d\'Approvisionnement',
    definition: 'Formulaire de demande de materiel qui suit un circuit de validation avant commande.',
    tip: 'Le circuit : Brouillon, Soumise, Validee Chef Projet, Validee DG, En commande, Livree.',
  },
  ca: {
    full: 'Chiffre d\'Affaires',
    definition: 'Revenu genere par le projet. Le CA previsionnel est l\'objectif, le CA realise est le montant effectif.',
  },
  ht: {
    full: 'Hors Taxes',
    definition: 'Montant sans les taxes. Standard dans les marches de travaux BTP.',
  },
  pxg: {
    full: 'Probabilite x Gravite',
    definition: 'Methode d\'evaluation des risques. Chaque risque est cote de 1 a 5 sur deux axes, le produit donne le niveau de risque.',
    tip: 'Score 1-4 : Faible / 5-9 : Moyen / 10-14 : Eleve / 15-25 : Critique.',
  },
  causerie: {
    full: 'Causerie Securite',
    definition: 'Reunion courte (10-15 min) de sensibilisation securite organisee directement sur le terrain avant le debut des travaux.',
    tip: 'Objectif recommande : 1 causerie par semaine et par chantier.',
  },
  levee_topo: {
    full: 'Levee Topographique',
    definition: 'Releve de mesures du terrain par un geometre pour verifier les cotes, les niveaux et l\'implantation des ouvrages.',
  },
  agrement: {
    full: 'Agrement',
    definition: 'Approbation officielle d\'un materiau, d\'un produit ou d\'un procede avant sa mise en oeuvre sur le chantier.',
    tip: 'L\'agrement est requis avant toute utilisation. Il est valide par le maitre d\'oeuvre.',
  },
  pv: {
    full: 'Proces-Verbal',
    definition: 'Compte-rendu officiel d\'une reunion, d\'une inspection ou d\'une reception de travaux.',
  },
  slump: {
    full: 'Test d\'affaissement (Slump)',
    definition: 'Mesure de la consistance du beton frais. Un cone est rempli de beton puis retire : on mesure l\'affaissement en cm.',
    tip: 'Norme NF EN 12350-2. Valeur typique : S3 (100-150 mm) pour beton courant.',
  },
  ft: {
    full: 'Forfait',
    definition: 'Unite de prix pour une prestation globale, independamment des quantites detaillees.',
  },
  ff: {
    full: 'Forfait Fixe',
    definition: 'Prix fixe non revisable pour une prestation complete.',
  },
  pm: {
    full: 'Pour Memoire',
    definition: 'Poste du DQE dont le montant est nul mais qui est mentionne pour reference ou pour une eventuelle mise en oeuvre future.',
  },
  qshe: {
    full: 'Qualite, Securite, Hygiene, Environnement',
    definition: 'Ensemble des domaines couvrant la maitrise de la qualite des ouvrages, la securite des personnes, l\'hygiene et la protection de l\'environnement.',
  },
  taux_consommation: {
    full: 'Taux de consommation budgetaire',
    definition: 'Pourcentage du budget depense par rapport au budget de reference. Formule : (depenses / budget) x 100.',
    tip: 'Vert < 70%, Orange 70-90%, Rouge > 90%.',
  },
  avancement_physique: {
    full: 'Avancement physique',
    definition: 'Pourcentage de travaux physiquement realises par rapport au total prevu. Mesure par le maitre d\'oeuvre.',
  },
  avancement_financier: {
    full: 'Avancement financier',
    definition: 'Pourcentage du budget effectivement depense par rapport au budget total du projet.',
  },
  point_bloquant: {
    full: 'Point Bloquant',
    definition: 'Probleme ou obstacle qui empeche l\'avancement normal des travaux et necessite une resolution rapide.',
    tip: 'Les points bloquants ont une priorite : Basse, Normale, Haute, Critique, Urgente.',
  },
  prevision: {
    full: 'Prevision',
    definition: 'Tache ou activite planifiee pour une semaine donnee avec un type (production, approvisionnement, RH, materiel).',
  },
  aps: {
    full: 'Avant-Projet Sommaire',
    definition: 'Phase d\'etude preliminaire qui definit les grandes lignes du projet : faisabilite, estimation de cout, principes techniques.',
  },
  apd: {
    full: 'Avant-Projet Detaille',
    definition: 'Phase d\'etude approfondie qui precise les solutions techniques retenues, les plans detailles et le chiffrage precis.',
  },
  exe: {
    full: 'Etudes d\'Execution',
    definition: 'Phase finale d\'etude produisant les plans de detail necessaires a la realisation des travaux sur le terrain.',
  },
  '2fa': {
    full: 'Verification en deux etapes',
    definition: 'Securite supplementaire : apres le mot de passe, un code a 6 chiffres genere par une application (Google Authenticator, etc.) est requis.',
    tip: 'Fortement recommande pour les comptes administrateurs.',
  },
}

/* ── Composant SmartTooltip ── */
export interface SmartTooltipProps {
  /** Cle du glossaire (ex: "dqe", "nc", "epi") */
  term: string
  /** Contenu sur lequel afficher le tooltip (le texte visible) */
  children: ReactNode
  /** Position du popover */
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function SmartTooltip({ term, children, side = 'top' }: SmartTooltipProps) {
  const entry = BTP_GLOSSARY[term.toLowerCase()]
  if (!entry) return <>{children}</>

  const trigger = (
    <span className="inline-flex items-center gap-1 cursor-help">
      {children}
      <span className="text-gray-400 dark:text-gray-500 hover:text-secondary dark:hover:text-secondary-light transition-colors">
        <IconInfo size={14} />
      </span>
    </span>
  )

  return (
    <HoverCard trigger={trigger} side={side} maxWidth={320} openDelay={150} closeDelay={200}>
      <div className="space-y-2">
        {/* Titre */}
        <div className="flex items-center gap-2">
          <span className="text-secondary dark:text-secondary-light">
            <IconInfo size={15} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">
            {entry.full}
          </span>
        </div>

        {/* Definition */}
        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          {entry.definition}
        </p>

        {/* Astuce */}
        {entry.tip && (
          <div className="flex items-start gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-700">
            <span className="text-amber-500 dark:text-amber-400 mt-0.5">
              <IconLightbulb size={13} />
            </span>
            <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 italic">
              {entry.tip}
            </p>
          </div>
        )}
      </div>
    </HoverCard>
  )
}
