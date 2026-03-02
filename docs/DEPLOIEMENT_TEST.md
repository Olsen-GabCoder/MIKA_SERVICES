# Déploiement en phase de test – offres gratuites

Ce document décrit comment déployer **MIKA Services Platform** en phase de test en n’utilisant que des offres gratuites (PaaS, BDD, email, stockage).

---

## Recommandation retenue (phase de test)

| Priorité | Option | Quand la choisir |
|----------|--------|-------------------|
| **1** | **Railway (tout-en-un)** | Déployer en quelques clics : backend + frontend + MySQL dans un seul projet, reverse proxy et HTTPS inclus. Limite : ~500 h/mois + 5 \$ de crédit gratuit (suffisant pour des tests). |
| **2** | **Docker sur une VM gratuite** (ex. Oracle Cloud Always Free) | Zéro limite de crédit, uploads persistants, contrôle total. Idéal si vous voulez une env de test stable et 100 % gratuite sans dépendre d’un quota. |
| **3** | **Vercel (front) + Render (back) + MySQL** | Si vous préférez séparer front (CDN) et back ; Render free « spin down » après inactivité (premier chargement plus lent). |

**Choix conseillé pour démarrer :** **Railway** pour la rapidité et la simplicité. Si le crédit gratuit s’épuise ou pour une env plus pérenne, passer à **Docker sur une VM gratuite** (Oracle Cloud, etc.) avec le `docker-compose.yml` du dépôt.

---

## 1. Rappel du stack

| Composant | Technologie |
|-----------|-------------|
| **Backend** | Kotlin 2.2, Java 17, Spring Boot 4.0.2, REST + WebSocket (STOMP/SockJS) |
| **Base de données** | MySQL 8 (JPA/Hibernate) |
| **Auth** | JWT (access + refresh en cookie HttpOnly), 2FA TOTP, rate limit, lockout |
| **Email** | Spring Mail (SMTP) |
| **Stockage** | Fichiers locaux (`UPLOAD_DIR`) |
| **Frontend** | React 19, Vite 7, TypeScript, MUI, build statique |
| **API** | Context-path `/api`, Swagger `/api/swagger-ui.html` |

---

## 2. Ce qu’il faut déployer

- **Backend** : JAR Spring Boot (port 9090, context-path `/api`), WebSocket `/api/ws`.
- **Frontend** : Fichiers statiques (build Vite) servis sous `/` ; les appels API et WebSocket passent par `/api`.
- **MySQL** : Instance avec base dédiée (schéma créé au premier run en staging, ou migrations en prod).
- **Variables d’environnement** : Voir `docs/VARIABLES_ENVIRONNEMENT.md` et la section 5 ci‑dessous.

---

## 3. Options gratuites recommandées (phase de test)

### 3.1 Hébergement applicatif

| Fournisseur | Offre gratuite | Backend | Frontend | Remarques |
|-------------|----------------|---------|----------|-----------|
| **Railway** | 500 h/mois, $5 de crédit | Oui (JAR + MySQL possible) | Oui (build statique) | Un projet = backend + front + DB, reverse proxy inclus |
| **Render** | Free tier (spin down après inactivité) | Oui | Oui (static site) | MySQL externe ou Render PostgreSQL (adapter le driver si PostgreSQL) |
| **Fly.io** | Machines partagées gratuites | Oui | Oui (static) | Bon pour Docker, plusieurs régions |
| **Vercel** | Hobby gratuit | Non (serverless) | **Oui** (idéal pour le front) | Front sur Vercel + backend ailleurs |
| **Netlify** | Free tier | Non | **Oui** | Idem, front uniquement |
| **Cloudflare Pages** | Free | Non | **Oui** | Idem |

**Recommandation phase de test** :  
- **Option A** : Tout sur **Railway** (backend + front + MySQL en un projet, reverse proxy automatique).  
- **Option B** : **Frontend** sur Vercel ou Netlify (gratuit, CDN) + **Backend** sur Railway ou Render + **MySQL** gratuit (voir ci‑dessous).

