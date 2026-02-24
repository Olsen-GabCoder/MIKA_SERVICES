# Analyse — Authentification MIKA Services — Ce qui manque

Document d’analyse de la chaîne d’authentification (backend + frontend) et des écarts par rapport à une cible « professionnelle et sécurisée ».

---

## 1. Ce qui est déjà en place

### 1.1 Backend

| Fonctionnalité | État | Détail |
|----------------|------|--------|
| Login email/password | ✅ | `POST /auth/login`, BCrypt, compte actif |
| Refresh token | ✅ | Cookie httpOnly ou body, `POST /auth/refresh` |
| Logout | ✅ | Désactivation session + clear cookie |
| Logout toutes sessions (admin) | ✅ | `POST /auth/logout-all?userId=` |
| Forgot password | ✅ | `POST /auth/forgot-password`, token par email |
| Reset password | ✅ | `POST /auth/reset-password`, token + nouveau mot de passe |
| 2FA (TOTP) | ✅ | Setup, verify-setup, verify (login), disable |
| Changement mot de passe (moi) | ✅ | `PUT /users/me/password` (utilisateur connecté) |
| Changement mot de passe (admin) | ✅ | `PUT /users/{id}/password`, `PUT /users/{id}/admin-reset-password` |
| Sessions en base | ✅ | Table `sessions`, invalidation au logout |
| JWT (access + refresh) | ✅ | Access 15 min, refresh 7 j, secret configurable |
| Rate limiting login | ✅ | `LoginRateLimitFilter` (5 tentatives / 1 min par IP) |
| Nettoyage sessions expirées | ✅ | `SessionCleanupScheduler` (cron 3h) |
| Nettoyage tokens reset | ✅ | Cron 4h pour `PasswordResetToken` |
| Envoi email reset | ✅ | `EmailService.sendPasswordResetEmail`, lien frontend configurable |

### 1.2 Frontend

| Fonctionnalité | État | Détail |
|----------------|------|--------|
| Page login | ✅ | LoginForm + lien « Mot de passe oublié » |
| Page mot de passe oublié | ✅ | ForgotPasswordPage |
| Page reset mot de passe | ✅ | ResetPasswordPage (token dans query) |
| Vérification 2FA après login | ✅ | Verify2FAForm, flux tempToken → code |
| Routes protégées | ✅ | ProtectedRoute (requireAuth, requireAdmin) |
| Restauration user au chargement | ✅ | `fetchUserFromToken` si token sans user |
| Intercepteur 401 + refresh | ✅ | Axios : refresh par cookie puis retry |
| Déconnexion + redirection | ✅ | Clear token + redirect /login si refresh échoue |
| Changement mot de passe (profil) | ✅ | ProfilePasswordSection → `userApi.changeMyPassword` |

### 1.3 Sécurité déjà couverte

- Pas d’énumération d’email sur forgot-password (réponse générique).
- Refresh token en cookie httpOnly (optionnel en body).
- Rôles (ADMIN, SUPER_ADMIN) pour routes admin.
- 2FA désactivable uniquement avec mot de passe.

---

## 2. Ce qui manque ou est à améliorer

### 2.1 Inscription (register) — hors périmètre

- **Décision** : **Aucune page ni endpoint d’inscription.** Les comptes sont créés uniquement par un administrateur (gestion des utilisateurs). Les utilisateurs ajoutés par l’admin se connectent ensuite avec leurs identifiants (email + mot de passe). Pas de self-registration.
- **État** : Conforme — pas de `/auth/register`, pas d’écran d’inscription. Ne pas en ajouter.

### 2.2 Vérification d’email (après inscription ou changement d’email)

- **État** : Non implémenté.
- **Manque** : Pas de champ `emailVerified` / `email_verified`, pas de lien magique ni d’endpoint du type `GET /auth/verify-email?token=`.
- **Recommandation** : Si inscription ou changement d’email existent, prévoir un flux « vérification email » (token court terme, email avec lien, endpoint public) et éventuellement bloquer certaines actions tant que l’email n’est pas vérifié.

### 2.3 Gestion du rate limit (429) côté frontend

- **État** : Le backend renvoie 429 avec un message explicite sur `/auth/login`.
- **Manque** : L’intercepteur axios ne traite pas spécifiquement le 429 ; le formulaire de login affiche probablement un message générique.
- **Recommandation** : Dans l’intercepteur ou dans le thunk/login, détecter le statut 429 et afficher un message du type « Trop de tentatives. Réessayez dans X minute(s). » (idéalement avec une clé i18n dédiée).

### 2.4 Blocage de compte (lockout) après N échecs

- **État** : Seul le rate limit par IP existe (5 tentatives / 1 min).
- **Manque** : Aucun verrouillage par compte (ex. 5 échecs → compte verrouillé 15 min ou nécessité de reset par admin / email).
- **Recommandation** : Pour un niveau « pro », envisager un lockout par identifiant (email) : compteur d’échecs, date de déverrouillage, et message clair côté frontend + email optionnel à l’utilisateur.

