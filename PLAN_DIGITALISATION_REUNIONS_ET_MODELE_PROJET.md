# Plan d’action — Digitalisation des réunions hebdomadaires et unification Projet

Document de référence : **PV réunions hebdomadaires S01-2026** (`Rapports/PV_réunions_hebdos_S01-2026.md`).

---

## Partie 1 — Analyse du procès-verbal

### 1.1 Structure du PV

| Bloc | Contenu | Modélisation |
|------|--------|---------------|
| **En-tête** | Numéro PV, date, lieu, rédacteur, heure | RéunionHebdo + auteur (User) |
| **Objet** | Texte fixe (« Réunions hebdomadaires pour discuter de l'avancement des projets ») | Champ texte ou constante |
| **Ordre du jour** | Liste fixe : 1) Avancement études 2) Avancement travaux 3) CA hebdo/mensuel 4) Prévision 5) Divers | Référence / liste ordre du jour |
| **Participants** | Tableau Nom, Initiales, Téléphone | Liste ParticipantRéunion (User + présence) |
| **Par affaire (projet)** | Voir 1.2 | PointProjetPV (une entrée par projet par réunion) |
| **Divers** | Sujets transverses (audit, cotisations, etc.) | Section texte ou entité Divers |

### 1.2 Structure d’une « affaire » ( = un projet dans le PV)

Chaque **AFFAIRE** correspond à **un projet (marché)** présenté par un **chef de projet**. Les champs suivants sont à modéliser :

| Section | Données | Modélisation proposée |
|--------|---------|------------------------|
| **Identité** | Chef de projet (nom), Référence(s) marché, Intitulé | Projet.chefProjet (User), Projet.numeroMarche, Projet.nom |
| **Cadre** | Montant(s) marché, Délai (mois), Date début, Date fin | Projet.montantHT, montantRevise, delaiMois, dateDebut, dateFin |
| **Chiffre d’affaires** | Par mois : CA prévisionnel, CA réalisé, Écart, Avancement cumulé % | Existant : CAPrevisionnelRealise (mois, annee, caPrevisionnel, caRealise, ecart, avancementCumule) — à vérifier/étendre |
| **Études** | Par phase : Avancement %, Dépôt à l’administration, État de validation. Phases : APS, APD, EXE, Géotechnique, Hydrologique/hydraulique, EIES/Notice EIES | **Nouvelle entité** : AvancementEtudeProjet (projetId, phase, avancementPct, dateDepot, etatValidation) ou table phase par projet |
| **Avancement travaux / Prévisions** | Texte libre + éléments structurés : Avancement % (physique, financier, délai consommé), Points bloquants, Prévisions S2/S5, Besoins (matériel, humain), Propositions d’amélioration | Points bloquants : existant (PointBloquant). Prévisions : existant (Prevision). **À ajouter** : BesoinMateriel, BesoinHumain (ou champs texte sur PointProjetPV). **Nouveau** : PointProjetPV (snapshot par réunion : avancementPhysique, avancementFinancier, delaiConsommePct, pointsBloquantsResume, previsionsTexte, besoinsMateriel, besoinsHumain, propositions) |

### 1.3 Logique métier dégagée

- **Une affaire = un projet (marché)** : pas de distinction « projet / chantier » dans le PV ; un chef de projet présente **un** projet.
- **Pilotage hebdo** : chaque vendredi, mise à jour collective (CA, études, travaux, blocages, prévisions, besoins).
- **Données structurées** : CA mensuel, phases d’études, pourcentages d’avancement (physique, financier, délai).
- **Données libres** : points bloquants détaillés, prévisions S2/S5, besoins matériels/humains, propositions d’amélioration.
- **Traçabilité** : qui a rédigé le PV, qui était présent, quelle date de réunion.

### 1.4 Données à intégrer dans le système

- **Déjà couvertes (Projet / existant)** : code projet, numéro marché, nom, montant, délai, dates, responsable (chef de projet), points bloquants, prévisions, CA prévisionnel/réalisé (CAPrevisionnelRealise).
- **À ajouter ou préciser** :
  - **Chef de projet** : affiché systématiquement sur la fiche et les listes (déjà prévu côté « responsable » ; aligner libellé « chef de projet »).
  - **Avancement des études par phase** : APS, APD, EXE, Géotechnique, Hydrologique/hydraulique, EIES — avec pourcentage, dépôt admin, état de validation.
  - **Avancement travaux** : physique %, financier %, délai consommé % (pour cohérence avec le PV).
  - **Besoins** : matériels (liste ou texte), humains (liste ou texte) — soit champs sur Projet/PointProjetPV, soit entités dédiées.
  - **Réunion hebdo + PV** : date, lieu, rédacteur, participants, et pour chaque projet : snapshot (avancement, points bloquants, prévisions, besoins) + section « Divers ».

