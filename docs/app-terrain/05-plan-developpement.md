# App Mobile Terrain MIKA — Plan de développement

## 1. Architecture retenue

- **PWA dans le repo existant** : `frontend_web/mika-services-frontend/src/features/terrain/` (route `/terrain/*` hors layout desktop), même build Vite, même API.
- **Backend** : extensions du module `materiel` (Spring Boot 4 / Kotlin) + réutilisation de `NotificationService`, STOMP `/ws`, Cloudinary, ZXing.
- **Stack technique** (existant réutilisé) : React 19, Redux Toolkit (+ `offlineQueueMiddleware`, `syncSlice`), TanStack Query, react-hook-form + zod, i18next, vite-plugin-pwa (Workbox), STOMP client.
- **Nouveautés** : IndexedDB (lib `idb`) pour cache + outbox offline, `BarcodeDetector` (fallback `@zxing/browser`) pour le scan caméra, Firebase Cloud Messaging (push).

Décision structure front : **découper** `TerrainAppPage.tsx` (1058 l.) en écrans par fichier :
```
features/terrain/
├── pages/TerrainAppPage.tsx         (shell : tabs + routing interne + toasts)
├── screens/ Accueil, Scan, FicheEngin, Inspection, Signalement, Releve,
│            Ravitaillement, DmaList, DmaForm, DmaDetail, TransfertForm,
│            TransfertList, ConfirmationMouvement, Notifications
├── components/ (StatutBadge, SubHeader, SignatureCanvas, PhotoPicker, SyncBadge…)
├── offline/ (db.ts idb, outbox.ts, sync.ts)
└── api/ → src/api/terrainApi.ts étendu
```

## 2. Phases

### Phase 0 — Socle & refactor (fondations)
- Découpage de `TerrainAppPage` en écrans + navigation bottom-tabs, styles partagés (tokens charte).
- **Design system terrain premium** : suppression totale des emojis → set d'icônes SVG inline stroke-based (même système que le web : 24×24, `stroke="currentColor"`, strokeWidth 1.5-2) dans `components/icons.tsx`, réutilisation d'`EnginTypeIcon` ; badges statuts identiques au web ; skeletons, micro-transitions, safe-areas.
- i18n `terrain` FR/EN (remplacement des libellés en dur).
- Scan QR caméra (`BarcodeDetector` + fallback ZXing, torche, saisie manuelle).

### Phase 1 — Demandes de matériel mobile
- Backend : rien ou presque (workflow DMA existant) ; endpoints terrain `GET/POST /terrain/demandes`, transitions autorisées par rôle ; photos justificatives.
- Front : écrans E04 (création), liste + E05 (timeline), actions valider/refuser/compléter.
- Réception mobile : quantités reçues + état + photo + signature (colonnes 2.3 du modèle).

### Phase 2 — Transferts d'engins terrain
- Backend : table `demandes_transfert_engin` + service (validation → création `MouvementEngin`), migration `@PostConstruct` idempotente (règles deployment_rules), preuves photo/signature sur mouvements (colonnes 2.2), notifications `TRANSFERT_*`.
- Front : E06 (demande), E07 (validation logistique avec détection de conflits), E08 (confirmations départ/réception avec photo + signature).

### Phase 3 — Offline-first
- IndexedDB : cache consultation (engins, demandes, transferts du chantier) + outbox.
- `clientRequestId` (idempotence) sur les POST terrain — backend : colonne unique + « replay-safe ».
- Sync : replay au retour réseau, statut par élément (E09), photos différées.
- Workbox : précache app shell `/terrain`, NetworkFirst API avec fallback cache.

### Phase 4 — Notifications
- In-app : cloche + liste + badge (réutilise `NotificationService` + STOMP `/topic/notifications/{userId}`).
- Push FCM : table `push_tokens`, envoi serveur (firebase-admin) sur événements DMA_*/MOUVEMENT_*/TRANSFERT_*, service worker push + deep-links.
- Matrice d'adressage par rôle + périmètre chantier.

