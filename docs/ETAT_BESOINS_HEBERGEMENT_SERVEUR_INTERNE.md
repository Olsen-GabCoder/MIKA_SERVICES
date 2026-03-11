# État des besoins — Hébergement sur serveur interne

**Projet :** MIKA Services Platform  
**Objectif :** Déployer l’application sur un serveur interne de l’entreprise (on‑premise).  
**Public :** Équipe infrastructure / DSI.

---

## 1. Vue d’ensemble de l’application

| Composant | Rôle |
|-----------|------|
| **Frontend** | Application web React (Vite), SPA. Sert les fichiers statiques (HTML, JS, CSS). |
| **Backend** | API REST + WebSocket. Spring Boot (Kotlin), JAR exécutable. Port **9090**, préfixe **/api**. |
| **Base de données** | MySQL 8.x. Stocke utilisateurs, projets, réunions, documents, notifications, etc. |

L’utilisateur accède à une **seule URL** (ex. `https://mika.entreprise.local`). Un **reverse proxy** (nginx ou équivalent) sert le frontend et redirige `/api` et `/api/ws` vers le backend.

---

## 2. Architecture technique cible (serveur interne)

```
                    [ Réseau interne ]
                              │
                    ┌─────────▼─────────┐
                    │  Reverse proxy     │  (nginx / Traefik / Apache)
                    │  Port 80 / 443     │  • Sert le frontend (fichiers statiques)
                    │                    │  • Proxy /api → backend:9090
                    │                    │  • Proxy /api/ws → backend:9090 (WebSocket)
                    └─────────┬─────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
    │ Frontend│          │ Backend │          │ MySQL   │
    │ (nginx  │          │ (JAR    │          │ 8.x     │
    │ static) │          │ Java 17)│          │ :3306   │
    │ :80     │          │ :9090   │          │         │
    └─────────┘          └────┬────┘          └─────────┘
                              │
                              │  Uploads (fichiers)
                              └──► Volume / répertoire persistant
```

- **Option A (Docker recommandée)** : 3 conteneurs (frontend, backend, mysql) + 1 reverse proxy (ou intégré au conteneur frontend avec proxy nginx).
- **Option B (sans Docker)** : 1 serveur ou 2 (app + BDD) avec Java 17, Node 22 (build uniquement), nginx, MySQL 8.

---

## 3. Besoins matériels et logiciels

### 3.1 Serveur(s)

| Critère | Minimum | Recommandé |
|---------|---------|------------|
| **CPU** | 2 cœurs | 4 cœurs |
| **RAM** | 2 Go | 4 Go (backend ~512 Mo heap + MySQL + OS) |
| **Disque** | 20 Go | 40 Go (OS + app + BDD + logs + **uploads**) |
| **OS** | Linux (Debian 11+, Ubuntu 22.04+, RHEL 8+) ou Windows Server | Idem |

Remarque : le backend est configuré avec `-Xmx512m` par défaut (modifiable). Prévoir de la marge pour MySQL (buffer pool, connexions).

### 3.2 Logiciels requis (hors Docker)

| Logiciel | Version | Usage |
|----------|---------|--------|
| **Java (JRE ou JDK)** | 17 (Eclipse Temurin / OpenJDK 17) | Exécution du JAR backend |
| **MySQL** | 8.0+ | Base de données |
| **Node.js** | 22 LTS | Uniquement pour **build** du frontend (pas obligatoire en prod si on utilise une image Docker déjà buildée) |
| **Nginx** (ou autre reverse proxy) | Dernière stable | Servir le frontend + proxy vers le backend |
| **Docker + Docker Compose** (optionnel) | Dernière stable | Déploiement en conteneurs (recommandé) |

---

## 4. Réseau et sécurité

### 4.1 Ports

| Port | Sens | Usage |
|------|------|--------|
| **80 / 443** | Entrant | Accès utilisateurs (HTTP/HTTPS) vers le reverse proxy |
| **9090** | Interne | Backend (exposé uniquement en localhost ou réseau interne si proxy sur même machine) |
| **3306** | Interne | MySQL (uniquement depuis le backend, pas d’exposition publique) |

En hébergement interne, le reverse proxy écoute en général sur 80 et/ou 443. Le backend et MySQL ne sont pas exposés directement sur Internet.

