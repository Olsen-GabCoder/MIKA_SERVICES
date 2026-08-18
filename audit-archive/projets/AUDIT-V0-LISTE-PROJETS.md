# Audit V0 — Page Liste des Projets

Date : 2026-05-25
Methode : analyse statique du code, read-only
Viewports cibles : 360 / 390 / 412 / desktop

---

## 1. Localisation et arborescence

### Route
- **Path** : `/projets`
- **Element** : `<ProtectedRoute><L><ProjetListPage /></L></ProtectedRoute>`
- **Fichier page** : `frontend_web/mika-services-frontend/src/features/projet/pages/ProjetListPage.tsx` (856 lignes)

### Arborescence des composants

```
ProjetListPage
|-- PageContainer (size="full")             [shared - src/components/layout/PageContainer.tsx]
|-- CacheTimestampBanner                    [shared - src/components/pwa/CacheTimestampBanner.tsx]
|-- PageGuide (variant="welcome")           [shared - src/components/ui/PageGuide.tsx]
|-- OfflineDisabledButton (x2)              [shared - src/components/pwa/OfflineDisabledButton.tsx]
|-- [Inline] Hero Header (titre + badge + boutons export/nouveau)
|-- [Inline] Bloc recherche + filtres (barre de recherche + 4 selects)
|-- [Inline] Skeleton loader (6 rows pulse)
|-- [Inline] Empty state (icone + texte)
|-- [Inline] Tableau desktop (hidden md:block, <table>)
|-- [Inline] Cartes mobile (md:hidden, <article>)
|-- [Inline] Barre de pagination
```

**Pas de sous-composants extraits** : l'integralite du rendu (tableau, cartes, filtres, pagination) est inline dans le fichier page unique de 856 lignes.

---

## 2. Architecture

### Hooks et dependances

| Hook / utilitaire | Source | Role |
|---|---|---|
| `useTranslation('projet')` | react-i18next | i18n |
| `useNavigate` / `useLocation` | react-router-dom | Navigation + restauration etat |
| `useAppDispatch` / `useAppSelector` | `@/store/hooks` (Redux Toolkit) | Etat global |
| `useConfirm` | `@/contexts/ConfirmContext` | Modale de confirmation |
| `useIsOnline` | `@/hooks/useConnectivity` | Detection offline |
| `useFormatNumber` | `@/hooks/useFormatNumber` | Formatage montant FCFA |
| `useFirstVisit` | `@/components/ui/PageGuide` | Affichage guide premier passage |
| `getEffectiveConnectionQuality` | `@/utils/connectionQualityPreferences` | Auto-refresh adaptatif |
| `canDeleteProjetEffective` / `canEditProjetEffective` / `hasGlobalAdminRoleEffective` | `@/utils/authRoles` | Controle des actions |

### Endpoints backend

| Action | Endpoint | Methode | Params |
|---|---|---|---|
| Liste paginee | `GET /projets` | GET | `page`, `size`, `statut`, `type`, `clientId`, `responsableId`, `sort=key,dir` |
| Recherche | `GET /projets/search` | GET | idem + `q` |
| Suppression | `DELETE /projets/:id` | DELETE | - |
| Liste clients | `GET /clients` | GET | `page`, `size` |
| Chefs de projet | `GET /users/chefs-projet` (via `userApi.getChefsProjet()`) | GET | - |

### Gestion d'etat

- **Redux Toolkit** (slice `projetSlice`) — pas de TanStack Query
- Etat slice : `projets[]`, `totalElements`, `totalPages`, `currentPage`, `loading`, `error`, `clients[]`, `lastFetched`
- Pas de `staleTime` ni strategie de cache TanStack — rafraichissement via `setInterval` (auto-refresh configurable selon qualite de connexion)
- Cache offline : `localStorage` via `getProjetsCache()` / `setProjetsCache()`
- Normalisation : `normalizeProjetTypes()` unifies `type` / `types`

### Pagination

