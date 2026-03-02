# Plan d’action : Historique du projet

## Objectif

Sur chaque **page de détail d’un projet**, intégrer un **bouton « Historique »** donnant accès à une vue dédiée qui regroupe, pour les semaines passées :

- les **modifications / ajustements** réalisés ;
- les **points bloquants** rencontrés ;
- les **tâches accomplies** (prévisions réalisées).

Objectif : **traçabilité claire, structurée et consultable à tout moment** pour suivre l’évolution du projet dans le temps.

---

## 1. Sources de données existantes

| Source | Données | Lien au projet | Période |
|--------|--------|----------------|---------|
| **Previsions** | `description`, `type`, `semaine`, `annee`, `avancementPct` | `projetId` | Par semaine (ISO) |
| **PointBloquant** | `titre`, `description`, `priorite`, `statut`, `dateDetection`, `dateResolution` | `projetId` | `dateDetection` / `createdAt` |
| **PointProjetPV** (réunions hebdo) | `resumeTravauxPrevisions`, `pointsBloquantsResume`, `besoinsMateriel`, `besoinsHumain`, `propositionsAmelioration`, indicateurs d’avancement | `reunion` + `projet` | `reunion.dateReunion` |

L’export Word/PDF utilise déjà un **« Historique des semaines passées »** basé sur les **prévisions** groupées par `(annee, semaine)`. L’historique à construire doit **enrichir** cette logique avec les PV hebdo et les points bloquants, et être consultable dans l’application (pas seulement en export).

---

## 2. Backend

### 2.1 Données manquantes côté API

- **PointProjetPV par projet** : aujourd’hui on récupère les points par **réunion** (`/reunions-hebdo/{id}`). Pour l’historique projet, il faut pouvoir récupérer **tous les PointProjetPV d’un projet**, ordonnés par date de réunion (semaines passées).

**Actions proposées :**

1. **Repository**  
   - Dans `PointProjetPVRepository`, ajouter une méthode du type :  
     `findByProjetIdOrderByReunion_DateReunionDesc(projetId: Long, pageable: Pageable)`  
   - (Ou équivalent sans pagination si le volume reste raisonnable.)

2. **Endpoint dédié « Historique projet »**  
   - **Option A (recommandée)** : `GET /api/projets/{id}/historique`  
     - Réponse = agrégat structuré (voir § 2.2).  
   - **Option B** : `GET /api/projets/{id}/historique-pv` qui ne retourne que les PointProjetPV du projet ; le front fait l’agrégation avec prévisions et points bloquants déjà chargés.  

   Recommandation : **Option A** pour une réponse claire et un front simple.

### 2.2 Structure de la réponse « Historique » (Option A)

Exemple de structure (à affiner selon vos conventions DTO) :

- **Par « entrée temporelle »** (ex. par semaine ou par date de réunion) :
  - **Période** : `semaine`, `annee` et/ou `dateReunion` (pour les PV).
  - **Prévisions de la période** : tâches prévues / réalisées (description, avancement %).
  - **Points bloquants** : soit ceux dont `dateDetection` tombe dans la période, soit ceux mentionnés dans le PV de la semaine (`pointsBloquantsResume`).
  - **Contenu du PV** (si une réunion hebdo existe pour cette période) :
    - Résumé travaux / prévisions ;
    - Points bloquants (résumé) ;
    - Besoins matériel / humain ;
    - Propositions d’amélioration ;
    - Indicateurs (avancement physique / financier / délai si présents).

Côté backend : construire cette structure en regroupant :

- les **prévisions** du projet (déjà par `semaine` / `annee`) ;
- les **points bloquants** du projet (avec `dateDetection` pour les rattacher à une semaine) ;
- les **PointProjetPV** du projet (avec `reunion.dateReunion` pour les rattacher à une semaine).

Ordre : **chronologique inverse** (semaines les plus récentes en premier).

---

## 3. Frontend

### 3.1 Page détail projet

- **Emplacement** : dans l’en-tête de la page (à côté de « Télécharger le document » et « Modifier le projet »), ajouter un bouton **« Historique »** (icône + libellé).
- **Navigation** : clic → route dédiée, par ex. `/projets/:id/historique`.