### 4.2 Flux sortants (serveur vers l’extérieur)

L’application peut initier des connexions sortantes pour :

| Service | Port / type | Obligatoire | Remarque |
|---------|-------------|-------------|----------|
| **Envoi d’e-mails** | SMTP 587 (TLS) ou API HTTPS (Brevo/Resend) | Recommandé | Reset MDP, notifications, alertes. Si SMTP bloqué, utiliser une API (Brevo, Resend) en HTTPS. |
| **OpenWeatherMap** | HTTPS | Non | Météo dashboard. Sans clé API = données simulées. |
| **Résolution DNS / mises à jour** | 53 (DNS), 80/443 | Oui | Pour Maven/npm en build, et accès API si utilisé. |

À valider avec la DSI : autorisation des flux SMTP sortants (587) ou, à défaut, usage d’un relais mail interne ou d’une API mail (Brevo/Resend).

### 4.3 HTTPS (recommandé en interne)

- Certificat SSL/TLS sur le reverse proxy (ex. Let’s Encrypt interne, ou certificat d’entreprise).
- Backend configuré avec `FRONTEND_BASE_URL` et `CORS_ALLOWED_ORIGINS` pointant vers l’URL réelle (ex. `https://mika.entreprise.local`).
- En prod, les cookies de session sont en `secure` + `same-site: Strict` (déjà géré par le profil `prod`).

---

## 5. Données et persistance

### 5.1 Base de données MySQL

- **Moteur :** MySQL 8.0 ou compatible (MariaDB 10.5+ possible après tests).
- **Schéma :** Créé automatiquement au premier démarrage du backend avec le profil `docker` (Hibernate `ddl-auto: update`). En production ensuite : profil `prod` avec `ddl-auto: none` (pas de modification automatique du schéma).
- **Sauvegardes :** À planifier par l’infrastructure (dump MySQL régulier, rétention selon politique interne).

### 5.2 Fichiers uploadés

- Le backend enregistre les fichiers dans un répertoire configuré par **`UPLOAD_DIR`** (défaut : `uploads`).
- Ce répertoire doit être **persistant** (volume Docker ou disque dédié) et inclus dans la stratégie de **sauvegarde**.
- Droits : l’utilisateur qui exécute le JAR (ou le processus du conteneur) doit avoir les droits en lecture/écriture.

---

## 6. Variables d’environnement (backend)

À renseigner sur le serveur (fichier `.env` ou variables d’environnement du conteneur / service).

### 6.1 Obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL JDBC MySQL | `jdbc:mysql://localhost:3306/mika_services?useSSL=false&serverTimezone=UTC` |
| `DATABASE_USERNAME` | Utilisateur MySQL | `mika_app` |
| `DATABASE_PASSWORD` | Mot de passe MySQL | *(secret)* |
| `JWT_SECRET` | Secret pour signature des JWT (long, aléatoire) | *(générer ex. `openssl rand -base64 48`)* |

### 6.2 Profil et admin initial

| Variable | Valeur | Description |
|----------|--------|-------------|
| `SPRING_PROFILES_ACTIVE` | `prod` | Profil production (cookies sécurisés, pas de création auto du schéma). Pour la **première** installation (BDD vide), utiliser une fois `docker` pour créer les tables, puis repasser en `prod`. |
| `INIT_ADMIN_EMAIL` | Email du premier admin | Création du compte SUPER_ADMIN au premier démarrage (si BDD vide et après création des tables). |
| `INIT_ADMIN_PASSWORD` | Mot de passe initial | À retirer après première connexion et changement du mot de passe. |

### 6.3 CORS et URL frontend

| Variable | Exemple | Description |
|----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | `https://mika.entreprise.local` | URL(s) du frontend (séparées par des virgules si plusieurs). |
| `FRONTEND_BASE_URL` | `https://mika.entreprise.local` | URL utilisée dans les **liens des e-mails** (réinitialisation MDP, etc.). |

### 6.4 Mail (recommandé)

Soit SMTP interne/entreprise, soit API (Brevo, Resend) si le pare-feu bloque le SMTP sortant. Voir `docs/VARIABLES_ENVIRONNEMENT.md` (sections Mail, Brevo, Resend).

### 6.5 Optionnel

