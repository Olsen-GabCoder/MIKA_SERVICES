# Module Qualité V2 — Plan de livrables

> Phase 2 — Plan validé avant toute implémentation
> Source de vérité : `docs/SOURCE_MODULE_QUALITE.md`

---

## Vue d'ensemble

**14 livrables** ordonnés, du nettoyage à la synthèse mensuelle.

| # | Titre | Effort | Couche | Dépend de |
|---|-------|--------|--------|-----------|
| 0 | Nettoyage existant | M | both | — |
| 1 | Rôles et permissions Qualité | M | both | #0 |
| 2 | DemandeReception — backend | L | backend | #1 |
| 3 | DemandeReception — frontend | L | frontend | #2 |
| 4 | EssaiLaboratoireBeton — full stack | S | both | #1 |
| 5 | LeveeTopographique — full stack | S | both | #1 |
| 6 | AgrementMarche — backend | M | backend | #1 |
| 7 | AgrementMarche — frontend | M | frontend | #6 |
| 8 | EvenementQualite — backend core | L | backend | #1 |
| 9 | EvenementQualite — backend workflow | L | backend | #8 |
| 10 | EvenementQualite — frontend liste + création | L | frontend | #9 |
| 11 | EvenementQualite — frontend détail + signatures | L | frontend | #10 |
| 12 | Documents qualité | M | both | #1 |
| 13 | Synthèse mensuelle | L | both | #2, #4, #5, #6, #8 |

**Effort** : S = ~30 min, M = ~1h, L = ~2h+

---

## Progression sidebar

| Après livrable | Entrées sous groupe Qualité |
|----------------|-----------------------------|
| #0 | Aucune (groupe supprimé) |
| #1 | Aucune (rôles créés, pas encore d'UI) |
| #3 | **Réceptions travaux** |
| #4 | Réceptions travaux, **Essais laboratoire béton** |
| #5 | Réceptions travaux, Essais laboratoire béton, **Levée topographique** |
| #7 | Réceptions travaux, Essais laboratoire béton, Levée topographique, **Agréments marché** |
| #10 | Réceptions travaux, Essais laboratoire béton, Levée topographique, Agréments marché, **NC / RC / PPI** |
| #12 | Réceptions travaux, Essais laboratoire béton, Levée topographique, Agréments marché, NC / RC / PPI, **Documents qualité** |
| #13 | **Synthèse mensuelle**, Réceptions travaux, Essais laboratoire béton, Levée topographique, Agréments marché, NC / RC / PPI, Documents qualité |

État final = 7 entrées, ordre conforme à la demande.

---

## Parallélisation possible

Après #1, les blocs d'entités indépendantes peuvent être menés en parallèle :

```
#1 (Rôles)
  ├── #2 → #3   (DemandeReception)
  ├── #4         (EssaiLabo — full stack, petit)
  ├── #5         (LeveeTopo — full stack, petit)
  ├── #6 → #7   (AgrementMarche)
  ├── #8 → #9 → #10 → #11  (EvenementQualite)
  └── #12        (Documents qualité)
        │
        └── #13 (Synthèse — agrège tout)
```

En pratique, on implémente séquentiellement avec checkpoints, mais les groupes #2-#3, #4, #5, #6-#7, et #12 n'ont aucune dépendance entre eux.

---

## Détail des livrables

### Livrable #0 — Nettoyage existant

**Scope** : suppression propre de ControleQualite et NonConformite (v1 QSHE), dans les deux couches.

**Backend — fichiers à supprimer (16 fichiers)** :

