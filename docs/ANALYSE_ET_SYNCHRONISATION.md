# Analyse et synchronisation Backend / Frontend — MIKA Services

## 1. Synthèse de l'analyse

### Backend (Spring Boot 4, Kotlin)
- **Stack** : Spring Boot 4.0.2, Kotlin, JPA, Security, JWT, MySQL.
- **Modules** : auth, user, role, projet, client, chantier (équipes), budget, planning, qualite, securite, document, reunionhebdo, fournisseur, materiel (materiaux, engins), reporting, communication.
- **Données initiales** : `DataInitializer` (profil `dev`/`staging`) créait uniquement permissions, rôles, admin et **un seul projet de démo**. Aucune donnée réaliste pour équipes, dépenses, tâches, points bloquants, etc.

### Frontend (Vite, React, TypeScript)
- **Emplacement** : `frontend_web/mika-services-frontend`.
- **API** : `src/api/*.ts` (projetApi, budgetApi, planningApi, chantierApi, qualiteApi, securiteApi, reportingApi, etc.) avec `baseURL: '/api'`.
- **Mock** : `src/config/mock.ts` — `VITE_USE_MOCK=true` → tout en mock ; `VITE_USE_MOCK_FALLBACK` → secours mock en cas d’échec backend.
- **Données factices** : `src/mock/data/*.ts` (projets, reporting, equipes, planning, qualite, securite, budget, communication, engins, materiaux, fournisseur). Les pages `ProjetDetailPage` et `ReportingPage` utilisaient en plus des imports directs de mocks.

### Problèmes identifiés
1. **Erreur 404 "Projet non trouvé avec l'ID: 1"** : le frontend ou un client appelait `GET /api/projets/1` alors qu’aucun projet avec cet ID n’existait en base (ou seed insuffisant).
2. **Données factices côté frontend** : `.env` avec `VITE_USE_MOCK=true` et `VITE_USE_MOCK_FALLBACK` actif masquait les erreurs backend et affichait des mocks.
3. **Pas de jeu de données cohérent en BDD** : un seul projet de démo, pas de clients, chefs de projet, dépenses, tâches, points bloquants, prévisions, contrôles qualité, incidents, risques, équipes, fournisseurs, matériaux, engins.

---

## 2. Corrections apportées

### 2.1 Backend — Seed de données réalistes

**Fichier** : `backend/src/main/kotlin/com/mikaservices/platform/config/database/SeedDataInitializer.kt`

- **Profil** : `dev`, `staging` (même que DataInitializer).
- **Ordre** : `@Order(Ordered.LOWEST_PRECEDENCE)` pour s’exécuter **après** DataInitializer (permissions, rôles, admin).
- **Condition** : ne s’exécute que si `projetRepository.count() == 0` (évite de recréer les données à chaque démarrage).

**Données créées** :
| Entité | Contenu |
|--------|--------|
| **Clients** | 5 clients (MTP, Ville de Libreville, État gabonais, Région Ogooué-Maritime, GSEZ). |
| **Chefs de projet** | 3 utilisateurs (CP001 Jean Mbenda, CP002 Marie Okoué, CP003 Paul Mba) avec rôle CHEF_PROJET, mot de passe `Chef@2024`. |
| **Projets** | 5 projets (RN1, Assainissement Akébé, Pont Komo, Voirie Port-Gentil, Terrassement GSEZ) avec client et responsable. |
| **Projet id=1** | Si absent, insertion SQL pour garantir un projet avec id=1. |
| **Dépenses** | 3 dépenses par projet (main d’œuvre, matériaux, carburant) pour les 3 premiers projets. |
| **Tâches** | 3 tâches par projet (étude géotechnique, terrassement, pose réseaux) pour les 3 premiers projets. |
| **Points bloquants** | 2 points par projet pour les 2 premiers projets. |
| **Prévisions** | 3 prévisions par projet (hebdo, mensuelle, trimestrielle) pour les 3 premiers projets. |
| **Contrôles qualité** | 2 contrôles par projet pour les 2 premiers projets. |
| **Incidents** | 2 incidents sur le premier projet. |
| **Risques** | 2 risques par projet pour les 2 premiers projets. |
| **Équipes** | 3 équipes (terrassement Nord, voirie Axe 1, polyvalente) avec chefs. |
| **Fournisseurs** | 3 fournisseurs. |
| **Matériaux** | 5 matériaux (ciment, sable, gravier, fer à béton, enrobé). |
| **Engins** | 5 engins (niveleuse, compacteur, pelleteuse, camion benne, bétonnière). |

**DataInitializer** : suppression de la création du projet de démo et des dépendances `ProjetRepository` et `JdbcTemplate` ; seuls permissions, rôles et utilisateur admin restent.

### 2.2 Frontend — Connexion au backend uniquement

**Fichiers modifiés** :

1. **`.env`**  
   - `VITE_USE_MOCK=false`  
   - `VITE_USE_MOCK_FALLBACK=false`  
   → Toutes les données viennent du backend ; plus de secours mock.

2. **`.env.example`**  
   - Mise à jour pour refléter le mode “backend uniquement” et la désactivation du fallback mock.

3. **`src/features/projet/pages/ProjetDetailPage.tsx`**  
   - Suppression des imports `getMockPointsBloquants`, `getMockPrevisions`, `getMockProjetReport`.  
   - Suppression du branchement `_fromMock` : chargement des points bloquants, prévisions et rapport projet **uniquement** via `pointBloquantApi`, `projetApi.getPrevisions`, `reportingApi.getProjetReport`.

4. **`src/features/reporting/pages/ReportingPage.tsx`**  
   - Suppression de l’import `mockEvolutionMensuelle`.  
   - `evolutionData` = données d’évolution du dashboard si présentes, sinon tableau vide (en attente d’un éventuel endpoint type `GET /reporting/evolution-mensuelle`).

---

## 3. Utilisation

### Backend
1. Démarrer avec le profil **dev** : `spring.profiles.active=dev` (déjà dans `application.yml`).
2. Au premier démarrage (base vide), **SeedDataInitializer** crée tout le jeu de données.
3. Connexion MySQL : `application-dev.yml` (url, user, password).

### Frontend
1. Vérifier que `.env` contient `VITE_USE_MOCK=false` et `VITE_USE_MOCK_FALLBACK=false`.
2. Démarrer le frontend (ex. `npm run dev`) avec un proxy vers le backend (ex. `http://localhost:9090/api` selon votre config).
3. Connexion : **admin** `admin@mikaservices.com` / `Admin@2024` ; **chefs de projet** `jean.mbenda@mikaservices.com`, etc. / `Chef@2024`.

### Réinitialiser les données
- En dev : supprimer ou recréer la base (ex. `mika_services_dev`) puis redémarrer le backend pour relancer le seed (si `projetRepository.count() == 0`).

---

## 4. Architecture synchronisée

- **Backend** : une seule source de vérité (MySQL) ; seed cohérent en dev/staging.
- **Frontend** : plus d’usage direct des mocks pour les écrans métier ; tout passe par les API.
- Les **mocks** restent dans `src/mock/data/` pour des tests ou pour réactiver temporairement `VITE_USE_MOCK=true` si besoin.

---

## 5. Pistes d’évolution

- Exposer un endpoint **évolution mensuelle** (ex. `GET /reporting/evolution-mensuelle`) et l’utiliser dans `ReportingPage` pour remplir `evolutionData`.
- Ajouter des **tests d’intégration** sur les endpoints principaux avec le jeu de données seed.
- Documenter ou centraliser les **comptes de test** (admin, chefs de projet) dans un fichier dédié (ex. `docs/COMPTES_DEV.md`).
