# QSHE Module — Phase 2 : Etat des lieux du projet existant

**Projet** : MIKA Services
**Date** : 2026-04-21
**Objectif** : Inventaire complet de l'existant avant conception du module QSHE

---

## 1. Etat actuel du module QSHE dans MIKA

### Constat principal : le QSHE n'est PAS une coquille vide

Contrairement a l'hypothese initiale, MIKA possede deja **deux modules fonctionnels** couvrant partiellement le perimetre QSHE :

### 1.1 Module Securite (S)

**Backend** : `backend/src/main/kotlin/com/mikaservices/platform/modules/securite/`
**Frontend** : `frontend_web/mika-services-frontend/src/features/securite/`

#### Entities implementees

**Incident** (`securite/entity/Incident.kt`)
- reference (auto-generee INC-00001), titre, description
- typeIncident : `ACCIDENT_TRAVAIL, PRESQU_ACCIDENT, INCIDENT_MATERIEL, INCIDENT_ENVIRONNEMENTAL, CHUTE, ELECTROCUTION, EFFONDREMENT, INCENDIE, AUTRE`
- gravite : `BENIN, LEGER, GRAVE, TRES_GRAVE, MORTEL`
- statut : `DECLARE, EN_INVESTIGATION, ANALYSE, ACTIONS_EN_COURS, CLOTURE`
- dateIncident, heureIncident, lieu
- declarePar (ManyToOne User)
- nbBlesses, arretTravail (boolean), nbJoursArret
- causeIdentifiee, mesuresImmediates, analyseCause
- Relation : ManyToOne Projet, OneToMany ActionPrevention

**ActionPrevention** (`securite/entity/ActionPrevention.kt`)
- titre, description
- statut : `PLANIFIEE, EN_COURS, REALISEE, VERIFIEE, ANNULEE`
- dateEcheance, dateRealisation, commentaireVerification
- Relation : ManyToOne Incident (optionnel), ManyToOne User (responsable)

**Risque** (`securite/entity/Risque.kt`)
- titre, description
- niveau : `FAIBLE, MOYEN, ELEVE, CRITIQUE`
- probabilite, impact (echelle 0-100)
- zoneConcernee, mesuresPrevention, actif (boolean)
- Relation : ManyToOne Projet