| Catégorie | Fichiers |
|-----------|----------|
| Entities | `qshe/entity/ControleQualite.kt`, `qshe/entity/NonConformite.kt` |
| Controllers | `qshe/controller/ControleQualiteController.kt`, `qshe/controller/NonConformiteController.kt` |
| Services | `qshe/service/ControleQualiteService.kt`, `qshe/service/NonConformiteService.kt` |
| Repositories | `qshe/repository/ControleQualiteRepository.kt`, `qshe/repository/NonConformiteRepository.kt` |
| DTOs request | `qshe/dto/request/ControleQualiteRequest.kt`, `qshe/dto/request/NonConformiteRequest.kt` |
| DTOs response | `qshe/dto/response/ControleQualiteResponse.kt`, `qshe/dto/response/NonConformiteResponse.kt` |
| Mappers | `qshe/mapper/ControleQualiteMapper.kt`, `qshe/mapper/NonConformiteMapper.kt` |
| Enums | `qshe/enums/TypeControleQualite.kt`, `qshe/enums/StatutControle.kt`, `qshe/enums/ResultatControle.kt`, `qshe/enums/GraviteNonConformite.kt`, `qshe/enums/StatutNonConformite.kt`, `qshe/enums/TypeDefaut.kt`, `qshe/enums/DecisionTraitement.kt` |

**Frontend — fichiers à supprimer (8 fichiers)** :

| Catégorie | Fichiers |
|-----------|----------|
| Pages | `features/qshe/pages/ControlesQualitePage.tsx`, `features/qshe/pages/NonConformitesPage.tsx` |
| API clients | `api/qsheControleApi.ts`, `api/qsheNcApi.ts` |
| Redux slices | `store/slices/qsheControleSlice.ts`, `store/slices/qsheNcSlice.ts` |
| Types | `types/qsheControle.ts`, `types/qsheNc.ts` |

**Frontend — fichiers à modifier (4 fichiers)** :

| Fichier | Modification |
|---------|-------------|
| `store/store.ts` | Retirer imports et reducers `qsheControle`, `qsheNc` |
| `router/Router.tsx` | Retirer lazy imports et routes `/qshe/controles`, `/qshe/non-conformites` |
| `components/layout/sidebarConfig.tsx` | Retirer `QUALITE_GROUP` et ses icônes |
| `constants/api.ts` | Retirer blocs `QSHE_CONTROLES` et `QSHE_NC` |

**Backend — fichiers à modifier** :

| Fichier | Modification |
|---------|-------------|
| `qshe/service/QsheNotificationService.kt` | Retirer méthode `notifierNonConformiteCree()` et import NC |

**Références existantes à laisser avec TODO** : `ReportingService.kt` et `ReportingResponses.kt` gardent leurs TODO QSHE v2 inchangés.

**Vérification** : `mvnw compile` + `tsc --noEmit` + `vite build` + navigation — aucun module SHE ne doit être cassé.

---

### Livrable #1 — Rôles et permissions Qualité

**Scope** : 7 nouveaux rôles système + permissions Qualité étendues + seed data + i18n.

**Backend** :

1. **SeedDataInitializer.kt** — ajouter la création des 7 rôles :

| Code | Nom | Niveau | Description |
|------|-----|--------|-------------|
| DIRECTEUR_TECHNIQUE | Directeur Technique | DIRECTION | Signature collégiale section 6 NC |
| RESPONSABLE_QUALITE | Responsable Qualité | CADRE_SUPERIEUR | Pilote module Qualité, signe sections 4/5/6/7 |
| INGENIEUR_QUALITE | Ingénieur Qualité | CADRE_MOYEN | Détection, proposition traitement, vérification |
| CONTROLEUR_TECHNIQUE | Contrôleur Technique | CADRE_MOYEN | Vérification section 4, signature collégiale section 6 |
| ASSISTANT_QUALITE | Assistant Qualité | AGENT_MAITRISE | Détection terrain, aide saisie |
| TECHNICIEN_LABORATOIRE | Technicien Laboratoire Qualité | AGENT_MAITRISE | Essais labo béton |
| TECHNICIEN_TOPOGRAPHIE | Technicien Topographie | AGENT_MAITRISE | Levée topographique |

2. **Permissions** — ajouter des permissions spécifiques au module QUALITE_V2 :
   - Les 4 permissions QUALITE existantes (READ/CREATE/UPDATE/DELETE) sont assignées aux 7 nouveaux rôles
   - Permissions additionnelles à créer : `QUALITE_SIGN` (type VALIDATE), `QUALITE_CONFIG` (type ADMIN)
   - `QUALITE_SIGN` → tous les rôles Qualité + CHEF_CHANTIER
   - `QUALITE_CONFIG` → RESPONSABLE_QUALITE uniquement (+ ADMIN/SUPER_ADMIN implicite)

