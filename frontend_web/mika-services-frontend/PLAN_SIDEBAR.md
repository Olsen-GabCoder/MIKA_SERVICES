# Plan d'action — Modification de la Sidebar (MIKA Services)

**Objectif** : Moderniser la sidebar de manière progressive, sans régression, en s'inspirant d'une sidebar type (réductible, thème clair/sombre, icônes, recherche) et en intégrant le bloc utilisateur connecté (photo, nom, rôle, déconnexion).

**Principe** : Une étape = un ou deux fichiers modifiés, validation possible après chaque étape.

---

## Référence visuelle (inspiration)

- Sidebar **réductible** : mode étendu (texte + icônes) / mode replié (icônes seules).
- **Recherche** en haut (champ en mode étendu, icône en mode replié).
- **Liens de navigation** avec icônes ; état actif mis en évidence (couleur/background).
- **Badges** optionnels (ex. nombre de notifications / messages non lus).
- **Pied de sidebar** : interrupteur thème clair/sombre (icône lune / soleil).
- **Bloc utilisateur** (à intégrer) : photo ou initiales, nom complet, rôle, menu déroulant (Profil, Déconnexion).

---

## Phase 0 — Backend (aucune modification requise)

**Statut** : Rien à faire.

- Les données utilisateur (nom, prénom, photo, rôles) viennent déjà de l’auth et du `User` (authSlice / API existante).
- Les compteurs « messages non lus » et « notifications non lues » sont déjà fournis par `communicationSlice` (appels API existants).
- Aucun nouveau endpoint backend n’est nécessaire pour la sidebar seule.

**Validation** : Aucun fichier à toucher ; on considère la phase 0 validée.

---

## Phase 1 — Données et état côté frontend (sans changer l’UI)

**Objectif** : Préparer les données et l’état nécessaires à la nouvelle sidebar, sans modifier le rendu actuel.

### 1.1 Store / préférences utilisateur (thème + sidebar repliée)

- **Fichier** : `src/store/slices/uiSlice.ts` (à créer).
- **Contenu** :
  - `sidebarCollapsed: boolean` (défaut `false`).
  - `theme: 'light' | 'dark'` (défaut `'light'` ou lecture depuis `localStorage`).
- **Actions** : `setSidebarCollapsed`, `setTheme`, `toggleSidebar`, `toggleTheme`.
- **Fichier** : `src/store/store.ts` — enregistrer le reducer `ui` (ex. `uiReducer`).

**Validation** : L’app tourne toujours ; le store contient bien `ui.sidebarCollapsed` et `ui.theme`. Aucun changement visuel encore.

### 1.2 (Optionnel) Persistance thème

- **Fichier** : `src/utils/themeStorage.ts` (à créer).
- Lire/écrire `theme` dans `localStorage` et appliquer une classe sur `<html>` (ex. `dark` pour Tailwind) pour que le thème s’applique au reste de l’app plus tard.

**Validation** : Au chargement, le thème sauvegardé est restauré ; pas d’impact sur la sidebar visuelle pour l’instant.

---

## Phase 2 — Structure et styles de base de la sidebar

**Objectif** : Une seule sidebar qui garde le même comportement fonctionnel (liens, actif, admin) mais avec une structure HTML/CSS prête pour les étapes suivantes (zones bien délimitées).

### 2.1 Découper la sidebar en zones

- **Fichier** : `src/components/layout/Sidebar.tsx`.
- **Modifications** (sans changer les liens ni la logique) :
  - En-tête : zone pour logo + futur bouton « replier » (pour l’instant un simple conteneur ou le logo seul).
  - Zone centrale : `<nav>` avec la liste des liens existants (Tableau de bord, Projets, …, Mon profil, Gestion utilisateurs si admin).
  - Pied : zone réservée pour le bloc utilisateur + futur toggle thème.
- Conserver exactement les mêmes `Link`, `to`, `isActive`, `isAdmin` qu’aujourd’hui.
- Utiliser des `className` cohérents (ex. `sidebar-header`, `sidebar-nav`, `sidebar-footer`) pour préparer le style.

**Validation** : La sidebar affiche les mêmes liens, la même page active, le même lien admin ; aucun lien cassé, aucune régression.

### 2.2 Appliquer les styles de base (couleurs, espacements)

- **Fichier** : `src/components/layout/Sidebar.tsx`.
- Appliquer les couleurs existantes du projet (`secondary-dark`, `primary`, etc.) sur les zones définies en 2.1.
- Ajuster espacements (padding, `space-y`) pour un rendu plus propre et lisible, sans changer encore la structure des liens.

**Validation** : Rendu plus propre visuellement ; comportement identique.