#### Endpoints (SecuriteController — base `/securite`)

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/incidents` | Creer un incident |
| GET | `/incidents` | Lister tous les incidents |
| GET | `/incidents/{id}` | Detail d'un incident |
| PUT | `/incidents/{id}` | Modifier un incident |
| DELETE | `/incidents/{id}` | Supprimer |
| GET | `/incidents/projet/{projetId}` | Incidents par projet |
| POST | `/risques` | Creer un risque |
| GET | `/risques/projet/{projetId}` | Risques par projet |
| PUT | `/risques/{id}` | Modifier un risque |
| DELETE | `/risques/{id}` | Supprimer |
| POST | `/actions` | Creer une action prevention |
| GET | `/actions/incident/{incidentId}` | Actions par incident |
| GET | `/actions/en-retard` | Actions en retard |
| PUT | `/actions/{id}` | Modifier |
| DELETE | `/actions/{id}` | Supprimer |
| GET | `/summary/projet/{projetId}` | KPIs securite du projet |

#### KPIs fournis par `getSecuriteSummary()`

totalIncidents, incidentsGraves, totalJoursArret, risquesActifs, risquesCritiques, actionsEnRetard

#### Frontend SecuritePage

- Dashboard avec KPI cards (total incidents, incidents graves, risques critiques, jours d'arret)
- Interface tabulee : onglets Incidents | Risques
- Selecteur de projet
- CRUD complet par modales
- Badges de statut colores
- Redux slice : `securiteSlice.ts`
- API : `securiteApi.ts` avec fallback mock
- Types : `securite.ts`
- i18n : `fr/securite.json` + `en/securite.json` (complets)

---

### 1.2 Module Qualite (Q)

**Backend** : `backend/src/main/kotlin/com/mikaservices/platform/modules/qualite/`
**Frontend** : `frontend_web/mika-services-frontend/src/features/qualite/`

#### Entities implementees

**ControleQualite** (`qualite/entity/ControleQualite.kt`)
- reference (auto-generee CQ-[TYPE]-0001), titre, description
- typeControle : `RECEPTION_MATERIAUX, EN_COURS_EXECUTION, OUVRAGE_TERMINE, SECURITE, ENVIRONNEMENTAL, DOCUMENTAIRE, AUDIT_INTERNE, AUDIT_EXTERNE`
- statut : `PLANIFIE, EN_COURS, CONFORME, NON_CONFORME, ANNULE`
- inspecteur (ManyToOne User)
- datePlanifiee, dateRealisation
- zoneControlee, criteresVerification, observations, noteGlobale (0-100)
- Relation : ManyToOne Projet, OneToMany NonConformite

**NonConformite** (`qualite/entity/NonConformite.kt`)
- reference (auto-generee NC-00001), titre, description
- gravite : `MINEURE, MAJEURE, CRITIQUE, BLOQUANTE`
- statut : `OUVERTE, EN_TRAITEMENT, ACTION_CORRECTIVE, VERIFIEE, CLOTUREE`
- responsableTraitement (ManyToOne User)
- causeIdentifiee, actionCorrective
- dateDetection, dateEcheanceCorrection, dateCloture
- preuveCorrection (texte)
- Relation : ManyToOne ControleQualite

#### Endpoints (QualiteController — base `/qualite`)

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/controles` | Creer un controle |
| GET | `/controles` | Lister |
| GET | `/controles/{id}` | Detail |
| PUT | `/controles/{id}` | Modifier |
| DELETE | `/controles/{id}` | Supprimer |
| GET | `/controles/projet/{projetId}` | Controles par projet |
| POST | `/non-conformites` | Creer une NC |
| GET | `/non-conformites/{id}` | Detail |
| PUT | `/non-conformites/{id}` | Modifier |
| DELETE | `/non-conformites/{id}` | Supprimer |
| GET | `/non-conformites/controle/{controleId}` | NC par controle |
| GET | `/non-conformites/en-retard` | NC en retard |
| GET | `/summary/projet/{projetId}` | KPIs qualite du projet |

#### KPIs fournis par `getQualiteSummary()`

totalControles, controlesConformes, controlesNonConformes, ncOuvertes, ncParGravite, tauxConformite (%)

#### Frontend QualitePage

- Dashboard avec KPI cards + taux de conformite
- Selecteur de projet
- Alerte NC en retard (banniere rouge)
- Filtres par statut
- Liste paginee des controles
- CRUD par modales
- Badges colores par statut/gravite
- Redux slice : `qualiteSlice.ts`
- API : `qualiteApi.ts` avec fallback mock
- Types : `qualite.ts`
- i18n : `fr/qualite.json` + `en/qualite.json` (complets)

---

### 1.3 Ce qui n'existe PAS encore

Par rapport au perimetre Phase 1, voici ce qui manque :

| Processus QSHE | Existe ? | Detail |
|-----------------|----------|--------|
| Incidents / AT | **Oui, partiel** | Pas de workflow declaration CNSS 48h, pas de body map, pas d'investigation structuree (arbre des causes, Ishikawa, 5P), pas de presqu'accident anonyme |
| Risques / EvRP | **Oui, basique** | Matrice probabilite x impact existe, mais pas de DUER/DUERP structure par unite de travail, pas de hierarchie des mesures de controle |
| Non-conformites qualite | **Oui, basique** | Workflow NC existe, mais pas de reserves/punchlist, pas de cout de reprise, pas de localisation sur plan |
| Causeries securite | Non | Rien |
| Inspections / audits (checklists) | Non | TypeControle existe mais pas de checklist configurable |
| Plans de prevention / PPSPS | Non | Rien |
| Gestion des EPI | Non | Rien |
| Habilitations / formations | Non | Rien |
| FDS (fiches de donnees de securite) | Non | Rien |
| Suivi environnemental | Non | TypeIncident.INCIDENT_ENVIRONNEMENTAL existe mais pas de module dedie (dechets, rejets, biodiversite, PGES) |
| Permis de travail | Non | Rien |
| KPIs QSHE (TF, TG) | Non | Summary basique existe, mais pas de calcul TF/TG, pas d'heures travaillees, pas de compteur sans AT |
| Reporting QSHE | Non | Pas de rapports mensuels, pas de templates CNSS/client |
| Roles QSHE specifiques | Non | Pas de RESPONSABLE_QSHE dans les roles systeme (mais voir module Chantier ci-dessous) |

