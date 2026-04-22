# Module Qualité — État actuel

> Document d'analyse — lecture du code au 2026-04-21
> Scope : exclusivement la partie Qualité (pas SHE, pas Incidents, pas Risques, pas Environnement)

---

## Section 1 : Inventaire technique

### 1.1 Sidebar et navigation

**Groupe sidebar :** `QUALITE_GROUP` (`sidebarConfig.tsx:191`)
- Libellé : `qshe:sidebar.groupQualite` → FR: "Qualité" / EN: "Quality"
- Icône : `QualiteIcon` (cercle + checkmark SVG)
- 2 entrées enfants :

| Entrée | Route | Libellé FR | Libellé EN |
|--------|-------|-----------|------------|
| Contrôles qualité | `/qshe/controles` | Contrôles qualité | Quality controls |
| Non-conformités | `/qshe/non-conformites` | Non-conformités | Non-conformities |

### 1.2 Routes frontend

Fichier : `router/Router.tsx`

| Route | Page | Composant |
|-------|------|-----------|
| `/qshe/controles` | Contrôles qualité | `ControlesQualitePage` |
| `/qshe/non-conformites` | Non-conformités | `NonConformitesPage` |

Toutes protégées par `<ProtectedRoute>` (authentification requise).

### 1.3 Backend — Entities JPA

#### ControleQualite

**Table :** `qshe_controles_qualite`

| Colonne | Type | Contraintes |
|---------|------|------------|
| id | Long | PK |
| projet_id | FK → projets | NOT NULL |
| reference | String(50) | UNIQUE — format `CQ-{TYPE}-{NNNN}` |
| titre | String(300) | NOT NULL |
| description | TEXT | nullable |
| type_controle | Enum `TypeControleQualite` | NOT NULL |
| statut | Enum `StatutControle` | default PLANIFIE |
| resultat | Enum `ResultatControle` | default NON_EVALUE |
| inspecteur_id | FK → users | nullable |
| date_planifiee | LocalDate | nullable |
| date_realisation | LocalDate | nullable |
| zone_controlee | String(200) | nullable |
| lot_ouvrage | String(200) | nullable |
| criteres_verification | TEXT | nullable |
| observations | TEXT | nullable |
| note_globale | Int | nullable |
| sous_projet_id | FK | nullable |
| checklist_template_id | FK | nullable |
| sous_traitant | String(200) | nullable |
| created_at | Timestamp | auto |
| updated_at | Timestamp | auto |

**Index :** `idx_qcq_projet`, `idx_qcq_statut`, `idx_qcq_resultat`, `idx_qcq_type`, `idx_qcq_date`

#### NonConformite

**Table :** `qshe_non_conformites`

| Colonne | Type | Contraintes |
|---------|------|------------|
| id | Long | PK |
| projet_id | FK → projets | NOT NULL |
| reference | String(50) | UNIQUE — format `NC-{NNNNN}` |
| titre | String(300) | NOT NULL |
| description | TEXT | nullable |
| gravite | Enum `GraviteNonConformite` | NOT NULL |
| statut | Enum `StatutNonConformite` | default OUVERTE |
| type_defaut | Enum `TypeDefaut` | nullable |
| decision_traitement | Enum `DecisionTraitement` | nullable |
| controle_qualite_id | FK → qshe_controles_qualite | nullable |
| responsable_traitement_id | FK → users | nullable |
| detecte_par_id | FK → users | nullable |
| sous_traitant | String(200) | nullable |
| zone_localisation | String(300) | nullable |
| lot_ouvrage | String(200) | nullable |
| cause_identifiee | TEXT | nullable |
| action_corrective | TEXT | nullable |
| action_preventive | TEXT | nullable |
| preuve_correction | TEXT | nullable |
| cout_reprise | Decimal(15,2) | nullable |
| date_detection | LocalDate | nullable |
| date_echeance_correction | LocalDate | nullable |
| date_cloture | LocalDate | nullable |
| est_reserve | Boolean | flag réserves/punchlist |
| created_at | Timestamp | auto |
| updated_at | Timestamp | auto |