### 2.5 Notifications par email (sécurité)

- **État** : Seul l’email de reset mot de passe est envoyé.
- **Manque** : Pas d’email « Nouvelle connexion / nouvel appareil », ni « Mot de passe modifié », ni « 2FA activée/désactivée ».
- **Recommandation** : Ajouter des envois optionnels (configurables) pour : nouveau login (IP/user-agent), changement de mot de passe, activation/désactivation 2FA. Utiliser le même `EmailService` et des templates dédiés.

### 2.6 Expiration / révocation du token de reset

- **État** : Token 1 h, marqué `used` après utilisation, nettoyage des expirés en cron.
- **Manque** : Rien de critique ; on peut documenter la durée (1 h) et le fait qu’un token ne soit utilisable qu’une fois (déjà le cas).

### 2.7 Liste des sessions / déconnexion d’une session donnée (côté utilisateur)

- **État** : L’admin peut déconnecter toutes les sessions d’un utilisateur ; l’utilisateur ne voit pas ses sessions actives ni ne peut en fermer une.
- **Manque** : Pas d’endpoint du type `GET /users/me/sessions` ni `DELETE /users/me/sessions/{id}`.
- **Recommandation** : Si besoin UX/sécurité (voir « où je suis connecté »), ajouter liste des sessions (user_agent, IP, date) et déconnexion d’une session ou « déconnecter les autres ».

### 2.8 Politique de mot de passe (complexité)

- **État** : Côté frontend, `validatePassword` existe (longueur, etc.) ; côté backend, à confirmer (contraintes sur `ResetPasswordRequest.newPassword`, `ChangePasswordRequest`, création utilisateur).
- **Recommandation** : S’assurer que les mêmes règles (longueur min, complexité si souhaitée) sont appliquées partout (reset, change password, admin reset, création user) et documentées.

### 2.9 Sécurité des cookies (refresh)

- **État** : Cookie refresh ajouté par `AuthCookieHelper` ; à vérifier en prod : `Secure`, `SameSite`, `Path`.
- **Recommandation** : Vérifier que en production le cookie a `Secure=true`, `SameSite` adapté (ex. `Lax` ou `Strict`) et `Path` restreint (ex. `/api` si pertinent) pour limiter les fuites.

### 2.10 Documentation et variables d’environnement

- **État** : HANDOFF et `application.yml` décrivent JWT, CORS, etc. Email avec `app.mail.from` et `app.mail.frontend-base-url`.
- **Manque** : Liste exhaustive des variables d’auth (JWT, mail, rate limit, cron cleanup, base URL du front pour les liens d’email) dans un seul endroit (README ou doc déploiement).
- **Recommandation** : Tenir à jour un fichier « Variables d’environnement » (backend + frontend) avec : `JWT_SECRET`, `JWT_EXPIRATION_MS`, `JWT_REFRESH_EXPIRATION_MS`, `app.mail.*`, `app.rate-limit.*`, `app.scheduler.*`, `app.auth.refresh-cookie.name`, `CORS_ALLOWED_ORIGINS`, `app.mail.frontend-base-url`.

### 2.11 Tests automatisés (auth)

- **État** : Non vérifié dans cette analyse.
- **Recommandation** : Au minimum : tests d’intégration pour login (succès, mauvais mot de passe, compte inactif, 2FA si activé), refresh, logout, forgot-password (réponse générique), reset-password (token valide/invalide/expiré). Côté frontend : tests E2E ou composants pour login, forgot, reset. (Pas d’inscription : comptes créés par l’admin.)

### 2.12 Récapitulatif des priorités

| Priorité | Élément | Effort estimé |
|----------|---------|----------------|
| Haute | Gestion explicite du 429 (rate limit) sur l’écran login | Faible |
| Haute | Vérifier et durcir les options du cookie refresh (Secure, SameSite, Path) en prod | Faible |
| Moyenne | Notifications email (nouveau login, changement MDP, 2FA) | Moyen |
| Moyenne | Lockout compte après N échecs (optionnel) | Moyen |
| — | Inscription : **non prévue** (comptes créés par l’admin uniquement) | — |
| Basse | Vérification email (si inscription ou changement email) | Élevé |
| Basse | Liste / révocation des sessions par l’utilisateur | Moyen |

---

## 3. Synthèse

- **Points forts** : Login, refresh, logout, forgot/reset password, 2FA, changement de mot de passe (moi + admin), sessions, rate limit IP, nettoyage des sessions et tokens reset, email de reset, intégration frontend (routes, intercepteur, profil) sont en place et cohérents.
- **Principaux manques** : traitement explicite du 429 et durcissement du cookie refresh en prod, puis renforcement UX/sécurité (notifications email, lockout compte, gestion des sessions par l’utilisateur) selon le niveau de criticité souhaité.

Ce document peut servir de base pour un plan d’action (backlog) dédié à l’authentification.
