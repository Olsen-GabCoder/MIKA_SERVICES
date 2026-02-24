# PHASE 0 : CONFIGURATION ET INFRASTRUCTURE - PLAN DÉTAILLÉ

**Date** : 2026-02-07  
**Statut** : ⏳ En attente de validation

---

## 📊 ANALYSE DE L'EXISTANT

### Backend (Spring Boot + Kotlin)

#### ✅ Ce qui existe déjà :
- Structure de dossiers organisée :
  - `config/` (cache, database, security, storage, swagger, websocket)
  - `common/` (constants, dto, enums, exception, mapper, utils, validator)
  - `shared/` (audit, email, export, logging, sms)
  - `modules/` (16 modules avec structure controller/dto/entity/mapper/repository/service)
- Configuration YAML :
  - `application.yml` (base)
  - `application-dev.yml` (développement)
  - `application-staging.yml` (staging)
  - `application-prod.yml` (production)
- Dépendances installées :
  - Spring Boot 4.0.2
  - Spring Data JPA
  - Spring Security
  - Spring Validation
  - MySQL Driver
  - Kotlin 2.2.21
  - Lombok
  - Jackson Kotlin Module
- Configuration serveur :
  - Port : **9090** (configuré dans application.yml)
  - Context path : `/api`
  - Profil actif : `dev`

#### ❌ Ce qui manque :
- **Dépendances à ajouter** :
  - JWT (jjwt pour authentification)
  - Swagger/OpenAPI (documentation API)
  - WebSocket (Spring WebSocket pour temps réel)
- **Fichiers de configuration** :
  - Tous les dossiers `config/` sont vides
  - Tous les dossiers `common/` sont vides
  - Tous les dossiers `shared/` sont vides
- **Base entity** : Pas d'entité de base avec audit fields
- **Gestion d'erreurs** : Pas de handler global d'exceptions
- **Utilitaires** : Pas de mappers, validators, constants

### Frontend (React + TypeScript + Vite)

#### ✅ Ce qui existe déjà :
- Structure de base Vite
- Dépendances installées :
  - React 19.2.0
  - TypeScript 5.9.3
  - Material-UI
  - Tailwind CSS
  - React Router DOM
  - Redux Toolkit
  - TanStack React Query
  - Zustand
  - Axios
  - Socket.io-client
  - React Hook Form + Zod
- Configuration TypeScript stricte
- Tailwind CSS configuré

#### ❌ Ce qui manque :
- **Configuration Vite** :
  - Pas de proxy API configuré
  - Pas d'alias TypeScript `@/` configuré
- **Structure de dossiers** :
  - Pas d'organisation (features, components, services, etc.)
- **Configuration Axios** :
  - Pas d'instance Axios configurée
  - Pas d'intercepteurs (auth, erreurs)
- **Configuration Redux** :
  - Pas de store configuré
- **Configuration React Router** :
  - Pas de routes définies
- **Configuration Socket.io** :
  - Pas de client Socket.io configuré
- **Layout de base** :
  - Pas de Header, Sidebar, Footer
- **Composants UI de base** :
  - Pas de composants réutilisables

---

## 🎯 PLAN D'ACTION PHASE 0

### ÉTAPE 1 : Backend - Ajout des dépendances manquantes

**Fichier** : `backend/pom.xml`

**Dépendances à ajouter** :
1. **JWT** :
   ```xml
   <dependency>
       <groupId>io.jsonwebtoken</groupId>
       <artifactId>jjwt-api</artifactId>
       <version>0.12.5</version>
   </dependency>
   <dependency>
       <groupId>io.jsonwebtoken</groupId>
       <artifactId>jjwt-impl</artifactId>
       <version>0.12.5</version>
       <scope>runtime</scope>
   </dependency>
   <dependency>
       <groupId>io.jsonwebtoken</groupId>
       <artifactId>jjwt-jackson</artifactId>
       <version>0.12.5</version>
       <scope>runtime</scope>
   </dependency>
   ```

