export interface PageGuidance {
  context: string
  greeting: string
  suggestions: string[]
}

function pg(context: string, greeting: string, suggestions: string[]): PageGuidance {
  return { context, greeting, suggestions }
}

export const GUIDANCE_REGISTRY: Record<string, PageGuidance> = {
  '/': pg(
    'dashboard',
    'Je peux vous expliquer vos indicateurs ou vous aider a naviguer.',
    ['Explique-moi ces KPIs', 'Quels projets sont en retard ?', 'Comment naviguer dans la plateforme ?']
  ),
  '/projets': pg(
    'projets',
    'Besoin d\'aide pour gerer vos projets ? Posez-moi vos questions.',
    ['Comment creer un projet ?', 'Que signifient les statuts ?', 'Comment exporter en Excel ?']
  ),
  '/projets/:id': pg(
    'projet-detail',
    'Je peux analyser vos rapports ou vous aider sur ce projet.',
    ['Resume l\'etat du projet', 'Que faire ensuite ?', 'Explique le DQE']
  ),
  '/budget': pg(
    'budget',
    'Je peux analyser votre consommation budgetaire.',
    ['Le budget est-il en danger ?', 'Explique le taux de consommation', 'Comment ajouter une depense ?']
  ),
  '/planning': pg(
    'planning',
    'Je vous aide a gerer vos taches et priorites.',
    ['Quelles taches sont critiques ?', 'Comment creer une tache ?', 'Que signifient les priorites ?']
  ),
  '/equipes': pg(
    'equipes',
    'Gestion de vos equipes de chantier.',
    ['Comment creer une equipe ?', 'Types d\'equipes disponibles', 'Affecter un membre']
  ),
  '/engins': pg(
    'engins',
    'Votre parc d\'engins et machines.',
    ['Taux d\'utilisation normal ?', 'Comment transferer un engin ?', 'Engins en panne']
  ),
  '/materiaux': pg(
    'materiaux',
    'Stock de materiaux par chantier.',
    ['Seuils de stock minimum ?', 'Comment commander ?', 'Alertes stock bas']
  ),
  '/dma': pg(
    'dma',
    'Suivi des demandes de materiel.',
    ['Comment fonctionne le circuit de validation ?', 'Creer une DMA', 'Statuts des DMA']
  ),
  '/messagerie': pg(
    'messagerie',
    'Messagerie interne de l\'equipe.',
    ['Comment mentionner quelqu\'un ?', 'Envoyer un fichier', 'Archiver une conversation']
  ),
  '/notifications': pg(
    'notifications',
    'Vos alertes et notifications.',
    ['Types de notifications', 'Tout marquer comme lu', 'Configurer les alertes']
  ),
  '/documents': pg(
    'documents',
    'Gestion documentaire centralisee.',
    ['Formats acceptes ?', 'Taille max de fichier ?', 'Organiser par type']
  ),
  '/fournisseurs': pg(
    'fournisseurs',
    'Repertoire fournisseurs et commandes.',
    ['Ajouter un fournisseur', 'Suivre une commande', 'Evaluer un fournisseur']
  ),
  '/bareme': pg(
    'bareme',
    'Catalogue de reference des prix BTP.',
    ['Comment trouver un article ?', 'Que signifie le prix unitaire ?', 'Importer depuis Excel']
  ),
  '/reporting': pg(
    'reporting',
    'Tableaux de bord analytiques.',
    ['Explique ce graphique', 'Tendances des projets', 'Exporter le rapport']
  ),
  '/qshe': pg(
    'qshe-dashboard',
    'Vue d\'ensemble QSHE de vos chantiers.',
    ['Indicateurs cles QSHE', 'Incidents recents', 'Actions correctives en retard']
  ),
  '/qshe/dashboard': pg(
    'qshe-dashboard',
    'Vue d\'ensemble QSHE de vos chantiers.',
    ['Indicateurs cles QSHE', 'Incidents recents', 'Actions correctives en retard']
  ),
  '/qshe/incidents': pg(
    'incidents',
    'Securite, hygiene, environnement — je vous guide.',
    ['Comment declarer un incident ?', 'Qu\'est-ce qu\'un presqu\'accident ?', 'Workflow d\'un incident']
  ),
  '/qshe/inspections': pg(
    'inspections',
    'Inspections de chantier et scores.',
    ['Score minimum acceptable ?', 'Creer une checklist', 'Planifier une inspection']
  ),
  '/qshe/risques': pg(
    'risques',
    'Evaluation des risques professionnels.',
    ['Explique la matrice P x G', 'Quels risques sont critiques ?', 'Qu\'est-ce que le DUERP ?']
  ),
  '/qshe/epi': pg(
    'epi',
    'Equipements de protection individuelle.',
    ['EPI obligatoires BTP ?', 'Alertes peremption', 'Doter un employe']
  ),
  '/qshe/causeries': pg(
    'causeries',
    'Causeries securite sur le terrain.',
    ['Qu\'est-ce qu\'une causerie ?', 'Frequence recommandee ?', 'Enregistrer une causerie']
  ),
  '/qshe/permis': pg(
    'permis-travail',
    'Permis de travail pour travaux a risque.',
    ['Types de permis', 'Renouveler un permis', 'Permis expirant bientot']
  ),
  '/qshe/environnement': pg(
    'environnement',
    'Suivi environnemental des chantiers.',
    ['Indicateurs environnement', 'Gestion des dechets', 'Seuils reglementaires']
  ),
  '/qshe/produits-chimiques': pg(
    'environnement',
    'Fiches de donnees de securite des produits chimiques.',
    ['Ajouter un produit', 'FDS obligatoires', 'Stockage securise']
  ),
  '/qshe/formations': pg(
    'qshe-dashboard',
    'Formations securite du personnel.',
    ['Habilitations requises', 'Formations expirant bientot', 'Planifier une formation']
  ),
  '/qualite/receptions': pg(
    'qualite-evenements',
    'Receptions de travaux et reserves.',
    ['Circuit de reception', 'Reception provisoire vs definitive', 'Lever une reserve']
  ),
  '/qualite/essais-labo': pg(
    'essais-labo',
    'Resultats des essais beton.',
    ['Qu\'est-ce que le slump ?', 'Normes beton NF', 'Interpreter les resultats']
  ),
  '/qualite/levees-topo': pg(
    'qualite-evenements',
    'Releves topographiques.',
    ['Qu\'est-ce qu\'une levee topo ?', 'Frequence recommandee', 'Importer des donnees']
  ),
  '/qualite/agrements': pg(
    'qualite-evenements',
    'Agrements de materiaux et procedes.',
    ['Qu\'est-ce qu\'un agrement ?', 'Processus de validation', 'Agrements en attente']
  ),
  '/qualite/evenements': pg(
    'qualite-evenements',
    'NC, RC, PPI — je vous explique tout.',
    ['Difference NC vs RC vs PPI ?', 'Comment cloturer un evenement ?', 'NC ouvertes']
  ),
  '/qualite/synthese': pg(
    'qualite-synthese',
    'Synthese mensuelle qualite.',
    ['Interpreter la synthese', 'Barres de statut', 'Exporter la synthese']
  ),
  '/qualite/documents': pg(
    'qualite-evenements',
    'Documents qualite versionnes.',
    ['Ajouter un document', 'Versionner un document', 'Types de documents qualite']
  ),
  '/salle-mika': pg(
    'salle-mika',
    'Votre salle de visioconference.',
    ['Comment demarrer une reunion ?', 'Raccourcis clavier', 'Inviter des participants']
  ),
  '/profile': pg(
    'profil',
    'Gerez votre profil et votre securite.',
    ['Comment activer la 2FA ?', 'Changer mon mot de passe', 'Voir mes sessions actives']
  ),
  '/parametres': pg(
    'parametres',
    'Chaque reglage a un impact precis — demandez-moi.',
    ['Que fait le mode hors-ligne ?', 'Difference compact vs espace ?', 'Changer la langue']
  ),
  '/users': pg(
    'utilisateurs',
    'Administration des comptes.',
    ['Comment creer un utilisateur ?', 'Quels roles existent ?', 'Desactiver un compte']
  ),
  '/suivi-activite': pg(
    'utilisateurs',
    'Journal d\'audit de la plateforme.',
    ['Types d\'evenements traces', 'Filtrer par utilisateur', 'Exporter le journal']
  ),
}