---

## Phase 3 — Icônes et badges

**Objectif** : Ajouter des icônes aux liens et, si pertinent, des badges (notifications / messages non lus) sans modifier les routes ni le Layout.

### 3.1 Icônes pour chaque entrée de menu

- **Fichier** : `src/components/layout/Sidebar.tsx` (ou fichier de config des items : `src/components/layout/sidebarConfig.tsx` / `.ts`).
- Définir une config : `{ to, label, icon? }` pour chaque entrée (Tableau de bord, Projets, Chantiers, etc.).
- Utiliser des icônes SVG inline ou un petit set d’icônes (ex. Heroicons) pour : dashboard, dossier, chantier, engin, palette/cube, budget, calendrier, qualité, bouclier, messagerie, cloche, graphique, document, fournisseurs, utilisateur, utilisateurs.
- Dans la sidebar : afficher `icon + label` pour chaque lien (toujours en mode étendu à cette étape).

**Validation** : Chaque lien a une icône + texte ; clics et état actif inchangés.

### 3.2 Badges (Notifications, Messagerie)

- **Fichier** : `src/components/layout/Sidebar.tsx`.
- Utiliser `useAppSelector` pour `messagesNonLusCount` et `notificationsNonLuesCount` (store `communication`).
- Afficher un petit badge (chiffre) à côté de « Messagerie » et « Notifications » quand le compteur > 0 (style discret : pastille rouge ou primary).

**Validation** : Les badges s’affichent et reflètent les compteurs ; pas de régression sur la navigation.

---

## Phase 4 — Sidebar réductible

**Objectif** : Pouvoir replier la sidebar (icônes seules) / l’étendre (icônes + texte) sans casser le Layout ni les routes.

### 4.1 Largeur et état replié

- **Fichier** : `src/components/layout/Sidebar.tsx`.
- Lire `sidebarCollapsed` depuis le store `ui`.
- Si `sidebarCollapsed` : largeur réduite (ex. `w-16` ou `w-14`), masquer les libellés et la recherche (ou n’afficher qu’une icône), centrer les icônes.
- Si étendu : largeur actuelle (ex. `w-64`), afficher icône + libellé.

**Validation** : En cliquant sur le bouton « replier » (à ajouter en 4.2), la sidebar change de largeur et masque/affiche le texte ; le contenu principal ne se chevache pas.

### 4.2 Bouton toggle (replier / étendre)

- **Fichier** : `src/components/layout/Sidebar.tsx`.
- En-tête : bouton (icône flèche ou chevron) qui dispatch `toggleSidebar` (ou `setSidebarCollapsed`).
- En mode replié : le même bouton ré-affiche la sidebar étendue.

**Validation** : Un clic replie, un clic étend ; l’état est cohérent (éventuellement persisté en localStorage en option).

### 4.3 Layout adapté

- **Fichier** : `src/components/layout/Layout.tsx`.
- S’assurer que la zone `<main>` prend bien le reste de l’espace (`flex-1`) et que la sidebar ne pousse pas le contenu de façon anormale quand on change de largeur (déjà le cas si la sidebar a une largeur fixe en `w-*`).

**Validation** : Aucune régression sur les pages ; le main s’adapte correctement.

---

## Phase 5 — Bloc utilisateur (photo, nom, rôle, déconnexion)

**Objectif** : Afficher en bas de la sidebar les infos de l’utilisateur connecté et un moyen de déconnexion, sans modifier le Header ni l’auth.

### 5.1 Affichage utilisateur (étendu uniquement pour l’instant)

- **Fichier** : `src/components/layout/Sidebar.tsx`.
- Dans la zone pied : afficher photo de profil (si `user.photo` existe) ou initiales (prénom + nom), nom complet, rôle (dérivé de `user.roles`, ex. Admin / Manager / Employé).
- Indicateur visuel « connecté » (pastille verte) à côté de la photo ou des initiales.

**Validation** : Les infos utilisateur s’affichent correctement ; pas de régression sur la navigation.

### 5.2 Menu déroulant (Profil, Déconnexion)

- **Fichier** : `src/components/layout/Sidebar.tsx`.
- Au clic sur le bloc utilisateur (ou sur une icône chevron) : ouvrir un menu avec « Mon profil » (lien vers `/profile`), « Gestion utilisateurs » (si admin, lien vers `/users`), « Déconnexion » (bouton).
- Déconnexion : appeler la même logique que dans le Header (dispatch `logoutUser`, puis `navigate('/login')`). Ne pas supprimer le bouton Déconnexion du Header à cette étape (éviter régression).
- Fermeture du menu au clic extérieur (ref + listener).

