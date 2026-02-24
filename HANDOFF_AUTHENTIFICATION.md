# Handoff — Authentification professionnelle et sécurisée — MIKA Services

Document de synthèse destiné à l’agent qui travaillera sur l’authentification. Objectif : une authentification professionnelle, sécurisée, avec envoi d’emails et mécanismes nécessaires.

---

## 1. Structure du projet

```
c:\Projet_Mika_Services\
├── backend/                    # API Spring Boot (Kotlin)
│   ├── pom.xml
│   ├── .env                    # Variables d'environnement (secrets)
│   └── src/main/
│       ├── kotlin/com/mikaservices/platform/
│       │   ├── common/         # Constantes, exceptions, utilitaires
│       │   ├── config/         # Security, Cors, JWT
│       │   └── modules/
│       │       ├── auth/       # Login, refresh, logout, Session
│       │       └── user/       # User, Role, Permission, UserController
│       └── resources/
│           ├── application.yml
│           ├── application-dev.yml
│           └── application-prod.yml
│
└── frontend_web/mika-services-frontend/   # SPA React (TypeScript)
    ├── package.json
    ├── .env, .env.example
    ├── vite.config.ts          # Proxy /api → localhost:9090
    └── src/
        ├── api/                # authApi, userApi, axios
        ├── store/slices/       # authSlice
        ├── features/auth/      # LoginPage, LoginForm
        ├── router/             # ProtectedRoute
        └── constants/api.ts    # API_ENDPOINTS
```

---

## 2. Technologies

| Composant | Stack |
|-----------|-------|
| **Backend** | Spring Boot 4.0.2, Kotlin 2.2.21, Java 17, JPA/Hibernate, MySQL |
| **Sécurité** | Spring Security, JWT (jjwt 0.12.5), BCrypt |
| **Frontend** | React 19, TypeScript 5.9, Vite 7, Redux Toolkit, React Router |
| **Auth frontend** | Redux authSlice, axios interceptors, `localStorage` pour tokens |

---

## 3. Authentification actuelle

### 3.1 Backend — Endpoints auth

| Méthode | Chemin | Description | Protégé |
|---------|--------|-------------|---------|
| POST | `/api/auth/login` | Connexion email/password | Non |
| POST | `/api/auth/refresh` | Refresh token | Non |
| POST | `/api/auth/logout` | Déconnexion (Bearer requis) | Oui |
| POST | `/api/auth/logout-all?userId=` | Déconnexion de toutes les sessions | Oui |

**Remarque** : `/auth/register` est autorisé dans la config sécurité mais **aucun contrôleur ni service n’existe**.

### 3.2 Backend — AuthService (`AuthService.kt`)

- **login** : Vérifie email, compte actif et mot de passe ; crée une `Session` ; génère access + refresh tokens
- **refreshToken** : Vérifie refresh token et session active ; émet de nouveaux tokens
- **logout** : Désactive la session
- **logoutAll** : Désactive toutes les sessions d’un utilisateur

### 3.3 Backend — JWT

- **JwtTokenProvider** : Génération et validation (HS256)
- **Access token** : 15 min (configurable via `JWT_EXPIRATION_MS`)
- **Refresh token** : 7 jours (configurable via `JWT_REFRESH_EXPIRATION_MS`)
- **Secret** : Variable d’environnement `JWT_SECRET` (minimum 32 caractères)

### 3.4 Backend — Session

- **Table `sessions`** : `user_id`, `token`, `refresh_token`, `ip_address`, `user_agent`, `date_debut`, `date_expiration`, `last_activity`, `active`
- **SessionRepository** : `findByToken`, `findByRefreshToken`, `deactivateAllUserSessions`

### 3.5 Frontend — Flux auth

1. Login : `authApi.login()` → POST `/api/auth/login` → stockage tokens dans `localStorage` et Redux
2. Requêtes API : Header `Authorization: Bearer <accessToken>`
3. 401 : Intercepteur axios tente un refresh puis relance la requête ; sinon logout et redirection `/login`
4. Routes protégées : `ProtectedRoute` (requireAuth, requireAdmin)

### 3.6 Frontend — Fichiers clés

| Fichier | Rôle |
|---------|------|
| `authSlice.ts` | State auth, thunks login/refresh/logout |
| `authApi.ts` | login, refreshToken, logout, getMe |
| `axios.ts` | Intercepteurs, refresh sur 401 |
| `LoginPage.tsx`, `LoginForm.tsx` | Page et formulaire de connexion |
| `ProtectedRoute.tsx` | Vérification auth et rôles (ADMIN, SUPER_ADMIN) |
| `constants/api.ts` | `API_ENDPOINTS.AUTH`, `API_ENDPOINTS.USERS` |

---

## 4. Base de données — User et rôles

### 4.1 Table `users`

- **Champs** : `id`, `matricule` (unique), `nom`, `prenom`, `email` (unique, identifiant de connexion), `mot_de_passe` (BCrypt), `actif`, `last_login`, etc.
- **Relations** : `user_roles` (N:N), `superieur_hierarchique_id`

### 4.2 Rôles

- **Table `roles`** : `code`, `nom`, `description`, `niveau`, `actif`
- **Exemples de codes** : `SUPER_ADMIN`, `ADMIN`, `USER`, `CHEF_PROJET`
- **permissions** : table `permissions`, liaison `role_permissions`

---

## 5. Ce qui manque (objectifs pour l’agent)

### 5.1 Emails

- **Aucune dépendance** `spring-boot-starter-mail` dans `pom.xml`
- **Aucun service d’envoi d’emails**
- À mettre en place :
  - Ajout de `spring-boot-starter-mail`
  - Configuration SMTP (variables d’environnement)
  - Service d’envoi d’emails
  - Templates pour : vérification email, reset password, notifications de sécurité