---

## Partie 2 — Unification Projet / Chantier (une seule entité « Projet »)

### 2.1 Constat

- **Actuel** : Projet → SousProjet → Chantier (3 niveaux). Chantier = lieu/sous-ensemble d’exécution.
- **Métier (PV)** : une affaire = un marché = un projet présenté par un chef de projet. Pas de notion « chantier » dans le PV.
- **Objectif** : une seule entité **Projet** (marché) avec toutes les informations nécessaires ; suppression de la notion Chantier comme entité séparée.

### 2.2 Option retenue : Projet unique enrichi

- **Conserver l’entité Projet** comme cœur métier (marché / affaire).
- **Enrichir Projet** avec les champs actuellement portés par Chantier quand ils ont du sens au niveau « un projet = un chantier » : adresse, quartier, ville, province, coordonnées, condition d’accès, zone climatique, distance dépôt, nombre d’ouvriers prévu, horaire de travail, **chef de projet** (responsableProjet déjà présent ; renommer en « chef de projet » en affichage), avancement physique (déjà avancementGlobal ; distinguer si besoin physique / financier / délai).
- **Supprimer** : entité Chantier et relation SousProjet → Chantier.
- **SousProjet** : à traiter soit par **suppression** (un projet = une affaire), soit par **conservation** en « lot » ou « phase » purement interne (sans Chantier). Décision métier à valider ; en première phase, on peut garder SousProjet comme subdivision optionnelle sans Chantier.

### 2.3 Impact technique (résumé)

- **Base de données** : suppression table `chantiers` et FK chantier dans les autres tables ; migration des données utiles de Chantier vers Projet (ou SousProjet si conservé) ; renommage / ajout de colonnes sur `projets`.
- **Backend** : suppression module Chantier (entity, repository, service, controller) ; adaptation Projet (et SousProjet si conservé) ; mise à jour de toutes les références (Budget, Planning, Qualité, Sécurité, Documents, Materiel affectations, etc.) : remplacer `chantierId` par `projetId` (ou garder une clé « projet » partout).
- **Frontend** : suppression des pages/listes/détails « Chantiers » ; listes et détails « Projets » enrichis (chef de projet, avancement, points bloquants, prévisions, besoins, observations) ; routes et menus mis à jour.

---

## Partie 3 — Plan d’action structuré

### Phase 0 — Validation et préparation (sans code)

1. **Valider avec l’encadrant**  
   - Confirmation de la structure du PV (ordre du jour, participants, une affaire = un projet).  
   - Validation de la fusion Projet/Chantier (un projet = un chantier ; suppression du concept Chantier).  
   - Décision sur SousProjet : suppression ou conservation comme « lot » sans Chantier.

2. **Inventaire des impacts**  
   - Lister toutes les tables et APIs qui référencent Chantier ou SousProjet.  
   - Lister toutes les écrans et flux frontend (listes, formulaires, filtres) qui utilisent « chantier ».

---

### Phase 1 — Digitalisation des réunions hebdomadaires (sans toucher à Projet/Chantier)

Objectif : modéliser et implémenter le cycle « Réunion hebdo → PV » pour coller au processus actuel, sans régression.

#### 1.1 Backend

- **Entités**  
  - `ReunionHebdo` : id, dateReunion, lieu, heureDebut, heureFin, ordreDuJour (texte ou JSON), statut (BROUILLON, VALIDE), createdBy (User), createdAt, updatedAt.  
  - `ParticipantReunion` : id, reunionId, userId, initiales, telephone (optionnel), present (bool).  
  - `PointProjetPV` : id, reunionId, projetId, avancementPhysiquePct, avancementFinancierPct, delaiConsommePct, resumeTravauxPrevisions (texte), pointsBloquantsResume (texte), besoinsMateriel (texte), besoinsHumain (texte), propositionsAmelioration (texte), ordreAffichage (int).  
  - `LigneCAPV` (optionnel si on veut détailler par mois dans le PV) : pointProjetPVId, mois, annee, caPrevisionnel, caRealise, ecart, avancementCumulePct.  
  - `LigneEtudePV` (optionnel) : pointProjetPVId, phase (APS, APD, EXE, GEOTECHNIQUE, HYDRAULIQUE, EIES), avancementPct, dateDepot, etatValidation.