### Phase 5 — Traçabilité & audit
- Fiche engin enrichie (E03) : qui/où/depuis quand, timeline (réutilise `CarnetEnginService`).
- `journal_audit_terrain` (append-only) alimenté par tous les endpoints terrain ; écran audit côté web pilotage.

### Phase 6 — Ré-authentification & permissions
- Rétablir l'auth sur `/terrain/**` (login mobile allégé, session longue + refresh, retour du confinement CONDUCTEUR).
- Scoping chantier des listes (`affectations_utilisateur_projet`), `@PreAuthorize` par transition.
- *Le permitAll actuel est un état de développement, à retirer avant tout déploiement.*

### Phase 7 — Finitions & greffe à la plateforme
- Restyling charte (badges/tokens identiques web), dark mode, accessibilité (contrastes, tailles).
- Manifest PWA dédié terrain (icône, `start_url: /terrain`), banner d'installation.
- Passe QA : parcours complets des 4 critères d'acceptation du cahier des charges, tests offline réels.

### Phase 8 — Outillage & stocks (V1.5)
- Backend : `outils`, `stocks`, `mouvements_stock` (append-only), `prets_outillage`, catalogue `articles_catalogue`, sites/dépôts.
- Front : check-in/check-out outillage par scan, sorties/entrées magasin, retours chantier→dépôt, alertes stock bas et retards de prêt.
- Préparation magasin des DMA (sortie de stock ou achat) + reliquats de livraison partielle.

### Phase 9 — Réservations & maintenance mobile (V1.5)
- Backend : `reservations_engin` (+ intégration détection de conflits transferts), extension `operations_maintenance` en ordres de travail (assignation mécanicien, compte-rendu, pièces, clôture signée).
- Front : écran réservation, file d'interventions mécanicien, immobilisation planifiée bloquant réservations/transferts.
- Checklists configurables par type d'engin (référentiel web + versionnage) et inspections réglementaires (VGP) avec échéancier.

### Phase 10 — Transport, inventaires & carte (V1.5/V2)
- Backend : `transporteurs` + colonnes transport sur mouvements (coûts), `inventaires`/`inventaires_lignes`, `geofences`.
- Front : missions transporteur (accès restreint), campagne d'inventaire mobile par scan avec écarts/ajustements, carte mobile du chantier/parc, alertes hors-zone (V2).
- Coûts par chantier (location+carburant+maintenance+transport) et exports PDF (bons de transfert/livraison, rapports d'inspection signés).

### Phase 11 — Pilotage fin & extensions (V2)
- Escalades paramétrables (`escalades_config`), délégations de validation, préférences de notification par type + email.
- Modèles de demande favoris, seuils budgétaires avec escalade de validation.
- Consommation anormale (dérive carburant), taux d'utilisation du parc, heures imputées par chantier.
- WebAuthn (biométrie), écran d'administration des référentiels (checklists, transporteurs, catalogue, seuils, geofences, matrice notifications).

## 3. Ordre de livraison recommandé

`0 → 1 → 2 → 3 → 4 → 5 → 6 → 7` = **V1** (socle livrable en production) ; puis `8 → 9 → 10` = **V1.5** ; enfin `11` = **V2**.
Chaque phase livre un incrément utilisable ; l'offline (3) arrive après les workflows pour ne pas figer une API instable ; l'auth (6) se rétablit avant toute mise en production. Le modèle de données complet (y compris V1.5/V2) est figé dès la Phase 2 pour éviter les refontes : les tables futures sont conçues, pas forcément créées.

## 4. Points de vigilance

- **Migrations DB** : contraintes CHECK PostgreSQL et pattern `@PostConstruct` idempotent (cf. `deployment_rules.md`) ; tester local MySQL **et** prod Postgres.
- **Spring Boot 4** : firebase-admin compatible (utiliser HTTP v1 API).
- **iOS** : push web nécessite installation PWA (iOS ≥ 16.4) ; `BarcodeDetector` absent de Safari → fallback ZXing obligatoire.
- **Photos** : compression client (canvas, max ~1280 px / 500 Ko) avant stockage outbox.
- **Cohérence état** : la localisation d'un engin reste dérivée des affectations/mouvements (jamais de champ « chantier » écrit à la main).
