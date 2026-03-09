# Variables d'environnement – MIKA Services Platform

Documentation des variables d'environnement utilisées par le backend, en particulier pour l’authentification, les emails et la sécurité.

## Chargement du fichier `.env`

Le backend charge automatiquement un fichier **`.env`** au démarrage (format `KEY=value`). Placer le fichier dans **`backend/`** ou à la racine du projet. Les variables (ex. `MAIL_HOST`, `JWT_SECRET`) sont alors lues par `application.yml`.

---

## 0. Admin initial (bootstrap)

Aucun identifiant administrateur n’est codé en dur. Le premier compte SUPER_ADMIN est créé au démarrage **uniquement** si les deux variables suivantes sont définies :

| Variable | Description | Requise |
|----------|-------------|---------|
| `INIT_ADMIN_EMAIL` | E-mail du compte admin à créer | Pour créer l’admin |
| `INIT_ADMIN_PASSWORD` | Mot de passe initial (à changer à la première connexion) | Pour créer l’admin |

Une fois le compte créé, vous pouvez retirer `INIT_ADMIN_PASSWORD` des secrets (recommandé en prod).

---

## 1. Authentification JWT

| Variable | Description | Défaut | Requise |
|----------|-------------|--------|---------|
| `JWT_SECRET` | Secret pour signer les tokens JWT. En prod, utiliser une valeur longue et aléatoire. | *(vide)* | Oui (prod) |
| `JWT_EXPIRATION_MS` | Durée de vie du token d’accès (ms). | `900000` (15 min) | Non |
| `JWT_REFRESH_EXPIRATION_MS` | Durée de vie du refresh token (ms). | `604800000` (7 jours) | Non |

---

## 2. Cookie refresh (token de renouvellement)

Le refresh token peut être envoyé au client dans un cookie HttpOnly (recommandé en prod).

| Variable | Description | Défaut | Profil |
|----------|-------------|--------|--------|
| `REFRESH_COOKIE_NAME` | Nom du cookie. | `refreshToken` | Tous |
| `REFRESH_COOKIE_PATH` | Path du cookie (doit correspondre au context-path de l’API). | `/api` | Tous |
| `REFRESH_COOKIE_MAX_AGE` | Max-Age du cookie en secondes. | `604800` (7 jours) | Tous |
| `REFRESH_COOKIE_SECURE` | Si `true`, cookie envoyé uniquement en HTTPS. | `false` (dev), **true** en prod (override dans `application-prod.yml`) | Prod |
| `REFRESH_COOKIE_SAME_SITE` | `Strict`, `Lax` ou `None`. En prod : `Strict` (ou `Lax` si redirects cross-site). | `Lax` (dev), `Strict` en prod | Prod |

Le cookie est toujours **HttpOnly** (défini dans le code). En production, le profil `application-prod.yml` force `secure: true` et `same-site: Strict`.

---

## 3. CORS

| Variable | Description | Défaut |
|----------|-------------|--------|
| `CORS_ALLOWED_ORIGINS` | Origines autorisées, séparées par des virgules. | `http://localhost:5173,http://127.0.0.1:5173` |

En prod, définir l’URL du frontend (ex. `https://app.mikaservices.com`).

---

## 4. Rate limit (connexion)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `LOGIN_RATE_LIMIT_MAX` | Nombre max de tentatives de connexion par fenêtre. | `5` |
| `LOGIN_RATE_LIMIT_WINDOW_MINUTES` | Fenêtre en minutes. | `1` |

En cas de dépassement, l’API renvoie **429** et un message invitant à réessayer plus tard. Le frontend affiche un message dédié (trop de tentatives).

---

## 4.1 Lockout par compte (après N échecs de connexion)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `AUTH_LOCKOUT_MAX_ATTEMPTS` | Nombre d’échecs de connexion (mauvais mot de passe) avant verrouillage du compte. | `5` |
| `AUTH_LOCKOUT_DURATION_MINUTES` | Durée du verrouillage en minutes. | `15` |

