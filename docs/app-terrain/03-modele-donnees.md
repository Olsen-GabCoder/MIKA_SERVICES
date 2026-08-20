# App Mobile Terrain MIKA — Modèle de données

Principe : **réutiliser le modèle existant** (module `materiel`) et n'ajouter que les briques manquantes. Base commune PostgreSQL (prod) / MySQL (local), API partagée.

## 1. Existant réutilisé tel quel

```
engins (Engin)                    statut: DISPONIBLE|EN_ATTENTE_DEPART|EN_SERVICE|EN_MAINTENANCE|
  ├─ qr_code_token (unique)               EN_PANNE|IMMOBILISE|HORS_SERVICE|EN_TRANSIT|REFORME
  ├─ latitude/longitude
  └─ heures_compteur

affectations_engin_projet (AffectationEnginChantier)   ← localisation courante = affectation EN_COURS
  ├─ engin_id, projet_id, date_debut, date_fin
  └─ statut: PLANIFIEE|EN_COURS|TERMINEE|ANNULEE|SUSPENDUE

mouvements_engin (MouvementEngin)                      ← transfert inter-chantiers
  ├─ engin_id, projet_origine_id (null=dépôt), projet_destination_id
  ├─ statut: EN_ATTENTE_DEPART|EN_TRANSIT|RECU|ANNULE
  ├─ date_depart_confirmee, date_reception_confirmee, initiateur_id
  └─ mouvements_engin_evenements (audit par mouvement, payload JSON)

demandes_materiel (DemandeMateriel)
  ├─ reference, projet_id, createur_id, priorite, date_souhaitee
  ├─ statut: SOUMISE|EN_VALIDATION_CHANTIER|EN_VALIDATION_PROJET|PRISE_EN_CHARGE|
  │          EN_ATTENTE_COMPLEMENT|EN_COMMANDE|LIVRE|REJETEE|CLOTUREE
  ├─ demandes_materiel_lignes (désignation, quantité, unité)
  └─ demandes_materiel_historique (transitions horodatées + acteur)   ← audit DMA

positions_engin (PositionEngin)      source: QR_SCAN|GPS_AUTO|MANUEL|CHANTIER
inspections_engin (InspectionEngin)  checklist JSON + signature + incident auto
incidents_engin (IncidentEngin)      gravité → EN_PANNE auto si MAJEURE/CRITIQUE
releves_compteur / consommations_carburant
notifications (Notification)         42 TypeNotification dont DMA_* et MOUVEMENT_*
users / roles / affectations_utilisateur_projet (+ roles_projet)      ← scoping chantier
```

## 2. Extensions nécessaires

### 2.1 `demandes_transfert_engin` — NOUVELLE table
Étape amont du `MouvementEngin` : la demande terrain avant validation logistique.

```
demandes_transfert_engin
  id                 BIGINT PK
  reference          VARCHAR(30) UNIQUE            -- DTE-2026-001
  engin_id           FK engins
  projet_origine_id  FK projets NULL               -- null = dépôt
  projet_destination_id FK projets
  motif              TEXT
  date_souhaitee     DATE
  statut             VARCHAR(30)                   -- DEMANDEE | VALIDEE | REFUSEE | ANNULEE
  motif_refus        TEXT NULL
  demandeur_id       FK users
  valideur_id        FK users NULL
  date_validation    TIMESTAMP NULL
  mouvement_id       FK mouvements_engin NULL      -- renseigné à la validation (ordre créé)
  created_at / updated_at
  INDEX (statut), INDEX (engin_id), INDEX (projet_destination_id)
```

Transitions : `DEMANDEE → VALIDEE` (crée le MouvementEngin) | `DEMANDEE → REFUSEE` | `DEMANDEE → ANNULEE` (demandeur).

