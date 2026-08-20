# Matrice rôles × modules × périmètres — Document de référence

> **Statut : RÉFÉRENCE.** Validé le 2026-08-20. Tout écart constaté dans le code, web ou mobile,
> se mesure contre ce document. Toute évolution des règles passe par une mise à jour explicite ici.

## 1. Principes fondateurs

### 1.1 Deux axes, jamais mélangés

- **Rôle global** (table `roles`, porté par le JWT) = **capacités** : ce que l'utilisateur
  sait faire, indépendamment de tout projet.
- **Affectation projet** (table `affectations_utilisateur_projet`, poste résolu contre le
  référentiel `roles_projet` par nom) = **périmètre** : où il exerce ces capacités, avec
  dates, statut et historique.

### 1.2 L'affectation est la source de vérité unique

- Être **chef de projet du projet X** = avoir une affectation **EN_COURS** sur X dont le poste
  résout vers **RP-CHEF-PROJET** (unique par projet, garanti par les garde-fous d'affectation).
- `projets.responsable_projet_id` est une **dénormalisation synchronisée automatiquement** :
  renseignée au démarrage de l'affectation RP-CHEF-PROJET, vidée à sa clôture/annulation.
  **La fiche projet ne se modifie plus directement.** L'intérim = clôturer une affectation,
  en créer une autre (historique daté).

### 1.3 Règle de périmètre unique (web et mobile)

> **Trio transversal (SUPER_ADMIN, ADMIN, LOGISTIQUE) = tout.
> Sinon : périmètre = mes affectations EN_COURS. Point final.**

- Plus aucune union « affectations ∪ responsable » : responsable ⇒ affecté, par construction.
- **Hors périmètre en lecture = 404, jamais 403** (ne pas révéler l'existence de la ressource).
- Les actions exigent le périmètre **ET** la capacité (jamais le rôle seul).
- Dans son projet, le **chef de projet est le chef de tout** : il voit et pilote tout ce qui
  touche son projet, au-dessus des chefs de chantier. Limites : anti auto-validation
  (on ne valide jamais sa propre demande) et actes réservés à la logistique.

### 1.4 Rôles globaux

| Rôle | Nature | Périmètre |
|---|---|---|
| SUPER_ADMIN, ADMIN | Transversal (pilotage) | Tout |
| LOGISTIQUE | Transversal (matériel) | Tout le parc et tous les flux matériel |
| CHEF_PROJET | Métier | Affectations EN_COURS |
| CHEF_CHANTIER | Métier | Affectations EN_COURS |
| CONDUCTEUR | Métier | Affectations EN_COURS |
| USER | Métier (employé) | Affectations EN_COURS |
| Rôles qualité (7) | Métier | Affectations EN_COURS (modules qualité) |

Accès web (`WEB_ROLES`, SecurityConfig) : réservé aux rôles pilotage tant que le web = dashboards.
Les autres rôles sont confinés à `/terrain` (mobile).

## 2. Matrice mobile (`/terrain/**`)

Légende : ✅ = autorisé dans le périmètre ; **T** = trio uniquement ; — = interdit.
Toute lecture hors périmètre → 404.

### 2.1 Contexte, engins, actions machine

| Endpoint | Capacité (rôles) | Périmètre |
|---|---|---|
| GET /me, /notifications* | tous | soi-même |
| GET /chantiers | tous | affectations EN_COURS (trio = tous actifs) |
| GET /mes-engins | tous | engins affectés EN_COURS à mes chantiers (trio = parc complet) |
| GET /engins/scan | tous | global (le scan = preuve de présence physique) |
| GET /engins/{id}/carnet, /photo | tous | périmètre engin* |
| POST /engins/{id}/position | tous | périmètre engin* |
| POST /engins/{id}/releve, /ravitaillement, /inspection | OPERATEUR (CONDUCTEUR, chefs, LOGISTIQUE, admins) | périmètre engin* |
| POST /engins/{id}/incident | **tous les rôles** (la sécurité prime) | périmètre engin* |

\* Périmètre engin : engin affecté EN_COURS à un de mes chantiers ; engin au dépôt = trio
uniquement (agir sur un engin au dépôt via scan = évolution explicite future, pas une exception).

### 2.2 DMA (demandes de matériel)

**Circuit à une seule porte** (réforme 2026-08-20, aligné sur les transferts) : le
chantier/projet soumet, la logistique arbitre, le circuit s'exécute.

```
SOUMISE (en attente logistique) → PRISE_EN_CHARGE → EN_COMMANDE → LIVRE → CLOTUREE
  ├─ REJETEE (depuis SOUMISE ou PRISE_EN_CHARGE, motif obligatoire)
  └─ EN_ATTENTE_COMPLEMENT ↔ PRISE_EN_CHARGE (aller-retour terrain)
```

| Action | Capacité | Périmètre |
|---|---|---|
| Liste / détail / historique | tous | projet ∈ affectations, OU créateur de la DMA |
| Créer | USER, chefs, LOGISTIQUE, admins | projet ∈ affectations (trio = tout) |
| Prendre en charge / rejeter (motif) | LOGISTIQUE, admins | tout ; jamais sa propre DMA (trio exempté) |
| Demander complément / commander | LOGISTIQUE, admins | tout |
| Compléter | créateur ou trio | — |
| Livrer / clôturer | créateur+trio (livraison) ; LOGISTIQUE, admins (clôture) | périmètre |

Notes :
- Les statuts `EN_VALIDATION_CHANTIER` / `EN_VALIDATION_PROJET` sont **retirés du circuit**
  (enum conservé pour lire l'historique et les visas PDF des DMA antérieures à la réforme).
- **Garde-fou informel obligatoire** : à la création, notification immédiate au(x) chef(s) de
  projet affecté(s) EN_COURS au projet (en plus de la logistique). Le CP n'a plus de veto
  formel mais ne perd jamais l'information ; il peut demander le rejet avant engagement.
- Backlog (évolution possible, non construite) : **visa chef de projet optionnel par projet**,
  à réintroduire le jour où un gros chantier l'exige.

### 2.3 Transferts d'engins

| Action | Capacité | Périmètre |
|---|---|---|
| Liste / détail | tous | origine OU destination ∈ affectations, OU initiateur (trio = tout) |
| Créer (demander) | chefs, LOGISTIQUE, admins | engin de mon périmètre ; **destination = tout chantier actif** (verrou = validation logistique) |
| Valider / rejeter | LOGISTIQUE, admins | tout |
| Confirmer départ | chef affecté à l'origine (CHEF_PROJET = son projet) | origine |
| Bon (QR + code) | initiateur, acteurs origine, trio | visible sinon 404 |
| Réceptionner | CHEF_CHANTIER ou CHEF_PROJET affecté à destination, trio | destination + preuve QR/code |
| Photos de réception | même règle que réceptionner | statut EN_TRANSIT/RECU sinon 400 |
| Annuler | initiateur (DEMANDE), logistique (validé) | selon statut |

### 2.4 Formulaires — listes de chantiers

- **Règle générale** (`GET /chantiers`) : affectations EN_COURS ; trio = tous les actifs.
- **Exception unique — destination de transfert** : tous les chantiers actifs, réservée au
  formulaire de création de transfert, pour les rôles habilités à initier un transfert.
  Aucun autre écran n'utilise la liste complète.

## 3. Matrice web

- Le web est réservé au **pilotage** (dashboards, lecture) — pivot 2026-08-19 : toutes les
  manipulations passent par le mobile.
- **Dette assumée** (cf. `docs/app-terrain/06-backlog-technique.md`) : les contrôleurs web
  matériel contrôlent le rôle seul, sans périmètre. **À scoper avec la même règle unique
  lors de la refonte dashboards.** Aucun nouveau rôle ne rejoint `WEB_ROLES` avant ce scoping.
- Gestion des affectations (web, espace Utilisateurs & Organisation) : SUPER_ADMIN/ADMIN
  partout ; CHEF_PROJET sur ses projets (`requireCanManage`).

## 4. Synchronisation responsable_projet_id (dénormalisation)

| Événement d'affectation RP-CHEF-PROJET | Effet sur `projets.responsable_projet_id` |
|---|---|
| Création/passage EN_COURS | = user de l'affectation |
| Modification (changement de titulaire) | mis à jour |
| Clôture (TERMINEE) / annulation / suspension | vidé (NULL) |
| Deux RP-CHEF-PROJET EN_COURS simultanés | impossible (garde-fou 409 existant) |

Le champ n'est plus éditable via l'API projet. Les consommateurs du champ (notifications,
affichages « responsable ») continuent de le lire — il est garanti cohérent par la synchro.

## 5. Invariants de non-régression (verrouillés par tests)

1. Aucune liste non scopée pour un rôle non transversal (pattern « mesEngins avant Phase 6 »).
2. Lecture hors périmètre = 404, jamais 403.
3. Aucune action autorisée sur le seul critère du rôle global.
4. Anti auto-validation sur tous les workflows.
5. Notifications alignées sur la visibilité : on n'est jamais notifié d'une ressource
   qu'on ne peut pas ouvrir.

Tests de référence : `MouvementEnginVisibiliteTest`, `DemandeMaterielVisibiliteTest`,
`TerrainEnginPerimetreTest` (+ tests de synchro responsable à venir).
