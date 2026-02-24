# Analyse complète du projet MIKA Services Platform

Document généré après revue exhaustive du backend et du frontend. Objectif : fournir une vision structurée de l’architecture, des flux, des dépendances et des points d’attention pour la suite du développement.

---

## 1. Vue d’ensemble

- **Backend** : Spring Boot 4.0.2, Kotlin, JPA/Hibernate, MySQL, JWT, Swagger, WebSocket.  
  Base : `backend/`, API sous `context-path: /api`, port **9090**.
- **Frontend** : React 19, TypeScript, Vite 7, Redux Toolkit, React Query, MUI, Tailwind.  
  Base : `frontend_web/mika-services-frontend/`, port dev **5173** (Vite).
- **Communication** : Frontend appelle `/api/*` ; Vite proxy en dev vers `http://localhost:9090`.  
  Pagination : format Spring `Page` (`content`, `totalElements`, etc.) aligné avec les types frontend `PageResponse<T>`.

---

## 2. Architecture backend

### 2.1 Structure des modules (par domaine)

| Module        | Préfixe API          | Contrôleur(s) / Entités principales |
|---------------|----------------------|-------------------------------------|
| Auth          | `/auth`              | AuthController – login, refresh, logout |
| User          | `/users`, `/roles`   | UserController, RoleController – User, Role, Permission, Departement, Specialite, AuditLog |
| Projet        | `/projets`           | ProjetController – Projet, Client, SousProjet, PointBloquant, Prevision, AvancementEtude, CAPrevisionnelRealise, RevisionBudget, Partenaire |
| Chantier      | `/equipes`           | EquipeController – Equipe, MembreEquipe, AffectationChantier, ZoneChantier, InstallationChantier |
| Budget        | `/budget`            | BudgetController – Depense |
| Planning      | `/planning`          | PlanningController – Tache |
| Materiel      | `/engins`, `/materiaux` | EnginController, MateriauController – Engin, Materiau, affectations chantier |
| Fournisseur   | `/fournisseurs`      | FournisseurController – Fournisseur, Commande |
| Qualité       | `/qualite`           | QualiteController – ControleQualite, NonConformite |
| Sécurité      | `/securite`          | SecuriteController – Incident, Risque, ActionPrevention |
| Réunion hebdo | `/reunions-hebdo`    | ReunionHebdoController – ReunionHebdo, PointProjetPV, ParticipantReunion |
| Communication | `/messages`, `/notifications` | MessageController, NotificationController |
| Document      | `/documents`         | DocumentController – Document |
| Météo         | `/meteo`             | MeteoController |
| Reporting     | `/reporting`         | ReportingController – dashboard, rapports projet |

### 2.2 Configuration

- **application.yml** : `server.port=9090`, `server.servlet.context-path=/api`, profil actif `dev`, JWT/CORS/upload/météo via variables d’environnement.
- **application-dev.yml** : MySQL `mika_services_dev`, `ddl-auto: update`, credentials en dur (à externaliser).
- **application-staging.yml** : MySQL staging, `ddl-auto: validate` (fichier renommé depuis `pplication-staging.yml`).
- **application-prod.yml** : à vérifier (non lu en détail).

**Correction effectuée** : le fichier `pplication-staging.yml` a été renommé en `application-staging.yml`.

### 2.3 Sécurité