2. **Swagger/OpenAPI** :
   ```xml
   <dependency>
       <groupId>org.springdoc</groupId>
       <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
       <version>2.6.0</version>
   </dependency>
   ```

3. **WebSocket** :
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-websocket</artifactId>
   </dependency>
   ```

---

### ÉTAPE 2 : Backend - Configuration Security (JWT)

**Fichiers à créer** :

1. **`backend/src/main/kotlin/com/mikaservices/platform/config/security/SecurityConfig.kt`**
   - Configuration Spring Security
   - Désactivation CSRF pour API REST
   - Configuration CORS
   - Filtres JWT
   - Endpoints publics (login, register)

2. **`backend/src/main/kotlin/com/mikaservices/platform/config/security/JwtConfig.kt`**
   - Configuration JWT (secret, expiration)
   - Bean pour JwtTokenProvider

3. **`backend/src/main/kotlin/com/mikaservices/platform/config/security/JwtTokenProvider.kt`**
   - Génération de tokens
   - Validation de tokens
   - Extraction d'informations du token

4. **`backend/src/main/kotlin/com/mikaservices/platform/config/security/JwtAuthenticationFilter.kt`**
   - Filtre pour intercepter les requêtes
   - Extraction du token depuis le header
   - Validation et authentification

**Configuration YAML à ajouter** :
- Dans `application.yml` : propriétés JWT (secret, expiration)

---

### ÉTAPE 3 : Backend - Configuration CORS

**Fichier** : `backend/src/main/kotlin/com/mikaservices/platform/config/CorsConfig.kt`
- Configuration CORS globale
- Autorisation des origines frontend (localhost:3000)
- Méthodes HTTP autorisées
- Headers autorisés

---

### ÉTAPE 4 : Backend - Configuration Swagger/OpenAPI

**Fichier** : `backend/src/main/kotlin/com/mikaservices/platform/config/swagger/SwaggerConfig.kt`
- Configuration Swagger UI
- Informations API (titre, description, version)
- Configuration sécurité Swagger (JWT)
- Endpoint : `/api/swagger-ui.html`

---

### ÉTAPE 5 : Backend - Configuration WebSocket

**Fichier** : `backend/src/main/kotlin/com/mikaservices/platform/config/websocket/WebSocketConfig.kt`
- Configuration WebSocket
- Endpoint : `/ws`
- Configuration CORS pour WebSocket
- Handler et interceptor

---

### ÉTAPE 6 : Backend - Gestion d'erreurs globale

**Fichiers à créer** :

1. **`backend/src/main/kotlin/com/mikaservices/platform/common/exception/GlobalExceptionHandler.kt`**
   - Handler global avec `@ControllerAdvice`
   - Gestion des exceptions :
     - `EntityNotFoundException`
     - `ValidationException`
     - `AuthenticationException`
     - `AccessDeniedException`
     - Exceptions génériques

2. **`backend/src/main/kotlin/com/mikaservices/platform/common/exception/ApiError.kt`**
   - DTO pour les erreurs API
   - Structure standardisée (timestamp, status, error, message, path)

3. **`backend/src/main/kotlin/com/mikaservices/platform/common/exception/CustomExceptions.kt`**
   - Exceptions personnalisées :
     - `ResourceNotFoundException`
     - `BadRequestException`
     - `UnauthorizedException`
     - `ForbiddenException`
     - `ConflictException`

---

### ÉTAPE 7 : Backend - Base Entity (Audit)

**Fichier** : `backend/src/main/kotlin/com/mikaservices/platform/common/entity/BaseEntity.kt`
- Classe abstraite avec :
  - `id: Long?`
  - `createdAt: LocalDateTime`
  - `updatedAt: LocalDateTime`
  - `createdBy: String?`
  - `updatedBy: String?`
- Annotations JPA pour audit automatique

---

### ÉTAPE 8 : Backend - Utilitaires communs

**Fichiers à créer** :

1. **`backend/src/main/kotlin/com/mikaservices/platform/common/utils/DateUtils.kt`**
   - Utilitaires pour dates (formatage, parsing)

2. **`backend/src/main/kotlin/com/mikaservices/platform/common/utils/StringUtils.kt`**
   - Utilitaires pour strings (validation, transformation)

3. **`backend/src/main/kotlin/com/mikaservices/platform/common/constants/ApiConstants.kt`**
   - Constantes API (endpoints, messages d'erreur)

4. **`backend/src/main/kotlin/com/mikaservices/platform/common/constants/SecurityConstants.kt`**
   - Constantes sécurité (JWT header, prefix, etc.)

---

### ÉTAPE 9 : Backend - Configuration logging avancé

**Fichier** : `backend/src/main/kotlin/com/mikaservices/platform/shared/logging/LoggingConfig.kt`
- Configuration logging personnalisée
- Format de logs structuré
- Niveaux de log par package

**Configuration YAML** :
- Ajout dans `application.yml` : configuration logging avancée

---

### ÉTAPE 10 : Frontend - Configuration Vite (Proxy + Alias)

**Fichier** : `frontend_web/mika-services-frontend/vite.config.ts`
- Configuration proxy : `/api` → `http://localhost:9090/api`
- Configuration alias TypeScript : `@/` → `./src/`
- Configuration port : 3000

