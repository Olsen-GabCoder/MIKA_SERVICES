# Plan d'action — Gestion complète des utilisateurs par l'administrateur

**Date** : 2026-02-21  
**Objectif** : Transformer le module utilisateurs en un panneau d'administration professionnel, robuste et sécurisé.

**Principe** : Pas d’inscription (self-service). Les comptes sont créés uniquement par un administrateur ; les utilisateurs se connectent ensuite avec leurs identifiants.

---

## 1. Synthèse de l'existant

### 1.1 Backend

| Élément | État actuel |
|--------|-------------|
| **Entité User** | Champs : matricule, nom, prénom, email, motDePasse, actif, lastLogin, totpSecret, totpEnabled, roles, départements, spécialités, superieurHierarchique, createdAt, updatedAt, createdBy, updatedBy. **Aucun champ emailVerified.** |
| **UserController** | POST/GET /users, GET/PUT/DELETE /users/{id}, GET /users/{id}/audit-logs, PUT /users/{id}/password (avec currentPassword + newPassword). Tous protégés par `@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")` sauf /users/me et sous-chemins. |
| **UserService** | create, findAll(pageable), findById, update, changePassword(id, request avec currentPassword), delete (soft : actif=false). **Pas de** : reset password admin sans ancien mot de passe, désactivation 2FA par admin, écriture dans AuditLog. |
| **UserRepository** | findByEmail, findByMatricule, findByActifTrue, existsByEmail/Matricule, findByRoleCode, findByDepartementId, findBySuperieurHierarchiqueId. **Pas de** recherche/filtre combiné (nom, email, actif, rôle, etc.) pour la liste paginée. |
| **AuditLog** | Entité et repository existent ; GET /users/{id}/audit-logs expose les logs. **Aucune écriture** n'est faite dans le projet (création, mise à jour, suppression utilisateur, changement mot de passe, etc. ne sont pas journalisés). |
| **DTOs** | UserResponse expose actif, totpEnabled, lastLogin, createdAt, updatedAt. UserUpdateRequest permet actif, roleIds, etc. ChangePasswordRequest exige currentPassword + newPassword (pas d’admin reset sans ancien mot de passe). |

### 1.2 Frontend

| Élément | État actuel |
|--------|-------------|
| **Pages** | UserManagementPage : liste + bouton « Ajouter » + modal création (UserForm). UserDetailPage : fiche lecture seule (infos générales, affectations, historique audit), bouton « Retour ». **Pas de** page ou modal d’édition, pas d’actions (activer/désactiver, reset MDP, 2FA, supprimer). |
| **UserList** | Affichage en cartes : initiales, nom, email, rôles + matricule, badge actif/inactif, bouton « Voir ». **Pas de** colonnes lastLogin, totpEnabled, createdAt ; pas de tri, pas de filtres, pas de recherche ; pas d’actions en ligne (éditer, désactiver, etc.). |
| **UserForm** | Utilisé uniquement en **création** (modal). Pas de formulaire d’édition (UserEditForm ou mode édition). |
| **API (userApi)** | getAll(page, size), getById, create, update, delete, getAuditLogs, changePassword(id, { currentPassword, newPassword }). **Pas de** : adminResetPassword(id, newPassword), adminDisable2FA(id). |
| **Routes** | /users (liste), /users/:id (détail). **Pas de** /users/:id/edit. |
| **Confirmations** | Aucune confirmation avant suppression ou action sensible. |

### 1.3 Sécurité et cohérence

- **Rôles** : SUPER_ADMIN et ADMIN ont les mêmes droits sur tous les endpoints users ; pas de distinction (ex. certaines actions réservées au seul SUPER_ADMIN).
- **Élévation de privilèges** : Pas de règle explicite interdisant à un admin de se retirer son propre rôle admin ou de désactiver son compte (à encadrer).
- **Journalisation** : Aucune action sensible n’est enregistrée dans AuditLog.

---

## 2. Écarts par rapport à l’objectif

### 2.1 Consultation

- Liste : manque colonnes **lastLogin**, **2FA (totpEnabled)**, **date de création** ; pas de **tri** ni **filtres** (statut, rôle, recherche nom/email/matricule).
- Fiche détail : manque affichage explicite **2FA**, **createdAt/updatedAt** ; pas de **boutons d’action** (modifier, activer/désactiver, réinitialiser MDP, 2FA, supprimer).

### 2.2 Actions admin

- **Modifier un utilisateur** : possible via API (PUT /users/{id}) mais pas d’UI (pas de formulaire d’édition).
- **Activer / Désactiver un compte** : possible via API (actif dans UserUpdateRequest) mais pas d’UI dédiée (bouton + confirmation).
- **Réinitialiser le mot de passe** : pas d’endpoint « admin définit un nouveau mot de passe » sans currentPassword ; pas d’UI.
- **Désactiver / réinitialiser la 2FA** : pas d’endpoint admin (seul l’utilisateur peut désactiver avec son mot de passe) ; pas d’UI.
- **Supprimer un utilisateur** : API en soft delete (actif=false) ; pas de confirmation côté frontend.

### 2.3 Vérification email

