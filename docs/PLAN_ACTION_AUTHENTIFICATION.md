# Plan d’action — Authentification (renforcements)

**Date** : 2026-02-21  
**Référence** : [ANALYSE_AUTHENTIFICATION_CE_QUI_MANQUE.md](./ANALYSE_AUTHENTIFICATION_CE_QUI_MANQUE.md)

**Contexte** : Pas d’inscription. Les utilisateurs sont créés par l’administrateur ; ils se connectent ensuite avec email + mot de passe. Ce plan porte sur les améliorations identifiées dans l’audit (429, cookie, emails, lockout, etc.).

---

## Phase 1 — Quick wins (démarrage)

Objectif : corriger les manques à fort impact et faible effort, sans changer l’architecture.

### 1.1 Gestion du 429 (rate limit) sur l’écran de login

| Étape | Action | Fichiers / lieu |
|-------|--------|------------------|
| 1 | Détecter le statut 429 dans la réponse du login (thunk ou authApi) et exposer un message dédié (ex. `errorCode: 'RATE_LIMIT'` ou message déjà formaté). | `authSlice.ts`, `authApi.ts` ou `LoginForm.tsx` |
| 2 | Afficher un message utilisateur clair : « Trop de tentatives de connexion. Réessayez dans X minute(s). » | Clés i18n `auth.login.errorRateLimit` (fr + en) |
| 3 | Optionnel : dans l’intercepteur axios, pour toute requête renvoyant 429, ne pas déclencher le flux 401 (refresh) ; laisser l’erreur remonter avec le bon message. | `axios.ts` |

**Livrable** : L’utilisateur qui dépasse le rate limit voit un message explicite sur la page de login.

---

### 1.2 Sécurité du cookie refresh (production)

| Étape | Action | Fichiers / lieu |
|-------|--------|------------------|
| 1 | Vérifier dans `AuthCookieHelper` (ou équivalent) les options du cookie : `Secure`, `SameSite`, `Path`, `HttpOnly`, `Max-Age`. | Backend : module auth, config cookie |
| 2 | En production : `Secure=true`, `SameSite=Lax` (ou `Strict` si même site), `Path` restreint (ex. `/api` si le refresh est appelé sous `/api`). Documenter la config (variables d’environnement si besoin). | `application-prod.yml` ou variables d’env + doc |
| 3 | Ajouter ces variables / valeurs dans la liste des variables d’environnement (voir phase 2). | Doc variables (phase 2) |

**Livrable** : Cookie refresh durci en prod et documenté.

---

### 1.3 Documentation des variables d’environnement (auth)

| Étape | Action | Fichiers / lieu |
|-------|--------|------------------|
| 1 | Créer ou compléter un fichier (ex. `docs/VARIABLES_ENVIRONNEMENT.md` ou section dans README) listant toutes les variables liées à l’auth. | `docs/` ou `README` |
| 2 | Inclure : `JWT_SECRET`, `JWT_EXPIRATION_MS`, `JWT_REFRESH_EXPIRATION_MS`, `app.mail.*`, `app.rate-limit.login-max-attempts`, `app.rate-limit.login-window-minutes`, `app.scheduler.session-cleanup-cron`, `app.scheduler.password-reset-cleanup-cron`, `app.auth.refresh-cookie.name`, `CORS_ALLOWED_ORIGINS`, `app.mail.frontend-base-url`, et options cookie (Secure, SameSite) si configurables. | Idem |

**Livrable** : Une seule référence pour configurer l’auth en dev et en prod.

---

## Phase 2 — Notifications email (sécurité)

Objectif : envoyer des emails optionnels pour nouveau login, changement de mot de passe et 2FA.

### 2.1 Nouvelle connexion (optionnel, configurable)

| Étape | Action | Fichiers / lieu |
|-------|--------|------------------|
| 1 | Ajouter une variable de config (ex. `app.mail.notify-on-login`) pour activer/désactiver l’envoi. | `application.yml` |
| 2 | Dans `AuthService` (après création de session réussie), si activé, appeler un nouveau méthode du type `emailService.sendLoginNotification(email, prenom, ip, userAgent)`. | `AuthService.kt`, `EmailService.kt` |
| 3 | Implémenter `sendLoginNotification` dans `EmailService` (template texte ou HTML simple). | `EmailService.kt` |

**Livrable** : Email « Connexion détectée » envoyé (ou non selon config).

---

### 2.2 Changement de mot de passe (utilisateur et admin)

| Étape | Action | Fichiers / lieu |
|-------|--------|------------------|
| 1 | Lors du changement de mot de passe réussi (`/users/me/password` et éventuellement `/users/{id}/password`), appeler `emailService.sendPasswordChangedNotification(email, prenom)`. | `UserService` (changeMyPassword, changePassword) |
| 2 | Implémenter le template et l’envoi dans `EmailService`. | `EmailService.kt` |

**Livrable** : L’utilisateur reçoit un email après chaque changement de mot de passe.