### 2.2 Preuves terrain sur les mouvements — colonnes ajoutées à `mouvements_engin`
```
photo_depart_url        VARCHAR(500) NULL      -- Cloudinary
signature_depart        TEXT NULL
photo_reception_url     VARCHAR(500) NULL
signature_reception     TEXT NULL
commentaire_reception   TEXT NULL              -- écarts d'état constatés
```

### 2.3 Réception mobile des DMA — colonnes ajoutées à `demandes_materiel_lignes`
```
quantite_recue      DECIMAL NULL
etat_reception      VARCHAR(20) NULL           -- CONFORME | PARTIEL | ENDOMMAGE
```
+ sur `demandes_materiel` : `photo_reception_url`, `signature_reception`.

### 2.4 `push_tokens` — NOUVELLE table (FCM)
```
push_tokens
  id            BIGINT PK
  user_id       FK users
  token         VARCHAR(255) UNIQUE
  plateforme    VARCHAR(20)          -- ANDROID | IOS | WEB
  derniere_activite TIMESTAMP
  created_at
```

### 2.5 `journal_audit_terrain` — NOUVELLE table (append-only)
Journal transverse des actions terrain (complète les historiques par entité).
```
journal_audit_terrain
  id            BIGINT PK
  acteur_id     FK users NULL        -- null si anonyme (mode dev)
  action        VARCHAR(50)          -- SCAN_QR | INSPECTION | INCIDENT | RELEVE | RAVITAILLEMENT |
                                     -- DMA_CREEE | DMA_TRANSITION | TRANSFERT_DEMANDE | TRANSFERT_VALIDE |
                                     -- DEPART_CONFIRME | RECEPTION_CONFIRMEE | POSITION_CONFIRMEE
  entite_type   VARCHAR(30)          -- ENGIN | DMA | TRANSFERT | MOUVEMENT
  entite_id     BIGINT
  projet_id     FK projets NULL
  latitude / longitude  DOUBLE NULL
  payload       TEXT NULL            -- JSON détails
  client_request_id VARCHAR(64) NULL -- idempotence sync offline
  created_at    TIMESTAMP
  INDEX (entite_type, entite_id), INDEX (acteur_id), INDEX (created_at)
```

### 2.6 Idempotence offline — colonne sur les entités saisies terrain
`client_request_id VARCHAR(64) UNIQUE NULL` sur : `inspections_engin`, `incidents_engin`, `releves_compteur`, `consommations_carburant`, `positions_engin`, `demandes_materiel`, `demandes_transfert_engin`.
Règle serveur : si `client_request_id` déjà présent → renvoyer l'entité existante (200), pas de doublon.

### 2.7 Nouveaux `TypeNotification`
```
TRANSFERT_DEMANDE, TRANSFERT_VALIDE, TRANSFERT_REFUSE   (les MOUVEMENT_* existent déjà)
DMA_RECEPTIONNEE (si distinguée de DMA_LIVREE)
```

## 3. Côté client (PWA) — stockage local

```
IndexedDB "mika-terrain"
  ├─ cache_engins        : engins du chantier (TerrainEnginResponse[])
  ├─ cache_demandes      : DMA + transferts de l'utilisateur
  ├─ outbox              : { clientRequestId, type, payload, photosLocales[], statut, tentatives, createdAt }
  └─ photos              : blobs compressés en attente d'upload
```
Sync : replay séquentiel de l'outbox au retour réseau (event `online` + retry périodique), envoi photo → Cloudinary via backend → puis payload avec URL.

## 3bis. Extensions périmètre complet (V1.5/V2 — conçues dès maintenant)

### Référentiels & catalogue
```
transporteurs        (id, nom, type INTERNE|EXTERNE, contact, actif)
articles_catalogue   (id, reference, designation, unite, categorie, seuil_mini, actif)
depots               → modélisés comme Projet de type DEPOT (flag `type_site` sur projets)
                       OU table dediee `sites(id, nom, type CHANTIER|DEPOT, geo…)` — décision Phase 2
checklists_modeles   (id, type_engin, version, actif, items JSON [{code,label,section,photoObligatoireSiDefaut}])
```