---

## 2. Modules adjacents — Points d'integration

### 2.1 Projet

**Backend** : `modules/projet/`

**Entity Projet — champs exploitables par QSHE :**
- `codeProjet`, `nom` — identification
- `province`, `ville`, `quartier`, `adresse`, `latitude`, `longitude` — geolocalisation des evenements QSHE
- `nombreOuvriersPrevu` — base de calcul pour TF/TG
- `horaireTravail` — calcul des heures travaillees
- `responsableProjet` (User) — destinataire des escalades
- `statut` — filtrer les projets actifs
- `client` — pour le reporting client-specific

**Entity SousProjet :**
- `code`, `nom`, `typeTravaux`, `statut`
- `responsable` (User)
- `avancementPhysique`
- Permet le rattachement QSHE a un sous-projet/chantier specifique

**Integration naturelle :** tout evenement QSHE est rattache a un Projet (FK existante dans Incident et ControleQualite). Ajouter le rattachement optionnel a un SousProjet pour la granularite fine.

---

### 2.2 Chantier (decouverte importante)

**Backend** : `modules/chantier/`

**Entities :**

**Equipe** : code, nom, type (TypeEquipe), chefEquipe (User), effectif, actif

**MembreEquipe** : equipe, user, **role** (RoleDansEquipe), dateAffectation, dateFin, actif

**RoleDansEquipe (enum) :**
```
CHEF, RESPONSABLE_SECURITE, RESPONSABLE_QUALITE, RESPONSABLE_ENVIRONNEMENT,
AGENT, OPERATEUR, APPRENTI
```

**Impact majeur :** les roles QSHE existent deja au niveau equipe de chantier (`RESPONSABLE_SECURITE`, `RESPONSABLE_QUALITE`, `RESPONSABLE_ENVIRONNEMENT`). C'est le point d'ancrage naturel pour identifier qui est responsable QSHE sur un chantier.

**Autres entities :** AffectationChantier, InstallationChantier, ZoneChantier — permettent de localiser les evenements QSHE par zone.

---

### 2.3 Utilisateur

**Backend** : `modules/user/`

**Entity User — champs exploitables :**
- matricule, nom, prenom, email, telephone
- typeContrat, dateEmbauche, niveauExperience — pertinent pour le suivi formations/habilitations
- superieurHierarchique (User) — chaine d'escalade
- roles (ManyToMany) — controle d'acces
- departements, specialites — classification
- emailNotificationsEnabled, dailyDigestEnabled — preferences de notification

**Entity Role :**
- code, nom, description
- niveau : `DIRECTION, CADRE_SUPERIEUR, CADRE_MOYEN, AGENT_MAITRISE, EMPLOYE`
- permissions (ManyToMany Permission)

**Entity Permission :**
- code, nom, module, description
- type : `CREATE, READ, UPDATE, DELETE, VALIDATE, EXPORT, ADMIN`

**Integration :** le systeme de permissions par module est deja en place. Il faudra creer les permissions QSHE (ex: `QSHE_INCIDENT_CREATE`, `QSHE_INSPECTION_VALIDATE`, etc.) et les associer aux roles existants ou a de nouveaux roles.

---

### 2.4 Module IA

**Backend** : `modules/ia/`

