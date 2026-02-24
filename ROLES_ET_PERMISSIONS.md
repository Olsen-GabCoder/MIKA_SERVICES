# Analyse et proposition : rôles et permissions

## 1. État actuel

### 1.1 Backend

- **Rôles en base** (DataInitializer) : uniquement **SUPER_ADMIN**, **ADMIN**, **USER**.
- **Permissions définies** : USER (READ/CREATE/UPDATE/DELETE), ROLE (idem), PROJET (idem), BUDGET (idem). Aucune permission pour CHANTIER, EQUIPE, QUALITE, DOCUMENT, PLANNING, REUNION_HEBDO, etc.
- **Autorisation** : aucun `@PreAuthorize` sur les contrôleurs ; `SecurityConfig` exige seulement `.authenticated()`. Les permissions ne sont **jamais** vérifiées. Un utilisateur connecté peut appeler n’importe quel endpoint.
- **JWT** : contient les **codes de rôles** (SUPER_ADMIN, ADMIN, USER). Le filtre crée les autorités `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_USER`. Les permissions ne sont pas dans le token.
- **Projet** : l’entité `Projet` a un champ `responsableProjet: User?` (chef de projet). Aucune vérification dans `ProjetService.update` / `delete` : n’importe quel utilisateur authentifié peut modifier ou désactiver n’importe quel projet.

### 1.2 Frontend

- **Sidebar** : `isAdmin` = ADMIN ou SUPER_ADMIN ; menu restreint avec `adminOnly`. `getRoleLabel` prévoit déjà "Manager" pour MANAGER / CHEF_PROJET, mais le rôle **CHEF_PROJET** n’existe pas côté backend.
- **Routes** : seules `/users` et `/users/:id` sont protégées par `requireAdmin`. Les pages Projet, Qualité, Budget, etc. sont accessibles à tout utilisateur connecté.
- **Formulaire utilisateur** : les rôles viennent de l’API `/roles/active` ; l’interface affiche donc uniquement les 3 rôles actuels.

### 1.3 Besoin fonctionnel

- Les **chefs de projet** doivent pouvoir **modifier toutes les informations relatives à leurs propres projets** (et que les personnes autorisées voient les mises à jour en temps réel).
- Le modèle actuel (3 rôles, pas de chef de projet, pas de contrôle par projet) est **insuffisant**.

---

## 2. Rôles manquants et permissions proposées

### 2.1 Rôles à ajouter

| Code            | Nom affiché        | Description |
|-----------------|--------------------|-------------|
| **CHEF_PROJET** | Chef de projet     | Peut lire et modifier les projets dont il est responsable, ainsi que les données liées (chantiers, équipes, qualité, budget projet, documents projet, planning, réunions). Pas de gestion globale utilisateurs/rôles. |
| **CONTROLEUR_QUALITE** | Contrôleur qualité | Lecture/écriture sur les contrôles qualité et non-conformités (éventuellement limité aux projets auxquels il est affecté). |
| **CHEF_CHANTIER** | Chef de chantier   | Gestion des équipes et chantiers (lecture/écriture) pour les chantiers dont il a la charge. |

Pour la première phase, on se concentre sur **CHEF_PROJET** pour couvrir le besoin « modifier toutes les infos de ses projets ».

### 2.2 Permissions à ajouter (modules)

En plus de USER, ROLE, PROJET, BUDGET, ajouter des permissions **READ / CREATE / UPDATE / DELETE** (selon le module) pour :

- **CHANTIER** (chantiers, sous-projets, points bloquants selon l’existant)
- **EQUIPE** (équipes, affectations)
- **QUALITE** (contrôles, non-conformités)
- **DOCUMENT** (documents)
- **PLANNING** (tâches, planning)
- **REUNION_HEBDO** (réunions hebdomadaires)
- **MATERIEL** (engins, matériaux) si pertinent
- **FOURNISSEUR** (fournisseurs)
- **SECURITE** (module sécurité)
- **REPORTING** (rapports) : souvent READ + EXPORT

Les permissions existantes (USER_*, ROLE_*, PROJET_*, BUDGET_*) restent inchangées ; on **complète** le jeu.

### 2.3 Répartition proposée par rôle

- **SUPER_ADMIN** : conserve **toutes** les permissions (y compris les nouvelles).
- **ADMIN** : USER + ROLE (inchangé) ; éventuellement ajout de quelques permissions de lecture globale (PROJET_READ, etc.) selon politique.
- **USER** : PROJET_READ (inchangé) ; éventuellement CHANTIER_READ, EQUIPE_READ, QUALITE_READ, etc. pour une lecture large.
- **CHEF_PROJET** (nouveau) :
  - PROJET_READ, PROJET_UPDATE (pour **ses** projets uniquement — vérification métier dans le service).
  - CHANTIER_READ, CHANTIER_UPDATE (scopé à ses projets en logique métier si nécessaire).
  - EQUIPE_READ, EQUIPE_UPDATE.
  - QUALITE_READ, QUALITE_UPDATE (ou CREATE selon besoin).
  - BUDGET_READ, BUDGET_UPDATE (pour les budgets de ses projets).
  - DOCUMENT_READ, DOCUMENT_UPDATE (ou CREATE).
  - PLANNING_READ, PLANNING_UPDATE.
  - REUNION_HEBDO_READ, REUNION_HEBDO_UPDATE (ou CREATE).
  - Pas de USER_*, ROLE_*, pas de PROJET_DELETE global (la désactivation projet peut rester admin ou être gérée par « responsable uniquement »).