3. **Vérification** : `NiveauHierarchique` contient déjà `AGENT_MAITRISE` — aucune modification nécessaire.

4. **Utilisateurs de test** : créer 7 utilisateurs fictifs (un par rôle) dans le seed data dev/staging.

**Frontend** :

1. **i18n** — ajouter dans `locales/fr/qshe.json` et `locales/en/qshe.json` (ou nouveau namespace `qualite`) les libellés des 7 rôles.

2. **Page gestion utilisateurs** — vérifier que les nouveaux rôles apparaissent dans le sélecteur de rôles existant (pas de nouvelle page à créer).

**Vérification** : login avec chaque utilisateur fictif → le rôle s'affiche correctement dans le profil.

---

### Livrable #2 — DemandeReception — backend

**Scope** : entity, enums, CRUD complet, workflow 5 statuts. Couvre les blocs 1-3 du Document A.

**Source** : Document A, blocs 1 (Topographie), 2 (Géotechnique/Labo), 3 (Ouvrage). Chacun contient 2 sous-tableaux (Terrassement + Génie Civil) avec 5 statuts identiques.

**Entité `DemandeReception`** :
- Rattachée à un projet
- Nature : enum 3 valeurs (TOPOGRAPHIE, GEOTECHNIQUE_LABORATOIRE, OUVRAGE)
- Sous-type : enum 2 valeurs (TERRASSEMENT, GENIE_CIVIL)
- Statut : enum 5 valeurs (ETABLIE, EN_ATTENTE_MDC, ACCORDEE_SANS_RESERVE, ACCORDEE_AVEC_RESERVE, REJETEE)
- Champs : référence auto-générée, titre, description, date demande, zone/ouvrage concerné, demandeur (FK user), décideur MdC (FK user, nullable), date décision, observations, PJ
- Mois de référence (pour agrégation synthèse mensuelle)

**Controller** : CRUD + liste par projet paginée + filtre par nature/sous-type/statut + summary par projet+mois

**Permissions** : création → rôles Qualité + CHEF_CHANTIER. Lecture → authentifié. Suppression → ADMIN/SUPER_ADMIN.

---

### Livrable #3 — DemandeReception — frontend

**Scope** : page complète + entrée sidebar.

**Page "Réceptions travaux"** :
- Sélecteur projet
- Onglets ou filtres par nature (Topographie / Géotechnique / Ouvrage)
- Sous-filtres par sous-type (Terrassement / Génie Civil)
- KPI : total demandes, répartition par statut (5 barres, comme le graphique du Document A)
- Liste paginée avec statut coloré
- Modale de création : nature, sous-type, titre, zone/ouvrage, date demande
- Détail avec modification de statut (workflow linéaire)

**Sidebar** : ajout entrée "Réceptions travaux" sous nouveau groupe Qualité.

---

### Livrable #4 — EssaiLaboratoireBeton — full stack

**Scope** : entité simple à 4 compteurs + page complète + entrée sidebar. Couvre le bloc 4 du Document A.

**Source** : Document A, bloc 4 — 4 lignes de compteurs mensuels.

**Entité `EssaiLaboratoireBeton`** :
- Rattachée à un projet + mois de référence
- 4 champs numériques : nbCamionsMalaxeursVolumeCoulee, nbEssaisSlump, nbJoursCoulage, nbPrelevements
- Observations texte libre

**Page "Essais laboratoire béton"** :
- Sélecteur projet + sélecteur mois
- Tableau de saisie des 4 compteurs
- Historique mensuel
- Pas de workflow de statut — c'est de la saisie de données

**Permissions** : saisie → TECHNICIEN_LABORATOIRE + rôles Qualité supérieurs. Lecture → authentifié.

**Sidebar** : ajout entrée "Essais laboratoire béton".

---

### Livrable #5 — LeveeTopographique — full stack

