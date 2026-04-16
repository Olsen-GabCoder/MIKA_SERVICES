# Spécification Technique — Module Engins & DMA

**MIKA Services** · Service Logistique · Référence développement interne · v1.0 · Mars 2026

---

## Table des matières

1. [Informations projet](#1-informations-projet)
2. [Modèle de données](#2-modèle-de-données)
   - 2.1 [Entités existantes — À réutiliser et étendre](#21-entités-existantes--à-réutiliser-et-étendre)
   - 2.2 [Nouvelles entités — À créer de zéro](#22-nouvelles-entités--à-créer-de-zéro)
3. [Rôles & Droits](#3-rôles--droits)
   - 3.1 [Matrice des rôles](#31-matrice-des-rôles)
   - 3.2 [Permissions `@PreAuthorize`](#32-permissions-preauthorize)
4. [Flux Engins](#4-flux-engins)
   - 4.1 [Workflow de déplacement](#41-workflow-de-déplacement)
   - 4.2 [Règles métier](#42-règles-métier)
5. [Flux DMA](#5-flux-dma)
   - 5.1 [Workflow DMA](#51-workflow-dma)
   - 5.2 [Machine à états — Statuts DMA](#52-machine-à-états--statuts-dma)
6. [API Endpoints](#6-api-endpoints)
   - 6.1 [Module Engins](#61-module-engins)
   - 6.2 [Module DMA](#62-module-dma)
7. [Notifications](#7-notifications)
8. [Plan de développement](#8-plan-de-développement)

---

## 1. Informations projet

| Attribut | Valeur |
|---|---|
| **Projet** | MIKA Services |
| **Module** | Gestion des Engins & Demandes de Matériel (DMA) |
| **Service** | Logistique (pilote unique du module) |
| **Backend** | Spring Boot / Kotlin — API REST — JWT |
| **Frontend** | React / TypeScript — SPA |
| **Mobile** | Application mobile à créer (Android ou PWA) |
| **Base de données** | MySQL — entités JPA / Hibernate |
| **Version doc** | 1.0 — Mars 2026 |

---

## 2. Modèle de données

### 2.1 Entités existantes — À réutiliser et étendre

| Entité | Attributs clés | Extension requise pour ce module |
|---|---|---|
| **Engin** | `code`, `nom`, `TypeEngin`, `marque`, `immatriculation`, `compteur`, `StatutEngin` (incl. `EN_TRANSIT`), `localisation` | Lier à `MouvementEngin`. Renforcer cohérence statut ↔ affectations. Ajouter règle : un seul mouvement actif par engin. |
| **AffectationEnginChantier** | `engin_id`, `projet_id`, `dates`, `StatutAffectation`, `heures`, `observations` | Ajouter projet source / destination. Clôture automatique au mouvement. Gérer conflits d'affectation simultanée. |
| **Projet** | `localisation`, `responsableProjet` (User), `statut`, `budget` | Ancrage chantier pour autorisations mobile et filtres tableau de bord logistique. |
| **Materiau** | `code`, `nom`, `type`, `unité`, `stocks`, `fournisseur` | Référentiel article. Lien optionnel vers lignes `DemandeMaterielLigne`. |
| **Commande** | `référence`, `Fournisseur`, `Projet?`, `montant`, `StatutCommande` | Phase approvisionnement après validation DMA. Mapper `StatutCommande` ↔ statut DMA (`EN_COMMANDE` → `LIVRE`). |
| **Notification** | `destinataire`, `titre`, `contenu`, `TypeNotification`, `lien`, `lu` | Ajouter 10 nouveaux types (voir section Notifications). Dispatch multi-destinataires. |
| **Document** | Pièces jointes projets (entité existante) | Réutiliser pour PJ des DMA : bons de livraison, photos réception, devis fournisseur. |
| **User / Role / Permission** | JWT, RBAC, `CurrentUserService`, `canEditProjet` | Créer rôles `LOGISTIQUE`, `CHEF_CHANTIER`. Étendre `USER` avec `DMA_CREATE` ciblé. Sécuriser `/engins` et `/materiaux` par `@PreAuthorize`. |

---

### 2.2 Nouvelles entités — À créer de zéro

#### `MouvementEngin`

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique du mouvement |
| `engin_id` | FK Engin | Engin concerné par le mouvement |
| `projet_origine_id` | FK Projet | Chantier source (nullable si dépôt central) |
| `projet_destination_id` | FK Projet | Chantier destinataire |
| `initiateur_user_id` | FK User | Responsable logistique créateur de l'ordre |
| `statut` | Enum | `EN_ATTENTE_DEPART` \| `EN_TRANSIT` \| `RECU` \| `ANNULE` |
| `date_demande` | Timestamp | Horodatage création de l'ordre |
| `date_depart_confirmee` | Timestamp | Horodatage confirmation départ (nullable) |
| `date_reception_confirmee` | Timestamp | Horodatage confirmation réception (nullable) |
| `commentaire` | String | Texte libre |

#### `MouvementEnginEvenement`

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `mouvement_id` | FK | Référence à `MouvementEngin` |
| `type_evenement` | Enum | `DEPART_CONFIRME` \| `RECEPTION_CONFIRMEE` \| `ANNULATION` \| `COMMENTAIRE` |
| `auteur_user_id` | FK User | Utilisateur auteur de l'événement |
| `horodatage` | Timestamp | Timestamp précis |
| `payload` | JSON | Optionnel : compteur horaire, photos, observations |

#### `DemandeMateriel`

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `reference` | String | Numéro lisible auto-généré — ex. `DMA-2026-0042` |
| `projet_id` | FK Projet | Chantier demandeur |
| `createur_user_id` | FK User | Membre terrain ayant soumis la DMA |
| `statut` | Enum | Voir machine à états — section [Flux DMA](#52-machine-à-états--statuts-dma) |
| `priorite` | Enum | `NORMALE` \| `URGENTE` |
| `date_souhaitee` | Date | Date de besoin exprimée terrain |
| `commentaire` | String | Texte libre |
| `montant_estime` | Decimal | Agrégat calculé depuis les lignes |
| `commande_id` | FK | Lien optionnel vers `Commande` (post-validation) |

#### `DemandeMaterielLigne`

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `demande_id` | FK | Référence à `DemandeMateriel` |
| `designation` | String | Libellé article — saisie libre |
| `materiau_id` | FK | Lien optionnel vers référentiel `Materiau` |
| `quantite` | Decimal | Quantité demandée |
| `unite` | String | Unité de mesure |
| `prix_unitaire_est` | Decimal | Prix estimé — optionnel |
| `fournisseur_suggere` | String | Texte libre ou `fournisseur_id` |

#### `DemandeMaterielHistorique`

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `demande_id` | FK | Référence à `DemandeMateriel` |
| `de_statut` | Enum | Statut avant transition |
| `vers_statut` | Enum | Statut après transition |
| `user_id` | FK User | Auteur de la transition |
| `date` | Timestamp | Horodatage précis |
| `commentaire` | String | Motif ou observation libre |

---

## 3. Rôles & Droits

### 3.1 Matrice des rôles

| Rôle | Interface Web — Actions autorisées | Interface Mobile — Actions autorisées |
|---|---|---|
| **LOGISTIQUE** *(à créer)* | Parc global engins · Ordres de mouvement · File des DMA · Traitement et clôture DMA · Liaison Commande · Tableau de bord · Reporting | Consultation d'urgence · Actions ponctuelles mouvements |
| **CHEF_PROJET** *(existant)* | Supervision projets (existant) · Validation DMA niveau projet | Confirmation départ / réception engin · Validation DMA niveau projet |
| **CHEF_CHANTIER** *(à créer)* | Accès limité aux chantiers assignés | Saisie DMA · Validation DMA niveau chantier · Confirmation présence engin |
| **USER terrain** *(étendu)* | — | Saisie DMA · Suivi statuts ses DMA · Confirmation réception engin (si délégué) |
| **ADMIN** *(existant)* | Paramétrage utilisateurs, rôles, référentiels | — |

---

### 3.2 Permissions `@PreAuthorize`

> À créer dans le backend.

| Permission | Description | Rôles concernés |
|---|---|---|
| `ENGIN_VIEW` | Consulter la liste et le détail des engins | `LOGISTIQUE`, `CHEF_PROJET`, `CHEF_CHANTIER` |
| `ENGIN_MANAGE` | Créer, modifier, désactiver un engin du parc | `LOGISTIQUE`, `ADMIN` |
| `MOUVEMENT_CREATE` | Créer un ordre de mouvement inter-chantiers | `LOGISTIQUE` |
| `MOUVEMENT_CONFIRM_DEPART` | Confirmer le départ d'un engin (CP / Chef chantier source) | `CHEF_PROJET`, `CHEF_CHANTIER` |
| `MOUVEMENT_CONFIRM_RECEPTION` | Confirmer la réception d'un engin (CP / Chef chantier destination) | `CHEF_PROJET`, `CHEF_CHANTIER` |
| `DMA_CREATE` | Soumettre une DMA depuis le mobile terrain | `USER`, `CHEF_CHANTIER` |
| `DMA_VALIDATE_CHANTIER` | Valider / rejeter une DMA au niveau chantier | `CHEF_CHANTIER` |
| `DMA_VALIDATE_PROJET` | Valider / rejeter une DMA au niveau projet | `CHEF_PROJET` |
| `DMA_PROCESS` | Prendre en charge et traiter une DMA (commande, livraison) | `LOGISTIQUE` |
| `DMA_CLOSE` | Clôturer définitivement une DMA après livraison | `LOGISTIQUE` |
| `DMA_VIEW_ALL` | Voir toutes les DMA tous chantiers confondus | `LOGISTIQUE`, `ADMIN` |

---

## 4. Flux Engins

### 4.1 Workflow de déplacement

> **Cas de référence :** Le Chantier X1 a besoin d'un engin affecté au Chantier Y. Le Responsable Logistique orchestre l'intégralité du mouvement.

| Étape | Acteur | Action système | Détail technique | Statut engin |
|---|---|---|---|---|
| **0** | État initial | — | L'engin est affecté au Chantier Y et en service. `AffectationEnginChantier` active. `StatutEngin = EN_SERVICE`. | `EN_SERVICE` |
| **1** | Resp. Logistique *(web)* | Ordre de mouvement | Création d'un `MouvementEngin` : engin, origine Y, destination X1, motif, date souhaitée. `POST /api/mouvements` — perm. `MOUVEMENT_CREATE`. Notification auto → `CHEF_PROJET Y` + `CHEF_CHANTIER Y`. | `EN_ATTENTE_DEPART` |
| **2** | Chef Projet / Chantier Y *(mobile)* | Confirmation départ | Confirmation du départ avec horodatage et observations optionnelles. `PATCH /api/mouvements/{id}/confirmer-depart` — perm. `MOUVEMENT_CONFIRM_DEPART`. Système verrouille `AffectationEnginChantier Y` (clôture). Création événement `DEPART_CONFIRME`. | `EN_TRANSIT` |
| **3** | — | Transit | L'engin est en route. Visible `EN_TRANSIT` dans le tableau de bord. Notification → `CHEF_PROJET X1` + `CHEF_CHANTIER X1`. Aucune action technique requise. | `EN_TRANSIT` |
| **4** | Chef Projet / Chantier X1 *(mobile)* | Confirmation réception | Confirmation de la réception : horodatage, état à l'arrivée. `PATCH /api/mouvements/{id}/confirmer-reception` — perm. `MOUVEMENT_CONFIRM_RECEPTION`. Création `AffectationEnginChantier X1` active. Maj `StatutEngin → EN_SERVICE`. Création événement `RECEPTION_CONFIRMEE`. | `EN_SERVICE (X1)` |
| **5** | Système | Clôture automatique | Clôture du `MouvementEngin`. Historique complet disponible. `MouvementEngin.statut = RECU`. Notification → Logistique. Historique `MouvementEnginEvenement` complet consultable. | `EN_SERVICE (X1)` |

---

### 4.2 Règles métier

| Règle | Description |
|---|---|
| **Concurrence** | Si deux chantiers demandent le même engin, seul `LOGISTIQUE` peut créer l'ordre. Le 2e chantier reçoit une notification de refus provisoire. |
| **Blocage engin** | `LOGISTIQUE` peut passer `StatutEngin → EN_MAINTENANCE` ou `EN_PANNE`. Tout mouvement actif sur cet engin doit être annulé automatiquement. |
| **Cohérence statut** | Un engin ne peut avoir qu'un seul `MouvementEngin` en statut `EN_ATTENTE_DEPART` ou `EN_TRANSIT` simultanément. Contrainte gérée côté service. |
| **Absence du CP** | Si le Chef de Projet est absent, `LOGISTIQUE` peut confirmer le départ/réception par délégation (paramétrable par projet). |

---

## 5. Flux DMA

> **Principe :** Le Service Logistique est le pilote unique — il prend en charge la DMA après la validation hiérarchique chantier/projet.

### 5.1 Workflow DMA

| Étape | Acteur | Action système | Détail technique | Statut DMA |
|---|---|---|---|---|
| **1** | Équipe terrain *(mobile)* | Saisie terrain | Création `DemandeMateriel` + lignes. Référence auto-générée. `POST /api/dma` — perm. `DMA_CREATE`. Validation : `projet_id` obligatoire, au moins 1 ligne. Notification → `CHEF_CHANTIER`. | `SOUMISE` |
| **2** | Chef de Chantier *(mobile)* | Validation chantier | Le Chef de Chantier valide ou rejette la DMA. `PATCH /api/dma/{id}/valider-chantier` — perm. `DMA_VALIDATE_CHANTIER`. Rejeter → statut `REJETEE` + commentaire obligatoire. Valider → Notification `CHEF_PROJET`. | `EN_VALIDATION_CHANTIER` |
| **3** | Chef de Projet *(mobile / web)* | Validation projet | Le Chef de Projet valide et transmet à la Logistique. `PATCH /api/dma/{id}/valider-projet` — perm. `DMA_VALIDATE_PROJET`. Notification → `LOGISTIQUE` (`DMA_VALIDEE_PROJET`). | `EN_VALIDATION_PROJET` |
| **4** | Resp. Logistique *(web)* | Prise en charge | La Logistique accuse réception. Peut demander des compléments terrain. `PATCH /api/dma/{id}/prendre-en-charge` — perm. `DMA_PROCESS`. Si complément requis → statut `EN_ATTENTE_COMPLEMENT` + Notification terrain. | `PRISE_EN_CHARGE` |
| **5** | Resp. Logistique *(web)* | Commande | Recherche fournisseur, émission commande. Création / lien entité `Commande`. `PATCH /api/dma/{id}/commander` — perm. `DMA_PROCESS`. Lien optionnel → `Commande.id`. Notification terrain (`DMA_PRISE_EN_CHARGE`). | `EN_COMMANDE` |
| **6** | Logistique / Terrain *(mobile)* | Livraison | Article livré sur chantier. Confirmation réception (bon de livraison, photo). `PATCH /api/dma/{id}/livrer` — perm. `DMA_PROCESS`. PJ optionnelle via module `Document` existant. Notification terrain (`DMA_LIVREE`). | `LIVRE` |
| **7** | Système / Logistique | Clôture | DMA clôturée et archivée. Mise à jour stock optionnelle. `PATCH /api/dma/{id}/cloturer` — perm. `DMA_CLOSE`. Alimentation optionnelle `Materiau` / `AffectationMateriauChantier`. | `CLOTUREE` |

---

### 5.2 Machine à états — Statuts DMA

| Statut | Transitions autorisées → | Acteur déclencheur | Notes | Type |
|---|---|---|---|---|
| `SOUMISE` | `EN_VALIDATION_CHANTIER` · `REJETEE` | Chef de Chantier | Notification automatique à la soumission | Intermédiaire |
| `EN_VALIDATION_CHANTIER` | `EN_VALIDATION_PROJET` · `REJETEE` | Chef de Projet | Timeout possible si inactivité > X jours | Intermédiaire |
| `EN_VALIDATION_PROJET` | `PRISE_EN_CHARGE` · `REJETEE` | Resp. Logistique | Notification logistique à la validation projet | Intermédiaire |
| `PRISE_EN_CHARGE` | `EN_COMMANDE` · `EN_ATTENTE_COMPLEMENT` | Resp. Logistique | — | Intermédiaire |
| `EN_ATTENTE_COMPLEMENT` | `PRISE_EN_CHARGE` | Équipe terrain *(mobile)* | Retour sur modification lignes DMA | Intermédiaire |
| `EN_COMMANDE` | `LIVRE` | Resp. Logistique | Lien vers entité `Commande` créé | Intermédiaire |
| `LIVRE` | `CLOTUREE` | Logistique / Système auto | BL confirmé ou timeout après livraison | Intermédiaire |
| `REJETEE` | — | — | **État terminal.** Commentaire de rejet obligatoire. | Terminal |
| `CLOTUREE` | — | — | **Archive.** Historique complet consultable. | Terminal |

---

## 6. API Endpoints

### 6.1 Module Engins

| Méthode | Route | Permission requise | Description |
|---|---|---|---|
| `GET` | `/api/engins` | `ENGIN_VIEW` | Liste du parc — filtres : statut, projet, type |
| `GET` | `/api/engins/{id}` | `ENGIN_VIEW` | Détail d'un engin |
| `POST` | `/api/engins` | `ENGIN_MANAGE` | Créer un nouvel engin |
| `PUT` | `/api/engins/{id}` | `ENGIN_MANAGE` | Modifier un engin existant |
| `GET` | `/api/engins/{id}/mouvements` | `ENGIN_VIEW` | Historique complet des mouvements d'un engin |
| `GET` | `/api/mouvements` | `MOUVEMENT_CREATE` | Liste globale des mouvements (logistique) — filtres : statut, engin, projet, période |
| `POST` | `/api/mouvements` | `MOUVEMENT_CREATE` | Créer un ordre de mouvement |
| `PATCH` | `/api/mouvements/{id}/confirmer-depart` | `MOUVEMENT_CONFIRM_DEPART` | Confirmer le départ de l'engin |
| `PATCH` | `/api/mouvements/{id}/confirmer-reception` | `MOUVEMENT_CONFIRM_RECEPTION` | Confirmer la réception de l'engin |
| `PATCH` | `/api/mouvements/{id}/annuler` | `MOUVEMENT_CREATE` | Annuler un mouvement (logistique uniquement) |

---

### 6.2 Module DMA

| Méthode | Route | Permission requise | Description |
|---|---|---|---|
| `GET` | `/api/dma` | `DMA_VIEW_ALL` ou filtre projet | Liste DMA filtrée selon le rôle de l'appelant |
| `GET` | `/api/dma/{id}` | `DMA_CREATE` | Détail complet d'une DMA |
| `POST` | `/api/dma` | `DMA_CREATE` | Soumettre une nouvelle DMA |
| `POST` | `/api/dma/{id}/lignes` | `DMA_CREATE` | Ajouter une ligne à une DMA en cours |
| `PATCH` | `/api/dma/{id}/valider-chantier` | `DMA_VALIDATE_CHANTIER` | Validation Chef de Chantier |
| `PATCH` | `/api/dma/{id}/valider-projet` | `DMA_VALIDATE_PROJET` | Validation Chef de Projet |
| `PATCH` | `/api/dma/{id}/prendre-en-charge` | `DMA_PROCESS` | Prise en charge par la Logistique |
| `PATCH` | `/api/dma/{id}/demander-complement` | `DMA_PROCESS` | Demander un complément d'information au terrain |
| `PATCH` | `/api/dma/{id}/commander` | `DMA_PROCESS` | Passer en commande — lien vers entité `Commande` |
| `PATCH` | `/api/dma/{id}/livrer` | `DMA_PROCESS` | Enregistrer la livraison sur chantier |
| `PATCH` | `/api/dma/{id}/cloturer` | `DMA_CLOSE` | Clôture définitive de la DMA |
| `PATCH` | `/api/dma/{id}/rejeter` | `DMA_VALIDATE_CHANTIER` | Rejet à n'importe quelle étape de validation |
| `GET` | `/api/dma/{id}/historique` | `DMA_CREATE` | Historique complet des transitions de statut |

---

## 7. Notifications

> **Infrastructure réutilisée :** `NotificationService` + WebSocket (`SimpMessagingTemplate`) + `EmailService` optionnel. **10 nouveaux types** à créer dans l'enum `TypeNotification`.

### Module Engins

| Type (enum) | Déclencheur | Destinataires |
|---|---|---|
| `MOUVEMENT_ORDRE_CREE` | Création d'un ordre de mouvement par la Logistique | CP + Chef Chantier source |
| `MOUVEMENT_DEPART_CONFIRME` | Confirmation du départ par CP / Chef Chantier source | CP + Chef Chantier destination + Logistique |
| `MOUVEMENT_RECEPTION_CONFIRMEE` | Confirmation de la réception par CP / Chef Chantier destination | Resp. Logistique |
| `MOUVEMENT_ANNULE` | Annulation d'un ordre de mouvement par la Logistique | CP source + CP destination |

### Module DMA

| Type (enum) | Déclencheur | Destinataires |
|---|---|---|
| `DMA_SOUMISE` | Soumission d'une DMA par l'équipe terrain | Chef de Chantier |
| `DMA_VALIDEE_CHANTIER` | Validation Chef de Chantier | Chef de Projet |
| `DMA_VALIDEE_PROJET` | Validation Chef de Projet | Resp. Logistique |
| `DMA_PRISE_EN_CHARGE` | Prise en charge par la Logistique | Créateur DMA + Chef de Projet |
| `DMA_COMPLEMENT_REQUIS` | Logistique demande un complément au terrain | Créateur DMA |
| `DMA_LIVREE` | Enregistrement de la livraison | Créateur DMA + Chef de Projet + Logistique |
| `DMA_REJETEE` | Rejet à n'importe quelle étape de validation | Créateur DMA |

---

## 8. Plan de développement

### Phases priorisées

| Phase | Priorité | Livrable | Dépendances | Domaine |
|---|---|---|---|---|
| **1** | 🔴 CRITIQUE | Backend : entités JPA + migrations DB + seed rôles `LOGISTIQUE` / `CHEF_CHANTIER` + permissions | — | Backend |
| **2** | 🔴 CRITIQUE | Backend : endpoints engins + machine à états `MouvementEngin` | Phase 1 | Backend |
| **3** | 🔴 CRITIQUE | Backend : endpoints DMA + machine à états `DemandeMateriel` | Phase 1 | Backend |
| **4** | 🟠 HAUTE | Backend : système de notifications — 11 nouveaux types + dispatch multi-destinataires | Phases 2–3 | Backend |
| **5** | 🟠 HAUTE | Backend : sécurisation `@PreAuthorize` routes `/engins` et `/materiaux` (actuellement sans contrôle granulaire) | Phase 1 | Backend |
| **6** | 🟠 HAUTE | Frontend web : tableau de bord logistique — parc engins, mouvements en cours, filtres | Phase 2 | Frontend |
| **7** | 🟠 HAUTE | Frontend web : gestion DMA logistique — file de traitement, historique, liaison commande | Phase 3 | Frontend |
| **8** | 🟠 HAUTE | Frontend web : composants validation DMA pour `CHEF_PROJET` (extension module projet existant) | Phase 3 | Frontend |
| **9** | 🟡 NORMALE | Mobile : création projet + authentification JWT (réutilisation backend existant) | Phase 1 | Mobile |
| **10** | 🟡 NORMALE | Mobile : saisie DMA + confirmation départ/réception engin + suivi statuts | Phases 2–3 | Mobile |
| **11** | 🟡 NORMALE | Mobile : notifications push FCM — intégration backend | Phases 4–10 | Mobile |
| **12** | 🟡 NORMALE | Mobile : mode hors-ligne partiel — file locale DMA, synchronisation à la reconnexion | Phase 10 | Mobile |
| **13** | 🟢 BASSE | Reporting : SLA DMA par projet, taux occupation engins, historique par machine | Phases 2–3 | Backend |

### Légende des priorités

| Niveau | Signification |
|---|---|
| 🔴 **CRITIQUE** | Bloquant — aucune autre phase ne peut démarrer |
| 🟠 **HAUTE** | Forte valeur métier — à livrer dans la foulée |
| 🟡 **NORMALE** | Important mais non bloquant |
| 🟢 **BASSE** | Valeur ajoutée — planifier après les phases essentielles |

---

*Document généré depuis la spécification source `spec_MIKA_engins_DMA.xlsx` — v1.0 — Mars 2026*
