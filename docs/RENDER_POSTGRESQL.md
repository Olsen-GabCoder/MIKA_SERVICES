# Prod sur Render avec PostgreSQL

En production sur Render, l’application utilise **PostgreSQL** (base gérée Render). En local, tu restes sur **MySQL** (profil `dev`).

## Profils

| Profil | BDD | Usage |
|--------|-----|--------|
| `dev` | MySQL (local) | Développement local |
| `prod` | MySQL | Prod avec MySQL (ex. ancien hébergeur) |
| `prod` + `prod-postgres` | **PostgreSQL** | **Prod sur Render** |

## Sur Render : activer PostgreSQL

1. **Créer une base PostgreSQL**  
   Dashboard Render → **New +** → **Postgres** → même région que le backend (ex. Francfort).

2. **Variables du service backend**  
   - `SPRING_PROFILES_ACTIVE` = **`prod,prod-postgres`** (les deux, dans cet ordre).
   - `DATABASE_URL` = l’URL fournie par Render (format `postgresql://user:password@host:port/dbname`).  
     Render l’injecte souvent automatiquement si la base est liée au service.  
   - Si tu utilises l’URL JDBC à la place :  
     `DATABASE_URL` = `jdbc:postgresql://host:port/dbname`  
     + `DATABASE_USERNAME` et `DATABASE_PASSWORD`.

3. **Schéma au premier déploiement (base vide)**  
   Avec `ddl-auto: none`, les tables ne sont pas créées automatiquement. Pour une **base PostgreSQL vide** :  
   - Déploie une fois avec `SPRING_PROFILES_ACTIVE=prod,prod-postgres,prod-postgres-init`.  
   - Au démarrage, Hibernate crée les tables (`ddl-auto: update`).  
   - Puis retire le profil `prod-postgres-init` (revenir à `prod,prod-postgres`) et redéploie.

## Local : inchangé

En local, garde `SPRING_PROFILES_ACTIVE=dev` (ou rien, défaut = dev). La config reste en MySQL (`application-dev.yml`).