**Architecture :**
- `AnthropicClientService` : client HTTP pour l'API Claude (claude-sonnet-4-5-20250929)
- Pattern **tool_use** pour l'extraction structuree de donnees
- Retry avec backoff exponentiel (max 3 tentatives)
- `AnalyseRapportLog` : entity d'audit (projetId, userId, modele, tokens, duree, succes, hash SHA256 du rapport)
- Config via `AnthropicProperties` (api-key, model, max-tokens, timeout, retries)

**Reutilisation pour QSHE :**
- Analyse NLP des rapports d'incident (extraction de causes, classification de gravite)
- Analyse des rapports d'inspection (detection de patterns recurrents)
- Assistance a l'investigation des causes racines (arbre des causes conversationnel)
- Generation de rapports QSHE mensuels
- Le pattern tool_use est directement reutilisable pour extraire des donnees structurees de rapports QSHE

**Point d'attention :** le chatbot Drawer frontend (`ProjetChatbotDrawer`) est specifique au module Projet. Il pourrait etre generalise en composant reutilisable pour un assistant QSHE.

---

### 2.5 Communication / Notifications

**Backend** : `modules/communication/`

**Entity Notification :**
- destinataire (User), titre, contenu, lien
- typeNotification : inclut deja `INCIDENT`, `NON_CONFORMITE`, `ECHEANCE`
- lu, dateCreation, dateLecture

**Types de notification deja prevus pour QSHE :**
```
INCIDENT, NON_CONFORMITE, ECHEANCE
```

**Endpoints cles :**
- `POST /notifications` — creer une notification
- `GET /notifications/mes-notifications/{userId}` — mes notifications
- `GET /notifications/non-lues/{userId}` — non lues
- `PUT /notifications/{notificationId}/lu/{userId}` — marquer comme lu
- `GET /notifications/count/{userId}` — compteur non lues

**Integration :** le systeme de notification est pret a l'emploi. Il suffit d'emettre des notifications de type INCIDENT/NON_CONFORMITE/ECHEANCE depuis les services QSHE. Les TypeNotification existants couvrent les cas principaux ; ajouter si besoin : `PERMIS_TRAVAIL`, `CAUSERIE`, `INSPECTION`, `FORMATION_EXPIRATION`, `EPI_EXPIRATION`.

---

### 2.6 Document / Upload

**Backend** : `modules/document/`

**Entity Document :**
- nomFichier, nomOriginal, cheminStockage, typeMime, tailleOctets
- typeDocument : `RAPPORT_CHANTIER, PHOTO, PLAN, DEVIS, FACTURE, CONTRAT, CERTIFICAT, AUTRE`
- projet (ManyToOne, optionnel), uploadePar (User)

**Stockage** : systeme de fichiers local (`uploads/`), noms UUID, max 50MB par fichier.

**Endpoints :**
- `POST /documents` — upload
- `GET /documents/{id}/download` — telecharger
- `GET /documents/projet/{projetId}` — documents du projet

**Integration pour QSHE :**
- Photos d'incidents (preuves)
- Photos d'inspections (avant/apres)
- Scans de certificats/habilitations
- FDS (fiches de donnees de securite) en PDF
- Rapports PGES
- Preuves de correction des NC (photo)

**A ajouter :** TypeDocument supplementaires : `PHOTO_INCIDENT`, `PHOTO_INSPECTION`, `CERTIFICAT_HABILITATION`, `FDS`, `RAPPORT_QSHE`, `PREUVE_CORRECTION`.

---

### 2.7 Planning

**Backend** : `modules/planning/`

**Entity Tache :**
- projet (Projet), titre, description
- statut : `A_FAIRE, EN_COURS, BLOQUEE, TERMINEE, ANNULEE`
- priorite : `BASSE, NORMALE, HAUTE, CRITIQUE`
- assigneA (User), dateDebut, dateFin, dateEcheance
- pourcentageAvancement, tacheParent (self-referential)