### 3.2 Base de données MySQL (gratuit)

| Fournisseur | Offre | Limites |
|-------------|--------|--------|
| **Railway** | MySQL en add-on | Inclus dans le crédit gratuit |
| **PlanetScale** | Tier gratuit | 1 BDD, 5 Go, branch dev (attention : pas de FK en prod) |
| **Aiven** | MySQL free tier | Limité en ressources |
| **Oracle Cloud (Always Free)** | MySQL (ou MySQL HeatWave) | Toujours gratuit, nécessite compte Oracle |
| **Docker / docker-compose** | MySQL en conteneur | Illimité en local ou sur une VM gratuite |

Pour rester 100 % compatible avec votre `application-prod.yml` (MySQL, JPA), le plus simple en test est : **MySQL sur Railway** ou **MySQL en conteneur** (docker-compose).

### 3.3 Email (SMTP gratuit)

| Fournisseur | Offre | Usage |
|-------------|--------|--------|
| **Brevo (ex-Sendinblue)** | 300 emails/jour gratuit | Reset password, notifications |
| **SendGrid** | 100 emails/jour gratuit | Idem |
| **Mailtrap** | Inbox de test illimitée | Uniquement pour tests (pas d’envoi réel) |
| **Gmail** | Compte perso + “mot de passe d’application” | Limité, à réserver pour démo/test |

En phase de test, Brevo ou SendGrid suffisent pour les emails réels (reset MDP, notification de connexion).

### 3.4 Stockage des fichiers (uploads)

En free tier, la plupart des PaaS ont un système de fichiers **éphémère** (les uploads sont perdus au redéploiement). Options :

- **Docker / VM** : volume persistant sur le disque (recommandé pour la phase de test).
- **Railway / Render** : volume persistant (souvent payant) ; en gratuit, accepter que les uploads ne soient pas persistés ou limiter les tests.
- Plus tard : **Cloudflare R2**, **Backblaze B2** (stockage S3‑compatible gratuit en faible volume).

---

## 4. Déploiement avec Docker (recommandé pour tests locaux ou VM)

Le dépôt contient désormais :

- `backend/Dockerfile` : build du JAR puis image Java 17.
- `frontend_web/mika-services-frontend/Dockerfile` : build Vite + Nginx pour servir le front.
- `docker-compose.yml` (à la racine) : backend + frontend + MySQL + reverse proxy (Nginx) pour exposer `/api` et `/` avec support WebSocket.

### 4.1 Build et lancement

À la racine du projet, créer un fichier `.env` à partir de `.env.example` (optionnel pour test local avec valeurs par défaut), puis :

```bash
docker compose up -d
```

- **Frontend** : http://localhost
- **API** : http://localhost/api (Swagger : http://localhost/api/swagger-ui.html)
- **WebSocket** : ws://localhost/api/ws (STOMP/SockJS)

Le compose utilise le profil Spring **docker** (`application-docker.yml`) : la base MySQL est créée automatiquement et le schéma est mis à jour au démarrage (`ddl-auto: update`). Les variables d’environnement sont documentées dans la section 5 et dans `.env.example`.

### 4.2 WebSocket (reverse proxy)

Le backend expose STOMP/SockJS sur `/api/ws`. La config Nginx du `docker-compose` doit :

- Proxifier `/api` (et `/api/ws`) vers le backend.
- Autoriser l’upgrade WebSocket (`Upgrade`, `Connection`).

Un exemple est fourni dans la config Nginx du frontend (ou du reverse proxy) dans le dépôt.

---

## 5. Variables d’environnement minimales pour la production / staging

À définir sur l’hébergeur (Railway, Render, etc.) ou dans `.env` pour Docker.

### 5.1 Obligatoires (profil `prod`)

