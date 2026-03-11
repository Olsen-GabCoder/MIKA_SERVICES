# Plan d'action — Dashboard Barème bâtiment (frontend)

**Objectif :** Mettre en place l’interface de consultation du barème de prix bâtiment : liste d’articles avec filtres, détail avec prix par fournisseur, comparaison et (optionnel) prise en compte du coefficient d’éloignement.

**Contexte :** Le backend expose déjà les APIs nécessaires (voir `PLAN_ACTION_BACKEND_BAREME_DASHBOARD.md`). Stack frontend : React 19, Vite, MUI, React Router, TanStack Query, Zustand.

**Règle :** Validation de votre part avant de passer d’une étape à l’autre.

---

## APIs backend disponibles (rappel)

| Endpoint | Rôle |
|----------|------|
| `GET /api/bareme/coefficients-eloignement` | Liste des villes/localités avec %, coefficient, note |
| `GET /api/bareme/corps-etat` | Liste des 15 corps d’état (Gros-Oeuvre, Assainissement, etc.) |
| `GET /api/bareme/articles` | Liste paginée avec filtres : `corpsEtatId`, `type`, `fournisseurId`, `recherche` |
| `GET /api/bareme/articles/{id}` | Détail : en-tête + prix par fournisseur (matériaux) ou décomposition + Déboursé/P.V (prestations) |
| `GET /api/bareme/derniere-mise-a-jour` | Date du dernier import (affichage sur le dashboard) |
| `POST /api/bareme/import` | Import Excel (réservé admin) |

---

## Étapes du plan (frontend)

---

### **ÉTAPE 1 — Structure du module et appels API**

**Objectif :** Créer le module frontend « Barème » et connecter les APIs.

**Livrables :**

1. **Structure du feature**
   - Dossier `src/features/bareme/` avec sous-dossiers : `api/`, `components/`, `pages/`, `types/`, `hooks/` (si besoin).

2. **Types TypeScript**
   - Interfaces alignées sur les réponses backend :
     - `CoefficientEloignement`, `CorpsEtatBareme`, `BaremeArticleList`, `BaremeArticleDetail`, `PrixFournisseur`, `LignePrestation`, `BaremeVersion`.

3. **Client API**
   - Fonctions (ou hook `useBaremeApi`) qui appellent les endpoints avec le client HTTP existant (axios + token) :
     - `getCoefficientsEloignement()`, `getCorpsEtat()`, `getArticles(params, page)`, `getArticleById(id)`, `getDerniereMiseAJour()`.
   - Utilisation de **TanStack Query** (useQuery / useInfiniteQuery) pour cache, chargement et rafraîchissement.

4. **Route et entrée menu**
   - Route : `/barème` ou `/bareme` (une page principale « Barème »).
   - Entrée dans la sidebar (icône type « liste de prix » ou « document ») et traduction i18n (ex. `sidebar.bareme`).

**Validation requise :**  
- Préférence d’URL : `/bareme` ou `/barème` (avec accent) ?  
- Le barème doit-il être accessible à tous les utilisateurs connectés (comme le backend) ?

---

### **ÉTAPE 2 — Page liste des articles (table + filtres)**

**Objectif :** Afficher la liste paginée des articles du barème avec filtres.

**Livrables :**

1. **Page principale Barème**
   - Titre, sous-titre (ex. « Consulter et comparer les prix du barème bâtiment »).
   - Affichage de la **dernière mise à jour** (appel à `GET /api/bareme/derniere-mise-a-jour`), avec message du type « Données mises à jour le … » ou « Aucun import » si `null`.

2. **Filtres**
   - **Corps d’état** : liste déroulante (select) alimentée par `GET /api/bareme/corps-etat` (option « Tous »).
   - **Type** : Matériau / Prestation (ou « Tous »).
   - **Fournisseur** : liste déroulante optionnelle (liste des fournisseurs barème : à déduire des articles ou via un endpoint dédié si ajouté côté backend).
   - **Recherche** : champ texte (recherche sur le libellé), debounce 300–400 ms.

3. **Tableau des articles**
   - Colonnes : Référence, Libellé, Unité, Corps d’état, Type, Fournisseur (ou « N fournisseurs »), Prix TTC / Déboursé–P.V selon type, Action (lien « Voir détail »).
   - Pagination (taille de page 20, paramètres `page` et `size`).
   - Gestion du chargement (skeleton ou spinner) et des états vides (aucun résultat, aucun import).

4. **Comportement**
   - Les filtres mettent à jour l’URL (query params) pour partage et retour arrière.
   - Clic sur une ligne ou « Voir détail » → navigation vers la page détail (`/bareme/articles/:id`).

**Validation requise :**  
- Colonnes à afficher en priorité (toutes celles listées ou un sous-ensemble) ?  
- Souhaitez-vous un export CSV/Excel de la liste filtrée dès cette étape (optionnel) ?

---

### **ÉTAPE 3 — Page détail d’un article**

**Objectif :** Afficher le détail d’un article avec tous les prix par fournisseur et, pour les prestations, la décomposition.

**Livrables :**

1. **Route**
   - `/bareme/articles/:id` — page détail (lecture seule).