**Integration :** les actions correctives QSHE pourraient etre creees comme des Tache du module Planning pour la tracabilite transversale. A evaluer si on prefere un module CAPA autonome ou une integration avec Planning.

---

## 3. Composants UI existants reutilisables

### 3.1 Composants generiques

| Composant | Fichier | Props cles | Reutilisable pour QSHE |
|-----------|---------|-----------|----------------------|
| **Modal** | `components/ui/Modal.tsx` | isOpen, onClose, title, children, footer, size (sm-2xl) | Oui — formulaires QSHE, details d'incidents |
| **ConfirmDialog** | `components/ui/ConfirmDialog.tsx` | open, title, message, variant (primary/danger) | Oui — confirmation de suppression, cloture |
| **Button** | `components/ui/Button.tsx` | variant (primary/secondary/success/danger/outline), size, isLoading | Oui |
| **Input** | `components/ui/Input.tsx` | label, error, forwarded ref | Oui |
| **Card** | `components/ui/Card.tsx` | title, subtitle, headerActions | Oui — KPI cards |
| **Alert** | `components/ui/Alert.tsx` | type (success/error/warning/info), title, onClose | Oui — alertes NC en retard, formations expirees |
| **Loading** | `components/ui/Loading.tsx` | size (sm/md/lg) | Oui |

### 3.2 Composants complexes reutilisables

| Composant | Fichier | Usage actuel | Reutilisation QSHE |
|-----------|---------|-------------|-------------------|
| **ProjetChatbotDrawer** | `features/projet/components/ProjetChatbotDrawer.tsx` | Assistant IA pour analyse de rapports projet | Generalisable en assistant QSHE (analyse d'incidents, aide a l'investigation, chatbot reglementaire) |
| **RapportValidationModal** | `features/projet/components/RapportValidationModal.tsx` | Validation de donnees extraites par IA | Reutilisable pour validation de rapports QSHE extraits par IA |
| **FleetDonutChart** | `features/materiel/components/FleetDonutChart.tsx` | Graphique donut statut parc materiel | Pattern reutilisable pour graphiques KPI QSHE (repartition NC par gravite, incidents par type) |

### 3.3 Patterns de page existants

Le pattern recurrent des pages Securite et Qualite est directement extensible :
- Header avec selecteur de projet
- Barre de KPI cards
- Filtres par statut
- Liste/tableau avec pagination
- Actions CRUD via modales
- Badges colores par statut/gravite

### 3.4 Bibliotheques UI

| Bibliotheque | Usage |
|-------------|-------|
| **recharts** | Graphiques (PieChart, etc.) — utilise dans FleetDonutChart |
| **react-hook-form** | Formulaires avec validation |
| **@react-pdf/renderer** | Generation PDF |
| **docx** | Export Word |
| **xlsx** | Export Excel |
| **Socket.io** | Temps reel (notifications) |

### 3.5 Systeme d'icones

Pas de bibliotheque d'icones formelle identifiee (pas de MUI Icons, Lucide, Heroicons). Les icones sont referencees dans la sidebar config (`ShieldIcon`, `CheckIcon`, etc.). A verifier le systeme exact (SVG inline probable).

---

## 4. Conventions du projet a respecter

### 4.1 Backend

**Packaging :**
```
modules/<nom>/
  entity/          # JPA entities (extends BaseEntity)
  repository/      # JPA repositories (Spring Data)
  service/         # @Service @Transactional
  controller/      # @RestController
  dto/             # Data classes (request/response)
  mapper/          # Object mapper (pas MapStruct)
  scheduler/       # @Scheduled (si applicable)
  config/          # Config specifique au module
```

**Entity :**
- Extends `BaseEntity` (id Long auto-increment, createdAt, updatedAt, createdBy, updatedBy)
- `@Enumerated(EnumType.STRING)` pour les enums
- `fetch = FetchType.LAZY` sur les relations
- Indexes sur les colonnes de filtre (FK, statut, etc.)
- Pas de soft delete generique — champ `actif` par entity si besoin

