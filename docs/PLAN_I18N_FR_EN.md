# Plan d’action – Gestion des paramètres de langue (FR / EN)

**Projet : MIKA Services**  
**Objectif :** Intégrer le français et l’anglais de façon cohérente, stable et synchronisée, sans reproduire les problèmes rencontrés avec le mode sombre (flash, éléments non pris en compte).

---

## 1. Analyse du projet

### 1.1 Structure

| Zone        | Chemin                                    | Rôle                    |
|------------|--------------------------------------------|-------------------------|
| Frontend   | `frontend_web/mika-services-frontend/`     | SPA React (Vite)        |
| Backend    | `backend/`                                | API REST Spring (Kotlin)|

**Stack frontend :** React 19, TypeScript, Vite, Redux, React Query, React Router, Tailwind. **Aucune librairie i18n actuelle.**

**Stack backend :** Spring Boot 4, Kotlin, JWT, validation. Messages d’erreur et de validation en français en dur.

### 1.2 Flux de données

Pages → hooks (useAppSelector / useAppDispatch) → slices Redux → `src/api/*.ts` → axios (`baseURL: '/api'`) → backend. Pas de SSR ; la langue peut être appliquée avant le premier rendu (comme le thème).

---

## 2. Inventaire des textes à traduire

### 2.1 Frontend

| Catégorie | Exemples | Fichiers / zones concernés |
|-----------|----------|----------------------------|
| **Layout** | Labels menu, fil d’Ariane, footer, sidebar (Navigation, Paramètres, Mode sombre, Déconnexion, etc.) | `sidebarConfig.tsx`, `headerConfig.ts`, `Header.tsx`, `Footer.tsx`, `Sidebar.tsx` |
| **Pages – titres** | « Tableau de bord », « Gestion des Projets », « Planning & Tâches », etc. | Toutes les `*Page.tsx` sous `features/` |
| **Formulaires** | Labels, placeholders, boutons (Enregistrer, Annuler), messages de validation (zod / react-hook-form) | `LoginForm.tsx`, `ProjetFormPage.tsx`, `UserForm.tsx`, `EquipeFormPage.tsx`, `ReunionHebdoFormPage.tsx`, etc. |
| **Messages système** | « Une erreur est survenue », « Chargement… », « Aucun résultat » | `errorHandler.ts`, divers composants |
| **Confirmations / alertes** | `confirm('Supprimer ce point bloquant ?')`, `alert('Erreur…')` | ProjetFormPage, PlanningPage, DocumentPage, SecuritePage, QualitePage, EquipeListPage, MateriauListPage, EnginListPage, FournisseurPage, ReunionHebdo* |
| **Tableaux** | En-têtes de colonnes, filtres (Statut, Type, Client), pagination (Précédent, Suivant, Afficher X par page), actions | ProjetListPage, EquipeListPage, EnginListPage, MateriauListPage, UserList, ReunionHebdoListPage |
| **Énumérations** | Statuts projet (En attente, Planifié, En cours…), types projet (Voirie, Route…), priorité tâche | `types/projet.ts`, constantes dans les pages, exports Excel |
| **Formatage** | Montants (XAF), dates | `formatMontant` (fr-FR), usages de `Intl.NumberFormat` / `toLocaleDateString` |
| **Erreurs API** | Messages et `details` renvoyés par l’API | Affichés via `errorHandler` et formulaires |

### 2.2 Backend

| Catégorie | Exemples | Fichiers concernés |
|-----------|----------|--------------------|
| **Erreurs globales** | « Ressource non trouvée », « Non autorisé », « Requête invalide », « Corps de la requête invalide… » | `ApiConstants.kt`, `GlobalExceptionHandler.kt` |
| **Validations** | Messages des annotations `@NotBlank`, `@Size`, etc. (ex. « L’intitulé du projet est obligatoire ») | Tous les DTOs dans `modules/*/dto/request/*.kt` |

---

## 3. Décisions techniques

### 3.1 Stockage et moment d’application de la langue

