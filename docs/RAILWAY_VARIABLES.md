# Variables d'environnement Railway – MIKA Services

Toutes les variables à configurer pour un déploiement **complet et fonctionnel** sur Railway (backend + frontend + envoi d’emails).

---

## 1. Service Backend (MIKA_SERVICES)

Dans le dashboard Railway : **Variables** du service backend.

### 1.1 Obligatoires (déjà en place si le backend répond)

| Variable | Exemple | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `jdbc:mysql://containers-us-west-xxx.railway.app:6543/railway` | URL JDBC MySQL fournie par Railway (MySQL) |
| `DATABASE_USERNAME` | `root` | Utilisateur BDD Railway |
| `DATABASE_PASSWORD` | `***` | Mot de passe BDD Railway |
| `JWT_SECRET` | *(chaîne longue aléatoire)* | Secret pour signer les JWT (min. 32 caractères) |

### 1.2 Profil et port

| Variable | Valeur recommandée | Description |
|----------|--------------------|-------------|
| `SPRING_PROFILES_ACTIVE` | `prod` | Profil **prod** : cookies sécurisés (HTTPS), pas de modification du schéma BDD |
| `PORT` | *(injecté par Railway)* | Le backend écoute sur cette valeur si définie (sinon 9090) |

### 1.3 Admin initial (premier déploiement uniquement)

Aucun identifiant admin n’est présent dans le code (dépôt public). Le premier compte administrateur est créé au démarrage **uniquement** si les deux variables suivantes sont définies :

| Variable | Description |
|----------|-------------|
| `INIT_ADMIN_EMAIL` | Adresse e-mail du compte SUPER_ADMIN à créer (ex. `admin@votredomaine.com`) |
| `INIT_ADMIN_PASSWORD` | Mot de passe initial (fort, à changer à la première connexion) |

- À la **première** exécution avec ces variables, l’app crée les permissions, rôles et ce compte admin, puis vous pouvez vous connecter.
- Une fois connecté, changez le mot de passe depuis le profil. Vous pouvez ensuite **supprimer** `INIT_ADMIN_PASSWORD` des variables Railway (le compte existe déjà ; le mot de passe n’est plus utilisé qu’en base).
- **BDD vide (tout premier déploiement)** : avec le profil `prod`, le schéma n’est pas créé automatiquement. Déployer une première fois avec `SPRING_PROFILES_ACTIVE=docker` (et les variables BDD) pour créer les tables, puis repasser en `prod`, ajouter `INIT_ADMIN_EMAIL` et `INIT_ADMIN_PASSWORD`, et redéployer.

### 1.4 CORS et frontend (pour que le login et les appels API fonctionnent)

| Variable | Exemple | Description |
|----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | `https://mika-services.up.railway.app` | URL publique du frontend (une seule ou plusieurs séparées par des virgules) |
| `FRONTEND_BASE_URL` | `https://mika-services.up.railway.app` | URL utilisée dans les **liens des e-mails** (reset mot de passe, bienvenue, etc.) |

Remplacez par votre domaine frontend Railway si différent.

### 1.5 Envoi d’e-mails

Sans configuration mail, l’application démarre mais **l’envoi d’e-mails échouera** (bienvenue, reset mot de passe, notifications, etc.).

#### Option A – Resend par API HTTP (recommandé sur Railway)

