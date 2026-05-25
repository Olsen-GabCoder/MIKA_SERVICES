# Plan Complet — Systeme d'Orientation IA Intelligent

## Audit de la plateforme

### Chiffres cles
- 59 pages, 19 modules, 85+ routes, 150+ endpoints API
- 9 roles utilisateur (SUPER_ADMIN a TECHNICIEN_LABORATOIRE)
- Guidance actuelle : 5 pages avec PageGuide, 7 pages avec SmartTooltip
- 47 pages sans AUCUNE guidance (80% de la plateforme)

### Etat actuel du systeme IA
- MikaAssistantButton + MikaAssistantDrawer (bouton flottant + drawer chat)
- GuidanceContext + guidanceRegistry (40+ routes avec suggestions)
- SmartTooltip (61 termes BTP dans le glossaire)
- PageGuide (3 variantes : welcome, contextual, warning)
- Backend : MikaAssistantService avec PAGE_CONTEXT_GUIDES (30+ pages)
- Input.tsx etendu avec helpText + aria-describedby

---

## PHASE 1 — Couverture Universelle (Guidance passive sur TOUTES les pages)

### Objectif : Chaque page a un PageGuide + SmartTooltip pertinent

#### 1.1 Pages sans PageGuide (47 pages a couvrir)

**Priorite HAUTE (pages complexes, frequentes) :**
- ProjetDetailPage — "Fiche complete du projet : avancement, budget, equipe, documents"
- ProjetDqePage — "Le DQE est votre devis detaille. Importez ou saisissez ligne par ligne"
- ProjetFormPage — Guide creation/edition projet
- EnginListPage — "Gerez votre parc materiel. Filtrez par statut, type ou chantier"
- EnginDetailPage — "Fiche equipement : historique mouvements, maintenance, affectation"
- MouvementEnginListPage — "Tracez chaque deplacement d'engin entre chantiers"
- MateriauListPage — "Stocks de materiaux par projet. Seuils d'alerte en rouge"
- DemandeMaterielListPage — "Demandes de materiel : creez, validez, suivez le statut"
- MessageriePage — "Messagerie interne : echangez avec vos collegues par projet"
- BaremePage — "Catalogue de prix BTP : recherchez par corps d'etat ou mot-cle"
- ReportingPage — "Tableaux de bord analytiques : chiffre d'affaires, budget, planning"
- SalleReunionPage — "Salle de reunion virtuelle : video + redaction de PV en direct"
- QsheDashboardPage — deja fait mais enrichir avec alertes intelligentes

**Priorite MOYENNE (pages secondaires) :**
- ProjetDocumentsPage, ProjetHistoriquePage
- EquipeListPage, EquipeDetailPage, EquipeFormPage
- DemandeMaterielFormPage, DemandeMaterielDetailPage
- NotificationsPage, DocumentPage, FournisseurPage
- BaremeArticleDetailPage, BaremeArticleCreatePage, BaremeArticleEditPage
- SyntheseMensuellePage, ReceptionsTravauxPage, LeveeTopoPage
- AgrementsPage, DocumentsQualitePage, EvenementDetailPage
- InspectionsPage, FormationsPage, PermisPage
- EnvironnementPage, ProduitsChimiquesPage
- ReunionHebdoListPage, ReunionHebdoFormPage, ReunionHebdoPVPage

**Priorite BASSE (pages admin/systeme) :**
- UserManagementPage, UserDetailPage, ActivityTrackingPage
- ProfilePage, ParametresPage
- LoginPage, ForgotPasswordPage, ResetPasswordPage

#### 1.2 SmartTooltip a ajouter (termes manquants par page)
- ProjetDetailPage : "avancement physique", "avancement financier", "point bloquant"
- BudgetPage : "taux consommation", "montant revise", "HT"
- PlanningPage : "chemin critique", "jalons"
- EnginListPage : "immobilisation", "amortissement"
- MateriauListPage : "stock minimum", "seuil d'alerte"
- DemandeMaterielListPage : "DMA", "bon de sortie"
- BaremePage : "corps d'etat", "debourse sec"
- SalleReunionPage : "PV", "ordre du jour"
- FormationsPage : "habilitation", "recyclage"
- PermisPage : "permis feu", "permis de fouille", "consignation"
- EnvironnementPage : "bilan carbone", "tri selectif"

---

## PHASE 2 — Etats Vides Intelligents (Empty States)

### Objectif : Quand une page n'a pas de donnees, guider au lieu d'afficher du vide