- **APIs**  
  - CRUD RéunionHebdo (création, mise à jour, validation).  
  - Liste des réunions (filtre par date, statut).  
  - Récupération d’un PV complet (réunion + participants + points par projet).  
  - Création / mise à jour des PointProjetPV (par projet, pour une réunion donnée).

- **Base de données**  
  - Tables `reunions_hebdo`, `participants_reunion`, `points_projet_pv`, éventuellement `lignes_ca_pv`, `lignes_etude_pv`.  
  - Pas de modification des tables Projet/Chantier à ce stade.

#### 1.2 Frontend

- **Pages**  
  - Liste des réunions hebdomadaires (date, lieu, statut, lien vers PV).  
  - Création / édition d’une réunion (date, lieu, heure, ordre du jour, participants).  
  - Édition du PV : pour chaque projet (affaire), formulaire ou bloc : avancement (physique, financier, délai), résumé travaux/prévisions, points bloquants, besoins matériels/humains, propositions.  
  - Visualisation PV en lecture seule (équivalent du document actuel).

- **Données**  
  - Appels API réunions + points projet PV ; affichage du chef de projet par projet (déjà disponible via Projet.responsableProjet).

#### 1.3 Livrable Phase 1

- Les réunions hebdomadaires peuvent être créées, remplies (par projet) et consultées sous forme de PV digital, sans modifier le modèle Projet/Chantier existant.

---

### Phase 2 — Enrichissement du modèle Projet (avancement études, besoins)

Objectif : ajouter au Projet les champs nécessaires pour alimenter le PV et la fiche projet (études, besoins), toujours sans supprimer Chantier.

#### 2.1 Backend

- **Avancement des études**  
  - Entité `AvancementEtudeProjet` : projetId, phase (enum : APS, APD, EXE, GEOTECHNIQUE, HYDRAULIQUE, EIES), avancementPct, dateDepot, etatValidation, miseAJour.  
  - API : GET/PUT par projet (liste des phases avec état).

- **Besoins**  
  - Soit champs sur Projet : `besoinsMateriel` (texte), `besoinsHumain` (texte).  
  - Soit entités `BesoinMaterielProjet`, `BesoinHumainProjet` (projetId, libelle, quantite, priorite, statut). À trancher selon le besoin de suivi.

- **Projet**  
  - Exposer clairement chef de projet (responsableProjet), avancement physique, financier, délai consommé (si déjà calculés ailleurs, les exposer ; sinon les ajouter).

#### 2.2 Frontend

- **Fiche Projet (détail)**  
  - Bloc « Chef de projet » (nom, contact).  
  - Bloc « Avancement » : physique %, financier %, délai consommé %.  
  - Bloc « Études » : tableau par phase (APS, APD, EXE, etc.) avec %, dépôt, état.  
  - Bloc « Points bloquants » (existant).  
  - Bloc « Prévisions » (existant).  
  - Bloc « Besoins » : matériels, humains (texte ou liste).  
  - Bloc « Observations » (texte libre si présent en base).

#### 2.3 Livrable Phase 2

- La fiche Projet reflète les informations du PV (avancement, études, besoins) et reste cohérente avec le modèle actuel Projet / Chantier.

---

### Phase 3 — Unification Projet / Chantier (une entité Projet)

Objectif : supprimer la notion Chantier et n’avoir qu’une entité Projet enrichie.

#### 3.1 Décisions préalables

- Confirmer la suppression de SousProjet ou sa conservation comme « lot » sans Chantier.  
- Choisir la stratégie de migration des données :  
  - Soit un Chantier par Projet actuel → fusion dans Projet.  
  - Soit un Chantier par SousProjet → soit créer un Projet par SousProjet, soit fusionner les Chantiers d’un même Projet dans un seul Projet (à définir avec le métier).

#### 3.2 Base de données

- **Migration**  
  - Créer colonnes sur `projets` pour les champs utiles de `chantiers` (adresse, ville, quartier, province, coordonnées, condition accès, zone climatique, distance dépôt, nombre ouvriers prévu, horaire travail, avancement physique si distinct, etc.).  
  - Migrer les données : pour chaque Chantier (ou SousProjet), remplir le Projet parent (ou le Projet correspondant selon la règle choisie).  
  - Mettre à jour toutes les tables qui ont une FK vers `chantiers` : remplacer par `projet_id` (Budget, Planning, Qualité, Sécurité, Documents, AffectationEnginChantier, AffectationMateriauChantier, AffectationChantier équipes, etc.).  
  - Supprimer les tables `chantiers`, `affectation_chantier`, etc., et éventuellement `sous_projets` si décision de suppression.