- **Stockage :** `localStorage` avec clé `mika-locale` (valeurs `fr` / `en`), comme pour `mika-theme`.
- **Moment d’application :**
  1. **Script dans `index.html`** (avant tout bundle) : lire `mika-locale`, définir `document.documentElement.lang` et éventuellement `window.__INITIAL_LOCALE__`.
  2. **Bootstrap i18n synchrone dans `main.tsx`** (avant `createRoot`) : initialiser i18next avec la locale lue (storage ou `__INITIAL_LOCALE__`), charger les namespaces du premier écran de façon synchrone ou bloquer le rendu jusqu’à ce qu’ils soient prêts.
- **Éviter :** appliquer la langue uniquement après le premier rendu (risque de flash).

### 3.2 Librairie frontend

- **Recommandation :** **react-i18next** + **i18next**.
- **Namespaces :** `common`, `layout`, `auth`, `user`, `projet`, `equipe`, `reunionHebdo`, `communication`, `errors`, etc. (un par domaine ou page lourde).
- **Clés structurées :** ex. `projet.list.title`, `projet.list.filters.status`, `auth.login.emailRequired`.

### 3.3 Backend

- **Recommandation :** **MessageSource** Spring + résolution de la locale via **Accept-Language** (ou header dédié `X-Locale`).
- Remplacer les chaînes en dur dans `ApiConstants` et `GlobalExceptionHandler` par des clés, et les messages de validation des DTOs par des clés (ex. `{validation.required}`).
- Le front envoie la locale dans chaque requête (intercepteur axios) ; le backend renvoie des messages déjà traduits dans `ApiError.message` et `details`.

---

## 4. Risques « type mode sombre » et parades

| Risque | Parade |
|--------|--------|
| Texte en dur non passé par `t()` | Inventaire exhaustif (cf. §2) ; remplacement systématique ; revue de code / recherche de chaînes. |
| Flash de langue au chargement | Script dans `index.html` + init i18n **avant** `createRoot` ; chargement synchrone des namespaces du premier écran (ou écran de chargement jusqu’à `i18n.isInitialized`). |
| `document.lang` incohérent | Définir `document.documentElement.lang` dans le script initial ; le mettre à jour à chaque `i18n.changeLanguage`. |
| Erreurs API en français uniquement | Backend MessageSource + `Accept-Language` ; front envoie la locale dans axios. |
| Validations front en français uniquement | Toutes les chaînes de validation (zod, register) en clés i18n ; `t()` appelé au moment de la validation. |
| `confirm` / `alert` en français uniquement | Remplacer par des modales ou un service utilisant `t()` pour les textes. |
| Formatage dates/montants en français uniquement | Utiliser `Intl.NumberFormat(i18n.language, ...)` et `toLocaleDateString(i18n.language, ...)` (ou équivalent). |

---

## 5. Plan d’action détaillé par phase

### Phase 1 : Setup + langue par défaut (sans flash)

| # | Tâche | Fichiers / zones | Validation |
|---|--------|-------------------|------------|
| 1.1 | Ajouter `i18next`, `react-i18next` ; optionnel : `i18next-browser-languagedetector`. | `package.json` | `npm install` OK. |
| 1.2 | Créer `src/i18n.ts` : init i18next, `fallbackLng: 'fr'`, `lng` depuis localStorage `mika-locale` ou défaut `fr` ; namespaces `common`, `layout`, `auth` ; chargement synchrone ou attente avant premier rendu. | `src/i18n.ts` | Locale et clés de test OK au chargement. |
| 1.3 | Créer `public/locales/fr/common.json`, `layout.json`, `auth.json` et versions `en/` avec clés minimales. | `public/locales/{fr,en}/*.json` | Fichiers valides. |
| 1.4 | Dans `index.html`, script en tête : lire `mika-locale`, poser `document.documentElement.lang` et `window.__INITIAL_LOCALE__`. | `index.html` | `html.lang` correct dès le premier paint. |
| 1.5 | Dans `main.tsx`, importer `./i18n` **avant** `createRoot` ; s’assurer que l’init i18n est terminée. | `main.tsx` | Pas de rendu avec clés brutes ou mauvaise langue au premier frame. |
| 1.6 | Ajouter `locale` dans `uiSlice` + persistance `mika-locale` + action `setLocale` ; à chaque changement, mettre à jour `document.documentElement.lang`. | `store/slices/uiSlice.ts`, évent. `utils/localeStorage.ts` | Changement de langue persisté et document à jour. |

### Phase 2 : Layout et pages principales