**Index :** `idx_qnc_projet`, `idx_qnc_statut`, `idx_qnc_gravite`, `idx_qnc_controle`, `idx_qnc_echeance`

**Propriété calculée :** `enRetard` = `dateEcheanceCorrection < today AND statut NOT IN (CLOTUREE, VERIFIEE)`

### 1.4 Backend — Enums (package `modules.qshe.enums`)

| Enum | Valeurs |
|------|---------|
| TypeControleQualite | RECEPTION_MATERIAUX, AUTOCONTROLE, CONTROLE_EXTERIEUR, OUVRAGE_TERMINE, ESSAI_LABORATOIRE, DOCUMENTAIRE, AUDIT_INTERNE, AUDIT_EXTERNE |
| StatutControle | PLANIFIE, EN_COURS, REALISE, ANNULE |
| ResultatControle | NON_EVALUE, CONFORME, NON_CONFORME, AVEC_RESERVES |
| GraviteNonConformite | MINEURE, MAJEURE, CRITIQUE, BLOQUANTE |
| StatutNonConformite | OUVERTE, EN_TRAITEMENT, ACTION_CORRECTIVE, VERIFIEE, CLOTUREE |
| TypeDefaut | EXECUTION, MATERIAUX, CONCEPTION, DOCUMENTATION, AUTRE |
| DecisionTraitement | REPRENDRE, REPARER, ACCEPTER_EN_ETAT, DEROGER, REBUTER_DEMOLIR |

### 1.5 Backend — Controllers

#### ControleQualiteController (`/api/qshe/controles`)

| Méthode | Path | Rôles autorisés | Description |
|---------|------|-----------------|-------------|
| POST | `/` | SUPER_ADMIN, ADMIN, CHEF_PROJET, CHEF_CHANTIER | Créer un contrôle |
| GET | `/projet/{projetId}` | Authentifié | Lister par projet (paginé, 20/page) |
| GET | `/{id}` | Authentifié | Détail d'un contrôle |
| PUT | `/{id}` | SUPER_ADMIN, ADMIN, CHEF_PROJET, CHEF_CHANTIER | Modifier un contrôle |
| DELETE | `/{id}` | SUPER_ADMIN, ADMIN | Supprimer un contrôle |
| GET | `/summary/projet/{projetId}` | Authentifié | KPI résumé du projet |

#### NonConformiteController (`/api/qshe/non-conformites`)

| Méthode | Path | Rôles autorisés | Description |
|---------|------|-----------------|-------------|
| POST | `/` | SUPER_ADMIN, ADMIN, CHEF_PROJET, CHEF_CHANTIER | Créer une NC |
| GET | `/projet/{projetId}` | Authentifié | Lister par projet (paginé) |
| GET | `/reserves/projet/{projetId}` | Authentifié | Lister les réserves d'un projet |
| GET | `/{id}` | Authentifié | Détail d'une NC |
| PUT | `/{id}` | SUPER_ADMIN, ADMIN, CHEF_PROJET, CHEF_CHANTIER | Modifier une NC |
| DELETE | `/{id}` | SUPER_ADMIN, ADMIN | Supprimer une NC |
| GET | `/en-retard` | Authentifié | Toutes les NC en retard (global) |
| GET | `/summary/projet/{projetId}` | Authentifié | KPI résumé du projet |

### 1.6 Backend — Services

#### ControleQualiteService

| Méthode | Comportement notable |
|---------|---------------------|
| `create()` | Génère la référence `CQ-{TYPE}-{NNNN}`, valide projet/inspecteur/template, statut=PLANIFIE, résultat=NON_EVALUE |
| `update()` | Si statut passe à REALISE et dateRealisation null → auto-set à today |
| `getSummary()` | Retourne : totalControles, controlesRealises, conformes, nonConformes, avecReserves, tauxConformite(%) |

#### NonConformiteService