En cas de verrouillage, l’API renvoie **423 Locked**. Le déverrouillage est automatique après la durée configurée, ou immédiat après réinitialisation du mot de passe (lien « Mot de passe oublié » ou réinitialisation par un admin).

---

## 5. Mail (SMTP)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `MAIL_HOST` | Serveur SMTP. | `localhost` |
| `MAIL_PORT` | Port SMTP. | `587` |
| `MAIL_USERNAME` | Utilisateur SMTP. | *(vide)* |
| `MAIL_PASSWORD` | Mot de passe SMTP. | *(vide)* |
| `MAIL_SMTP_AUTH` | Activer l’auth SMTP. | `false` |
| `MAIL_STARTTLS_ENABLE` | Activer STARTTLS. | `false` |
| `MAIL_FROM` | Adresse expéditrice des emails. | `noreply@mikaservices.com` |
| `FRONTEND_BASE_URL` | URL de base du frontend (liens dans les emails : reset password, etc.). | `http://localhost:5173` |
| `MAIL_NOTIFY_ON_LOGIN` | Si `true`, envoi d’un email « nouvelle connexion » à chaque login réussi (IP, user-agent). | `true` |

**En cas de « Connect timed out » vers smtp.gmail.com:587** : le serveur n’atteint pas Gmail (timeout réseau). Causes possibles : pare-feu ou FAI qui bloque le port 587 sortant, proxy d’entreprise non configuré pour SMTP, connexion lente. À faire : vérifier que le port 587 sortant est autorisé (ou tester `telnet smtp.gmail.com 587` depuis la machine qui héberge le backend) ; si vous êtes derrière un proxy, configurer les propriétés JVM `mail.smtp.proxy.host` / `mail.smtp.proxy.port` ou utiliser un relais SMTP local.

---

## 6. Scheduler (tâches planifiées)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `SESSION_CLEANUP_CRON` | Cron de nettoyage des sessions expirées. | `0 0 3 * * ?` (tous les jours à 3h) |
| `PASSWORD_RESET_CLEANUP_CRON` | Cron de nettoyage des tokens de réinitialisation MDP. | `0 0 4 * * ?` (tous les jours à 4h) |
| `DIGEST_CRON` | Cron d’envoi des digest (quotidiens/hebdomadaires). À l’heure configurée par utilisateur (`digestTime`). | `0 0 * * * ?` (toutes les heures à minuit) |

---

## 7. Météo (dashboard)

Le widget météo sur le tableau de bord appelle l’API backend `/meteo/actuelle` et `/meteo/previsions`. Sans clé API, le backend renvoie des **données simulées** (ville par défaut).

| Variable | Description | Défaut |
|----------|-------------|--------|
| `METEO_API_KEY` | Clé API **OpenWeatherMap** pour la météo réelle. Créer une clé sur [openweathermap.org/api](https://openweathermap.org/api). | *(vide)* → données simulées |
| `METEO_DEFAULT_CITY` | Ville utilisée pour la météo (actuelle et prévisions). | `Libreville` |

---

## 8. Autres

| Variable | Description | Défaut |
|----------|-------------|--------|
| `UPLOAD_DIR` | Répertoire des uploads. | `uploads` |

---

## Résumé minimal pour la production

- **Obligatoire** : `JWT_SECRET`, `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
- **Recommandé** : `CORS_ALLOWED_ORIGINS`, `FRONTEND_BASE_URL`, `MAIL_*` (si envoi d’emails), `METEO_API_KEY` (pour la météo réelle sur le dashboard)
- Le cookie refresh est durci automatiquement en profil **prod** (`secure`, `same-site`).
- **Sur Railway** : utiliser `SPRING_PROFILES_ACTIVE=prod` et renseigner toutes les variables (dont SMTP). Liste complète et exemples : **[docs/RAILWAY_VARIABLES.md](RAILWAY_VARIABLES.md)**.