**Validation** : Menu s’ouvre/ferme, Profil et Déconnexion fonctionnent ; Header inchangé.

### 5.3 Mode replié (bloc utilisateur)

- **Fichier** : `src/components/layout/Sidebar.tsx`.
- Quand la sidebar est repliée : n’afficher que l’avatar (photo ou initiales) dans le pied ; au clic, ouvrir le même menu déroulant (éventuellement positionné en absolu pour ne pas être coupé).

**Validation** : En mode replié, l’utilisateur peut quand même ouvrir le menu et se déconnecter ou aller au profil.

---

## Phase 6 — Recherche (optionnelle)

**Objectif** : Ajouter une zone « Recherche » en haut de la sidebar, sans casser la navigation.

### 6.1 Champ de recherche (mode étendu)

- **Fichier** : `src/components/layout/Sidebar.tsx`.
- Sous l’en-tête logo/toggle : champ de recherche (placeholder « Rechercher… ») avec icône loupe.
- Comportement minimal : soit recherche côté client (filtrer la liste des liens par libellé), soit redirection vers une page « Recherche » avec query (à définir selon le besoin métier). Pour éviter les régressions, on peut limiter à un filtre local sur les liens visibles.

**Validation** : La recherche ne casse pas les liens ; le reste de l’app est inchangé.

### 6.2 Mode replié

- En mode replié : masquer le champ, afficher uniquement l’icône loupe ; au clic, soit ouvrir un overlay/popover de recherche, soit étendre temporairement la sidebar pour afficher le champ.

**Validation** : Comportement cohérent en mode replié.

---

## Phase 7 — Thème clair / sombre

**Objectif** : Permettre de basculer le thème (sidebar + optionnellement le reste de l’app) sans régression.

### 7.1 Styles sidebar selon le thème

- **Fichier** : `src/components/layout/Sidebar.tsx`.
- Lire `theme` depuis le store `ui`.
- Si `theme === 'dark'` : conserver un style type « dark » (fond sombre, texte clair), cohérent avec l’actuel.
- Si `theme === 'light'` : fond clair, texte sombre, bordures discrètes (s’inspirer de la référence fournie).

**Validation** : Bascule manuelle du thème dans le store (devtools) change bien le rendu de la sidebar.

### 7.2 Toggle thème dans la sidebar

- **Fichier** : `src/components/layout/Sidebar.tsx`.
- Dans le pied (au-dessus ou en dessous du bloc utilisateur) : interrupteur ou bouton avec icône lune / soleil qui dispatch `toggleTheme` (et persiste en localStorage si implémenté en 1.2).

**Validation** : Un clic change le thème et le rendu de la sidebar (et du reste si la classe `dark` est appliquée sur `<html>`).

### 7.3 (Optionnel) Étendre le thème à toute l’app

- **Fichier** : `src/App.tsx` ou point d’entrée : appliquer une classe `dark` sur la racine quand `theme === 'dark'`, et définir dans `tailwind.config.js` les couleurs en mode `dark:` pour Header, main, etc.

**Validation** : Toute l’interface respecte le thème choisi ; pas de régression sur les pages.

---

## Ordre recommandé et points de vigilance

1. **Respecter l’ordre** : Phase 1 → 2 → 3 → 4 → 5 → 6 (optionnel) → 7. Chaque phase valide avant de passer à la suivante.
2. **Un fichier à la fois** : pour les phases qui touchent plusieurs fichiers (ex. store + Layout), faire le store d’abord, tester, puis le composant.
3. **Ne pas toucher** : routes (`Router.tsx`), slices métier (auth, projet, communication, etc.) sauf usage en lecture ; Header et Footer tant que la déconnexion dans la sidebar n’est pas validée.
4. **Référence** : la capture fournie montre une sidebar réductible avec recherche, icônes, badges et toggle thème ; ce plan en est l’adaptation structurée pour MIKA Services, avec en plus le bloc utilisateur (photo, nom, rôle, déconnexion).

---

## Fichiers impactés (résumé)

| Fichier | Phases |
|--------|--------|
| `src/store/slices/uiSlice.ts` (nouveau) | 1 |
| `src/store/store.ts` | 1 |
| `src/utils/themeStorage.ts` (nouveau, optionnel) | 1 |
| `src/components/layout/Sidebar.tsx` | 2, 3, 4, 5, 6, 7 |
| `src/components/layout/sidebarConfig.ts` (nouveau, optionnel) | 3 |
| `src/components/layout/Layout.tsx` | 4 |
| `src/App.tsx` | 7 (optionnel) |
| `tailwind.config.js` | 7 (optionnel) |

Aucun fichier backend à modifier pour ce plan.