| Méthode | Comportement notable |
|---------|---------------------|
| `create()` | Génère référence `NC-{NNNNN}`, dateDetection défaut = today, déclenche notification via QsheNotificationService |
| `update()` | Si statut passe à CLOTUREE et dateCloture null → auto-set à today |
| `findEnRetard()` | Requête : dateEcheanceCorrection < today AND statut NOT IN (CLOTUREE, VERIFIEE) |
| `findReservesByProjet()` | Filtre sur estReserve = true |
| `getSummary()` | Retourne : totalNc, ncOuvertes, ncEnRetard, ncParGravite (Map), coutRepriseTotal |

#### QsheNotificationService (partie Qualité)

- `notifierNonConformiteCree(nc)` : envoie une notification au responsable traitement ou au responsable projet. Type: `TypeNotification.NON_CONFORMITE`.

### 1.7 Backend — Repositories

#### ControleQualiteRepository

| Méthode | Description |
|---------|-------------|
| `findByProjetId(projetId, pageable)` | Liste paginée par projet |
| `findByProjetIdAndStatut(projetId, statut)` | Liste par projet+statut |
| `findByReference(reference)` | Recherche par référence |
| `countByProjetId(projetId)` | Nombre total par projet |
| `countByProjetIdAndResultat(projetId, resultat)` | Compte par résultat (JPQL) |
| `countRealisesByProjet(projetId)` | Compte contrôles réalisés (JPQL) |

#### NonConformiteRepository

| Méthode | Description |
|---------|-------------|
| `findByProjetId(projetId, pageable)` | Liste paginée par projet |
| `findByControleQualiteId(controleId)` | NC liées à un contrôle |
| `findByReference(reference)` | Recherche par référence |
| `countByProjetId(projetId)` | Nombre total par projet |
| `countOuvertesByProjet(projetId)` | NC non clôturées (JPQL) |
| `findEnRetard(today)` | NC en retard global (JPQL) |
| `countEnRetardByProjet(projetId, today)` | NC en retard par projet (JPQL) |
| `countByProjetIdAndGravite(projetId, gravite)` | Compte par gravité (JPQL) |
| `findByProjetIdAndEstReserveTrue(projetId, pageable)` | NC réserves (punchlist) |

### 1.8 Backend — DTOs

#### Requests Contrôle

**ControleQualiteCreateRequest** : projetId (required), titre (required, max 300), typeControle (required) + 8 champs optionnels (description, inspecteurId, datePlanifiee, zoneControlee, lotOuvrage, criteresVerification, sousProjetId, checklistTemplateId, sousTraitant)

**ControleQualiteUpdateRequest** : tous les champs optionnels (14 champs incluant statut, resultat, dateRealisation, observations, noteGlobale)

#### Requests NC

**NonConformiteCreateRequest** : projetId (required), titre (required, max 300), gravite (required) + 10 champs optionnels (description, typeDefaut, controleQualiteId, responsableTraitementId, detecteParId, sousTraitant, zoneLocalisation, lotOuvrage, dateDetection, dateEcheanceCorrection, estReserve)

**NonConformiteUpdateRequest** : tous les champs optionnels (15 champs incluant statut, decisionTraitement, causeIdentifiee, actionCorrective, actionPreventive, preuveCorrection, coutReprise)

#### Responses

**ControleQualiteResponse** : 22 champs (inclut projetNom, sousProjetNom, inspecteurNom, checklistTemplateNom dénormalisés)

**ControleQualiteSummaryResponse** : totalControles, controlesRealises, conformes, nonConformes, avecReserves, tauxConformite

**NonConformiteResponse** : 27 champs (inclut projetNom, controleReference, responsableNom, detecteParNom dénormalisés + enRetard calculé)

**NonConformiteSummaryResponse** : totalNc, ncOuvertes, ncEnRetard, ncParGravite (Map<String, Long>), coutRepriseTotal

### 1.9 Backend — Mappers

- `ControleQualiteMapper` (object) : `toResponse(entity) → ControleQualiteResponse`
- `NonConformiteMapper` (object) : `toResponse(entity) → NonConformiteResponse`