- Pas de champ **emailVerified** ni de flux « forcer la vérification » ; à prévoir si le métier le demande (sinon laisser pour une phase ultérieure).

### 2.4 Sécurité et audit

- **Audit** : aucune écriture dans AuditLog pour les actions sur les utilisateurs.
- **Confirmations** : aucune pour suppression ni pour actions sensibles.
- **Protection** : pas de règle empêchant un admin de se désactiver lui-même ou de se retirer ses rôles admin.

---

## 3. Plan d’action détaillé

### Phase A — Backend : fondations et API admin

| # | Tâche | Détail |
|---|--------|--------|
| A1 | **Audit : écriture des logs** | Créer un service/utilitaire (ex. `AuditLogService.log(userId, module, action, details, ipAddress)`) et l’appeler dans UserService (et si besoin AuthService) pour : création, mise à jour, suppression (désactivation) d’utilisateur ; changement de mot de passe (self et admin) ; désactivation 2FA par admin. Utiliser l’utilisateur connecté et l’IP (HttpServletRequest si disponible). |
| A2 | **Reset password par admin** | Ajouter un DTO `AdminResetPasswordRequest(newPassword)` et un endpoint `PUT /users/{id}/admin-reset-password` (ou `POST /users/{id}/reset-password`) réservé SUPER_ADMIN + ADMIN, qui définit le mot de passe sans currentPassword. Journaliser dans AuditLog. |
| A3 | **Désactivation 2FA par admin** | Ajouter un endpoint `POST /users/{id}/admin-disable-2fa` (SUPER_ADMIN + ADMIN) qui met totpEnabled=false et totpSecret=null pour l’utilisateur cible. Journaliser dans AuditLog. |
| A4 | **Liste avec filtres et tri** | Étendre UserRepository (ou créer une méthode avec Specification / @Query) pour accepter paramètres : search (nom, prénom, email, matricule), actif (boolean?), roleId (Long?), tri (ordre + champ). Exposer dans UserService.findAll(search, actif, roleId, pageable) et dans UserController (query params). |
| A5 | **Protection anti-auto-dégradation** | Dans UserService : update et delete — interdire à un utilisateur de se désactiver lui-même (actif=false) ou de se retirer tous ses rôles admin (SUPER_ADMIN/ADMIN). Optionnel : réserver certaines actions (ex. admin-reset-password sur un SUPER_ADMIN) au seul SUPER_ADMIN. |
| A6 | **Optionnel — emailVerified** | Si le métier le demande : ajouter le champ emailVerified sur User + migration BDD ; prévoir un endpoint « forcer vérification » admin (ex. PUT /users/{id}/force-email-verified). Sinon laisser pour une phase ultérieure. |

### Phase B — Frontend : liste professionnelle

| # | Tâche | Détail |
|---|--------|--------|
| B1 | **Tableau avec colonnes riches** | Remplacer ou compléter l’affichage en cartes par un **tableau** : Nom, Email, Matricule, Rôles, **Statut (actif/inactif)**, **2FA**, **Dernière connexion**, **Créé le**, Actions (Voir, Éditer, etc.). Utiliser les champs déjà présents dans User (lastLogin, totpEnabled, createdAt). |
| B2 | **Tri** | Tri par colonne (nom, email, date création, lastLogin, statut) avec indicateur visuel (flèche). Passer sort=nom,order=asc (ou équivalent) à l’API. |
| B2bis | **Pagination** | Sélecteur de taille de page (10, 25, 50) branché sur l’API et le state (pageSize). |
| B3 | **Filtres** | Barre de filtres : **Recherche** (nom / email / matricule), **Statut** (actif / inactif / tous), **Rôle** (liste déroulante). Relancer le chargement de la liste avec les paramètres (search, actif, roleId) + pagination. |
| B4 | **Actions en ligne** | Colonne Actions : lien « Voir » (existant), bouton « Modifier » (ouverture modal/page édition), bouton « Activer/Désactiver » avec confirmation. Pas encore de suppression en ligne (garder la suppression sur la fiche détail avec confirmation). |

### Phase C — Frontend : fiche détail et actions

| # | Tâche | Détail |
|---|--------|--------|
| C1 | **Blocs manquants sur la fiche** | Afficher clairement : **2FA** (activée / désactivée), **Date de création**, **Dernière mise à jour**. Structurer la fiche en blocs (État du compte, Infos générales, Affectations, Historique). |
| C2 | **Boutons d’action** | En haut ou en barre d’actions : **Modifier** (ouvre formulaire d’édition), **Activer / Désactiver le compte** (avec modal de confirmation), **Réinitialiser le mot de passe** (modal avec champ nouveau mot de passe, appel admin reset API), **Désactiver la 2FA** (modal confirmation, appel admin disable 2FA API), **Supprimer** (modal « Supprimer cet utilisateur ? », appel delete). |
| C3 | **Formulaire d’édition** | Créer un **UserEditForm** (ou mode édition dans UserForm) : mêmes champs que création sauf matricule (lecture seule) et mot de passe (optionnel ou séparé). Inclure actif, roleIds, départements, spécialités, supérieur. Soumission → update(id, data). Ouverture en modal depuis la liste ou depuis la fiche (bouton Modifier). |
| C4 | **Modals de confirmation** | Modals réutilisables : « Désactiver le compte de X ? », « Réinitialiser le mot de passe de X ? », « Désactiver la 2FA de X ? », « Supprimer l’utilisateur X ? » avec Annuler / Confirmer. Afficher un message de succès ou d’erreur après l’action. |