**Controller :**
- Contexte : `/api` (global prefix dans application.yml)
- Routes : kebab-case, pluriel (`/securite/incidents`, `/qualite/controles`)
- CRUD : POST (create, 201), GET (list/detail, 200), PUT (update, 200), DELETE (200/204)
- Pagination : Spring `Pageable`, `@PageableDefault(size = 20)`
- Validation : `@Valid` sur les request bodies

**Service :**
- `@Transactional` au niveau classe
- `@Transactional(readOnly = true)` pour les queries
- References auto-generees (INC-00001, CQ-TYPE-0001, NC-00001)
- Validation metier avant operations DB
- Exceptions via `ResourceNotFoundException`, `BadRequestException`, `ConflictException`
- Logger SLF4J

**DTOs :**
- CreateRequest : champs obligatoires avec `@NotBlank`, `@Size`, etc.
- UpdateRequest : tous les champs nullable (partial update)
- Response : data class aplatie, pas d'objets imbriques

**Exceptions :**
```kotlin
ResourceNotFoundException(message)    // 404
BadRequestException(message)          // 400
ConflictException(message)           // 409
UnauthorizedException(message)       // 401
ForbiddenException(message)          // 403
ValidationException(message, errors) // 400 + detail champs
```
Reponse : `ApiError(timestamp, status, error, message, path, details)`

### 4.2 Frontend

**Structure :**
```
src/features/<module>/
  pages/           # Pages principales
  components/      # Composants specifiques au module
src/api/           # Clients API (apiClient axios)
src/types/         # Interfaces TypeScript
src/store/slices/  # Redux slices
src/locales/fr/    # Traductions FR
src/locales/en/    # Traductions EN
src/constants/api.ts # Endpoints centralises
```

**State management :** Redux Toolkit (slices), **PAS** TanStack Query

**API client :**
- Axios avec base URL `VITE_API_BASE_URL ?? '/api'`
- Timeout 15s
- JWT Bearer dans Authorization header
- Retry : 2 tentatives avec backoff exponentiel (800ms)
- Refresh token automatique sur 401
- Cache de reponse GET en intercepteur
- Fallback mock si `USE_MOCK` active

**Routing :**
- React Router v6+ avec `createBrowserRouter`
- Routes lazy-loaded avec `React.lazy()` + `Suspense`
- `ProtectedRoute` pour l'auth (requireAuth, requireAdmin)

**Theme :**
- Tailwind CSS + variables CSS custom
- Dark/light via attribut `data-theme="dark"` sur `<html>`
- Classes `mika-theme-card`, `mika-theme-bg`
- Couleur primaire : `#FF6B35` (orange)
- Palette status : success `#6BBF59`, warning `#F4A261`, danger `#E63946`, info `#17A2B8`

**i18n :**
- i18next, namespace par module
- Stockage locale : localStorage `mika-locale`
- Default : francais (fr)

**Conventions de nommage :**
- Composants : PascalCase (`SecuritePage.tsx`)
- Fichiers API : camelCase (`securiteApi.ts`)
- Types : camelCase (`securite.ts`)
- Slices : camelCase (`securiteSlice.ts`)
- i18n keys : dot notation (`securite.incidents.titre`)

### 4.3 Roles existants et securite

**Roles systeme :**
- Les roles sont dynamiques (entite Role avec permissions), pas des enums hardcodes
- `NiveauHierarchique` : DIRECTION, CADRE_SUPERIEUR, CADRE_MOYEN, AGENT_MAITRISE, EMPLOYE
- Auth : JWT (HS256, JJWT 0.12.5), refresh tokens, 2FA TOTP

**Roles equipe (module Chantier) :**
- `RoleDansEquipe` : CHEF, RESPONSABLE_SECURITE, RESPONSABLE_QUALITE, RESPONSABLE_ENVIRONNEMENT, AGENT, OPERATEUR, APPRENTI