#### 3.3 Backend

- Supprimer le module Chantier (entity, repository, service, controller, DTOs).  
- Adapter le module Projet : champs ajoutés, endpoints existants des « chantiers » à remplacer par des endpoints « projets » (ex. liste des projets d’un client, liste des projets pour le PV).  
- Mettre à jour tous les services qui utilisaient Chantier : Budget, Planning, Qualité, Sécurité, Documents, Materiel, Reporting — tout passe par `projetId`.  
- Conserver le module Équipe ; les affectations « équipe → chantier » deviennent « équipe → projet » (nouvelle table ou champ projet_id).

#### 3.4 Frontend

- **Routes et menus**  
  - Supprimer les routes /chantiers, /chantiers/:id, /chantiers/nouveau, etc.  
  - Menu : retirer « Chantiers » ; garder « Projets » comme entrée principale.

- **Pages**  
  - Supprimer ChantierListPage, ChantierDetailPage, ChantierFormPage.  
  - ProjetListPage : afficher systématiquement le chef de projet (responsableProjet).  
  - ProjetDetailPage : vue détaillée complète (avancement, études, points bloquants, prévisions, besoins, observations) comme défini en Phase 2.  
  - ProjetFormPage : champs du Projet enrichi (y compris anciens champs chantier si nécessaires).

- **État et API**  
  - Supprimer chantierSlice, chantierApi (ou les remplacer par des appels projet).  
  - Tous les composants qui utilisaient chantierId ou liste de chantiers utilisent projetId et liste de projets.  
  - Reporting, Budget, Planning, Qualité, Sécurité, Documents : filtres et listes par projet uniquement.

#### 3.5 Tests et non-régression

- Vérifier que : création/édition/suppression Projet, liste Projets, détail Projet, Budget par projet, Planning par projet, Qualité/Sécurité par projet, Documents par projet, Réunions hebdo et PV, Reporting — fonctionnent sans erreur et sans référence à « chantier ».  
- Vérifier les droits et les rôles si des règles métier dépendaient de Chantier.

---

### Phase 4 — Consolidation et alignement métier

- **PV et réunions**  
  - Alimenter les PointProjetPV à partir des données Projet (avancement, points bloquants) pour pré-remplir le PV.  
  - Exporter le PV en PDF ou document structuré (optionnel).

- **Reporting et tableaux de bord**  
  - Tous les indicateurs basés sur « chantier » sont recalculés sur « projet ».  
  - Cohérence avec le PV : même définition d’« affaire » = projet.

- **Documentation**  
  - Mettre à jour la documentation technique et fonctionnelle (modèle de données, parcours utilisateur, règles métier).

---

## Partie 4 — Synthèse des priorités

| Priorité | Thème | Action |
|----------|--------|--------|
| 1 | Digitalisation réunions | Phase 1 : entités RéunionHebdo, PointProjetPV, APIs, écrans liste/création/édition/consultation PV. |
| 2 | Fiche Projet alignée PV | Phase 2 : avancement études, besoins, affichage chef de projet, blocs avancement/points bloquants/prévisions. |
| 3 | Unification Projet/Chantier | Phase 3 : migration données, suppression Chantier, adaptation backend/frontend, tests. |
| 4 | Consolidation | Phase 4 : pré-remplissage PV depuis Projet, reporting, doc. |

---

## Partie 5 — Risques et précautions

- **Régression** : chaque phase doit être testée (backend + frontend) avant de passer à la suivante.  
- **Migration données** : sauvegarde complète avant migration ; script de migration idempotent et testé sur copie.  
- **Délai** : la Phase 1 (réunions + PV) peut être livrée sans toucher à Projet/Chantier ; la Phase 3 est la plus lourde et doit être planifiée après validation du métier.  
- **Alignement métier** : valider avec l’encadrant la structure du PV (ordre du jour, participants, champs par affaire) et la règle « un projet = une affaire = plus de chantier » avant de figer le modèle.

---

*Document à faire évoluer selon les retours de l’encadrant et les décisions de migration (SousProjet, stratégie de fusion Chantier → Projet).*