### 1.10 Frontend — Pages

#### ControlesQualitePage (`features/qshe/pages/ControlesQualitePage.tsx`)

- Sélecteur de projet en haut de page
- 4 cartes KPI : total contrôles, taux conformité (%), non-conformes, avec réserves
- Filtre par statut (PLANIFIE, EN_COURS, REALISE, ANNULE)
- Liste des contrôles avec : référence, titre, badge statut, badge résultat, type, date planifiée, zone, lot, note globale (/100), inspecteur
- Modale de création : titre (requis), type (requis), date planifiée, zone, lot
- Bouton supprimer par contrôle
- Pagination (20/page)

#### NonConformitesPage (`features/qshe/pages/NonConformitesPage.tsx`)

- Sélecteur de projet en haut de page
- 4 cartes KPI : total NC, NC ouvertes, NC en retard, coût reprise total (FCFA)
- Filtre par statut (OUVERTE, EN_TRAITEMENT, ACTION_CORRECTIVE, VERIFIEE, CLOTUREE)
- Toggle "Réserves uniquement" (filtre punchlist)
- Liste des NC avec : référence, titre, badge gravité (coloré), badge statut, type défaut, décision traitement, zone, lot, sous-traitant, coût reprise (FCFA), alerte retard (bordure rouge + badge pulsant), badge réserve
- Modale de création : titre (requis), gravité (requis), type défaut, zone, lot, sous-traitant, échéance correction, checkbox réserve
- Bouton supprimer par NC
- Pagination

### 1.11 Frontend — API clients

#### qsheControleApi (`api/qsheControleApi.ts`)

| Méthode | Endpoint |
|---------|----------|
| `create` | POST `/qshe/controles` |
| `getByProjet` | GET `/qshe/controles/projet/{projetId}?page,size,sort=datePlanifiee,desc` |
| `getById` | GET `/qshe/controles/{id}` |
| `update` | PUT `/qshe/controles/{id}` |
| `delete` | DELETE `/qshe/controles/{id}` |
| `getSummary` | GET `/qshe/controles/summary/projet/{projetId}` |

#### qsheNcApi (`api/qsheNcApi.ts`)

| Méthode | Endpoint |
|---------|----------|
| `create` | POST `/qshe/non-conformites` |
| `getByProjet` | GET `/qshe/non-conformites/projet/{projetId}?page,size,sort=dateDetection,desc` |
| `getById` | GET `/qshe/non-conformites/{id}` |
| `update` | PUT `/qshe/non-conformites/{id}` |
| `delete` | DELETE `/qshe/non-conformites/{id}` |
| `getEnRetard` | GET `/qshe/non-conformites/en-retard` |
| `getSummary` | GET `/qshe/non-conformites/summary/projet/{projetId}` |

### 1.12 Frontend — Redux slices

#### qsheControleSlice

**State :** `{ controles: [], summary: null, totalElements, totalPages, currentPage, loading, error }`

**Thunks :** `fetchControlesByProjet`, `createControle`, `updateControle`, `deleteControle`, `fetchControleSummary`

#### qsheNcSlice

**State :** `{ ncs: [], summary: null, totalElements, totalPages, currentPage, loading, error }`

**Thunks :** `fetchNcsByProjet`, `createNc`, `updateNc`, `deleteNc`, `fetchNcSummary`

### 1.13 Frontend — Types

- `types/qsheControle.ts` : enums (TypeControleQualite, StatutControle, ResultatControle) + interfaces (response, create/update requests, summary)
- `types/qsheNc.ts` : enums (GraviteNonConformite, StatutNonConformite, DecisionTraitement, TypeDefaut) + interfaces (response, create/update requests, summary)

### 1.14 Frontend — i18n

Fichiers : `locales/fr/qshe.json` et `locales/en/qshe.json`

Clés Qualité pertinentes :
- `sidebar.groupQualite` : "Qualité" / "Quality"
- `sidebar.controles` : "Contrôles qualité" / "Quality controls"
- `sidebar.nc` : "Non-conformités" / "Non-conformities"
- Enums traduits pour tous les statuts, résultats, gravités, types de défaut, décisions traitement

