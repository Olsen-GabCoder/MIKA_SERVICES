# Diagnostic d'authentification – Déconnexions en production

Guide pas-à-pas pour identifier la cause des déconnexions après quelques minutes.

---

## Rappel du flux d'authentification

1. **Login** → le backend renvoie `accessToken` (15 min) + `refreshToken` (7 jours)
2. Le frontend les stocke dans `localStorage` ou `sessionStorage`
3. **Premier refresh** : 30 s après connexion (validation précoce en prod)
4. **Refreshs suivants** : toutes les 14 min (avant expiration du JWT)
5. **En cas de 401** : l'intercepteur axios appelle `/auth/refresh` avec le refresh token

---

## Étape 1 : Vérifier que le backend répond

### 1.1 Swagger / Health

```bash
curl -s -o /dev/null -w "%{http_code}" https://mikaservices-production.up.railway.app/api/swagger-ui/index.html
```

Attendu : `200`.

### 1.2 Endpoint refresh (sans token — doit répondre 400 « Refresh token manquant »)

```bash
curl -s -X POST https://mikaservices-production.up.railway.app/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nHTTP %{http_code}\n"
```

Attendu : message du type `Refresh token manquant` avec code `400`. Si erreur réseau ou autre : problème d’URL ou de déploiement backend.

---

## Étape 2 : Vérifier les variables du **backend** Railway

Dans le dashboard Railway : **service backend** → **Variables**.

| Variable | Obligatoire ? | Impact si manquant |
|----------|---------------|---------------------|
| `JWT_SECRET` | ✅ Oui | L'app ne démarre pas ou les tokens sont invalides |
| `CORS_ALLOWED_ORIGINS` | ✅ Recommandé | Requêtes bloquées par CORS en prod |
| `FRONTEND_BASE_URL` | ✅ Recommandé | Utilisé aussi comme origine CORS (ex. `https://mika-services.up.railway.app`) |
| `SPRING_PROFILES_ACTIVE` | Recommandé | Mettre `prod` pour cookies sécurisés |

**Test rapide** : après modification des variables → **Redeploy** du service backend.

---

## Étape 3 : Tester le login et le refresh manuellement

### 3.1 Login

```bash
curl -s -X POST https://mikaservices-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://mika-services.up.railway.app" \
  -d '{"email":"VOTRE_EMAIL","password":"VOTRE_MOT_DE_PASSE"}' \
  | jq .
```

Vérifier la présence de `accessToken` et `refreshToken` dans la réponse.

### 3.2 Refresh avec le token obtenu

En remplaçant `VOTRE_REFRESH_TOKEN` par la valeur de `refreshToken` de l’étape 3.1 :

```bash
curl -s -X POST https://mikaservices-production.up.railway.app/api/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Origin: https://mika-services.up.railway.app" \
  -d '{"refreshToken":"VOTRE_REFRESH_TOKEN"}' \
  | jq .
```

Si le refresh réussit → le `JWT_SECRET` et le refresh flow côté backend sont corrects.

Si erreur (400, 401, 500) → vérifier les logs Railway du backend pour le message exact.

---

## Étape 4 : Vérifier CORS côté navigateur

1. Ouvrir le frontend en prod : `https://mika-services.up.railway.app`
2. Ouvrir les **DevTools** (F12) → onglet **Réseau**
3. Se connecter
4. Repérer les requêtes vers `mikaservices-production.up.railway.app` :
   - Si **CORS blocked** ou erreur rouge sur des requêtes OPTIONS / POST → problème CORS
   - Si les requêtes passent (200) → CORS OK

**Alternative** : dans la console, exécuter :

```javascript
fetch('https://mikaservices-production.up.railway.app/api/auth/login-policy', {
  method: 'GET',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json()).then(console.log).catch(console.error)
```

Si erreur CORS → ajouter l’URL exacte du frontend dans `CORS_ALLOWED_ORIGINS` sur le backend (ex. `https://mika-services.up.railway.app`).

---

## Étape 5 : Vérifier le flux de refresh dans le navigateur

1. Se connecter sur le frontend prod
2. DevTools → **Réseau** → activer « Préserver le journal » (si disponible)
3. Attendre **~30 secondes** : une requête POST vers `/auth/refresh` doit apparaître
4. Vérifier la réponse :
   - **200** avec `accessToken` → refresh OK
   - **401 / 400 / erreur réseau** → problème de refresh

5. Si aucune requête `/auth/refresh` après 30 s :
   - Vérifier dans **Application** → **Storage** → `localStorage` que `refreshToken` existe
   - Vérifier qu’aucune redirection vers `/login` n’a lieu trop tôt

---

## Étape 6 : Vérifier l’URL utilisée par le frontend

1. Sur le frontend prod, ouvrir DevTools → **Réseau**
2. Repérer une requête API (ex. `/auth/me` ou une liste)
3. Vérifier l’URL complète : elle doit être `https://mikaservices-production.up.railway.app/api/...`

Si l’URL est `https://mika-services.up.railway.app/api/...` (domaine du frontend) → `VITE_API_BASE_URL` n’a pas été injectée au build (ou est incorrecte). Revoir les variables du **service frontend** Railway et **redéployer** le frontend.

---

## Étape 7 : Logs backend Railway

1. Railway → service backend → **Deployments** → dernier déploiement → **View Logs**
2. Chercher :
   - `CORS allowed origins/patterns` → confirmer que l’URL du frontend est listée
   - Erreurs liées à `JWT`, `refresh`, `IllegalStateException` pour JWT_SECRET
   - Erreurs 401/500 sur `/auth/refresh`

---

## Checklist de synthèse

| Test | Résultat | Action |
|------|----------|--------|
| Backend Swagger 200 | ☐ | OK ou vérifier URL / déploiement |
| JWT_SECRET défini backend | ☐ | Définir un secret long (≥32 car.) |
| CORS_ALLOWED_ORIGINS / FRONTEND_BASE_URL | ☐ | Ajouter l’URL exacte du frontend |
| Login curl → accessToken + refreshToken | ☐ | OK ou vérifier credentials / logs backend |
| Refresh curl avec refreshToken | ☐ | OK ou vérifier JWT_SECRET / sessions |
| Requêtes API depuis navigateur → bonne URL | ☐ | VITE_API_BASE_URL bien injectée au build |
| Requête /auth/refresh visible à ~30 s | ☐ | Flux de refresh actif |
| Réponse 200 sur /auth/refresh | ☐ | Refresh fonctionnel |

---

## Causes fréquentes résumées

1. **VITE_API_BASE_URL** absente ou incorrecte sur le frontend → requêtes vers mauvaise URL, refresh échoue.
2. **CORS_ALLOWED_ORIGINS** sans l’URL du frontend → requêtes bloquées par CORS.
3. **JWT_SECRET** manquant ou différent entre local et prod → tokens invalides, refresh échoue.
4. **JWT_SECRET** avec caractères spéciaux (`+`, `/`) mal gérés → générer un secret Base64 URL-safe ou hexadécimal.
5. **Condition de concurrence sur le refresh** : le backend invalide le refresh token à chaque utilisation (rotation). Si plusieurs requêtes reçoivent 401 en même temps et lancent chacune un refresh, seule la première réussit ; les autres obtiennent « Refresh token invalide » et l’utilisateur est déconnecté. **Correction** : mutex dans `axios.ts` pour qu’un seul refresh soit en cours à la fois.