### Phase D — API frontend et state

| # | Tâche | Détail |
|---|--------|--------|
| D1 | **userApi** | Ajouter : `adminResetPassword(userId, newPassword)`, `adminDisable2FA(userId)`. Pour la liste : `getAll(params)` avec search, actif, roleId, page, size, sort, order. |
| D2 | **userSlice** | Étendre le thunk fetchUsers pour accepter les paramètres de filtre et tri ; stocker dans le state (search, actifFilter, roleIdFilter, sort, order) si besoin pour persister les filtres entre navigations. |
| D3 | **i18n** | Ajouter les libellés pour : colonnes (2FA, Dernière connexion, Créé le), boutons (Modifier, Activer, Désactiver, Réinitialiser MDP, Désactiver 2FA, Supprimer), titres/messages des modals de confirmation, messages succès/erreur. |

### Phase E — Sécurité et cohérence

| # | Tâche | Détail |
|---|--------|--------|
| E1 | **Règles métier côté backend** | Appliquer les protections A5 (interdiction de se désactiver soi-même, de se retirer tous les rôles admin). Retourner 400/403 avec message clair. |
| E2 | **Messages d’erreur** | Côté frontend, afficher les messages renvoyés par l’API (ex. « Vous ne pouvez pas désactiver votre propre compte »). |
| E3 | **Vérification des permissions** | S’assurer que les boutons sensibles (Supprimer, Désactiver 2FA, Reset MDP) ne sont visibles que pour les rôles autorisés (déjà le cas si la page est sous requireAdmin). Optionnel : masquer « Supprimer » pour soi-même. |

---

## 4. Ordre d’exécution recommandé

1. **A1** — Audit (écriture des logs) : base pour traçabilité de toutes les actions suivantes.  
2. **A2, A3** — Endpoints admin (reset password, disable 2FA) : nécessaires pour les boutons de la fiche.  
3. **A4** — Liste avec filtres/tri backend : nécessaire pour B1–B3.  
4. **A5, A6** — Protections et optionnel emailVerified.  
5. **D1, D2** — API et state frontend (getAll avec params, adminResetPassword, adminDisable2FA).  
6. **B1, B2, B2bis, B3, B4** — Liste tableau, tri, pagination, filtres, actions en ligne.  
7. **C1, C2, C3, C4** — Fiche détail (blocs, boutons, formulaire d’édition, modals).  
8. **D3, E1, E2, E3** — i18n, règles métier, messages d’erreur, cohérence permissions.

---

## 5. Résumé des livrables

- **Backend** : AuditLog alimenté ; endpoints admin reset password et disable 2FA ; liste utilisateurs avec recherche, filtres (actif, rôle), tri ; protections contre auto-désactivation / retrait des rôles admin.  
- **Frontend** : Liste en tableau avec colonnes (statut, 2FA, lastLogin, createdAt), tri, pagination, filtres ; fiche détail avec blocs et boutons d’action ; formulaire d’édition ; modals de confirmation pour toutes les actions sensibles ; appels aux nouvelles API.  
- **Sécurité** : Confirmations côté UI ; journalisation côté backend ; pas d’élévation de privilèges ni d’auto-dégradation non contrôlée.

---

## 6. État d'avancement

| Phase | Tâche | Statut |
|-------|--------|--------|
| **A** | A1 Audit (écriture des logs) | ✅ `AuditLogService.log` sur create, update, delete, changeMyPassword, changePassword, adminResetPassword, adminDisable2FA |
| **A** | A2 Reset password par admin | ✅ `PUT /users/{id}/admin-reset-password` |
| **A** | A3 Désactivation 2FA par admin | ✅ `POST /users/{id}/admin-disable-2fa` |
| **A** | A4 Liste avec filtres et tri | ✅ `findAll(search, actif, roleId, pageable)` |
| **A** | A5 Protection anti-auto-dégradation | ✅ Interdiction se désactiver, se retirer rôles admin, se supprimer |
| **B** | B1–B4 Tableau, tri, pagination, filtres, actions | ✅ `UserList` : tableau, tri, pagination, filtres, Voir/Modifier/Activer-Désactiver |
| **C** | C1–C4 Fiche détail, boutons, édition, modals | ✅ `UserDetailPage` : blocs (2FA, createdAt, updatedAt), boutons, `UserEditForm`, modals |
| **D** | D1–D3 API, state, i18n | ✅ userApi, userSlice, libellés |
| **E** | E1–E3 Règles, messages, permissions | ✅ Backend 400 ; frontend désactive boutons pour soi-même |

---

*Document généré à partir de l’analyse du projet MIKA Services — Backend (Spring Boot/Kotlin) et Frontend (React/TypeScript).*