Pour chaque page liste, creer un EmptyState contextuel :

| Page | Icone | Message | Action |
|------|-------|---------|--------|
| ProjetListPage (0 projets) | Dossier | "Aucun projet pour l'instant" | "Creer votre premier projet" |
| PlanningPage (0 taches) | Calendrier | "Aucune tache planifiee" | "Creer une tache" |
| BudgetPage (pas de projet) | Portefeuille | "Selectionnez un projet" | Dropdown projet |
| IncidentsPage (0 incidents) | Bouclier | "Aucun incident declare — bonne nouvelle" | "Declarer un incident" |
| EnginListPage (0 engins) | Camion | "Aucun engin enregistre" | "Ajouter un engin" |
| MateriauListPage (0 materiaux) | Boite | "Aucun materiau en stock" | "Ajouter un materiau" |
| MessageriePage (0 messages) | Enveloppe | "Pas de messages — envoyez le premier" | "Nouveau message" |
| EquipeListPage (0 equipes) | Personnes | "Aucune equipe constituee" | "Creer une equipe" |
| FournisseurPage (0) | Carnet | "Aucun fournisseur reference" | "Ajouter un fournisseur" |
| DocumentPage (0) | Fichier | "Aucun document partage" | "Deposer un document" |

---

## PHASE 3 — Alertes Intelligentes Proactives

### Objectif : L'IA detecte les anomalies et previent l'utilisateur AVANT qu'il ne demande

#### 3.1 Alertes basees sur les donnees (PageGuide variant="warning")

| Condition | Page | Message |
|-----------|------|---------|
| Budget > 90% | BudgetPage | "Consommation a X% — zone critique" |
| Taches en retard > 0 | PlanningPage | "X taches en retard" |
| Incidents en investigation | IncidentsPage | "X incidents ouverts depuis Y jours" |
| EPI expires < 30j | EpiPage | "X EPI expirent dans les 30 prochains jours" |
| Formations expirees | FormationsPage | "X habilitations a renouveler" |
| Permis expires | PermisPage | "X permis de travail expirent cette semaine" |
| NC non cloturees > 30j | EvenementsPage | "X non-conformites ouvertes depuis plus de 30 jours" |
| Engins immobilises > 7j | EnginListPage | "X engins immobilises depuis plus de 7 jours" |
| DMA en attente validation | DemandeMaterielListPage | "X demandes en attente de validation" |
| Stock sous seuil | MateriauListPage | "X materiaux sous le seuil d'alerte" |
| Messages non lus > 10 | MessageriePage | "X messages non lus" |
| Reunion sans PV | ReunionHebdoListPage | "X reunions sans PV redige" |

#### 3.2 Alertes dans le Dashboard (hub central)

Le DashboardPage agrege les alertes critiques de tous les modules :
- Bandeau "Alertes du jour" avec compteurs par module
- Clic sur une alerte = navigation vers la page concernee

---

## PHASE 4 — Onboarding Progressif (Nouveau Utilisateur)

### Objectif : Un nouvel utilisateur comprend la plateforme en 5 minutes

#### 4.1 Composant OnboardingWizard

Etapes du wizard (modal plein ecran, 5 etapes) :
1. "Bienvenue sur MIKA Services" — presentation de la plateforme
2. "Votre tableau de bord" — explication des KPIs principaux
3. "Vos projets" — comment naviguer dans les projets
4. "L'assistant Mika" — presenter le bouton flottant et ses capacites
5. "Personnalisez" — theme, langue, notifications

Declenchement : premiere connexion (localStorage `mika_onboarding_done`)

#### 4.2 Composant FeatureSpotlight

Bulle qui pointe un element precis de l'interface :
- Fond assombri (backdrop) sauf l'element cible
- Fleche pointant vers l'element
- Texte explicatif + bouton "Suivant" / "Compris"

Utilisations :
- Premiere visite Dashboard : pointer le selecteur de projet
- Premiere visite Projets : pointer le bouton "Nouveau projet"
- Premiere visite Planning : pointer le bouton "Nouvelle tache"
- Premiere visite Assistant : pointer le bouton flottant Mika

#### 4.3 Composant ProgressTracker

Barre de progression "Configuration de votre espace" :
- [ ] Completer votre profil
- [ ] Creer ou rejoindre un projet
- [ ] Ajouter un membre a votre equipe
- [ ] Declarer votre premier engin
- [ ] Envoyer un message

Visible dans le Dashboard jusqu'a completion (5/5), puis disparait.

---