Sur Railway, les ports SMTP (587, 465) sont souvent bloqués, ce qui provoque des *Connect timed out*. L’envoi via l’**API HTTP Resend** (port 443) évite ce blocage.

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Clé API Resend (dashboard [resend.com](https://resend.com) → API Keys). Si définie, tous les e-mails partent via l’API au lieu du SMTP. |
| `MAIL_FROM` | Adresse expéditrice **vérifiée** dans Resend (ex. `onboarding@resend.dev` ou votre domaine vérifié). |
| `MAIL_NOTIFY_ON_LOGIN` | Envoyer un e-mail à chaque connexion réussie : `true` ou `false`. |

Aucune autre variable SMTP n’est nécessaire lorsque `RESEND_API_KEY` est définie.

#### Option B – SMTP (Gmail, SendGrid, Resend SMTP, etc.)

| Variable | Description | Exemple (Gmail) | Exemple (SendGrid) |
|----------|-------------|-----------------|--------------------|
| `MAIL_HOST` | Serveur SMTP | `smtp.gmail.com` | `smtp.sendgrid.net` |
| `MAIL_PORT` | Port SMTP | `587` | `587` |
| `MAIL_USERNAME` | Utilisateur SMTP | ton-email@gmail.com | `apikey` |
| `MAIL_PASSWORD` | Mot de passe / mot de passe d’application / clé API | Mot de passe d’application Gmail | Clé API SendGrid |
| `MAIL_SMTP_AUTH` | Activer l’auth SMTP | `true` | `true` |
| `MAIL_STARTTLS_ENABLE` | Activer STARTTLS | `true` | `true` |
| `MAIL_FROM` | Adresse expéditrice (doit être autorisée chez le fournisseur) | `noreply@mondomaine.com` | `noreply@mondomaine.com` |
| `MAIL_NOTIFY_ON_LOGIN` | Envoyer un e-mail à chaque connexion réussie | `true` ou `false` | idem |

**Exemples par fournisseur :**

- **Resend (API)** : définir uniquement `RESEND_API_KEY` + `MAIL_FROM` (recommandé sur Railway).
- **Gmail** : créer un [mot de passe d’application](https://myaccount.google.com/apppasswords). `MAIL_USERNAME` = adresse Gmail, `MAIL_PASSWORD` = ce mot de passe. `MAIL_FROM` = même adresse Gmail (ou alias).
- **SendGrid** : créer une clé API. `MAIL_USERNAME` = `apikey`, `MAIL_PASSWORD` = la clé. `MAIL_FROM` = adresse vérifiée dans SendGrid.
- **Resend (SMTP)** : host/port/user/password + `MAIL_FROM` vérifié (peut être bloqué sur Railway).
- **Mailgun** : SMTP Mailgun (region) : host/port/user/password + `MAIL_FROM` du domaine vérifié.

### 1.6 Optionnel (valeurs par défaut correctes)

| Variable | Défaut | Description |
|----------|--------|-------------|
| `JWT_EXPIRATION_MS` | `900000` (15 min) | Durée de vie du token d’accès (ms) |
| `JWT_REFRESH_EXPIRATION_MS` | `604800000` (7 jours) | Durée de vie du refresh token (ms) |
| `UPLOAD_DIR` | `uploads` | Répertoire des uploads (éphémère sur Railway, prévoir stockage externe plus tard si besoin) |
| `METEO_API_KEY` | *(vide)* | Clé API météo (widget dashboard) |
| `METEO_DEFAULT_CITY` | `Douala` | Ville par défaut météo |
| `AUTH_LOCKOUT_MAX_ATTEMPTS` | `5` | Verrouillage compte après N échecs de connexion |
| `AUTH_LOCKOUT_DURATION_MINUTES` | `15` | Durée du verrouillage (minutes) |
| `LOGIN_RATE_LIMIT_MAX` | `5` | Rate limit global connexion |
| `LOGIN_RATE_LIMIT_WINDOW_MINUTES` | `1` | Fenêtre du rate limit (minutes) |

Les variables de cookie (`REFRESH_COOKIE_*`) sont déjà durcies dans le profil **prod** (secure, SameSite).

---

## 2. Service Frontend (striking-gratitude)

Dans le dashboard Railway : **Variables** du service frontend.

| Variable | Valeur | Description |
|----------|--------|-------------|
| `VITE_API_BASE_URL` | `https://mikaservices-production.up.railway.app/api` | URL de l’API backend (avec `/api`). Adapter si votre backend a une autre URL publique. |

**Réseau (onglet Networking)** : Port **80** (déjà configuré).

---

## 3. Résumé à copier-coller (Backend)

À adapter puis coller dans les variables Railway du **backend** :

```env
# Profil et BDD (obligatoire)
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:mysql://...  # fourni par Railway MySQL
DATABASE_USERNAME=root
DATABASE_PASSWORD=...

# JWT (obligatoire)
JWT_SECRET=votre_secret_long_et_aleatoire_32_caracteres_minimum

# Admin initial (premier déploiement : créer le premier compte SUPER_ADMIN)
INIT_ADMIN_EMAIL=admin@votredomaine.com
INIT_ADMIN_PASSWORD=mot_de_passe_fort_a_changer

# Frontend et CORS (obligatoire pour login depuis le front)
CORS_ALLOWED_ORIGINS=https://mika-services.up.railway.app
FRONTEND_BASE_URL=https://mika-services.up.railway.app

# E-mails (obligatoire pour envoi fonctionnel)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=votre_user_smtp
MAIL_PASSWORD=votre_mot_de_passe_ou_cle_api
MAIL_SMTP_AUTH=true
MAIL_STARTTLS_ENABLE=true
MAIL_FROM=noreply@votredomaine.com
MAIL_NOTIFY_ON_LOGIN=true
```

---

## 4. Vérifications rapides

- **Backend** : `https://mikaservices-production.up.railway.app/api/swagger-ui/index.html` → Swagger s’affiche.
- **Frontend** : `https://mika-services.up.railway.app` → page de connexion.
- **Login** : depuis le frontend, connexion avec un utilisateur existant (ex. seed) → pas d’erreur CORS, tokens et cookie OK.
- **E-mails** : créer un utilisateur (admin) ou « Mot de passe oublié » → vérifier réception (et dossier spam).

Pour plus de détails sur chaque variable, voir [VARIABLES_ENVIRONNEMENT.md](./VARIABLES_ENVIRONNEMENT.md).
