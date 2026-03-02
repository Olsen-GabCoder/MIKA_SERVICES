# Diagnostic : durée de session et flux d’authentification

Ce document décrit le mécanisme actuel de gestion des sessions et des tokens (access + refresh), identifie les causes probables du dysfonctionnement « session courte malgré "Rester connecté 5 h" », et propose des corrections sans régression.

---

## 1. Résumé du flux actuel

### 1.1 Connexion (sans 2FA)

1. **Frontend** : l’utilisateur envoie `POST /api/auth/login` avec `{ email, password, rememberMe }` (via `authApi.login`, `withCredentials: true`).
2. **Backend** : `AuthService.login` vérifie identifiants, puis appelle `createSessionAndAuthResponse(user, httpRequest, request.rememberMe)`.
3. **Durée de session** :
   - `rememberMe == true` → `sessionDurationMs = LONG_SESSION_MS` (5 h = 18 000 000 ms).
   - `rememberMe == false` → `sessionDurationMs = SHORT_SESSION_MS` (1 h = 3 600 000 ms).
4. **Tokens générés** :
   - **Access token** : toujours `DEFAULT_JWT_EXPIRATION_MS` = **15 minutes** (SecurityConstants / JwtTokenProvider).
   - **Refresh token** : durée = `sessionDurationMs` (donc 5 h ou 1 h).
5. **Session (table `sessions`)** : créée ou réutilisée (même IP/User-Agent), avec `token` = access token, `refreshToken`, `dateExpiration` = maintenant + `sessionDurationMs`.
6. **Réponse** : `AuthResponse(accessToken, refreshToken, expiresIn=900, sessionExpiresIn=18000 ou 3600, user)`.
7. **Cookie** : `AuthController` appelle `authCookieHelper.addRefreshTokenCookie(response, refreshToken, sessionExpiresIn?.toInt())` → cookie `refreshToken` avec `Path=/api`, `Max-Age=18000` (5 h) ou 3600 (1 h), `HttpOnly`, `SameSite=Lax`.

### 1.2 Connexion avec 2FA

- Après vérification 2FA, `verify2FA` appelle aussi `createSessionAndAuthResponse(user, httpRequest, request.rememberMe)` et pose le même cookie avec `sessionExpiresIn` selon `rememberMe`.

### 1.3 Utilisation de l’API

- Chaque requête API envoie `Authorization: Bearer <accessToken>` (token lu depuis `localStorage`).
- **JwtAuthenticationFilter** : lit le Bearer token, valide le JWT (signature + expiration 15 min), puis cherche une session active par `sessionRepository.findByToken(token)`. Si session absente ou inactive → pas d’authentification (requête continue sans contexte), le contrôleur renverra typiquement 401.

### 1.4 Renouvellement (refresh)

- **Déclenchement** : lorsqu’une requête reçoit **401**, l’intercepteur Axios (frontend) appelle `POST /api/auth/refresh` avec un body vide ; le **refresh token** est envoyé uniquement via le **cookie** (httpOnly).
- **Backend** : `AuthController.refreshToken` lit le cookie `refreshToken`, appelle `authService.refreshToken`. La session est retrouvée par `findByRefreshToken`, vérification `active` et `dateExpiration`. Nouveaux access + refresh tokens générés, **dateExpiration de la session conservée** (durée restante). Réponse avec nouveau `accessToken` et **nouveau cookie** (même nom, nouveau refresh token et même `sessionExpiresIn` restant).
- **Frontend** : stocke le nouvel `accessToken` dans `localStorage`, réessaie la requête initiale. En cas d’échec du refresh (ex. pas de cookie), suppression de l’access token et redirection vers `/login`.

---

## 2. Rôle des différents éléments

| Élément | Rôle | Expiration / durée |
|--------|------|--------------------|
| **Access token (JWT)** | Authentification de chaque requête API | **15 min** (fixe) |
| **Refresh token (JWT)** | Permet d’obtenir un nouvel access token sans se reconnecter | 1 h ou 5 h selon `rememberMe` |
| **Cookie `refreshToken`** | Transport du refresh token (httpOnly, non lisible en JS) | `Max-Age` = `sessionExpiresIn` (secondes) = 3600 ou 18000 |
| **Session (BDD)** | Lien token ↔ refreshToken ↔ user, `dateExpiration` = fin de la session | `dateExpiration` = 1 h ou 5 h après login |

La « durée de session » côté utilisateur (1 h ou 5 h) est donc portée par la **session** et le **refresh token** (et le cookie). L’access token expire volontairement au bout de 15 min ; la session reste valide tant que le **refresh** fonctionne (cookie envoyé + session active et non expirée).

---

## 3. Causes probables du dysfonctionnement

### 3.1 Cookie non envoyé sur `POST /api/auth/refresh`

Si le navigateur **n’envoie pas** le cookie sur l’appel au refresh :

- Le backend répond « Refresh token manquant » (400) ou équivalent.
- L’intercepteur considère le refresh comme en échec → suppression de l’access token et redirection vers `/login`.
- L’utilisateur est déconnecté dès le **premier 401** après expiration de l’access token (donc vers **15 min**), ce qui peut être perçu comme « quelques minutes ».

Causes techniques possibles :

