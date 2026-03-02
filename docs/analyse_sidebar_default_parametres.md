# Analyse : fonctionnalité « État de la barre latérale » (Paramètres)

## 1. Comportement actuel (sans régression)

### 1.1 Store et persistance
- **État** : `uiSlice.sidebarCollapsed` (boolean).
- **Clé localStorage** : `mika-sidebar-collapsed` ; valeur `'true'` = réduite, `'false'` ou absente = étendue.
- **Initialisation** : `getStoredSidebarCollapsed()` au chargement du store ; défaut = `false` (étendue).

### 1.2 Utilisation dans l’app
- **Layout.tsx** : lit `sidebarCollapsed` pour définir `--layout-sidebar-width` (4rem vs 16rem).
- **Sidebar.tsx** : bouton expand/collapse qui dispatch `toggleSidebar()` ; met à jour l’état et le localStorage.

### 1.3 Paramètres (avant modification)
- Section Affichage : une ligne « État de la barre latérale » avec **SoonBadge** (non fonctionnelle).
- Libellés i18n : `affichage.sidebarDefault`, `sidebarDefaultDesc`, `sidebarExpanded`, `sidebarCollapsed` (FR + EN).

## 2. Objectif

Permettre à l’utilisateur de choisir **à l’ouverture** l’état de la barre : **Étendue** ou **Réduite**.  
Comme l’état est déjà persisté, « à l’ouverture » = au prochain chargement de l’app. Pas de nouveau concept : on expose et modifie la **même** préférence que le bouton de la sidebar.

## 3. Stratégie (zéro régression)

- **Aucun changement** : uiSlice, Sidebar, Layout, localStorage, clés i18n.
- **Un seul changement** : ParametresPage.tsx.
  - Remplacer la ligne qui affiche SoonBadge pour `sidebarDefault` par un **contrôle réel**.
  - Contrôle : sélecteur deux options « Étendue » / « Réduite ».
  - Valeur affichée : `sidebarCollapsed ? 'collapsed' : 'expanded'`.
  - Au changement : `dispatch(setSidebarCollapsed(value === 'collapsed'))`.

Résultat : même source de vérité, même persistance ; le choix dans Paramètres = même effet que le bouton de la sidebar (y compris à l’ouverture suivante).

## 4. Implémentation prévue

1. Importer `setSidebarCollapsed` depuis `@/store/slices/uiSlice`.
2. Lire `sidebarCollapsed` depuis le store dans ParametresPage.
3. Retirer `{ k: 'sidebarDefault', dk: 'sidebarDefaultDesc' }` du tableau qui génère les lignes SoonBadge.
4. Ajouter une `SettingRow` dédiée avec un `SettingSelect` :
   - options : `['expanded', 'collapsed']`,
   - value : `sidebarCollapsed ? 'collapsed' : 'expanded'`,
   - optionLabels : `sidebarExpanded`, `sidebarCollapsed`,
   - onChange : `(v) => dispatch(setSidebarCollapsed(v === 'collapsed'))`.

Aucune modification des composants Sidebar, Layout ou du slice UI.
