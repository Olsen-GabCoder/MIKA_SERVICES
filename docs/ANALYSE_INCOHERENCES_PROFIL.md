# Analyse des incohérences – Partie Profil

Document de synthèse des incongruïtés relevées entre le frontend (page Profil, Paramètres, API utilisateur) et le backend (endpoints `/users/me`, contrôleur utilisateur, entité User).

---

## 1. Incohérences bloquantes (critiques)

### 1.1 Mise à jour du profil : endpoint réservé aux admins

- **Constat**  
  La page Profil utilise le formulaire `ProfileForm`, qui enregistre via `updateUser({ id: user.id, data })` → `userApi.update(id, data)` → **PUT `/users/{id}`**.  
  Côté backend, **PUT `/users/{id}`** est protégé par `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")` (cf. `UserController.kt`).

- **Conséquence**  
  Un utilisateur **non admin** qui modifie ses infos (nom, prénom, email, téléphone, adresse, fiche de mission, etc.) et clique sur « Enregistrer les modifications » reçoit un **403 Forbidden**. La mise à jour du profil ne fonctionne que pour les comptes ADMIN / SUPER_ADMIN.

- **Recommandation**  
  - Soit ajouter un endpoint dédié **PATCH ou PUT `/users/me`** (ou `/users/me/profile`) autorisant l’utilisateur connecté à mettre à jour uniquement les champs « profil » (nom, prénom, email, téléphone, adresse, ville, quartier, province, dateEmbauche, ficheMission), et faire appeler cet endpoint par le frontend depuis la page Profil.  
  - Soit assouplir la sécurité sur **PUT `/users/{id}`** pour autoriser la mise à jour lorsque `id == currentUser.id`, en limitant côté service les champs modifiables (pas d’`actif`, pas de `roleIds`, etc. pour l’auto-mise à jour).

---

## 2. Incohérences fonctionnelles (comportement / données)

### 2.1 Store auth non synchronisé après mise à jour du profil

- **Constat**  
  Après un `updateUser` réussi, le `userSlice` met à jour `currentUser`, `users` et `selectedUser`, mais **aucun `setUser` n’est dispatché vers `authSlice`**.

- **Conséquence**  
  `state.auth.user` garde l’ancienne version (nom, prénom, email, etc.). La sidebar / le header peuvent continuer à afficher l’ancien nom ou les anciennes infos jusqu’à un nouveau `getMe` (ex. refresh, re-navigation) ou une déconnexion/reconnexion.

- **Recommandation**  
  Dans `ProfileForm`, après un `updateUser` réussi, dispatcher aussi `setUser(action.payload)` (ou le `User` retourné) pour garder `auth.user` aligné avec le profil mis à jour.

---

### 2.2 Paramètres « Compte » : champs affichés mais inexistants côté backend

- **Constat**  
  Dans `ParametresPage`, la section **Compte** affiche des réglages avec `SoonBadge` pour :  
  `displayName`, `contactEmail`, `signature`, `contactPreference`, `profileVisibility`.  
  L’entité `User` et le `UserResponse` backend **ne contiennent pas** ces champs. Les libellés (ex. « Adresse pour les notifications (Mon profil) », « Visibilité du profil ») laissent penser que ces options existeront un jour, mais il n’y a pas de champs ni d’API correspondants.

- **Conséquence**  
  - Risque de confusion : l’utilisateur peut croire que « contactEmail » ou « profileVisibility » sont ou seront gérés dans le profil.  
  - Aujourd’hui, les préférences de notifications (email, alerte nouvelle connexion, etc.) sont bien dans `User` et exposées via **PATCH `/users/me/preferences/notifications`** et sont utilisées dans la section **Sécurité / Notifications** des paramètres, pas dans « Compte » avec ces libellés.

- **Recommandation**  
  - Soit documenter/clarifier que `displayName`, `contactEmail`, `signature`, `contactPreference`, `profileVisibility` sont des évolutions prévues et que le backend n’expose pas encore ces champs.  
  - Soit aligner les libellés de la section Compte sur ce qui existe vraiment (photo, mot de passe, 2FA, lien vers le profil) et déplacer ou renommer les options « Bientôt » pour éviter la confusion avec les préférences notification déjà présentes.

---

### 2.3 Double source de vérité pour l’utilisateur connecté

- **Constat**  
  L’utilisateur courant est disponible à la fois dans `state.auth.user` (rempli par `authApi.getMe()` après login / refresh token) et dans `state.user.currentUser` (rempli par `userSlice` via `userApi.getMe()`). Les deux appellent le même endpoint **GET `/users/me`**.

- **Conséquence**  
  En cas de mise à jour (ex. photo, ou futur correctif de mise à jour profil), il faut penser à mettre à jour les deux stores (auth + user) pour éviter des incohérences (ex. sidebar avec ancienne photo, page profil avec nouvelle).

- **Recommandation**  
  Déjà partiellement géré (ex. `ProfileHeader` après upload photo appelle `setUser` et `fetchCurrentUser`). Étendre cette logique après toute mise à jour du profil (voir 2.1) et, à plus long terme, envisager une seule source de vérité (par ex. toujours dériver l’utilisateur courant de `auth` et invalider/rafraîchir via `getMe` après chaque action de profil).