- **Proxy Vite** : les requêtes partent vers `baseURL: '/api'` (même origine que la page, ex. `http://127.0.0.1:5173`). Le proxy envoie vers `http://localhost:9090`. Si la réponse du backend contient `Set-Cookie`, elle doit être correctement transmise au navigateur. Par défaut, le proxy Vite (http-proxy) transmet les en-têtes ; toutefois, en fonction de la version ou de la config, des cas où `Set-Cookie` est mal ou pas transmis ne sont pas à exclure.
- **Path du cookie** : le cookie est défini avec `Path=/api`. Les requêtes sont bien `/api/...` ; en dev avec proxy, l’URL perçue par le navigateur est du type `http://127.0.0.1:5173/api/auth/refresh`, donc le path convient.
- **SameSite / Secure** : en dev, `Secure` n’est en général pas activé ; `SameSite=Lax` est cohérent avec des requêtes same-origin (tout passe par 5173 grâce au proxy). En production, si front et API sont sur des domaines différents, il faudra vérifier CORS + credentials et éventuellement `SameSite=None; Secure`.

### 3.2 Pas de refresh proactif

Aujourd’hui le refresh n’est déclenché **qu’après un 401**. Donc :

- Si l’utilisateur n’effectue aucune requête entre 0 et 15 min, la première requête après 15 min reçoit 401 → refresh.
- Si le cookie est absent ou invalide à ce moment-là, une seule tentative de refresh échoue → déconnexion immédiate.

Un **refresh proactif** (avant expiration de l’access token, ex. toutes les 14 min) permettrait de s’assurer que le cookie est bien utilisé tant que la session est valide, et de détecter plus tôt un problème de cookie.

### 3.3 Incohérence éventuelle sur les chemins « publics » (JWT filter)

- `SecurityConstants.PUBLIC_PATHS` contient des préfixes **sans** context-path (`/auth/login`, `/auth/refresh`, …).
- Avec `context-path: /api`, `request.getRequestURI()` peut être `/api/auth/login`. Dans ce cas `path.startsWith("/auth/login")` est **faux**, donc le filtre JWT **ne skip pas** ces chemins. Ce n’est pas bloquant : en l’absence de Bearer valide, le filtre ne fait pas échouer la requête et le contrôleur reçoit bien l’appel. Pour la clarté et la cohérence, on peut faire en sorte que les chemins publics soient comparés avec le préfixe `/api` si le contexte l’utilise.

---

## 4. Synthèse des points à corriger / sécuriser

1. **S’assurer que le cookie est bien posé et renvoyé**
   - Vérifier en dev que la réponse de `POST /api/auth/login` (et `verify-2fa`) contient bien `Set-Cookie` et que, après une requête vers `/api/auth/refresh`, le backend reçoit bien le cookie (logs côté backend si besoin).
   - Configurer le proxy Vite pour qu’il ne supprime pas les en-têtes `Set-Cookie` (option explicite si nécessaire).

2. **Refresh proactif côté frontend**
   - Lancer un appel `POST /api/auth/refresh` avant l’expiration de l’access token (ex. toutes les 14 minutes) lorsque l’utilisateur est connecté et que la page est ouverte. Cela garantit que tant que le cookie est valide, l’access token est renouvelé sans attendre un 401.

3. **Cohérence des chemins publics (optionnel)**
   - Adapter `JwtAuthenticationFilter` pour prendre en compte le context-path (`/api`) dans la comparaison avec `PUBLIC_PATHS`, pour que login/refresh soient explicitement exclus du traitement JWT.

4. **Aucune régression**
   - Ne pas modifier la durée du JWT (15 min) ni la logique de durée de session (1 h / 5 h) sans besoin explicite.
   - Conserver le flux 401 → refresh → retry et le comportement du cookie (Path, HttpOnly, SameSite) tel quel, en ne faisant qu’ajouter le refresh proactif et la robustesse du proxy/cookie.

---

## 5. Fichiers concernés

- **Backend** : `SecurityConstants.kt`, `AuthService.kt` (createSessionAndAuthResponse, refreshToken), `AuthController.kt` (login, verify2FA, refresh, cookie), `AuthCookieHelper.kt`, `JwtTokenProvider.kt`, `JwtAuthenticationFilter.kt`, `application.yml` (app.auth.refresh-cookie.*).
- **Frontend** : `api/axios.ts` (intercepteur 401 + refresh), `api/authApi.ts`, `store/slices/authSlice.ts`, `features/auth/` (LoginForm avec rememberMe), configuration proxy dans `vite.config.ts`.

---

## 6. Plan d’action recommandé (et réalisé)

1. **Vérifier le cookie en conditions réelles** : après login avec « Rester connecté 5 h », inspecter la réponse (onglet Réseau) pour confirmer la présence de `Set-Cookie` avec `Max-Age=18000`, puis appeler manuellement ou attendre 15 min et vérifier que `POST /api/auth/refresh` envoie bien le cookie et renvoie un nouvel `accessToken`.
2. **Refresh proactif** : implémenté dans `App.tsx` — toutes les 14 minutes, si l’utilisateur est connecté, appel à `dispatch(refreshToken())` pour renouveler l’access token via le cookie. Le store et le `localStorage` sont mis à jour ; en cas d’échec (cookie absent), le flux 401 ou le prochain chargement gère la déconnexion.
3. **PUBLIC_PATHS** : adapté dans `SecurityConstants.kt` pour inclure le context-path `/api` (ex. `/api/auth/login`, `/api/auth/refresh`), afin que le filtre JWT ignore correctement ces chemins lorsque `request.requestURI` contient le context-path.
4. **Proxy Vite** : commentaire ajouté dans `vite.config.ts` pour rappeler que les en-têtes `Set-Cookie` du backend doivent être transmis (comportement par défaut de http-proxy).

Une fois ces points en place, la session devrait rester active pendant toute la durée choisie (5 h avec « Rester connecté »), sans régression sur le flux actuel.