- Type : **offset-based** (page + size)
- Tailles : 10, 20, 25, 50, 100
- Taille par defaut : Redux `state.ui.itemsPerPage` (20)
- Persistance : Redux (pas d'URL params, pas de localStorage dedie)

### Restauration d'etat

- Au retour du detail vers la liste, l'etat complet (page, size, search, filters, sort) est passe via `location.state.fromListState`
- C'est robuste mais ne survit pas a un F5

---

## 3. Donnees et fonctionnalites

### Champs affiches dans la liste

| Champ | Colonne desktop | Card mobile | Format |
|---|---|---|---|
| `nom` | Oui (+ icone batiment) | Oui | Texte tronque 200px max |
| `codeProjet` | Oui (sous le nom, mono) | Non | Font mono 11px |
| `type` / `types` | Oui (badge gris) | Oui (inline texte) | Labels traduits, jointure virgule |
| `clientNom` | Oui | Oui | Texte tronque 150px |
| `montantHT` | Oui (icone dollar) | Oui | `formatMontant()` — FCFA |
| `avancementGlobal` | Oui (barre 96px + %) | Oui (barre pleine largeur + %) | Gradient orange, max 100% |
| `statut` | Oui (badge colore + dot) | Oui (badge) | Traduit via `enums.statut.*` |
| `responsableNom` | Oui (avatar initiales + nom) | Oui (petit avatar + nom) | Avatar colore aleatoire |

### Champs disponibles API mais non affiches (gisement)

| Champ ProjetSummary | Potentiel |
|---|---|
| `province` | Localisation geographique |
| `ville` | Localisation geographique |
| `latitude` / `longitude` | Vue carte |
| `dateDebut` / `dateFin` | Calendrier / delai restant |
| `nombreEnginsAffectes` | Charge materielle |
| `chantierActif` | Indicateur de chantier en pause |
| `motifArretChantier` | Alerte visuelle |
| `dateArretChantier` | Info contextuelle |
| `responsableProjetId` | Deja utilise pour droits, pas affiche |

### Fonctionnalites presentes

| Fonctionnalite | Statut | Details |
|---|---|---|
| Filtres | 4 filtres (statut, type, client, responsable) | `<select>` inline, non persistants en URL |
| Tri | 7 colonnes triables | Indicateur fleche, API-side sort |
| Recherche | Texte libre (`q`) | Champ unique, Enter ou bouton, backend full-text |
| Pagination | Offset-based | Prev/Next + indicateur page, select taille |
| Action : voir detail | Clic row / card | Navigation `/projets/:id` avec fromListState |
| Action : modifier | Bouton crayon (role-based) | Navigation `/projets/:id/edit` |
| Action : supprimer | Bouton poubelle (admin only) | Modale confirm puis DELETE |
| Creation | Bouton "Nouveau Projet" (admin only) | Navigation `/projets/nouveau` |
| Export Excel | Bouton download | xlsx dynamique (page courante seulement) |
| Selection multiple | Non | Absent |
| Actions groupees | Non | Absent |
| Export CSV/PDF | Non | Absent (seul Excel) |

---

## 4. UX/UI desktop

### Layout

- **PageContainer** `size="full"` : pas de max-width, pleine largeur
- **Hero header** : fond degrade (blanc vers orange-50), cercles decoratifs blur, padding `px-8 py-7`
- **Zone defilable** : `overflow-y-auto`, `px-8 py-6`
- **Pas de sidebar** : filtres inline sous la recherche
- **Pas de breadcrumb**
- **Footer** : pagination integree dans le conteneur du tableau

### Composants visuels

- Badge compteur total (pill orange)
- Barre de progression degradee (de primary vers orange-400)
- Avatar initiales colore (7x7 px round)
- Border-left couleur statut sur chaque ligne
- Icones SVG inline (pas de lib d'icones)

### Animations / micro-interactions

- `hover:bg-gradient-to-r` sur lignes tableau (orange-50)
- `group-hover:opacity-100` sur boutons actions (hidden par defaut)
- `group-hover:scale-110` sur boutons edit/delete
- `hover:scale-[1.02]` sur bouton "Nouveau Projet"
- `active:scale-[0.98]` sur boutons CTA
- Shine effect CSS (`translate-x group-hover:translate-x`) sur bouton nouveau
- `transition-all duration-200` generalise
- Skeleton loader (6 lignes animate-pulse)
- Empty state dedie (icone + texte contextuel)
- Indicateur tri avec opacity transition

---

## 5. UX/UI mobile

### Strategie responsive

Le breakpoint `md:` (768px) delimite deux rendus completement differents :
- **Desktop (>= md)** : `<table>` classique, `hidden md:block`
- **Mobile (< md)** : Cards `<article>`, `md:hidden`

### Analyse mobile (360/390/412px)

**Points positifs :**
- Vue card dediee (pas de tableau force)
- Barre de progression pleine largeur
- Border-left statut conserve
- Boutons actions textuels (pas juste icones)

**Points faibles identifies :**

| Probleme | Localisation | Impact |
|---|---|---|
| `px-8` sur le hero header et la zone defilable | Lignes 388, 451 | 32px de padding chaque cote = 64px perdus sur 360px viewport. Contenu utile = 296px |
| 4 `<select>` filtres en `flex-wrap` | Ligne 493 | Sur 360px les selects debordent, le wrap force un empilement peu lisible |
| Bouton "Rechercher" + "Appliquer filtres" pas assez grands | Lignes 486, 535 | `px-4 py-2` et `px-4 py-1.5` = petits tap targets |
| Hero header non adapte | Lignes 381-448 | Elements decoratifs (cercles blur 80x80, 40x40) consomment du GPU inutilement sur mobile |
| Pas de sticky pour la barre de recherche | - | L'utilisateur doit scroller en haut pour filtrer |
| Bouton "Exporter la liste (Excel)" en texte long | Ligne 427 | Peut deborder du container sur 360px |
| Pagination `flex-wrap` | Ligne 814 | Sur petit viewport, les boutons se superposent ou wrappent mal |

### Tap targets

- Boutons actions dans les cards : `px-3 py-1.5` = environ 36px hauteur (< 44px recommande)
- Boutons pagination : `px-4 py-2` = environ 40px (limite basse)
- Selects filtres : `px-3 py-1.5` = environ 32px hauteur (< 44px)

---

## 6. i18n

### Couverture

- **Namespace** : `projet` (cle racine `list.*`)
- **FR** : complet pour toutes les cles `list.*` (50+ cles)
- **EN** : complet et symetrique (meme structure, memes cles)
- **Enums traduits** : `statut.*`, `type.*` — FR et EN

### Hardcoded strings detectees

| Ligne | String | Probleme |
|---|---|---|
| 376 | `"Gerez tous vos projets BTP depuis cette page. Filtrez par statut, type ou client. Cliquez sur un projet pour acceder a ses details, son budget et son planning."` | Texte FR hardcode dans la prop `message` de PageGuide — non traduit |
| 828 | `{n} / page` dans les options du select pagination | Template litteral non i18n |
| 604 | Caracteres `↑`, `↓`, `↕` | Acceptable (symboles universels) |
| 457 | `✕` | Acceptable (symbole fermeture) |

---

## 7. Accessibilite

### Signaux positifs

| Element | Implementation |
|---|---|
| `role="table"` | Present sur `<table>` (ligne 585) |
| `role="button"` + `tabIndex={0}` | Sur chaque `<tr>` et `<article>` mobile |
| `aria-label` | Sur lignes clickables (t('list.openDetail', { name })) |
| `aria-label` | Sur boutons edit/delete (t('list.editProject'), t('list.deleteProject')) |
| `aria-sort` | Sur colonnes triees (ascending/descending) |
| `scope="col"` | Sur les `<th>` |
| `onKeyDown` Enter/Space | Navigation clavier fonctionnelle |
| `focus:ring-2 focus:ring-inset` | Focus visible sur lignes |
| `role="main"` | Via PageContainer |
| `role="status" aria-live="polite"` | Sur CacheTimestampBanner |

### Signaux negatifs / absents

| Probleme | Impact |
|---|---|
| Pas de `<caption>` sur le tableau | Lecteur d'ecran ne decrit pas le contexte du tableau |
| Les selects de filtres n'ont pas de `<label>` visible ni `aria-label` | Identifiables uniquement par le placeholder (option disabled) |
| Le select de taille pagination n'a pas de label | Idem |
| Les boutons de pagination n'ont pas de `aria-label` | Seulement le texte "Precedent" / "Suivant" (OK mais pas de contexte page) |
| Les icones SVG decoratives n'ont pas `aria-hidden="true"` | Potentiel bruit pour lecteurs d'ecran |
| Contraste non verifie pour `text-gray-400` sur fond blanc | Probablement < 4.5:1 (a verifier) |
| Pas de skip-link vers le contenu principal | Navigation clavier penalisee |

---

## 8. Diagnostic synthetique

| Dimension | Statut | Note |
|---|---|---|
| Architecture | ⚠️ | Fichier monolithique 856 lignes, pas de decomposition en sous-composants. Redux correct mais pas de TanStack Query (pas d'invalidation, pas de deduplication). Auto-refresh par setInterval. |
| Donnees affichees | ✅ | Les 7 colonnes essentielles sont presentes avec formatage adapte |
| Filtres / tri / recherche | ✅ | 4 filtres + 7 colonnes triables + recherche full-text. Fonctionnel. |
| Pagination | ✅ | Offset-based, tailles variables, range affiche. Manque seulement le jump-to-page. |
| Mobile responsive | ⚠️ | Cards dediees (bon), mais paddings excessifs, tap targets sous-dimensionnes, filtres peu ergonomiques au pouce |
| Animations / feedback | ✅ | Skeleton, empty states, hover animations riches, transitions generalisees |
| i18n | ⚠️ | Couverture quasi-complete FR/EN, mais 2 strings hardcodees (PageGuide message + pagination select) |
| Accessibilite | ⚠️ | Bon socle (aria-sort, aria-label, keyboard nav), mais labels manquants sur selects et quelques lacunes |

---

## 9. Risques de regression

### Composants partages utilises par cette page

| Composant | Autres pages qui l'utilisent |
|---|---|
| `PageContainer` | 53 pages (quasi-toutes) |
| `CacheTimestampBanner` | Plusieurs pages liste (engins, equipes, etc.) |
| `OfflineDisabledButton` | Nombreuses pages avec actions |
| `PageGuide` / `useFirstVisit` | DashboardPage, BudgetPage, PlanningPage, IncidentsPage |

### Redux slice `projetSlice`

- Utilise par : ProjetListPage, ProjetDetailPage, ProjetFormPage, ProjetHistoriquePage, ProjetDqePage, DashboardPage, PlanningPage, BudgetPage
- Modifier le shape du state ou les thunks impacte toutes ces pages

### Types partages

- `ProjetSummary` : utilise dans le slice, le DashboardPage, le PlanningPage
- `ProjetListFilters` / `ProjetSortKey` : couples au slice

### Hooks et utilitaires

| Utilitaire | Egalement utilise par |
|---|---|
| `useFormatNumber` / `formatMontant` | BudgetPage, ProjetDetailPage, reporting, exports |
| `useIsOnline` | Quasi-toutes les pages avec actions |
| `canEditProjetEffective` / `canDeleteProjetEffective` | ProjetDetailPage, ProjetFormPage |
| `useConfirm` | 20+ pages |

### Risque specifique

Le composant `ProjetListPage` est **autonome** (pas de sous-composant extrait). Les modifications restent confinables a ce fichier SAUF si on touche :
- Le shape de `ProjetSummary` (backend + tous les consumers)
- Les filtres API (backend doit supporter)
- Le comportement de `PageContainer` (53 pages)
- Le slice Redux (8 pages)

---

## 10. Opportunites d'elevation (diamond)

1. **Champs non exploites** : `province`/`ville`, `dateDebut`/`dateFin`, `chantierActif`/`motifArretChantier` — gisement pour enrichir les cards et le tableau
2. **Vue carte** : latitude/longitude disponibles dans ProjetSummary — affichage geographique possible
3. **KPI header** : les cles i18n `list.kpi.*` existent (enCours, termines, montantTotal, avancementMoyen) mais ne sont PAS utilisees dans le rendu actuel — dashboard mini prevu mais pas implemente
4. **Persistance filtres en URL** : actuellement lost on F5, les search params permettraient le partage de vues filtrees
5. **Decomposition** : extraction de `ProjetTable`, `ProjetCard`, `ProjetFilters`, `ProjetPagination` pour testabilite et reutilisation
6. **TanStack Query** : migration depuis Redux thunks pour beneficier de staleTime, background refetch, deduplication, devtools
7. **Selection multiple + actions groupees** : export selectif, changement de statut en masse, affectation
8. **Vue hybride** : toggle table/cards sur desktop (certains users preferent les cards)
9. **Indicateur delai** : afficher un calcul `dateFinPrevue - today` avec code couleur retard/avance
10. **Badge alerte chantier arrete** : le champ `chantierActif` + `motifArretChantier` permettrait un signal visuel fort

---

## 11. Questions ouvertes pour Olsen

1. **Filtres "Mes projets"** : la cle `list.subtitleMine` existe mais le toggle "tous / mes projets" n'est pas implemente dans le rendu — etait-il prevu ? Doit-il filtrer sur `responsableId = currentUser.id` ?

2. **KPI header** : les cles i18n `list.kpi.*` suggerent un bloc de stats en haut de page. A-t-il ete supprime intentionnellement ou est-ce un WIP ?

3. **Export** : l'export Excel ne couvre que la page courante. Souhaite-t-on un export de tous les resultats filtres (appel API sans pagination) ?

4. **Auto-refresh** : le `setInterval` adaptatif est actif. Est-ce souhaitable sur cette page liste ou cela genere-t-il des re-renders non voulus ?

5. **Statuts incoherents** : `STATUT_COLORS` (ligne 27) definit `INITIALISATION`, `EN_COURS_EXECUTION`, `SUSPENSION`, `RECEPTION_PROVISOIRE`, `RECEPTION_DEFINITIVE`, `EN_AVANCE`. Mais `STATUT_DOT`/`STATUT_BADGE`/`STATUT_BORDER` (lignes 326-357) definissent `EN_ATTENTE`, `PLANIFIE`, `EN_COURS`, `SUSPENDU`, `TERMINE`, `ABANDONNE`, `RECEPTION_PROVISOIRE`, `RECEPTION_DEFINITIVE` — un jeu different. Lequel est la verite ? Le type `StatutProjet` ne contient que le premier jeu.

6. **Breakpoint mobile** : `md:` (768px) couvre-t-il les tablettes 7" en paysage ? Faut-il un breakpoint intermediaire ?

7. **Filtres chef de projet** : l'appel `userApi.getChefsProjet()` est hors du cycle Redux (setState local). Est-ce voulu ? Risque de desynchronisation avec le cache global.