- **SecurityConfig** : CORS injecté, CSRF désactivé, session stateless, JWT avant `UsernamePasswordAuthenticationFilter`.  
  Public : `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, Swagger, `/ws/**`, `/error`.  
  Tout le reste : `authenticated()`.
- **JwtAuthenticationFilter** : utilise `SecurityConstants.PUBLIC_PATHS` pour ne pas traiter les URLs publiques.  
  Les chemins sont définis sans préfixe `/api` ; à confirmer que `request.requestURI` (avec context-path) est bien géré (voir point 5.1).
- **AuthController** : pas d’endpoint `POST /auth/register` alors que la sécurité l’autorise (incohérence mineure).

### 2.4 Commun / partagé

- **BaseEntity** : `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`.
- **Enums** : nombreux dans `common/enums` (StatutProjet, TypeProjet, etc.) – cohérents avec les types frontend.
- **Exceptions** : `GlobalExceptionHandler`, `ApiError`, `CustomExceptions` (ResourceNotFound, BadRequest, etc.).
- **DataInitializer** : profil `dev` et `staging`, création permissions, rôles, admin, clients.

---

## 3. Architecture frontend

### 3.1 Structure des dossiers

- **src/api** : couche HTTP (axios avec baseURL `/api`), un fichier par domaine (authApi, projetApi, userApi, chantierApi, etc.).
- **src/constants** : `api.ts` – `API_ENDPOINTS` et `API_BASE_URL` alignés avec les contrôleurs backend.
- **src/config** : `mock.ts` – `USE_MOCK` et `USE_MOCK_FALLBACK` (variables d’env Vite).
- **src/features** : une feature par domaine (auth, user, projet, equipe, materiel, budget, planning, qualite, securite, communication, reporting, document, fournisseur, reunionhebdo, dashboard, errors).
- **src/components** : `layout` (Layout, Sidebar, Header, Footer, PageContainer), `ui` (Button, Card, Input, Modal, Alert, Loading).
- **src/store** : Redux (slices par domaine + auth, user, ui), `store.ts`, `hooks.ts`.
- **src/router** : `Router.tsx` (createBrowserRouter), `ProtectedRoute.tsx` (auth + option requireAdmin).
- **src/types** : interfaces TypeScript (projet, chantier, budget, qualite, securite, etc.) et `PageResponse<T>`.
- **src/mock** : données de repli (projets, clients, equipes, etc.) utilisées si `USE_MOCK` ou `USE_MOCK_FALLBACK`.

### 3.2 Flux d’authentification

1. Login : `authApi.login` → tokens en localStorage, Redux `authSlice` mis à jour.
2. Requêtes : `api/axios.ts` – intercepteur request ajoute `Authorization: Bearer <accessToken>`.
3. 401 : intercepteur response tente `POST /api/auth/refresh` avec `refreshToken`, puis rejouer la requête ; si échec → suppression tokens et redirection `/login`.
4. Au chargement de l’app (hors `/login`) : si authentifié mais pas d’objet `user`, `fetchUserFromToken` appelle `authApi.getMe()` (GET `/users/me`) pour remplir le state.

### 3.3 Routes (résumé)

- `/login` – LoginPage (non protégée).  
- `/` – DashboardPage.  
- `/profile`, `/users`, `/users/:id` – Profil et gestion utilisateurs (requireAdmin pour users).  
- `/projets`, `/projets/nouveau`, `/projets/:id`, `/projets/:id/edit` – Liste, création, détail, édition.  
- `/equipes`, `/equipes/nouveau`, `/equipes/:id`, `/equipes/:id/edit` – Équipes.  
- `/engins`, `/materiaux` – Matériel.  
- `/budget`, `/planning`, `/qualite`, `/securite` – Budget, planning, qualité, sécurité.  
- `/messagerie`, `/notifications` – Communication.  
- `/reporting`, `/documents`, `/fournisseurs` – Reporting, documents, fournisseurs.  
- `/reunions-hebdo` (liste, nouveau, détail, PV, édition).  
- `*` – NotFoundPage.

---

## 4. Alignement API frontend / backend

Les préfixes et chemins dans `src/constants/api.ts` correspondent aux `@RequestMapping` des contrôleurs (avec base `/api` côté client) :

- Auth : `/auth/login`, `/auth/refresh`, `/auth/logout` ; `/users/me` pour le profil courant.
- Projets, sous-projets, clients, points bloquants : préfixes et sous-chemins (ex. `BY_PROJET`, `BY_ID`) conformes.
- Équipes : `/equipes`, `/equipes/affectations/user/{userId}`.
- Budget, planning, qualite, securite, reunions-hebdo, messages, notifications, documents, reporting, fournisseurs, engins, materiaux : cohérents avec les contrôleurs.

Format de pagination : backend renvoie Spring `Page<>` (content, totalElements, totalPages, number, size, first, last). Le frontend utilise `PageResponse<T>` avec au moins `content` et `totalElements`, ce qui reste compatible.

---

## 5. Incohérences et points d’attention

### 5.1 Sécurité / Auth

- **SecurityConstants.PUBLIC_PATHS** : les chemins sont en `/auth/login`, `/auth/refresh`, etc. Avec `context-path=/api`, `request.requestURI` peut être `/api/auth/login`. Vérifier en runtime que les requêtes vers login/refresh sont bien exclues du filtre JWT (sinon ajouter le préfixe `/api` ou normaliser le chemin dans le filtre).
- **POST /auth/register** : autorisé dans SecurityConfig mais absent dans AuthController. Soit implémenter l’endpoint, soit retirer `/auth/register` des chemins publics.

### 5.2 Configuration et documentation

- **DEMARRAGE_RAPIDE.md** : indique frontend sur port **3000**, alors que `vite.config.ts` utilise **5173**. Mettre à jour la doc (et l’ordre de démarrage si besoin).
- **application-dev.yml / application-staging.yml** : mot de passe MySQL en clair. Recommandation : variables d’environnement (ex. `SPRING_DATASOURCE_PASSWORD`) et ne pas commiter de secrets.

### 5.3 Backend

- **pom.xml** : dépendances de test avec noms inhabituels (`spring-boot-starter-data-jpa-test`, `-security-test`, `-validation-test`, `-webmvc-test`) – à confirmer que ces artifacts existent pour Spring Boot 4 (ou adapter aux noms réels).
- **ProjetController** : `PUT` et `POST` sur `/{id}` pour la mise à jour – prévu pour compatibilité, à documenter ou uniformiser (par ex. PUT seul) à terme.

### 5.4 Frontend

- **authApi.getMe** : utilise `API_ENDPOINTS.AUTH.ME` = `/users/me`. Backend expose bien `GET /users/me`. Cohérent.
- **Mock / fallback** : selon `.env.example`, `VITE_USE_MOCK=false` et `VITE_USE_MOCK_FALLBACK=false` pour privilégier le backend. Comportement clair pour la suite.

---

## 6. Dépendances techniques (résumé)

**Backend** : Java 17, Kotlin 2.2.21, Spring Boot 4.0.2, spring-boot-starter-data-jpa, -security, -validation, -webmvc, -websocket, JWT (jjwt 0.12.5), springdoc-openapi, MySQL, Lombok.

**Frontend** : React 19, React Router 7, Redux Toolkit, React Query (TanStack), Axios, MUI, Tailwind, React Hook Form, Zod, Zustand, Recharts, socket.io-client, Vite 7, TypeScript 5.9.

---

## 7. Synthèse et recommandations pour la suite

- **Architecture** : backend modulaire par domaine (auth, user, projet, chantier, etc.) et frontend par features + API + store alignés ; bonne base pour faire évoluer le produit.
- **À faire en priorité** :  
  1) Vérifier/corriger les chemins publics du filtre JWT (contexte `/api`).  
  2) Aligner register : implémenter `POST /auth/register` ou retirer de la config sécurité.  
  3) Mettre à jour DEMARRAGE_RAPIDE.md (port frontend 5173).  
  4) Externaliser les secrets (JWT, BDD) et éviter les mots de passe en clair dans les YAML.
- **Cohérence globale** : routes, DTO/Response et types frontend (Projet, ProjetSummary, PageResponse, etc.) sont alignés ; pagination et erreurs sont gérées de façon homogène. En poursuivant le développement, s’appuyer sur `API_ENDPOINTS` et les mêmes patterns (controller → service → repository, api → slice) pour garder cette cohérence.

---

*Document produit après analyse exhaustive des fichiers backend (Kotlin, YAML, config) et frontend (TS/TSX, config, store, api, routes, composants).*