**Scope** : entité simple à 3 compteurs + page complète + entrée sidebar. Couvre le bloc 5 du Document A.

**Source** : Document A, bloc 5 — 3 lignes de compteurs.

**Entité `LeveeTopographique`** :
- Rattachée à un projet + mois de référence
- 3 champs numériques : nbProfilsImplantes, nbProfilsReceptionnes, nbControlesRealises
- Observations texte libre

**Page "Levée topographique"** :
- Sélecteur projet + sélecteur mois
- Tableau de saisie des 3 compteurs
- Historique mensuel

**Permissions** : saisie → TECHNICIEN_TOPOGRAPHIE + rôles Qualité supérieurs. Lecture → authentifié.

**Sidebar** : ajout entrée "Levée topographique".

---

### Livrable #6 — AgrementMarche — backend

**Scope** : entity, enums, CRUD, workflow 6 statuts. Couvre le bloc 6 du Document A.

**Source** : Document A, bloc 6 — workflow distinct du workflow de réception.

**Entité `AgrementMarche`** :
- Rattachée à un projet
- Statut : enum 6 valeurs (PREVU_AU_MARCHE, ETABLI, EN_ATTENTE_MDC, ACCORDE_SANS_RESERVE, ACCORDE_AVEC_RESERVE, REJETE)
- Champs : référence auto-générée, objet (produit/fournisseur/matériau), titre, description, date soumission, date décision, décideur MdC (FK user, nullable), observations
- Mois de référence

**Controller** : CRUD + liste par projet paginée + filtre par statut + summary par projet+mois.

**Permissions** : même logique que DemandeReception.

---

### Livrable #7 — AgrementMarche — frontend

**Scope** : page complète + entrée sidebar.

**Page "Agréments marché"** :
- Sélecteur projet
- KPI : prévus au marché, établis, en attente, accordés, rejetés (graphique barres fidèle au Document A)
- Liste paginée avec workflow de statut
- Modale de création
- Détail avec transition de statut

**Sidebar** : ajout entrée "Agréments marché".

---

### Livrable #8 — EvenementQualite — backend core

**Scope** : entités principales du workflow NC/RC/PPI. Couvre le Document B, structure de la fiche.

**Source** : Document B — en-tête + 7 sections + annexe photos.

**Entités** :
- `EvenementQualite` : entité principale
  - Type : enum (NC, RC, PPI) — exclusif
  - Catégories : multi-sélection (QUALITE, SECURITE, ENVIRONNEMENT) — stockée comme Set
  - Origine : enum (TRAVAUX, RECEPTION_PRODUITS, ETUDE) — exclusif
  - Rattaché à un projet + ouvrage concerné
  - Bloc sous-traitance : nom fournisseur, n° BC, n° BL, date livraison
  - Contrôle exigé CCTP : booléen
  - Référence auto-générée
  - Statut global calculé à partir de la progression des sections

- `SectionEvenement` : chaque section (1 à 7) de la fiche
  - Numéro section (1-7)
  - Contenu texte libre (description, vérification, analyse causes...)
  - Pièces jointes (texte — pour section 1 et 4)
  - Signataire désigné (FK user) — assigné à la création
  - Signataire effectif (FK user, nullable) — rempli à la signature
  - Date de signature (nullable)
  - Signée : booléen
  - Champs spécifiques section 2 : choix correction/dérogation (enum)
  - Champs spécifiques section 6 : nécessité CAPA (booléen, nullable)

- `SectionSignataireCollegial` : pour la section 6 uniquement (4 signatures)
  - Section FK
  - Rôle attendu (DT/RQ/CT/CC)
  - Signataire désigné (FK user)
  - Signataire effectif (FK user, nullable)
  - Date de signature (nullable)
  - Signée : booléen

**Enums** : TypeEvenement, CategorieEvenement, OrigineEvenement, ChoixTraitement (CORRECTION, DEROGATION), NumeroSection (1-7)

**Controller** : CRUD + liste par projet paginée + filtres (type, catégorie, origine, statut)

---

### Livrable #9 — EvenementQualite — backend workflow