**Fichier** : `frontend_web/mika-services-frontend/tsconfig.json`
- Ajout de l'alias `@/*` dans `paths`

---

### ÉTAPE 11 : Frontend - Structure de dossiers

**Structure à créer** :
```
src/
├── api/              # Services API (Axios)
├── components/       # Composants réutilisables
│   ├── ui/          # Composants UI de base
│   └── layout/      # Composants layout
├── features/        # Features par module
├── hooks/           # Custom hooks
├── store/           # Redux store
│   ├── slices/      # Redux slices
│   └── store.ts     # Configuration store
├── services/        # Services (API, WebSocket)
├── types/           # Types TypeScript
├── utils/           # Utilitaires
├── constants/       # Constantes
└── App.tsx
```

---

### ÉTAPE 12 : Frontend - Configuration Axios

**Fichier** : `frontend_web/mika-services-frontend/src/api/axios.ts`
- Instance Axios configurée
- Base URL : `/api`
- Intercepteur request : Ajout token JWT
- Intercepteur response : Gestion erreurs globale
- Gestion refresh token

---

### ÉTAPE 13 : Frontend - Configuration Redux Store

**Fichier** : `frontend_web/mika-services-frontend/src/store/store.ts`
- Configuration Redux Toolkit store
- Middleware (thunk, logger en dev)
- Root reducer

---

### ÉTAPE 14 : Frontend - Configuration React Router

**Fichier** : `frontend_web/mika-services-frontend/src/router/Router.tsx`
- Configuration React Router
- Routes de base (Login, Dashboard placeholder)
- Protected routes (à implémenter après Phase 1)

---

### ÉTAPE 15 : Frontend - Configuration React Query

**Fichier** : `frontend_web/mika-services-frontend/src/services/queryClient.ts`
- Configuration TanStack React Query
- Options par défaut (retry, cache, etc.)

---

### ÉTAPE 16 : Frontend - Configuration Socket.io

**Fichier** : `frontend_web/mika-services-frontend/src/services/socket.ts`
- Client Socket.io configuré
- Connexion au serveur WebSocket
- Gestion reconnexion automatique

---

### ÉTAPE 17 : Frontend - Layout de base

**Fichiers à créer** :

1. **`frontend_web/mika-services-frontend/src/components/layout/Header.tsx`**
   - Header avec logo, navigation, profil utilisateur

2. **`frontend_web/mika-services-frontend/src/components/layout/Sidebar.tsx`**
   - Sidebar avec menu navigation

3. **`frontend_web/mika-services-frontend/src/components/layout/Footer.tsx`**
   - Footer

4. **`frontend_web/mika-services-frontend/src/components/layout/Layout.tsx`**
   - Layout principal combinant Header, Sidebar, Footer

---

### ÉTAPE 18 : Frontend - Composants UI de base

**Fichiers à créer** :