---

## 3. Incohérences mineures (UX / i18n / détails)

### 3.1 Titre de la page Profil non traduit

- **Constat**  
  Dans `ProfilePage.tsx`, le titre est en dur : `<h1>Mon Profil</h1>`.

- **Recommandation**  
  Utiliser `t('profile.title')` ou un libellé existant (ex. `layout.monProfil`) et ajouter la clé dans les namespaces `user` ou `layout` si besoin.

---

### 3.2 Clés i18n manquantes pour le profil

- **Constat**  
  Dans `ProfileForm.tsx` et `ProfileHeader.tsx`, des libellés ont un fallback en dur :  
  - `t('profile.groupIdentity') ?? 'Identité'`  
  - `t('profile.groupContact') ?? 'Contact'`  
  - `t('profile.groupAddress') ?? 'Adresse'`  
  - `t('profile.sinceLabel', { year: yearDebut }) ?? \`Depuis ${yearDebut}\``  

  Les clés `profile.groupIdentity`, `profile.groupContact`, `profile.groupAddress`, `profile.sinceLabel` ne figurent pas dans les fichiers de traduction (ex. `locales/fr/user.json`).

- **Recommandation**  
  Ajouter ces clés dans les locales (fr/en) pour éviter les fallbacks en français sur la version anglaise et pour centraliser les textes.

---

### 3.3 Message « Aucune information utilisateur disponible » non traduit

- **Constat**  
  Dans `ProfilePage.tsx`, lorsque `!userForDisplay`, le message affiché est en français en dur :  
  `"Aucune information utilisateur disponible"`.

- **Recommandation**  
  Utiliser une clé i18n (ex. `profile.noUserData`) et l’ajouter aux fichiers de traduction.

---

### 3.4 Indicateur de force du mot de passe en français uniquement

- **Constat**  
  Dans `ProfilePasswordSection.tsx`, les libellés de force du mot de passe sont en dur :  
  `const STRENGTH_LABELS = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort']`.

- **Recommandation**  
  Utiliser des clés i18n (ex. `profile.passwordStrengthWeak`, etc.) pour être cohérent avec le reste de l’app multilingue.

---

## 4. Cohérence backend / frontend (résumé)

| Élément | Backend | Frontend | Statut |
|--------|---------|----------|--------|
| GET utilisateur courant | GET `/users/me` → `UserResponse` | `userApi.getMe()` / `authApi.getMe()` → `User` | OK |
| Mise à jour profil | PUT `/users/{id}` (admin uniquement) | `userApi.update(id, data)` depuis Profil | Incohérent (1.1) |
| Changement MDP (moi) | PUT `/users/me/password` | `userApi.changeMyPassword()` | OK |
| Photo de profil | POST `/users/me/photo`, GET `/users/me/photo` | `userApi.uploadPhoto()`, `getPhotoBlob()` | OK |
| Préférences notifications | PATCH `/users/me/preferences/notifications` | `userApi.updateNotificationPreferences()` | OK |
| Préférences session | PATCH `/users/me/preferences/session` | `userApi.updateSessionPreferences()` | OK |
| Historique connexions | GET `/users/me/login-history` | `userApi.getMyLoginHistory()` | OK |
| Sessions actives | GET `/users/me/sessions`, DELETE `/users/me/sessions/{id}` | `userApi.getMySessions()`, `revokeSession()` | OK |
| Champs User / UserResponse | Voir `UserResponse.kt`, `User.kt` | Type `User` dans `types/index.ts` | Alignés (champs principaux + préférences) |
| Paramètres « Compte » | Pas de champs displayName, contactEmail, signature, profileVisibility | Affichés en « Bientôt » | Incohérence conceptuelle (2.2) |

---

## 5. Actions recommandées (par priorité)

1. **Critique**  
   - Introduire un endpoint permettant à l’utilisateur connecté de mettre à jour son propre profil (ex. PATCH `/users/me` avec champs limités), ou assouplir PUT `/users/{id}` pour `id == currentUser.id` avec champs restreints.  
   - Faire appeler cet endpoint depuis `ProfileForm` au lieu de PUT `/users/{id}` pour l’auto-édition.

2. **Fonctionnel**  
   - Après succès de la mise à jour du profil (ou de la photo), mettre à jour aussi `authSlice` (`setUser`) pour garder header/sidebar cohérents.  
   - Clarifier ou adapter la section Compte des Paramètres (libellés / champs « Bientôt ») par rapport aux champs réellement gérés (profil + préférences notifications).

3. **UX / i18n**  
   - Traduire le titre de la page Profil et le message « Aucune information utilisateur disponible ».  
   - Ajouter les clés manquantes : `profile.groupIdentity`, `profile.groupContact`, `profile.groupAddress`, `profile.sinceLabel`.  
   - Internationaliser les libellés de force du mot de passe dans la section changement de mot de passe.

---

*Document généré à partir de l’analyse du code (backend Kotlin, frontend React/TypeScript) – partie Profil et Paramètres.*