### Outillage & stocks
```
outils               (id, code, designation, type, serialise BOOL, qr_code_token, statut, photo, actif)
stocks               (id, article_id|outil_id, site_id, quantite, maj TIMESTAMP)  -- stock par emplacement
mouvements_stock     (id, article_id, site_origine_id NULL, site_dest_id NULL, type ENTREE|SORTIE|TRANSFERT|RETOUR|AJUSTEMENT,
                      quantite, dma_id NULL, acteur_id, motif, created_at)        -- append-only
prets_outillage      (id, outil_id, emprunteur_id, site_id, date_sortie, date_retour_prevue,
                      date_retour_effective NULL, statut EN_COURS|RENDU|EN_RETARD|PERDU)
inventaires          (id, site_id, statut EN_COURS|CLOTURE, cree_par, created_at)
inventaires_lignes   (id, inventaire_id, article_id|outil_id, qte_theorique, qte_comptee, ecart, ajuste BOOL)
```

### Réservations & maintenance mobile
```
reservations_engin   (id, engin_id, projet_id, date_debut, date_fin, statut DEMANDEE|CONFIRMEE|REFUSEE|ANNULEE,
                      demandeur_id, valideur_id NULL, motif)  -- alimente la détection de conflits transferts
ordres_travail       → réutilise operations_maintenance + colonnes : assigne_a (FK users mécanicien),
                      compte_rendu TEXT, pieces_utilisees JSON, duree_heures, photo_cloture_url, signature_cloture
```

### Transport & geofencing
```
mouvements_engin     + colonnes : transporteur_id FK NULL, date_transport_planifiee, cout_transport_estime,
                      cout_transport_reel, type_portechar VARCHAR NULL
geofences            (id, projet_id, centre_lat, centre_lng, rayon_m)   -- V2 : alerte position hors zone
delegations          (id, delegant_id, delegataire_id, portee VARCHAR, date_debut, date_fin, actif)  -- V2
```

### Notifications & préférences
```
push_tokens          (cf. 2.4)
preferences_notifications (id, user_id, type_notification, in_app BOOL, push BOOL, email BOOL)
escalades_config     (id, type_evenement, delai_heures, role_escalade)   -- V2
```

Types de notification supplémentaires : `TRANSFERT_DEMANDE/VALIDE/REFUSE`, `TRANSFERT_LITIGE`, `RESERVATION_CONFIRMEE/CONFLIT`, `PRET_OUTIL_RETARD`, `INVENTAIRE_ECART`, `INCIDENT_RESOLU`, `DMA_RECEPTIONNEE`.

### Règles d'intégrité globales
- Localisation d'une ressource = **toujours dérivée** (affectation EN_COURS / mouvement EN_TRANSIT / stock par site) — jamais un champ libre.
- Tous les journaux (`mouvements_stock`, `journal_audit_terrain`, historiques) sont **append-only** : aucune mise à jour/suppression.
- Toute transition d'état passe par un service qui : valide la transition autorisée, enregistre l'historique, publie l'événement de notification.
- Idempotence `client_request_id` sur **toutes** les écritures mobiles (y compris stocks, prêts, inventaires, réservations).

## 4. Diagramme de flux (transfert)

```
CHEF CHANTIER B                LOGISTIQUE                 CHEF CHANTIER A            CHEF CHANTIER B
demande transfert  ──────▶  valide (ou refuse)  ──────▶  confirme départ  ──────▶  confirme réception
DTE: DEMANDEE               DTE: VALIDEE                 MVT: EN_TRANSIT            MVT: RECU
                            MVT créé: EN_ATTENTE_DEPART  Engin: EN_TRANSIT          Engin: EN_SERVICE
                            notif → chantier A           photo+signature            affectation A terminée
                                                         notif → B + logistique     affectation B créée
                                                                                    photo+signature
```