1. **`frontend_web/mika-services-frontend/src/components/ui/Button.tsx`**
   - Bouton réutilisable (variants, sizes)

2. **`frontend_web/mika-services-frontend/src/components/ui/Input.tsx`**
   - Input réutilisable (text, email, password, etc.)

3. **`frontend_web/mika-services-frontend/src/components/ui/Card.tsx`**
   - Card réutilisable

4. **`frontend_web/mika-services-frontend/src/components/ui/Modal.tsx`**
   - Modal réutilisable

5. **`frontend_web/mika-services-frontend/src/components/ui/Loading.tsx`**
   - Composant de chargement

6. **`frontend_web/mika-services-frontend/src/components/ui/Alert.tsx`**
   - Composant d'alerte (success, error, warning, info)

---

### ÉTAPE 19 : Frontend - Gestion des erreurs globale

**Fichier** : `frontend_web/mika-services-frontend/src/utils/errorHandler.ts`
- Handler d'erreurs global
- Transformation erreurs API en messages utilisateur
- Affichage notifications d'erreur

---

### ÉTAPE 20 : Frontend - Configuration Tailwind personnalisée

**Fichier** : `frontend_web/mika-services-frontend/tailwind.config.js`
- Thème personnalisé (couleurs MIKA SERVICES)
- Configuration responsive
- Extensions utilitaires

---

## 📋 CHECKLIST PHASE 0

### Backend
- [ ] Dépendances JWT ajoutées
- [ ] Dépendance Swagger ajoutée
- [ ] Dépendance WebSocket ajoutée
- [ ] SecurityConfig créé
- [ ] JwtConfig créé
- [ ] JwtTokenProvider créé
- [ ] JwtAuthenticationFilter créé
- [ ] CorsConfig créé
- [ ] SwaggerConfig créé
- [ ] WebSocketConfig créé
- [ ] GlobalExceptionHandler créé
- [ ] ApiError créé
- [ ] CustomExceptions créé
- [ ] BaseEntity créé
- [ ] Utilitaires communs créés
- [ ] Configuration logging avancée
- [ ] Application démarre sans erreur
- [ ] Swagger UI accessible
- [ ] CORS fonctionne

### Frontend
- [ ] Proxy API configuré dans Vite
- [ ] Alias TypeScript `@/` configuré
- [ ] Structure de dossiers créée
- [ ] Axios configuré avec intercepteurs
- [ ] Redux store configuré
- [ ] React Router configuré
- [ ] React Query configuré
- [ ] Socket.io configuré
- [ ] Layout de base créé (Header, Sidebar, Footer)
- [ ] Composants UI de base créés
- [ ] Gestion erreurs globale
- [ ] Tailwind personnalisé
- [ ] Application démarre sans erreur
- [ ] Proxy fonctionne

---

## ⚠️ QUESTIONS AVANT DÉMARRAGE

1. **Port backend** : Configuration indique 9090, mais instructions mentionnent 9092. Confirmer le port à utiliser ?

2. **JWT Secret** : Dois-je générer un secret aléatoire ou utiliser une variable d'environnement ?

3. **CORS** : Quelles sont les origines autorisées en production ? (localhost:3000 pour dev, mais production ?)

4. **WebSocket** : Quelles fonctionnalités doivent utiliser WebSocket en priorité ? (notifications, chat, mises à jour temps réel ?)

5. **Structure frontend** : Préférence pour l'organisation des features ? (feature-based ou type-based ?)

6. **Charte graphique** : J'ai vu des fichiers PNG de charte graphique. Dois-je les analyser pour appliquer les couleurs/thèmes ?

---

## 🎯 ORDRE D'EXÉCUTION PROPOSÉ

1. **Backend d'abord** (étapes 1-9)
2. **Frontend ensuite** (étapes 10-20)
3. **Tests de validation** (vérifier que tout fonctionne)

---

**STATUT** : ⏳ **EN ATTENTE DE VALIDATION**

*Une fois validé, je commencerai par l'étape 1 (ajout des dépendances backend).*