### 3.2 Route

- **Route** : `projets/:id/historique` → composant `ProjetHistoriquePage` (ou `ProjetHistoriqueView`).
- **Accès** : même règle que la détail (utilisateur authentifié ; droits lecture projet).

### 3.3 Page / vue « Historique du projet »

- **Titre** : « Historique — [Nom du projet] » avec fil d’Ariane ou lien retour vers la fiche projet.
- **Contenu** :
  - Liste chronologique (semaines passées, de la plus récente à la plus ancienne).
  - Pour chaque période (ex. « Semaine 9 (2026) ») :
    - **Tâches accomplies / prévisions** : tableau ou liste (description, avancement %).
    - **Points bloquants** : liste (titre, statut, priorité, dates) et/ou résumé du PV si présent.
    - **Modifications / ajustements** : texte du PV (résumé travaux, propositions d’amélioration, besoins, etc.).
  - Gestion des périodes sans donnée : afficher quand même la période avec un message du type « Aucune donnée pour cette semaine » pour garder la traçabilité temporelle.

### 3.4 Appels API

- Si **Option A** : un seul appel `GET /api/projets/{id}/historique` au chargement de la page Historique ; affichage direct de l’agrégat.
- Si **Option B** : appeler `GET /api/projets/{id}/historique-pv` et réutiliser prévisions + points bloquants déjà disponibles (ou les recharger) ; construire la vue agrégée côté front.

### 3.5 Traductions

- Clés i18n pour : bouton « Historique », titre de la page, libellés des blocs (Tâches accomplies, Points bloquants, Modifications / Ajustements, Aucune donnée pour cette semaine, etc.) en FR et EN.

---

## 4. Ordre de mise en œuvre suggéré

| Étape | Description | Priorité |
|-------|-------------|----------|
| 1 | Backend : `PointProjetPVRepository.findByProjetIdOrderByReunion_DateReunionDesc` (+ test si besoin) | 1 |
| 2 | Backend : DTO + service + `GET /api/projets/{id}/historique` (agrégat semaines passées) | 2 |
| 3 | Frontend : route `projets/:id/historique` + page `ProjetHistoriquePage` (structure vide ou mock) | 3 |
| 4 | Frontend : bouton « Historique » sur la page détail projet → lien vers la nouvelle route | 4 |
| 5 | Frontend : appel API historique + affichage par période (prévisions, points bloquants, contenu PV) | 5 |
| 6 | Traductions FR/EN + ajustements UX (fil d’Ariane, messages vides, chargement) | 6 |
| 7 | (Optionnel) Filtres (par plage de dates, par type d’événement) ou export de l’historique | 7 |

---

## 5. Points d’attention

- **Performance** : limiter le nombre de semaines retournées (ex. 52 dernières semaines) ou paginer si nécessaire.
- **Cohérence des semaines** : utiliser la même règle de numéro de semaine (ISO 8601) que pour les prévisions et les réunions.
- **Points bloquants** : décider si on les affiche par semaine selon `dateDetection`, ou uniquement via le résumé du PV (ou les deux avec un libellé clair).
- **Modifications / ajustements** : dans l’état actuel, ils sont surtout portés par les champs texte des **PointProjetPV** (résumé travaux, propositions). Si plus tard vous ajoutez un vrai audit des changements sur la fiche projet, on pourra les intégrer dans la même vue « Historique ».

---

## 6. Résumé

- **Backend** : nouveau endpoint `GET /api/projets/{id}/historique` qui agrège prévisions, points bloquants et PointProjetPV par période (semaine), tri inverse.
- **Frontend** : bouton « Historique » sur la détail projet → page dédiée `projets/:id/historique` affichant l’historique structuré par semaine avec tâches accomplies, points bloquants et contenus des PV.
- **Traçabilité** : une seule entrée « Historique » par projet, consultable à tout moment, avec une structure claire et cohérente pour les semaines passées.

Ce plan peut servir de base pour les tâches (tickets) et l’estimation du chantier.
