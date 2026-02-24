# Analyse : flash en mode clair à la navigation (formulaires)

## 1. Chaîne de gestion du thème

### 1.1 Stockage et lecture
- **Clé** : `mika-theme` (localStorage)
- **Valeurs** : `'dark'` | `'light'`
- **Lecture** :
  - `src/utils/themeStorage.ts` : `getStoredTheme()` (lit localStorage, défaut `'light'`)
  - `src/store/slices/uiSlice.ts` : `getStoredTheme()` dans `initialState` (même logique)
- **Écriture** : `uiSlice` (setTheme, toggleTheme) + `themeStorage.setStoredTheme()`

### 1.2 Application au DOM
- **Cible** : `document.documentElement` (élément `<html>`)
- **Actions** : `setAttribute('data-theme', theme)` + classe `dark` si theme === 'dark'
- **Où c’est appelé** :
  1. **index.html** (script dans `<head>`) : exécution synchrone avant tout contenu → OK au chargement initial
  2. **main.tsx** : `applyThemeToDocument(getStoredTheme())` avant `createRoot()` → OK au boot
  3. **main.tsx** : `store.subscribe()` → après chaque changement de thème dans le store
  4. **App.tsx** : `applyThemeToDocument(theme)` pendant le rendu (lecture store)
  5. **ThemeGate** : `applyThemeToDocument(getStoredTheme())` dans `useLayoutEffect` (dépend de `location.pathname`)

### 1.3 Tailwind
- **Config** : `darkMode: ['selector', '[data-theme="dark"]']`
- Les classes `dark:...` s’appliquent quand un ancêtre a `[data-theme="dark"]`.
- **Layout** : `<main data-theme={theme}>` en plus du `document.documentElement`.

---

## 2. Ordre d’exécution

### 2.1 Chargement initial (full page load)
1. Parse HTML → script `<head>` lit localStorage et met `data-theme` sur `<html>`.
2. Body → `<div id="root">` puis chargement de `main.tsx`.
3. **store** : `configureStore` → `initialState` de `uiSlice` → `getStoredTheme()` → store a le bon thème.
4. **main.tsx** : `applyThemeToDocument(getStoredTheme())` → thème réappliqué.
5. `createRoot().render()` → React rend : App → Layout → ThemeGate → Outlet → page courante.
6. **ThemeGate** : `ready = false` au premier mount → contenu dans un div `visibility: hidden`.
7. **useLayoutEffect** (ThemeGate) : applique le thème, `requestAnimationFrame(() => setReady(true))`.
8. Peinture navigateur : soit contenu caché, soit déjà après rAF → pas de flash au premier chargement si tout est synchrone.

### 2.2 Navigation (ex. détail projet → « Modifier le projet »)
1. Clic lien → Router met à jour la location (ex. `/projets/123/edit`).
2. Re-render : RouterProvider → App → Layout → ThemeGate → Outlet → **ProjetFormPage**.
3. **ThemeGate ne remonte pas** : même instance, `ready` reste **true** (déjà passé à true sur la page précédente).
4. Donc ThemeGate rend directement `children` (pas de div cachée) → **le formulaire est visible tout de suite**.
5. App a bien appelé `applyThemeToDocument(theme)` pendant ce rendu, donc le thème est appliqué avant que les enfants soient rendus.

Conséquence : le « gate » ne s’applique qu’au **premier mount** de ThemeGate. À chaque **changement de route**, le nouveau contenu (dont le formulaire) s’affiche **sans** repasser par la phase « caché + useLayoutEffect + rAF ». Si, pour une raison (timing navigateur, ordre d’application des styles, etc.), la première frame peinte est encore en mode clair, on obtient un flash.

---

## 3. Cause racine identifiée

- **ThemeGate ne se réinitialise pas à la navigation** : `ready` reste à `true`, donc on n’utilise plus le mécanisme « cacher → appliquer thème → rAF → afficher » pour les nouvelles pages.
- Même si le thème est appliqué dans App (et sur `<main>`), **la première frame peinte après navigation** peut encore montrer le nouveau contenu (formulaire) avec des styles « clair » si :
  - le navigateur peint avant que les styles `[data-theme="dark"]` soient pris en compte pour ce sous-arbre, ou
  - un ordre de style / cascade fait que les variantes `dark:` ne gagnent pas tout de suite.

En pratique : **on affiche le formulaire (et toute nouvelle page) sans jamais attendre une frame après application du thème**, ce qui laisse la place à un flash en mode clair.

---

## 4. Correction recommandée

- **Forcer ThemeGate à se réinitialiser à chaque changement de route** pour que le « gate » s’applique aussi à la navigation, pas seulement au premier chargement.
- Moyen simple : **remonter ThemeGate à chaque changement de pathname** en lui donnant une **key** basée sur la route, par ex. `key={location.pathname}` dans Layout. Ainsi :
  - À chaque navigation, ThemeGate est démonté puis remonté.
  - Au remount, `ready` repasse à `false` → contenu à nouveau masqué (même logique qu’au premier chargement).
  - useLayoutEffect réapplique le thème et programme `setReady(true)` au frame suivant.
  - Le contenu (dont le formulaire) n’est affiché qu’après application du thème + une frame → plus de flash.

Aucun changement de logique de thème (store, localStorage, `applyThemeToDocument`) n’est nécessaire ; seul le comportement de ThemeGate à la navigation est corrigé.