/**
 * Resolve guidance for a given pathname, handling dynamic segments like /projets/:id
 */
export function resolveGuidance(pathname: string): PageGuidance {
  // Exact match first
  if (GUIDANCE_REGISTRY[pathname]) return GUIDANCE_REGISTRY[pathname]

  // Dynamic routes: /projets/:id/dqe, /projets/:id, etc.
  if (/^\/projets\/\d+\/dqe/.test(pathname)) return { context: 'dqe', greeting: 'Le DQE detail tous les postes de depenses.', suggestions: ['Importer un DQE', 'Verifier les totaux', 'Exporter en Excel'] }
  if (/^\/projets\/\d+\/documents/.test(pathname)) return GUIDANCE_REGISTRY['/documents'] ?? FALLBACK
  if (/^\/projets\/\d+\/historique/.test(pathname)) return { context: 'projet-detail', greeting: 'Historique des modifications du projet.', suggestions: ['Voir les changements recents', 'Qui a modifie quoi ?'] }
  if (/^\/projets\/\d+\/edit/.test(pathname)) return { context: 'projet-detail', greeting: 'Modification du projet.', suggestions: ['Champs obligatoires', 'Enregistrer les modifications'] }
  if (/^\/projets\/\d+/.test(pathname)) return GUIDANCE_REGISTRY['/projets/:id'] ?? FALLBACK
  if (/^\/equipes\/\d+/.test(pathname)) return GUIDANCE_REGISTRY['/equipes'] ?? FALLBACK
  if (/^\/engins\/\d+/.test(pathname)) return GUIDANCE_REGISTRY['/engins'] ?? FALLBACK
  if (/^\/dma\/\d+/.test(pathname)) return GUIDANCE_REGISTRY['/dma'] ?? FALLBACK
  if (/^\/users\/\d+/.test(pathname)) return GUIDANCE_REGISTRY['/users'] ?? FALLBACK
  if (/^\/bareme\/articles/.test(pathname)) return GUIDANCE_REGISTRY['/bareme'] ?? FALLBACK
  if (/^\/qualite\/evenements\/\d+/.test(pathname)) return GUIDANCE_REGISTRY['/qualite/evenements'] ?? FALLBACK
  if (/^\/salle-mika\/pv/.test(pathname)) return GUIDANCE_REGISTRY['/salle-mika'] ?? { context: 'reunions-hebdo', greeting: 'Proces-verbaux de reunions.', suggestions: ['Creer un PV', 'Format standard du PV'] }

  return FALLBACK
}

const FALLBACK: PageGuidance = {
  context: 'dashboard',
  greeting: 'Comment puis-je vous aider ?',
  suggestions: ['Que puis-je faire ici ?', 'Guide de la plateforme', 'Raccourcis utiles'],
}