**Roles QSHE a creer :** a definir en Phase 3, mais les candidats naturels sont :
- Niveau systeme : `RESPONSABLE_QSHE` (acces full QSHE), `INSPECTEUR_QSHE` (inspections/audits), `AGENT_TERRAIN` (signalements simplifies)
- Les roles equipe `RESPONSABLE_SECURITE/QUALITE/ENVIRONNEMENT` sont deja en place comme roles de chantier

---

## 5. Considerations specifiques Phase 1 — verification dans l'existant

### 5.1 Offline-first

**Etat actuel :** des briques offline existent dans le frontend :

| Utilitaire | Fichier | Description |
|-----------|---------|-------------|
| `offlineCache.ts` | `src/utils/offlineCache.ts` | Cache des donnees utilisateur pour mode offline |
| `offlineAuth.ts` | `src/utils/offlineAuth.ts` | Verification des credentials en mode offline |
| `offlineQueue.ts` | `src/utils/offlineQueue.ts` | File d'attente des requetes quand offline |
| `offlineQueueMiddleware` | Redux middleware | Intercepte les actions quand offline et les met en queue |
| `responseCache.ts` | `src/utils/responseCache.ts` | Cache des reponses HTTP GET |

**Verdict :** les fondations d'une strategie offline existent (cache, queue, middleware). Mais c'est du caching opportuniste, **pas une architecture offline-first**. Il n'y a pas de :
- Service Worker
- IndexedDB / PouchDB pour stockage structure
- Synchronisation bidirectionnelle
- Gestion de conflits
- Indicateur UX de statut online/offline
- Cache des templates/checklists pour usage offline

**Impact QSHE :** l'offline-first est identifie en Phase 1 comme le facteur differentiant #1. L'infrastructure actuelle est un point de depart mais necessite un investissement significatif pour supporter le vrai offline (jours sans internet sur chantier forestier gabonais). C'est un **chantier technique transversal** qui depasse le scope QSHE strict.

### 5.2 SMS / WhatsApp

**Etat actuel : AUCUNE integration SMS ou WhatsApp.**

Le projet utilise :
- Email (EmailService avec Brevo/Resend/SMTP)
- Notifications in-app (module Communication)
- WebSocket/STOMP pour le temps reel