| # | Tâche | Fichiers | Validation |
|---|--------|----------|------------|
| 2.1 | Traduire tous les labels du menu et de la sidebar. | `sidebarConfig.tsx`, `Sidebar.tsx`, `layout.json` | Sidebar 100 % traduite. |
| 2.2 | Traduire fil d’Ariane et titres de section. | `headerConfig.ts`, `Header.tsx`, `layout.json` | Breadcrumbs et header OK. |
| 2.3 | Traduire Footer. | `Footer.tsx`, `layout.json` | Footer OK. |
| 2.4 | Traduire Login (titres, labels, placeholders, validation, erreurs, boutons). | `LoginPage.tsx`, `LoginForm.tsx`, `auth.json` | Login 100 % traduit. |
| 2.5 | Traduire Dashboard (titre, KPIs, alertes, chargement). | `DashboardPage.tsx`, `common` ou `dashboard.json` | Dashboard cohérent. |
| 2.6 | Traduire page 404. | `NotFoundPage.tsx`, `common` ou `errors.json` | 404 traduit. |

### Phase 3 : Formulaires et validations (front)

| # | Tâche | Fichiers | Validation |
|---|--------|----------|------------|
| 3.1 | Créer namespaces et JSON (fr/en) pour user, projet, equipe, reunionHebdo (labels, placeholders, boutons). | `public/locales/{fr,en}/*.json` | Clés prêtes. |
| 3.2 | Traduire formulaires utilisateur et profil. | `UserForm.tsx`, `ProfileForm.tsx`, `ProfileHeader.tsx`, etc., `user.json` | Formulaires user/profil en i18n. |
| 3.3 | Traduire formulaire projet (sections, champs, boutons, listes déroulantes statiques). | `ProjetFormPage.tsx`, `projet.json` | Formulaire projet en i18n. |
| 3.4 | Remplacer tous les messages de validation (zod, react-hook-form) par des clés i18n ; s’assurer que `t()` est appelé au moment de la validation. | Formulaires concernés, JSON associés | Messages de validation dans la bonne langue. |
| 3.5 | Traduire formulaires équipe et réunions hebdo. | `EquipeFormPage.tsx`, `ReunionHebdoFormPage.tsx`, JSON | Formulaires équipe/réunion en i18n. |
| 3.6 | Dans `errorHandler.ts`, remplacer les messages génériques par des clés. | `utils/errorHandler.ts`, `common.json` | Erreurs génériques traduites. |

### Phase 4 : Messages API et notifications

| # | Tâche | Fichiers | Validation |
|---|--------|----------|------------|
| 4.1 | **Backend :** Configurer MessageSource (`messages_fr.properties`, `messages_en.properties`), LocaleResolver (`Accept-Language` ou `X-Locale`). Remplacer constantes dans `ApiConstants` et `GlobalExceptionHandler` par des clés. | `ApiConstants.kt`, `GlobalExceptionHandler.kt`, `messages_*.properties`, config Spring | Requête avec `Accept-Language: en` renvoie messages en anglais. |
| 4.2 | **Backend :** Remplacer les `message` des validations (DTOs) par des clés ; MessageSource pour les résoudre. | DTOs dans `modules/*/dto/request/*.kt`, `messages_*.properties` | Erreurs 400 avec `details` traduits. |
| 4.3 | **Frontend :** Intercepteur axios : ajouter header `Accept-Language: i18n.language` (ou store ui.locale). | `api/axios.ts` | Toutes les requêtes envoient la locale. |
| 4.4 | S’assurer que les messages API (déjà traduits par le backend) sont affichés tels quels ; pas de double traduction. | Composants qui affichent les erreurs | Erreurs API dans la langue courante. |
| 4.5 | Remplacer tous les `alert()` et `window.confirm()` par des modales / service utilisant `t()`. | DocumentPage, ProjetListPage, ProjetFormPage, PlanningPage, FournisseurPage, SecuritePage, ReunionHebdo*, QualitePage, EquipeListPage, MateriauListPage, EnginListPage | Aucun texte natif navigateur ; confirmations/alertes traduites. |
| 4.6 | Traduire les messages d’erreur métier (ex. « Erreur chargement notifications »). | `api/communicationApi.ts`, etc., `common.json` | Messages d’erreur métier en i18n. |