**Scope** : logique de signature, actions de traitement, pièces jointes, validation dynamique.

**Source** : Document B — sections 2, 6, annexe photos + workflow de signature par assignation nommée.

**Entités complémentaires** :
- `ActionTraitement` : lignes d'action de la section 2
  - FK section
  - Description de l'action
  - Responsable (texte ou FK user)
  - Délai prévu (date)

- `PieceJointeEvenement` : photos avec légende
  - FK section (rattachée à une section spécifique)
  - URL fichier
  - Légende texte
  - Ordre d'affichage

**Logique de signature** :
- Endpoint `POST /api/qualite/evenements/{id}/sections/{numSection}/signer`
- Double vérification : (1) l'utilisateur connecté = signataire désigné, (2) l'utilisateur a le rôle attendu
- Refus avec message explicite si l'une des conditions échoue
- Section 6 : signature individuelle par chaque membre du collège (4 signatures requises)
- Section 6 signée = les 4 signatures collégiales sont présentes

**Statut global calculé** :
- BROUILLON : section 1 non signée
- DETECTEE : section 1 signée
- EN_TRAITEMENT : section 2 signée
- EN_VERIFICATION : section 4 signée
- LEVEE : section 5 signée
- ANALYSEE : section 6 signée (4 signatures collégiales complètes)
- CLOTUREE : section 7 signée

**Notification** : à chaque signature, notification au signataire désigné de la section suivante.

---

### Livrable #10 — EvenementQualite — frontend liste + création

**Scope** : page NC/RC/PPI avec liste et formulaire de création + entrée sidebar.

**Page "NC / RC / PPI"** :
- Sélecteur projet
- KPI : encart fidèle au bloc 7 du Document A (NC enregistrées, NC traitées, coûts NC)
- Filtres : type (NC/RC/PPI), catégorie (Q/S/E), origine, statut
- Liste paginée avec badges type + catégories + statut coloré
- Modale de création fidèle au Document B :
  - Type (exclusif) : NC / RC / PPI
  - Catégories (multi) : Qualité / Sécurité / Environnement
  - Origine (exclusif) : Travaux / Réception produits / Étude
  - Bloc identification : ouvrage concerné, contrôle exigé CCTP
  - Bloc sous-traitance conditionnel : fournisseur, BC, BL, date livraison
  - Description (texte riche)
  - PJ photos avec légende
  - Assignation des signataires pour chaque section (2, 4, 5, 6, 7)

**Sidebar** : ajout entrée "NC / RC / PPI".

---

### Livrable #11 — EvenementQualite — frontend détail + signatures

**Scope** : page de détail d'un événement avec vue section par section et système de signature.

**Page détail** :
- Vue en sections numérotées (1 à 7), fidèle à la fiche papier
- Chaque section affiche : contenu, signataire désigné, état (signée/en attente), date
- Section active = la prochaine à signer (progression séquentielle)
- Bouton "Signer" visible uniquement pour l'utilisateur désigné + message si mauvais rôle
- Section 2 : tableau d'actions éditable (ajout/suppression lignes) + choix Correction/Dérogation
- Section 6 : vue collégiale avec 4 lignes de signature (DT, RQ, CT, CC) + case CAPA
- Annexe photos : galerie avec légendes
- Timeline latérale résumant la progression (sections signées avec dates)

---

### Livrable #12 — Documents qualité

**Scope** : référentiel versionné des templates de formulaires qualité + page + entrée sidebar.

**Source** : les deux documents portent un code + version (`MS-Chantier-QUA-T3(4-05)` v1, `MS-QUA-F2-V1` v1).

**Entité `DocumentQualite`** :
- Code document (unique)
- Titre
- Version courante
- Date de création
- Date de dernière modification
- Description
- Fichier associé (URL)
- Actif : booléen
- Historique des versions (OneToMany)

**Entité `VersionDocumentQualite`** :
- FK document
- Numéro de version
- Date
- Auteur (FK user)
- Fichier (URL)
- Commentaire de version