La **portée « ses projets »** (responsableProjet) est gérée **dans la couche service** : même avec la permission PROJET_UPDATE, un CHEF_PROJET ne peut modifier que les projets où `projet.responsableProjet.id == currentUserId`. SUPER_ADMIN / ADMIN conservent un droit global.

---

## 3. Ajustements techniques

### 3.1 Modèle de données (backend)

- **Aucune migration de schéma** nécessaire : les entités `Role` et `Permission` existent déjà avec une table de liaison `role_permissions`. Il suffit d’ajouter des lignes en base (via DataInitializer ou scripts).
- **DataInitializer** : créer les nouvelles permissions (CHANTIER_*, EQUIPE_*, QUALITE_*, etc.) et le rôle **CHEF_PROJET** avec la liste de permissions ci-dessus.

### 3.2 Logique métier et autorisations (backend)

1. **Service « utilisateur courant »**  
   - Créer un service (ex. `CurrentUserService`) qui lit `SecurityContextHolder.getContext().authentication` et expose l’identifiant (et si besoin l’entité `User`) de l’utilisateur connecté.  
   - À utiliser dans les services qui doivent vérifier « est-ce le responsable du projet ? ».

2. **Règle « peut modifier ce projet »**  
   - Centraliser dans un helper ou dans le service projet :  
     - **SUPER_ADMIN** : oui.  
     - **ADMIN** (ou tout rôle ayant une permission globale PROJET_UPDATE) : oui.  
     - **CHEF_PROJET** : oui **uniquement** si `projet.responsableProjet?.id == currentUserId`.  
   - Appeler cette règle dans `ProjetService.update(id, request)` et `ProjetService.delete(id)` (et éventuellement dans les sous-ressources : points bloquants, avancement études, etc.). En cas d’interdiction : lever une exception **403 Forbidden**.

3. **Contrôleurs**  
   - Rester sur `.authenticated()` dans `SecurityConfig`.  
   - Ajouter `@PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")` sur les endpoints de gestion des utilisateurs et des rôles (UserController, RoleController) pour renforcer la cohérence.  
   - Pour les projets : soit garder uniquement la vérification en service (recommandé pour la règle « chef de projet = ses projets »), soit ajouter un `@PreAuthorize` léger (ex. `hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('CHEF_PROJET')`) et affiner en service.

4. **JWT**  
   - Conserver les **rôles** dans le token (pas besoin d’y mettre toutes les permissions pour l’instant). Les contrôles « chef de projet sur son projet » se font côté serveur avec `CurrentUserService` + `responsableProjet`.

### 3.3 Interface utilisateur (frontend)

1. **Libellés des rôles**  
   - Afficher **Chef de projet** pour le code `CHEF_PROJET` (Sidebar, fiche utilisateur, listes). Adapter `getRoleLabel` et tout endroit qui affiche le rôle (ex. `userDisplay.ts`, `Sidebar.tsx`).

2. **Routes**  
   - Garder `requireAdmin` pour `/users` et `/users/:id`.  
   - Ne pas bloquer l’accès aux pages Projet / Qualité / Budget pour les CHEF_PROJET : ils y accèdent normalement ; les restrictions sont côté API (403 si modification d’un projet dont ils ne sont pas responsables).

3. **Boutons d’action (éditer / supprimer)**  
   - Optionnel : selon le rôle et le fait que l’utilisateur soit ou non responsable du projet, masquer ou désactiver « Modifier » / « Supprimer » pour éviter des appels inutiles (amélioration UX). Sinon, afficher les boutons et laisser l’API renvoyer 403.

4. **Données utilisateur**  
   - Les rôles et permissions viennent déjà de l’API ; une fois le rôle **CHEF_PROJET** créé et renvoyé par `/roles/active` et sur l’utilisateur connecté, le formulaire utilisateur et les écrans détail afficheront automatiquement le nouveau rôle.

---

## 4. Synthèse des tâches

| Zone | Tâche |
|------|--------|
| Backend – Données | Étendre DataInitializer : nouvelles permissions (CHANTIER, EQUIPE, QUALITE, DOCUMENT, PLANNING, REUNION_HEBDO, etc.) et rôle CHEF_PROJET avec les permissions listées. |
| Backend – Sécurité | Créer CurrentUserService ; dans ProjetService (update/delete) vérifier « utilisateur courant = responsable ou admin/super_admin » ; renvoyer 403 si non autorisé. |
| Backend – Contrôleurs | Ajouter @PreAuthorize sur UserController et RoleController (admin/super_admin). |
| Frontend | Adapter getRoleLabel / Sidebar pour afficher « Chef de projet » pour CHEF_PROJET ; garder cohérence des libellés (userDisplay, listes, détail). |

Ce document sert de référence pour implémenter un système de rôles et permissions **complet, cohérent et sécurisé**, avec un premier rôle métier **Chef de projet** et une autorisation basée sur le lien **responsableProjet**.