**Impact QSHE :** le fallback SMS/WhatsApp est identifie en Phase 1 comme critique pour le Gabon. C'est un **chantier d'infrastructure a planifier** (integration Africa's Talking ou Twilio, WhatsApp Business API).

### 5.3 Mobile responsive

**Etat actuel :** le frontend utilise les breakpoints Tailwind (sm/md/lg) et a une sidebar responsive (collapse 16rem → 4rem). Le pattern est **desktop-first avec adaptations responsives**, pas mobile-first.

**Details :**
- Sidebar : collapsable avec menu hamburger mobile
- Container padding : responsive (`p-3 sm:p-4 md:p-6 lg:p-8`)
- Tableaux : pas de pattern de table responsive identifie (pas de card view mobile)
- Formulaires : pas de layout mobile-specific

**Impact QSHE :** pour les travailleurs de terrain (usage majoritaire sur smartphone), il faudra soit :
- (a) Rendre les pages QSHE veritablement mobile-first dans le web existant
- (b) Creer une PWA dediee terrain (scope beaucoup plus large)
- Decision a prendre en Phase 3.

### 5.4 Stockage fichiers / photos

**Etat actuel :**
- Stockage local filesystem (`uploads/`)
- Noms UUID (ex: `550e8400-e29b-41d4-a716-446655440000.pdf`)
- Limite : 50MB par fichier
- Pas de cloud storage (S3, GCS)
- Entity `Document` avec metadata (nom, mime, taille, type, projet, uploader)

**Impact QSHE :** le volume de photos sera important (photos d'incidents, inspections, avant/apres NC, EPI). Le stockage local fonctionne en dev mais posera des problemes en production sur Render (stockage ephemere). Il faudra probablement migrer vers un stockage cloud (S3 compatible ou Cloudinary pour les images).

**Note :** ce probleme est general au projet, pas specifique a QSHE, mais QSHE l'accentuera significativement.

---

## Bilan final

### Ce qui est pret a etre reutilise (reduit le scope)

1. **Module Securite existant** : entites Incident, Risque, ActionPrevention avec CRUD complet, endpoints, frontend, i18n — a enrichir plutot qu'a recreer
2. **Module Qualite existant** : entites ControleQualite, NonConformite avec CRUD complet, endpoints, frontend, i18n — a enrichir
3. **Systeme de notifications** : types INCIDENT, NON_CONFORMITE, ECHEANCE deja prevus
4. **Module Document** : upload/download pret a l'emploi
5. **Module Chantier** : roles RESPONSABLE_SECURITE/QUALITE/ENVIRONNEMENT en place
6. **Module IA** : AnthropicClientService + pattern tool_use reutilisable pour analyse QSHE
7. **Composants UI** : Modal, ConfirmDialog, Card, Alert, Button, Input, Loading
8. **Pattern de page** : le pattern Securite/Qualite (dashboard KPIs + tabs + CRUD modales) est directement extensible
9. **Conventions** : packaging backend, patterns controller/service/entity, i18n, routing — tout est documente et coherent
10. **Utilitaires offline** : cache, queue, middleware — base a etendre

### Ce qui manque et qu'il faudra construire

**Nouveaux sous-modules QSHE :**
1. Causeries securite (toolbox talks) — entity + CRUD + calendrier + presence
2. Inspections avec checklists configurables — entity checklist template + instances + items
3. Permis de travail — entity + workflow d'approbation + timer de validite
4. Gestion des EPI — entity inventaire + affectation + expiration + QR codes
5. Habilitations / formations — entity certificat + matrice de formation + alertes expiration
6. FDS (fiches de donnees de securite) — entity produit chimique + upload FDS + alerte obsolescence
7. Suivi environnemental — dechets (BSD), mesures, biodiversite, PGES
8. KPIs QSHE avances — TF, TG, heures travaillees, compteur sans AT, indicateurs avances
9. Reporting QSHE — templates de rapports mensuels/trimestriels, generation PDF, reporting client
10. Investigation d'incidents structuree — arbre des causes, 5 Pourquoi, Ishikawa

**Enrichissements des modules existants :**
1. Incident : ajouter workflow CNSS 48h, body map, investigation structuree, declaration anonyme, photos multiples
2. ControleQualite : ajouter checklists configurables, scoring pondere, localisation sur plan
3. NonConformite : ajouter reserves/punchlist, cout de reprise, photos avant/apres
4. Risque : structurer en DUER par unite de travail, ajouter hierarchie des controles

### Dependances techniques transverses (hors scope QSHE strict — decision requise)

| Dependance | Impact | Urgence pour QSHE |
|-----------|--------|-------------------|
| **Offline-first** | Architecture majeure (Service Worker, IndexedDB, sync bidirectionnelle, gestion de conflits). Les briques existantes (cache, queue) sont un debut mais insuffisantes pour l'offline prolonge. | Elevee — mais peut demarrer sans (online-first puis offline incrementalement) |
| **SMS / WhatsApp** | Integration API tierce (Africa's Talking ou Twilio). Pas d'existant. | Moyenne — peut etre ajoute apres le CRUD de base |
| **Stockage cloud** | Migration du filesystem local vers S3/Cloudinary. Affecte tout le projet, pas que QSHE. | Elevee pour la production (Render = stockage ephemere) |
| **Mobile-first UX** | Repenser les composants pour l'usage terrain smartphone. Peut etre fait module par module. | Elevee pour l'adoption terrain, mais les pages desktop fonctionnent en attendant |
| **Roles/permissions QSHE** | Creer les permissions QSHE et les associer aux roles. Le systeme Permission existe deja. | Basse — peut etre fait au fil de l'eau a chaque sous-module |

---

*Etat des lieux compile le 2026-04-21. Aucune proposition d'architecture — juste les faits observes dans le code. Phase 3 a suivre apres validation.*