### 1.15 Frontend — Constants API

Fichier : `constants/api.ts`

```
QSHE_CONTROLES: { BASE, BY_ID, BY_PROJET, SUMMARY }
QSHE_NC: { BASE, BY_ID, BY_PROJET, RESERVES, EN_RETARD, SUMMARY }
```

### 1.16 Reporting — Intégration Qualité

**ReportingResponses.kt** : un DTO `QualiteStats` existe (controlesTotal, tauxConformite, ncOuvertes) mais est toujours renvoyé à `null`. Marqué TODO livrable #4.

**ReportingService.kt** : `qualite = null` hardcodé à 2 endroits (stats globales + stats par projet). Les méthodes `getGlobalQualiteStats()` ont été retirées lors du nettoyage #0.

### 1.17 Seed Data

**SeedDataInitializer.kt** : les méthodes `initControlesQualite()` ont été retirées lors du nettoyage #0. Commentaire : "seed data à recréer au livrable #1". Aucune donnée de test Qualité n'est injectée au démarrage.

---

## Section 2 : Périmètre fonctionnel actuel

### 2.1 Contrôles Qualité — Ce que l'utilisateur peut faire

**Créer un contrôle :**
- Sélectionner un projet (obligatoire via sélecteur en haut de page)
- Saisir : titre (obligatoire), type de contrôle (obligatoire), date planifiée, zone contrôlée, lot/ouvrage
- La référence est générée automatiquement côté backend (CQ-{TYPE}-{NNNN})
- Statut initial : PLANIFIE, résultat initial : NON_EVALUE

**Lister et filtrer les contrôles :**
- Liste paginée (20/page) par projet
- Filtre par statut (4 valeurs)
- Affichage : référence, titre, statut, résultat, type, date planifiée, zone, lot, note, inspecteur

**Consulter les KPI :**
- Total contrôles, taux de conformité (%), nombre de non-conformes, nombre avec réserves

**Supprimer un contrôle :**
- Bouton de suppression directe (rôles SUPER_ADMIN, ADMIN)

**Modifier un contrôle (backend uniquement) :**
- L'endpoint PUT existe avec tous les champs modifiables (statut, résultat, observations, note globale, etc.)

**Workflow de statut :** PLANIFIE → EN_COURS → REALISE (auto-set dateRealisation) / ANNULE

**Workflow de résultat :** NON_EVALUE → CONFORME / NON_CONFORME / AVEC_RESERVES

### 2.2 Non-Conformités — Ce que l'utilisateur peut faire

**Créer une NC :**
- Sélectionner un projet (obligatoire)
- Saisir : titre (obligatoire), gravité (obligatoire), type de défaut, zone/localisation, lot/ouvrage, sous-traitant, échéance correction, flag réserve
- Référence générée automatiquement (NC-{NNNNN})
- Statut initial : OUVERTE, dateDetection = today par défaut
- Notification automatique envoyée au responsable traitement ou au responsable projet

**Lister et filtrer les NC :**
- Liste paginée par projet
- Filtre par statut (5 valeurs)
- Toggle "Réserves uniquement"
- Affichage riche avec code couleur par gravité et statut
- Indicateur visuel de retard (bordure rouge + badge pulsant)

**Consulter les KPI :**
- Total NC, NC ouvertes, NC en retard, coût de reprise total (FCFA)

**Supprimer une NC :**
- Bouton de suppression directe (rôles SUPER_ADMIN, ADMIN)

**Modifier une NC (backend uniquement) :**
- Endpoint PUT avec tous les champs : statut, décision traitement, cause identifiée, action corrective, action préventive, preuve correction, coût reprise, etc.

**Consulter les NC en retard (backend uniquement) :**
- Endpoint GET global (pas par projet) listant toutes les NC en retard

**Workflow de statut :** OUVERTE → EN_TRAITEMENT → ACTION_CORRECTIVE → VERIFIEE → CLOTUREE (auto-set dateCloture)