## PHASE 5 — Aide Contextuelle dans les Formulaires

### Objectif : Chaque champ complexe est auto-explicatif

#### 5.1 helpText sur les champs critiques

| Formulaire | Champ | helpText |
|------------|-------|----------|
| ProjetForm | montantHT | "Montant total du marche hors taxes en FCFA" |
| ProjetForm | delaiExecution | "Duree prevue en jours calendaires" |
| ProjetForm | codeProjet | "Code unique du projet (ex: PRJ-2026-001)" |
| DqeImport | fichier | "Formats acceptes : .xlsx, .csv. Colonnes attendues : designation, unite, quantite, prix unitaire" |
| EnginForm | immatriculation | "Plaque d'immatriculation ou numero interne" |
| EnginForm | dateMiseEnService | "Date de premiere utilisation sur chantier" |
| IncidentForm | gravite | "1 = Mineure (premiers soins), 2 = Moyenne (arret < 3j), 3 = Grave (arret > 3j), 4 = Tres grave (incapacite)" |
| IncidentForm | description | "Decrivez les faits, les circonstances et les temoins presents" |
| RisqueForm | probabilite | "1 = Rare, 2 = Peu probable, 3 = Probable, 4 = Tres probable" |
| RisqueForm | gravite | "1 = Faible, 2 = Moyenne, 3 = Grave, 4 = Catastrophique" |
| BudgetDepense | montant | "Montant de la depense en FCFA HT" |
| TacheForm | dateFin | "Date d'echeance. La tache passera en retard apres cette date" |
| EpiForm | dateExpiration | "Date de peremption ou de remplacement obligatoire" |
| CauserieForm | nbParticipants | "Nombre total de personnes presentes" |
| EssaiLaboForm | slump | "Valeur d'affaissement en cm (norme NF EN 12350-2)" |
| MaterielForm | quantiteMin | "Seuil d'alerte : une notification sera envoyee en dessous" |
| FournisseurForm | siret | "Numero SIRET a 14 chiffres ou NIF local" |

#### 5.2 Composant FormSectionGuide

Bandeau explicatif en haut de chaque section de formulaire complexe :
- ProjetForm section "Informations generales" : "Ces informations identifient le projet dans tout le systeme"
- ProjetForm section "Budget" : "Le budget initial sera utilise comme reference pour le suivi des depenses"
- IncidentForm section "Actions correctives" : "Decrivez les mesures prises pour eviter la recurrence"

---

## PHASE 6 — Assistant IA Enrichi (Mika v2)

### Objectif : L'assistant comprend ce que l'utilisateur VOIT et FAIT

#### 6.1 Injection de donnees contextuelles (pageData)

Chaque page envoie ses donnees clefs au backend via pageData :

| Page | Donnees injectees |
|------|-------------------|
| Dashboard | nb projets actifs, budget total, taches en retard |
| ProjetDetail | nom, statut, budget consomme, nb taches |
| BudgetPage | montantHT, totalDepenses, tauxConsommation |
| PlanningPage | nb taches, nb en retard, prochaine echeance |
| IncidentsPage | nb incidents par statut |
| EnginList | nb engins, nb immobilises, nb disponibles |
| QsheDashboard | compteurs par module (incidents, risques, EPI) |
| EssaisLabo | nb essais, taux conformite |
| SalleReunion | reunion en cours oui/non, nb participants |

Le backend recoit ces donnees et les injecte dans le prompt systeme :
"L'utilisateur voit actuellement : 3 projets actifs, 12 taches en retard, budget consomme a 78%"

#### 6.2 Actions suggerees enrichies

L'IA peut suggerer :
- Navigation : "Voir les taches en retard" -> /planning?filter=en-retard
- Explication : "Qu'est-ce que le taux de consommation ?" -> reponse inline
- Action directe : "Creer un incident" -> ouvrir le formulaire
- Comparaison : "Comparer avec le mois dernier" -> navigation reporting

#### 6.3 Detection de comportement

Nouveau hook `useUserBehavior` :
- Temps passe sur la page (>60s sans action = proposer aide)
- Nombre de clics sur les filtres (>5 = "Vous cherchez quelque chose ? Demandez a Mika")
- Scroll rapide repetitif (= desorientation)
- Formulaire abandonne (champs remplis puis navigation = "Voulez-vous sauvegarder ?")

Declenchement : bulle discrete pres du bouton Mika, pas de popup intrusif.

---

## PHASE 7 — Navigation Intelligente

### Objectif : L'utilisateur ne se perd jamais