### Phase 5 : Tableaux et contenus dynamiques

| # | Tâche | Fichiers | Validation |
|---|--------|----------|------------|
| 5.1 | Traduire liste projets : titres, KPIs, statuts, en-têtes, filtres, pagination, états vides, export Excel. | `ProjetListPage.tsx`, `projet.json` | Liste projets 100 % traduite. |
| 5.2 | Centraliser libellés d’énumérations (types projet, statuts, etc.) dans i18n. | `types/projet.ts`, pages, `projet.json` | Énumérations affichées dans la bonne langue. |
| 5.3 | Adapter `formatMontant` et tout formatage nombre/date pour utiliser `i18n.language`. | Tous les usages de NumberFormat / toLocaleDateString | Montants et dates selon la locale. |
| 5.4 | Traduire en-têtes et libellés des exports (Excel, etc.). | Pages concernées, JSON | Exports avec en-têtes traduits. |
| 5.5 | Traduire toutes les autres listes (équipes, engins, matériaux, utilisateurs, réunions). | `*ListPage.tsx`, namespaces | Listes traduites. |
| 5.6 | Traduire pages détail (projet, équipe, utilisateur, PV réunion). | `*DetailPage.tsx`, `*PVPage.tsx`, JSON | Détails cohérents. |
| 5.7 | Traduire Messagerie, Notifications, puis Budget, Planning, Qualité, Sécurité, Reporting, Documents, Fournisseurs, Paramètres. | Fichiers concernés, namespaces | Aucune page avec libellés en dur. |

### Phase 6 : Recette et synchronisation

| # | Tâche | Validation |
|---|--------|------------|
| 6.1 | Ajouter un sélecteur de langue (Header ou Paramètres) : `setLocale` + `i18n.changeLanguage` + `document.documentElement.lang` + localStorage. | Changement de langue appliqué partout et persisté. |
| 6.2 | Recherche globale de chaînes en dur (hors commentaires/tests) ; traiter ou documenter les restes. | Liste des restes traitée. |
| 6.3 | Recette manuelle ou automatisée : parcours complet en FR puis en EN (formulaires, validations, erreurs API, listes, pagination, export, confirmations). | Checklist validée pour fr et en. |
| 6.4 | Vérifier premier chargement (langue stockée vs défaut) et absence de flash. | `html.lang` et contenu corrects dès la première frame. |
| 6.5 | (Optionnel) Préférence langue dans le profil utilisateur (API + BDD) ; au login, appliquer et écrire dans localStorage. | Langue du compte appliquée après connexion si définie. |

---

## 6. Fichiers principaux à modifier (résumé)

**Frontend :**  
`index.html`, `main.tsx`, `src/i18n.ts`, `src/store/slices/uiSlice.ts`, `src/api/axios.ts`, `src/utils/errorHandler.ts`, `sidebarConfig.tsx`, `headerConfig.ts`, `Header.tsx`, `Footer.tsx`, `Sidebar.tsx`, toutes les pages sous `src/features/**/*Page.tsx` et composants de formulaires/listes, `src/types/projet.ts` (ou déplacement des libellés vers i18n).

**Backend :**  
`ApiConstants.kt`, `GlobalExceptionHandler.kt`, tous les DTOs dans `modules/*/dto/request/*.kt`, ajout de `messages_fr.properties` / `messages_en.properties` et configuration MessageSource + LocaleResolver.

**Nouveaux fichiers :**  
`public/locales/fr/*.json`, `public/locales/en/*.json` (namespaces : common, layout, auth, user, projet, equipe, reunionHebdo, communication, errors, etc.).

---

## 7. Critères de succès

- **Cohérence :** Chaque élément de l’application (pages, composants, formulaires, messages système, notifications, validations, tableaux, contenus dynamiques) est pris en compte et affiché dans la langue sélectionnée.
- **Stabilité :** Pas de flash de langue au chargement ; `document.lang` et contenu alignés dès la première frame.
- **Synchronisation :** Frontend et backend utilisent la même locale (Accept-Language) ; erreurs et validations API dans la langue de l’utilisateur.
- **Persistance :** Langue stockée dans `mika-locale` et appliquée à chaque visite ; optionnel : préférence dans le profil utilisateur.