2. **En-tête**
   - Libellé, référence, unité, corps d’état, type (Matériau / Prestation).

3. **Cas Matériau**
   - Bloc « Prix par fournisseur » : tableau ou cartes avec colonnes Fournisseur, Contact, Prix TTC, Date prix.
   - Tri possible (par prix, par fournisseur).

4. **Cas Prestation**
   - Bloc « Décomposition » : tableau des lignes (Libellé, Qté, P.U, Unité, Somme).
   - Ligne de total : **Déboursé** (unité si présente), **P.V** (prix de vente), coefficient P.V (1,4 ou 1,6) si présent.

5. **Navigation**
   - Lien « Retour à la liste » qui préserve les filtres (retour vers `/bareme?corpsEtatId=…` etc.).

**Validation requise :**  
- Pour les matériaux avec plusieurs fournisseurs, affichage sous forme de tableau ou de cartes ?  
- Afficher ou non le coefficient d’éloignement sur cette page (sélecteur de ville → application du coef au P.V) ?

---

### **ÉTAPE 4 — Coefficient d’éloignement (optionnel)**

**Objectif :** Permettre d’appliquer le coefficient d’éloignement (ville/localité) pour recalculer un prix ou l’afficher à titre indicatif.

**Livrables :**

1. **Données**
   - Appel à `GET /api/bareme/coefficients-eloignement` (déjà prévu en Étape 1).

2. **Intégration possible**
   - **Option A** : Sur la page détail, un sélecteur « Localité » (ville) : affichage du coefficient et du « Prix avec éloignement » (ex. P.V × coefficient).
   - **Option B** : Bloc dédié « Coefficients d’éloignement » (page ou section) : liste des villes avec %, coefficient, note (informatif).
   - **Option C** : Les deux (sélecteur sur le détail + page liste des coefficients).

**Validation requise :**  
- Souhaitez-vous cette fonctionnalité dès la première version du dashboard (Option A, B ou C) ou la reporter ?

---

### **ÉTAPE 5 — Import barème (admin)**

**Objectif :** Permettre aux administrateurs de lancer un réimport du fichier Excel depuis l’interface.

**Livrables :**

1. **Zone réservée admin**
   - Sur la page Barème (ou dans une section « Administration barème »), affichage d’un bloc « Importer le barème » uniquement pour les rôles ADMIN / SUPER_ADMIN.

2. **Upload**
   - Bouton « Choisir un fichier » (input file .xls / .xlsx) + bouton « Importer ».
   - Appel à `POST /api/bareme/import` avec le fichier en multipart.
   - Affichage du résultat (nombre de coefficients, corps d’état, fournisseurs, lignes) ou des erreurs.

3. **Feedback**
   - Message de succès + mise à jour de l’affichage « Dernière mise à jour » (rafraîchir `getDerniereMiseAJour`).
   - En cas d’erreur (ex. 413, 500), affichage d’un message clair.

**Validation requise :**  
- L’import doit-il être accessible depuis la page Barème principale ou depuis une page « Paramètres / Administration » dédiée ?

---

### **ÉTAPE 6 — UX, i18n et recette**

**Objectif :** Finaliser l’expérience utilisateur, les textes et la recette.

**Livrables :**

1. **Traductions**
   - Clés i18n pour tous les libellés du module barème (namespace `bareme` ou `layout` pour le menu) : titres, filtres, colonnes, boutons, messages d’erreur et états vides.

2. **Cohérence visuelle**
   - Réutilisation des composants existants (PageContainer, boutons, tables MUI ou existantes, couleurs du thème).
   - États de chargement et erreurs homogènes avec le reste de l’application.

3. **Recette**
   - Checklist : filtres (corps d’état, type, recherche), pagination, détail matériau (plusieurs fournisseurs), détail prestation (décomposition + Déboursé/P.V), dernière mise à jour, import admin (si implémenté).

**Validation requise :**  
- Langues à supporter en priorité (FR uniquement ou FR + autre) ?

---

## Récapitulatif des étapes

| Étape | Titre | Point de validation |
|-------|--------|----------------------|
| 1 | Structure module + API | URL de la route, public cible (tous connectés ?) |
| 2 | Liste articles + filtres | Colonnes, export CSV optionnel |
| 3 | Détail article | Format affichage prix fournisseurs, lien coefficient éloignement |
| 4 | Coefficient d’éloignement | Inclus ou reporté (A / B / C) |
| 5 | Import admin | Emplacement (page Barème vs admin) |
| 6 | UX, i18n, recette | Langues |

---

## Ordre d’exécution

1. **Étape 1** → validation → **Étape 2** → validation → **Étape 3** → validation → etc.  
2. Les étapes 4 et 5 peuvent être traitées après la 3 si vous souhaitez une première version « consultation seule » sans import ni coefficient d’éloignement.

---

## Dépendances techniques

- **Backend** : toutes les APIs listées en tête de document doivent être disponibles et testées.
- **Frontend** : authentification (token JWT) pour les appels API ; rôles utilisateur pour l’affichage conditionnel de l’import (admin).

Dès que vous validez l’**Étape 1** (structure, types, appels API, route et menu), on peut détailler les fichiers à créer et les implémenter.