| Variable | Exemple | Description |
|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | `prod` | Profil Spring |
| `JWT_SECRET` | (chaîne longue aléatoire) | Signature JWT |
| `DATABASE_URL` | `jdbc:mysql://host:3306/mika_services?useSSL=true&serverTimezone=UTC` | URL JDBC MySQL |
| `DATABASE_USERNAME` | `user` | Utilisateur MySQL |
| `DATABASE_PASSWORD` | (mot de passe) | Mot de passe MySQL |

### 5.2 Fortement recommandées

| Variable | Exemple | Description |
|----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | `https://votre-app.vercel.app` | Origine(s) du frontend (séparées par des virgules) |
| `FRONTEND_BASE_URL` | `https://votre-app.vercel.app` | Liens dans les emails (reset password, etc.) |
| `MAIL_HOST` | `smtp.brevo.com` | Serveur SMTP |
| `MAIL_PORT` | `587` | Port SMTP |
| `MAIL_USERNAME` | (votre clé / email) | Auth SMTP |
| `MAIL_PASSWORD` | (secret) | Mot de passe SMTP |
| `MAIL_SMTP_AUTH` | `true` | |
| `MAIL_STARTTLS_ENABLE` | `true` | |
| `MAIL_FROM` | `noreply@votredomaine.com` | Expéditeur des emails |

### 5.3 Optionnelles

- `UPLOAD_DIR` : répertoire des uploads (en Docker, monter un volume sur ce chemin).
- `JWT_EXPIRATION_MS`, `JWT_REFRESH_EXPIRATION_MS` : durée des tokens.
- `LOGIN_RATE_LIMIT_MAX`, `AUTH_LOCKOUT_MAX_ATTEMPTS`, etc. (voir `VARIABLES_ENVIRONNEMENT.md`).

---

## 6. Checklist avant déploiement

- [ ] Profil Spring : `prod` (ou `staging` si vous acceptez `ddl-auto: update` en test).
- [ ] `JWT_SECRET` défini (long, aléatoire).
- [ ] Base MySQL créée, `DATABASE_*` renseignés.
- [ ] CORS et `FRONTEND_BASE_URL` pointent vers l’URL réelle du frontend.
- [ ] SMTP configuré si vous utilisez reset password / notifications par email.
- [ ] En HTTPS : le cookie refresh est déjà en `secure` + `SameSite=Strict` en profil prod (`application-prod.yml`).
- [ ] Pas de secrets en dur dans le code (éviter les mots de passe dans `application-dev.yml` en dépôt ; utiliser des variables d’env ou un `.env` non versionné).

---

## 7. Points d’attention

- **WebSocket** : le backend utilise **STOMP over SockJS** sur `/api/ws`. Le frontend possède un module `socket.ts` basé sur **Socket.io** ; pour des notifications temps réel cohérentes, il faudra soit un client STOMP côté front, soit un adaptateur côté backend. En déploiement, le reverse proxy doit accepter l’upgrade WebSocket vers le backend.
- **Uploads** : en environnement éphémère (sans volume), les fichiers uploadés peuvent être perdus à chaque redéploiement. Pour la phase de test, un volume Docker ou une petite VM avec disque persistant suffit.
- **Logs** : en prod, les niveaux de log sont réduits (`application-prod.yml`). Adapter si besoin pour du debug temporaire.

---

## 8. Résumé des scénarios “tout gratuit”

1. **Docker en local ou sur une VM gratuite (ex. Oracle Cloud Always Free)**  
   `docker compose up` avec MySQL + backend + front + Nginx. Volume pour `UPLOAD_DIR` et données MySQL.

2. **Railway**  
   Un projet : service Backend (JAR), service Frontend (static), add-on MySQL. Variables d’env dans le dashboard. Reverse proxy Railway pour `/api` et `/`.

3. **Frontend Vercel + Backend Render + MySQL externe**  
   Front déployé sur Vercel (build Vite), backend sur Render (free tier), MySQL sur Railway ou PlanetScale. Configurer `CORS_ALLOWED_ORIGINS` et `FRONTEND_BASE_URL` avec l’URL Vercel.

Une fois ces éléments en place, vous pouvez déployer l’application en phase de test en n’utilisant que des offres gratuites.