### 2.3 Relations avec les autres modules

| Relation | Description |
|----------|-------------|
| Projet | Chaque contrôle et chaque NC est rattaché à un projet. Le sélecteur de projet filtre toute la vue. |
| Utilisateur | L'inspecteur (contrôle), le responsable traitement et le détecteur (NC) sont des FK vers users. |
| Contrôle → NC | Une NC peut être rattachée à un contrôle qualité qui l'a détectée (FK controle_qualite_id). |
| Sous-projet | FK optionnelle sur le contrôle. |
| Checklist template | FK optionnelle sur le contrôle (templates partagés avec le module Inspections). |
| Notification | Création de NC déclenche une notification via QsheNotificationService. |
| Reporting | `QualiteStats` existe dans le DTO mais est renvoyé `null` — intégration non câblée. |

### 2.4 Règles de validation

**Contrôle :**
- titre : @NotBlank, @Size(max=300)
- projetId : @NotNull
- typeControle : @NotNull

**NC :**
- titre : @NotBlank, @Size(max=300)
- projetId : @NotNull
- gravite : @NotNull

Pas d'autres validations métier côté backend (pas de contrôle sur les transitions de statut, pas de validation de cohérence dates).

---

## Section 3 : Zones floues ou incomplètes

### 3.1 Fonctionnalités backend existantes non exposées dans l'UI

| Fonctionnalité backend | Statut frontend |
|------------------------|-----------------|
| **PUT contrôle** (modification complète : statut, résultat, observations, note, etc.) | Aucun formulaire d'édition dans la page. Le thunk `updateControle` existe dans le slice mais n'est appelé nulle part dans `ControlesQualitePage`. |
| **PUT NC** (modification complète : statut, décision, cause, actions, preuves, coût) | Aucun formulaire d'édition dans la page. Le thunk `updateNc` existe dans le slice mais n'est appelé nulle part dans `NonConformitesPage`. |
| **GET NC en retard** (global) | L'API `getEnRetard` est définie dans `qsheNcApi.ts` et dans les constantes (`QSHE_NC.EN_RETARD`), mais aucun thunk ni aucune page ne l'appelle. |
| **GET réserves par projet** | L'endpoint et la constante `QSHE_NC.RESERVES` existent, mais le toggle "réserves" côté frontend filtre localement sur la liste déjà chargée (pas d'appel à l'endpoint dédié). |
| **GET contrôle par ID** | API client définie (`getById`) mais jamais appelée — pas de page détail contrôle. |
| **GET NC par ID** | API client définie (`getById`) mais jamais appelée — pas de page détail NC. |
| Champs `inspecteurId`, `sousProjetId`, `checklistTemplateId`, `sousTraitant` dans la création de contrôle | Non présents dans la modale de création frontend. |
| Champs `description`, `controleQualiteId`, `responsableTraitementId`, `detecteParId`, `dateDetection` dans la création de NC | Non présents dans la modale de création frontend. |

### 3.2 UI présente mais fonctionnalité limitée

| Élément UI | Constat |
|------------|---------|
| Modale création contrôle | 5 champs sur 12 disponibles côté backend. Pas de sélection d'inspecteur, de sous-projet, de template checklist, de sous-traitant. |
| Modale création NC | 7 champs sur 13 disponibles côté backend. Pas de lien vers un contrôle source, pas de sélection de responsable/détecteur, pas de description. |
| Liste contrôles — note globale | Affichée si présente, mais aucun moyen de la saisir depuis l'UI (champ dans UpdateRequest uniquement). |
| Liste NC — décision traitement | Affichée si présente, mais aucun moyen de la saisir depuis l'UI. |
| Liste NC — coût reprise | Affiché si présent, mais aucun moyen de le saisir depuis l'UI. |
| Aucune page de détail | Ni pour les contrôles ni pour les NC. Tout est affiché en liste avec des informations résumées. |
| Aucun formulaire d'édition | Impossible de modifier un contrôle ou une NC depuis l'interface. Pas de transition de statut dans l'UI. |

