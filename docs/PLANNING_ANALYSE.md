# Planning et Tâches — Analyse et synchronisation

## 1. Vue d’ensemble

- **Prévisions** (module Projet) : tâches planifiées par **semaine/année**, saisies dans la fiche projet (section « Prévisions »). Champs : `semaine`, `annee`, `description`, `type`, `statut`, `dateDebut`, `dateFin`.
- **Tâches** (module Planning) : tâches opérationnelles avec **titre**, **statut**, **priorité**, **assignation**, **dates**, **avancement**. Utilisées dans la page « Planning et Tâches ».

Les deux entités sont **liées au projet** mais distinctes. La synchronisation consiste à **créer automatiquement une Tache** à chaque création de **Prevision**, pour que tout ce qui est planifié dans la fiche projet apparaisse dans le Planning.

---

## 2. Logique fonctionnelle

| Élément | Prévisions (fiche projet) | Tâches (Planning) |
|--------|---------------------------|-------------------|
| Création | Formulaire « Prévisions » (semaine en cours / suivante) | Bouton « Nouvelle tâche » ou **sync auto** depuis Prévisions |
| Données | Semaine, année, description, type, statut | Titre, description, statut, priorité, assigné, dates, % avancement |
| Usage | Planification hebdo (ce qui sera fait) | Suivi opérationnel (à faire / en cours / terminé) |

**Règle de synchronisation** : à chaque `createPrevision` (backend), une **Tache** est créée avec :
- `projetId` = même projet
- `titre` = `description` de la prévision (ou « Tâche planifiée (Sx année) » si vide)
- `dateDebut` / `dateFin` = soit celles de la prévision, soit déduites de `semaine` / `annee` (premier et dernier jour de la semaine)
- `dateEcheance` = `dateFin`
- Pas d’assignation ni priorité spécifique (valeurs par défaut)

---

## 3. Cohérence des données

- **Source de vérité pour la planification** : les **Prévisions** (fiche projet).
- **Source de vérité pour le suivi** : les **Tâches** (statut, avancement, assignation).
- Une prévision **ne met pas à jour** une tâche existante si la prévision est modifiée ou supprimée (pas de lien FK Prevision → Tache). On évite ainsi les dépendances circulaires et les migrations. Une évolution future pourrait ajouter un `prevision_id` sur `Tache` pour lier et mettre à jour/supprimer en cascade.

---

## 4. Backend — Synchronisation

- **Fichier** : `ProjetService.kt`
- **Méthode** : `createPrevision(projetId, request)`
- **Comportement** :
  1. Création et sauvegarde de l’entité `Prevision`.
  2. Calcul de `dateDebut` / `dateFin` : soit depuis la requête, soit à partir de `semaine` et `annee` (semaine calendaire : jour 1 = 1er janvier + (semaine-1)*7, jour 7 = +6).
  3. Appel à `planningService.createTache(TacheCreateRequest(...))` dans un `try/catch` : en cas d’échec (ex. module Planning indisponible), la prévision reste créée et un warning est loggé.

---

## 5. Frontend — Comportement

- **Fiche projet** : l’utilisateur ajoute des prévisions (tâches à réaliser par semaine). Aucun appel direct à l’API Planning : la sync est **côté backend**.
- **Page Planning** :
  - Chargement des projets (`fetchProjets`) et des tâches en retard au montage.
  - Quand un projet est sélectionné : `fetchTachesByProjet(projetId)`.
  - Les tâches créées par sync apparaissent comme les autres (même liste, mêmes filtres, même mise à jour de statut / suppression).
- **Temps réel** : pas de WebSocket. La mise à jour est faite après chaque action (création prévision → rechargement du Planning si l’utilisateur change de projet ou revient sur la page).

---

## 6. Design de la page Planning

- **Conteneur** : `PageContainer` en `size="full"` avec fond `bg-gray-50/80`, aligné avec les autres pages (ex. détail projet).
- **En-tête** : bandeau gradient `from-primary to-primary-dark`, titre « Planning & Tâches », sous-titre expliquant la synchronisation avec les prévisions.
- **Sections** :
  - **Projet** : carte avec sélecteur de projet et bouton « Nouvelle tâche ».
  - **KPIs** : 5 indicateurs (Total, À faire, En cours, Terminées, En retard) en grille.
  - **Tâches en retard** : alerte dédiée (fond rouge léger, liste des 5 premières).
  - **Filtres** : boutons par statut (Toutes, À faire, En cours, etc.).
  - **Liste des tâches** : carte avec en-tête « Tâches du projet », liste avec statut, priorité, assigné, échéance, barre d’avancement, actions (changer statut, supprimer), pagination si besoin.
- **Modal création** : titre, description, priorité, date d’échéance ; boutons Annuler / Créer la tâche.
- **Imports** : alias `@/` pour store, types et composants.

---

## 7. Résumé technique

| Composant | Rôle |
|-----------|------|
| `ProjetService.createPrevision` | Crée la Prevision puis appelle `PlanningService.createTache` avec les champs mappés. |
| `PlanningService.createTache` | Crée une `Tache` (projet, titre, dates, etc.). |
| Page Planning (frontend) | Affiche les tâches par projet, incluant celles issues des prévisions. |
| Fiche projet — Prévisions | Saisie des prévisions ; la sync est automatique côté serveur. |

Aucune action supplémentaire n’est requise côté utilisateur : **ajouter une tâche planifiée dans la fiche projet suffit pour la voir apparaître dans Planning et Tâches**.