#### 7.1 Composant Breadcrumb Intelligent

Fil d'ariane dynamique sur chaque page :
- Dashboard > Projets > PRJ-2026-001 > DQE
- Dashboard > QSHE > Incidents > INC-0042
- Chaque segment est cliquable

#### 7.2 Composant RelatedPages

Bandeau en bas de page "Pages liees" :
- Sur ProjetDetail : "Budget", "Planning", "DQE", "Documents", "Historique"
- Sur IncidentsPage : "Actions correctives", "Risques", "Inspections"
- Sur BudgetPage : "DQE", "Bareme", "Reporting"
- Sur EpiPage : "Formations", "Causeries", "Incidents"

#### 7.3 Raccourcis clavier globaux

- Ctrl+K : Ouvrir la recherche globale (CommandPalette)
- Ctrl+M : Ouvrir/fermer l'assistant Mika
- Ctrl+/ : Afficher les raccourcis disponibles

---

## PHASE 8 — Microcopies et Messages Pedagogiques

### Objectif : Chaque interaction est humaine, claire et rassurante

#### 8.1 Messages de confirmation enrichis
- Suppression : "Cet engin sera desactive. Les mouvements historiques sont conserves."
- Validation incident : "L'incident sera marque comme clos. Un email sera envoye au declarant."
- Envoi DMA : "Votre demande sera visible par le responsable logistique sous 5 minutes."

#### 8.2 Messages d'etat adaptatifs
- Chargement : "Chargement des projets..." (pas juste un spinner)
- Erreur reseau : "Connexion interrompue — vos modifications sont sauvegardees localement"
- Succes : "Projet cree avec succes — il apparait maintenant dans votre liste"

#### 8.3 Tooltips sur les boutons d'action
- Bouton "Exporter" : "Telecharge un fichier Excel avec les donnees filtrees"
- Bouton "Importer DQE" : "Chargez votre devis depuis un fichier .xlsx ou .csv"
- Bouton "Archiver" : "Le projet sera masque mais pas supprime"

---

## PHASE 9 — Systeme de Niveaux Utilisateur

### Objectif : Adapter la densite d'aide au niveau de l'utilisateur

#### 9.1 Detection automatique du niveau

Criteres :
- Debutant : < 5 connexions, < 3 projets consultes
- Intermediaire : 5-50 connexions, guides dismisses
- Expert : > 50 connexions, tous guides dismisses

#### 9.2 Comportement par niveau

| Element | Debutant | Intermediaire | Expert |
|---------|----------|---------------|--------|
| PageGuide welcome | Visible | Cache | Cache |
| SmartTooltip | Icone + bulle | Icone seule | Cache |
| Onboarding wizard | Oui | Non | Non |
| FeatureSpotlight | Oui | Non | Non |
| Assistant greeting | Detaille | Court | Minimal |
| Empty states | Avec guide | Standard | Minimal |
| Raccourcis clavier | Tooltip | Non | Non |
| Alertes proactives | Toujours | Toujours | Toujours |

Preference stockee : localStorage `mika_user_level` (auto-detect ou choix manuel dans Parametres)

---

## PHASE 10 — Polish et Animations

### Objectif : L'experience est fluide, premium et professionnelle

- Transitions douces sur l'apparition des PageGuide (slide-down 300ms)
- Micro-animation sur le bouton Mika quand une alerte est detectee (pulse doux)
- Animation d'entree des SmartTooltip (fade-in 200ms)
- Skeleton loading sur toutes les pages (au lieu de spinners)
- Haptic feedback sur mobile (vibration legere au tap sur l'assistant)

---

## ORDRE D'IMPLEMENTATION

| Phase | Effort | Impact | Priorite |
|-------|--------|--------|----------|
| Phase 1 — Couverture universelle | Moyen | Tres eleve | P0 |
| Phase 2 — Empty states | Faible | Eleve | P0 |
| Phase 3 — Alertes proactives | Moyen | Tres eleve | P0 |
| Phase 4 — Onboarding | Eleve | Tres eleve | P1 |
| Phase 5 — Aide formulaires | Moyen | Eleve | P1 |
| Phase 6 — Mika v2 (pageData) | Eleve | Tres eleve | P1 |
| Phase 7 — Navigation intelligente | Moyen | Eleve | P2 |
| Phase 8 — Microcopies | Faible | Moyen | P2 |
| Phase 9 — Niveaux utilisateur | Eleve | Moyen | P3 |
| Phase 10 — Polish animations | Faible | Moyen | P3 |