### 3.3 Intégrations non câblées

| Zone | Constat |
|------|---------|
| Reporting / Dashboard global | `QualiteStats` (controlesTotal, tauxConformite, ncOuvertes) existe comme DTO mais est renvoyé `null`. TODO : livrable #4. |
| Seed data | `initControlesQualite()` retiré du SeedDataInitializer. Aucune donnée de démo. TODO : livrable #1. |
| Lien contrôle → inspection | Les deux entités ont un champ `checklist_template_id` mais aucune relation directe entre elles. |
| ProjetDetailPage | Le fix appliqué aujourd'hui (`rapport.securite?.risquesCritiques`) indique que les stats QSHE ne sont plus injectées dans la vue projet. |

### 3.4 Incohérences observées

| Observation |
|-------------|
| L'endpoint `GET /reserves/projet/{projetId}` existe côté backend et la constante `QSHE_NC.RESERVES` est définie frontend, mais le toggle réserves filtre côté client et non via cet endpoint dédié. |
| Les thunks `updateControle` et `updateNc` existent dans les slices Redux mais ne sont appelés par aucun composant. |
| Le champ `noteGlobale` du contrôle est affiché dans la liste mais ne peut être saisi nulle part dans l'UI — il reste toujours null. |
| Les constantes API définissent les endpoints `QSHE_NC.EN_RETARD` et `QSHE_NC.RESERVES` mais aucun thunk Redux ne les consomme. |

### 3.5 Aucun TODO/FIXME dans le code Qualité propre

Les fichiers sous `modules/qshe/` (controllers, services, entities, DTOs) ne contiennent aucun TODO ni FIXME. Les TODO sont uniquement dans le module Reporting et le SeedDataInitializer.

---

## Section 4 : Questions ouvertes à poser au chef de projet

1. **Pages de détail :** Faut-il des pages dédiées pour visualiser/éditer un contrôle ou une NC en détail, ou le modèle "tout en liste" est-il volontaire ?

2. **Édition et transitions de statut :** Comment l'utilisateur doit-il modifier un contrôle ou une NC aujourd'hui ? L'absence de formulaire d'édition signifie-t-elle que cette fonctionnalité est prévue mais non encore développée, ou que l'édition passe par un autre canal (ex: API directe, import) ?

3. **Champs manquants dans les modales de création :** Les champs backend non exposés dans l'UI (inspecteur, sous-projet, template checklist, contrôle source, responsable traitement, etc.) sont-ils prévus pour une phase ultérieure ?

4. **Lien Contrôle → NC :** Le backend permet de rattacher une NC à un contrôle (FK controle_qualite_id). Ce lien est-il utilisé dans le workflow réel ? Doit-il être exposé dans l'UI ?

5. **Réserves / Punchlist :** Le flag `estReserve` et l'endpoint dédié existent. Quelle est l'utilisation métier attendue ? Le toggle frontend actuel (filtrage client) est-il suffisant ?

6. **Intégration Reporting :** Les `QualiteStats` sont marquées TODO livrable #4. Ce livrable est-il toujours planifié ? Quelles métriques Qualité doivent apparaître dans le dashboard global ?

7. **Seed data :** L'absence de données de démo est-elle bloquante pour les tests ou les démos client ?

8. **Lien avec Inspections :** Les contrôles qualité et les inspections sont deux entités séparées avec des templates de checklist communs. Y a-t-il une intention de les lier fonctionnellement (ex: une inspection génère un contrôle, un contrôle déclenche une inspection) ?

9. **Validation métier des transitions :** Actuellement, aucune règle n'empêche de passer un contrôle de PLANIFIE directement à ANNULE, ou une NC de OUVERTE à CLOTUREE. Des contraintes de workflow sont-elles souhaitées ?

10. **Notifications :** Seule la création de NC déclenche une notification. D'autres événements doivent-ils notifier (contrôle non-conforme, NC en retard, NC clôturée) ?