---

### 2.3 2FA activée / désactivée

| Étape | Action | Fichiers / lieu |
|-------|--------|------------------|
| 1 | Après activation 2FA réussie (`verifySetup2FA`), envoyer un email de confirmation. | `AuthService.kt` |
| 2 | Après désactivation 2FA réussie (`disable2FA`), envoyer un email de confirmation. | `AuthService.kt` |
| 3 | Méthodes dédiées dans `EmailService` (ex. `send2FAEnabledNotification`, `send2FADisabledNotification`). | `EmailService.kt` |

**Livrable** : Emails de confirmation 2FA activée / désactivée.

---

## Phase 3 — Renforcements optionnels (selon priorité)

### 3.1 Lockout par compte (après N échecs de connexion)

| Étape | Action | Fichiers / lieu |
|-------|--------|------------------|
| 1 | Décider : nombre d’échecs (ex. 5), durée de verrouillage (ex. 15 min) ou déverrouillage par reset password / admin. | Spécification |
| 2 | Backend : stocker par utilisateur (ou par email) le nombre d’échecs et la date de déverrouillage (table dédiée ou champs sur `User`). Incrémenter à chaque échec login, réinitialiser à 0 à chaque succès. Si seuil atteint : renvoyer 423 ou 429 avec message clair. | Entité, repository, `AuthService.login` |
| 3 | Frontend : afficher un message adapté (ex. « Compte temporairement verrouillé. Réessayez à HH:mm » ou « Utilisez Mot de passe oublié »). | Clés i18n, `LoginForm` / `authSlice` |

**Livrable** : Réduction du risque brute-force par identifiant (en plus du rate limit par IP).

---

### 3.2 Liste des sessions et déconnexion (côté utilisateur)

| Étape | Action | Fichiers / lieu |
|-------|--------|------------------|
| 1 | Backend : `GET /users/me/sessions` (liste des sessions actives de l’utilisateur connecté : id, ip, userAgent, dateDebut, lastActivity). | Controller users ou auth, service, DTO |
| 2 | Backend : `DELETE /users/me/sessions/{sessionId}` (révocation d’une session, avec vérification que la session appartient à l’utilisateur). | Idem |
| 3 | Frontend : page ou section « Sécurité / Sessions actives » dans Profil ou Paramètres : afficher la liste, bouton « Déconnecter » par session. | Page Paramètres ou Profil, appels API |

**Livrable** : L’utilisateur voit ses sessions et peut en invalider une.

---

### 3.3 Politique de mot de passe (cohérence backend)

| Étape | Action | Fichiers / lieu |
|-------|--------|------------------|
| 1 | Vérifier et aligner les contraintes : `ResetPasswordRequest.newPassword`, `ChangePasswordRequest.newPassword`, création utilisateur (admin). Longueur min, complexité (majuscule, chiffre, symbole) si souhaitée. | DTOs, validation (Bean Validation ou service) |
| 2 | Documenter la politique dans la doc technique ou dans le README. | Docs |

**Livrable** : Même règles de mot de passe partout, documentées.

---

### 3.4 Tests automatisés (auth)

| Étape | Action | Fichiers / lieu |
|-------|--------|------------------|
| 1 | Backend : tests d’intégration (Controller ou Service) pour login (succès, mauvais mot de passe, compte inactif, 2FA requis), refresh, logout, forgot-password (réponse générique), reset-password (token valide / invalide / expiré). | `src/test/` backend |
| 2 | Frontend : tests composant ou E2E pour login, forgot-password, reset-password (au moins parcours heureux). | `src/` frontend, tests E2E ou composants |

**Livrable** : Régression évitée sur les flux critiques.

---

## Ordre de réalisation recommandé

1. **Phase 1** (quick wins) : 1.1 → 1.2 → 1.3.  
2. **Phase 2** (emails) : 2.1 → 2.2 → 2.3 (ou en parallèle si une seule personne travaille sur `EmailService`).  
3. **Phase 3** : selon priorité métier — lockout (3.1), sessions (3.2), politique MDP (3.3), tests (3.4).

---

## Checklist de suivi

- [ ] 1.1 — Message 429 sur l’écran de login (i18n fr + en)
- [ ] 1.2 — Cookie refresh sécurisé en prod (Secure, SameSite, Path) + doc
- [ ] 1.3 — Doc variables d’environnement (auth)
- [ ] 2.1 — Email « nouvelle connexion » (configurable)
- [ ] 2.2 — Email « mot de passe modifié »
- [ ] 2.3 — Emails « 2FA activée » / « 2FA désactivée »
- [ ] 3.1 — Lockout compte (optionnel)
- [ ] 3.2 — Liste / révocation sessions (optionnel)
- [ ] 3.3 — Politique mot de passe alignée et documentée
- [ ] 3.4 — Tests automatisés auth (backend + frontend)

Ce plan peut être découpé en tickets (un par case de la checklist ou par phase) selon votre outil de suivi.