### 5.2 Inscription (register)

- `/auth/register` est public mais non implémenté
- À définir : inscription avec ou sans validation email

### 5.3 Reset mot de passe (oublié)

- Non implémenté côté backend
- Workflow typique : demande par email → token temporaire → formulaire nouveau mot de passe

### 5.4 Vérification d’email

- Non implémentée
- À définir : vérification obligatoire avant premier login ?

### 5.5 Changement de mot de passe (utilisateur connecté)

- **Actuel** : `PUT /users/{id}/password` avec `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")`
- **Problème** : un utilisateur non-admin ne peut pas changer son propre mot de passe
- **Recommandation** : ajouter `PUT /users/me/password` pour que l’utilisateur connecté change son propre mot de passe (sans rôle admin)

### 5.6 Autres améliorations sécurité

- Limitation des tentatives de connexion (rate limiting)
- Nettoyage périodique des sessions expirées
- Notifications par email : nouveau device, changement de mot de passe
- 2FA (optionnel, plus tard)

---

## 6. Configuration

### 6.1 Variables d’environnement backend

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `JWT_SECRET` | Secret JWT (≥ 32 caractères) | Obligatoire |
| `JWT_EXPIRATION_MS` | Durée access token (ms) | 900000 (15 min) |
| `JWT_REFRESH_EXPIRATION_MS` | Durée refresh token (ms) | 604800000 (7 jours) |
| `CORS_ALLOWED_ORIGINS` | Origines CORS | `http://localhost:5173,http://127.0.0.1:5173` |
| `UPLOAD_DIR` | Dossier uploads | `uploads` |
| `METEO_API_KEY` | Clé API météo | — |

### 6.2 URLs et proxy

- **Backend** : `http://localhost:9090`, context-path `/api`
- **Frontend** : `http://localhost:5173`, proxy `/api` → `http://localhost:9090`
- **API base** : `/api` (défini dans `constants/api.ts`)

### 6.3 application.yml (extrait)

```yaml
app:
  jwt:
    secret: ${JWT_SECRET:}
    expiration: ${JWT_EXPIRATION_MS:900000}
    refresh-expiration: ${JWT_REFRESH_EXPIRATION_MS:604800000}
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5173,...}
```

---

## 7. Fichiers principaux à connaître

### Backend (auth)

- `modules/auth/controller/AuthController.kt`
- `modules/auth/service/AuthService.kt`
- `modules/auth/entity/Session.kt`
- `modules/auth/repository/SessionRepository.kt`
- `config/security/JwtTokenProvider.kt`
- `config/security/JwtAuthenticationFilter.kt`
- `config/security/SecurityConfig.kt`
- `common/constants/SecurityConstants.kt`

### Backend (user)

- `modules/user/entity/User.kt`
- `modules/user/repository/UserRepository.kt`
- `modules/user/service/UserService.kt`
- `modules/user/controller/UserController.kt`

### Frontend (auth)

- `store/slices/authSlice.ts`
- `api/authApi.ts`
- `api/axios.ts`
- `features/auth/pages/LoginPage.tsx`
- `features/auth/components/LoginForm.tsx`
- `router/ProtectedRoute.tsx`
- `constants/api.ts`

### Frontend (profil utilisateur)

- `features/user/components/ProfilePasswordSection.tsx` — change password (appelle `userApi.changePassword`)
- `api/userApi.ts` — `changePassword(userId, { currentPassword, newPassword })`

---

## 8. Chemins publics (sans JWT)

Configurés dans `SecurityConfig` :

- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/register`
- Swagger : `/v3/api-docs/**`, `/swagger-ui/**`, `/webjars/**`
- WebSocket : `/ws/**`
- OPTIONS : `/**`
- `/error`

**À ajouter par l’agent** : `POST /auth/forgot-password`, `POST /auth/reset-password` (chemins publics pour le workflow reset password).

---

## 9. Checklist pour l’agent auth

1. [ ] Ajouter `spring-boot-starter-mail` et configurer SMTP
2. [ ] Créer un service d’envoi d’emails avec templates
3. [ ] Implémenter `POST /auth/forgot-password` (envoi token par email)
4. [ ] Implémenter `POST /auth/reset-password` (validation token + nouveau mot de passe)
5. [ ] Ajouter `PUT /users/me/password` pour changement de mot de passe par l’utilisateur connecté
6. [ ] Décider et implémenter `/auth/register` (optionnel, avec ou sans vérification email)
7. [ ] Mettre en place nettoyage périodique des sessions expirées
8. [ ] Envisager rate limiting sur `/auth/login`
9. [ ] Envisager emails de notification : nouveau login, changement mot de passe
10. [ ] Documenter les nouvelles variables d’environnement (SMTP, etc.)

---

## 10. Traductions auth (i18n)

Fichiers : `frontend_web/mika-services-frontend/src/locales/fr/auth.json`, `locales/en/auth.json`

Structure actuelle : `login.title`, `login.subtitle`, `login.email`, `login.password`, `login.submit`, `login.errorBadCredentials`, `login.errorNetwork`, `login.validation*`, etc.

Les écrans reset password et vérification email devront utiliser ce namespace : `auth.forgotPassword.*`, `auth.resetPassword.*`, etc.

---

## 11. Contextes supplémentaires récents (i18n général)

Des traductions i18n ont été ajoutées sur l’appli :

- Login, profil, boutons, messages d’erreur utilisent `react-i18next`
- Namespaces : `auth`, `user`, `common`
- Les nouveaux messages d’auth (reset password, vérification email) devront être intégrés dans les fichiers de traduction (`locales/fr/auth.json`, `locales/en/auth.json`)

---

*Document généré pour handoff — Projet MIKA Services — Authentification professionnelle et sécurisée*