- **Météo :** `METEO_API_KEY`, `METEO_DEFAULT_CITY` (ex. Libreville).
- **Uploads :** `UPLOAD_DIR` (ex. `/app/uploads` ou chemin absolu sur le serveur).
- **Port :** `PORT=9090` (défaut si non défini).

Liste complète : **`docs/VARIABLES_ENVIRONNEMENT.md`**.

---

## 7. Build et déploiement

### 7.1 Avec Docker (recommandé)

- **Backend :** `Dockerfile.backend` (racine) ou `backend/Dockerfile`. Image basée sur Eclipse Temurin 17, build Maven, JAR exposé sur 9090.
- **Frontend :** `Dockerfile.frontend` (racine). Build Node 22 + Vite, puis servitude par nginx (fichiers statiques). Pour un **même domaine** (proxy intégré), utiliser la config nginx qui proxy `/api` et `/api/ws` vers le backend (voir `frontend_web/mika-services-frontend/nginx.conf`).
- **MySQL :** Image officielle `mysql:8.0`.
- **Orchestration :** `docker-compose.yml` à la racine (MySQL + backend + frontend). Adapter les variables d’environnement et les volumes (uploads, données MySQL).

Pour un serveur interne, adapter dans le `docker-compose` :
- Les variables d’environnement (`.env` ou `environment`).
- Le reverse proxy : soit nginx dans un conteneur qui sert frontend + proxy API, soit nginx sur l’hôte qui pointe vers les conteneurs.

### 7.2 Sans Docker

1. **MySQL :** Installer MySQL 8, créer une base et un utilisateur, renseigner `DATABASE_*`.
2. **Backend :** Installer Java 17, déployer le JAR (build en CI ou local avec `mvn package`), lancer avec `java -jar app.jar` et les variables d’environnement (ou `.env` à côté du JAR).
3. **Frontend :** Build avec `npm ci && npm run build` (Node 22). Si l’API est sur le même domaine : build **sans** `VITE_API_BASE_URL` (le frontend utilisera `/api` en relatif). Copier le contenu de `dist/` vers la racine web du reverse proxy.
4. **Nginx :** Configurer la racide document sur le build frontend, `location /api/` et `location /api/ws` en proxy vers `http://127.0.0.1:9090`.

Exemple de configuration nginx (à adapter au chemin du frontend et au nom du serveur backend) : voir `frontend_web/mika-services-frontend/nginx.conf`.

---

## 8. Checklist avant mise en production

- [ ] MySQL installé et accessible, base créée, identifiants dans `DATABASE_*`.
- [ ] `JWT_SECRET` défini (long, aléatoire).
- [ ] `SPRING_PROFILES_ACTIVE=prod` (après création éventuelle du schéma avec `docker`).
- [ ] `CORS_ALLOWED_ORIGINS` et `FRONTEND_BASE_URL` = URL réelle du frontend (ex. `https://mika.entreprise.local`).
- [ ] Premier admin créé via `INIT_ADMIN_EMAIL` / `INIT_ADMIN_PASSWORD`, puis mot de passe changé et `INIT_ADMIN_PASSWORD` retiré.
- [ ] Envoi d’e-mails configuré (SMTP ou API Brevo/Resend) pour reset MDP et notifications.
- [ ] Répertoire des uploads persistant et sauvegardé.
- [ ] Reverse proxy configuré (frontend + proxy `/api` et `/api/ws`), HTTPS si requis.
- [ ] Sauvegardes MySQL et du répertoire uploads planifiées.
- [ ] Flux sortants autorisés (mail, éventuellement OpenWeatherMap).

---

## 9. Références dans le projet

| Document | Contenu |
|----------|---------|
| `docs/VARIABLES_ENVIRONNEMENT.md` | Toutes les variables d’environnement (auth, mail, météo, scheduler, etc.). |
| `docs/RAILWAY_VARIABLES.md` | Exemple de déploiement (Railway) ; utile pour la liste des variables et bonnes pratiques. |
| `docker-compose.yml` | Exemple d’orchestration MySQL + backend + frontend. |
| `Dockerfile.backend`, `Dockerfile.frontend` | Build des images pour backend et frontend. |
| `frontend_web/mika-services-frontend/nginx.conf` | Exemple nginx avec proxy `/api` et WebSocket `/api/ws`. |

---

*Document fait pour l’hébergement sur serveur interne — MIKA Services Platform.*
