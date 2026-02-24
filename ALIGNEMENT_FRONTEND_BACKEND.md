# Alignement Frontend / Backend — Mika Services

## Base URL et préfixe API

- **Backend** : `server.servlet.context-path: /api` (application.yml). Tous les contrôleurs sont donc exposés sous `/api` (ex. `GET /api/projets`, `POST /api/auth/login`).
- **Frontend** : `API_BASE_URL = '/api'` et `axios` utilise `baseURL: '/api'`. Les appels sont donc cohérents (ex. `GET /api/projets`).
- **Dev** : Le proxy Vite redirige `/api` vers `http://localhost:9090` **sans réécriture** : les requêtes gardent le préfixe `/api`, le backend (avec context-path `/api`) répond correctement.

## Endpoints principaux alignés

| Domaine        | Backend (Kotlin)                    | Frontend (constants/api.ts)        |
|----------------|-------------------------------------|------------------------------------|
| Auth           | POST /auth/login, /refresh, /logout | AUTH.LOGIN, REFRESH, LOGOUT        |
| Utilisateur    | GET /users/me                       | USERS.ME                           |
| Projets        | GET/POST/PUT/DELETE /projets        | PROJETS.BASE, BY_ID, SEARCH, etc.  |
| Points bloquants | GET /points-bloquants/projet/:id (Page) | POINTS_BLOQUANTS.BY_PROJET        |
| Prévisions     | GET /projets/:id/previsions         | PROJETS.PREVISIONS(id)             |
| Avancement études | GET/PUT /projets/:id/avancement-etudes | PROJETS.AVANCEMENT_ETUDES(id)   |
| Reporting      | GET /reporting/dashboard, /reporting/projet/:id | REPORTING.DASHBOARD, PROJET_REPORT |
| Clients        | GET /clients/search?nom=            | CLIENTS.SEARCH                     |

## Pagination (Spring Page)

- Le backend renvoie `Page<T>` (content, totalElements, totalPages, size, number, first, last).
- Le frontend utilise `PageResponse<T>` avec les mêmes champs (types/projet.ts, etc.) et envoie `page` et `size` (paramètres Spring par défaut).

## Types alignés

- **ProjetResponse** (backend) ↔ **Projet** (frontend) : champs alignés (montantHT, avancementGlobal, dates en string ISO, etc.).
- **ProjetUpdateRequest** : frontend inclut avancementPhysiquePct, avancementFinancierPct, delaiConsommePct, besoinsMateriel, besoinsHumain, observations comme le backend.
- **ProjetReportResponse** ↔ **ProjetReport** : budget, planning, qualite, securite, nbChantiers, nbSousProjets (types number pour Long/Double/BigDecimal sérialisés en JSON).
- **PointBloquantResponse**, **PrevisionResponse**, **ClientResponse**, **AvancementEtudeProjetResponse** : structures alignées avec les types frontend correspondants.

## Enums

- TypeProjet, StatutProjet, TypeClient, SourceFinancement, PhaseEtude, Priorite, StatutPointBloquant, TypePrevision, StatutPrevision : valeurs identiques entre backend (Kotlin enums) et frontend (types union string).

## Points d’attention

1. **countByStatut** : le backend renvoie `{ "count": Long }`, le frontend lit `response.data.count` (number).
2. **Auth** : AuthResponse (backend) contient accessToken, refreshToken, tokenType, expiresIn, user (UserResponse). Le frontend doit persister les tokens et utiliser le user pour l’état auth.
3. En **production**, le backend doit être déployé avec le même context-path `/api` ou derrière un reverse proxy qui préfixe les requêtes par `/api`.