**Page "Documents qualité"** :
- Liste des documents avec version courante, date, statut actif/archivé
- Upload de nouvelle version
- Historique des versions par document

**Permissions** : configuration → RESPONSABLE_QUALITE + ADMIN/SUPER_ADMIN. Lecture → authentifié.

**Sidebar** : ajout entrée "Documents qualité".

---

### Livrable #13 — Synthèse mensuelle

**Scope** : tableau de bord mensuel calculé dynamiquement + page + entrée sidebar.

**Source** : Document A — 6 blocs + encart NC.

**Pas d'entité de stockage** — calcul dynamique à partir des données existantes :
- Blocs 1-3 : agrégation des `DemandeReception` par nature × sous-type × statut pour le mois sélectionné
- Bloc 4 : lecture directe de `EssaiLaboratoireBeton` du mois
- Bloc 5 : lecture directe de `LeveeTopographique` du mois
- Bloc 6 : agrégation des `AgrementMarche` par statut pour le mois
- Encart NC : agrégation des `EvenementQualite` (enregistrées, traitées, coûts) pour le mois

**Colonne Statistique** : pourcentage calculé = (quantité ligne / total du bloc) × 100

**Page "Synthèse mensuelle"** :
- Sélecteur projet + sélecteur mois
- Reproduction fidèle du layout A3 du Document A : 6 blocs + encart NC
- Chaque bloc avec son tableau quantité/statistique + graphique barres
- Export PDF (layout A3 paysage, fidèle au document papier)

**Backend** : endpoint `GET /api/qualite/synthese/{projetId}/{mois}` qui retourne la structure complète pré-calculée.

**Sidebar** : ajout entrée "Synthèse mensuelle" en première position.

---

## Points d'arbitrage (validation requise avant #2)

### Arbitrage 1 — Module Kotlin : `modules/qualite/` ou `modules/qshe/qualite/`

Le code Qualité v2 sera sous un nouveau package. Deux options :
- **Option A** : `modules/qualite/` — package autonome, séparé du QSHE existant (inspections, incidents, risques restent dans `modules/qshe/`)
- **Option B** : `modules/qshe/qualite/` — sous-package du QSHE

Ma recommandation : **Option A** — le module Qualité a son propre scope métier, ses propres rôles, ses propres documents source. La séparation physique reflète la séparation fonctionnelle.

### Arbitrage 2 — Namespace i18n

Les traductions Qualité v2 vont dans :
- **Option A** : nouveau namespace `qualite` (fichiers `locales/fr/qualite.json` et `en/qualite.json`)
- **Option B** : extension du namespace `qshe` existant (ajouter des clés dans `qshe.json`)

Ma recommandation : **Option A** — namespace dédié `qualite`, cohérent avec la séparation fonctionnelle.

### Arbitrage 3 — Préfixe des tables en base

Les nouvelles tables :
- **Option A** : préfixe `qualite_` (ex: `qualite_demandes_reception`, `qualite_evenements`)
- **Option B** : préfixe `qshe_qualite_` (cohérent avec le préfixe `qshe_` des tables SHE existantes)

Ma recommandation : **Option A** — `qualite_` suffit, plus lisible.

### Arbitrage 4 — Base path des endpoints REST

- **Option A** : `/api/qualite/...` (nouveau préfixe)
- **Option B** : `/api/qshe/qualite/...` (sous-préfixe du QSHE existant)

Ma recommandation : **Option A** — `/api/qualite/...` pour marquer la rupture avec l'ancienne implémentation.

### Arbitrage 5 — Section 3 manquante du formulaire NC

Le Document B saute de la section 2 à la section 4. Trois options :
- **Option A** : modéliser 7 sections (1-7) avec la section 3 nullable/désactivée, fidèle au formulaire papier
- **Option B** : modéliser 6 sections (1, 2, 4, 5, 6, 7) en gardant la numérotation originale
- **Option C** : renuméroter en 6 sections (1-6) pour simplifier

Ma recommandation : **Option B** — garder la numérotation du formulaire papier (les utilisateurs parlent de "section 4", "section 6") mais ne pas créer de section 3 vide inutile.
