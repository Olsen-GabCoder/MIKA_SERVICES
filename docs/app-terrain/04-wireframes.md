# App Mobile Terrain MIKA — Wireframes

Charte appliquée (issue de l'analyse de la plateforme) — **exigence : rendu ultra premium** :
- **Accent** : orange MIKA `#FF6B35` (actions principales) ; header sombre `#0F1B26` (existant terrain)
- **Sémantique** : succès `#16A34A`/`#6BBF59`, danger `#DC2626`/`#E63946`, warning `#D97706`/`#F4A261`, info bleu `#2563EB`
- **Typo** : `Barlow` (texte), `Barlow Condensed` (titres/KPI) — convention de l'app terrain existante
- **Iconographie** : **AUCUN emoji**. SVG inline stroke-based style Heroicons/Feather (24×24, `stroke="currentColor"`, strokeWidth 1.5-2, linecap/linejoin round) — même système que la partie web (cf. `EnginTypeIcon.tsx`, `AlertesBanner.tsx`). Set d'icônes terrain dédié dans `features/terrain/components/icons.tsx` : scan, engin (par type via `EnginTypeIcon` réutilisé), inspection, panne, compteur, carburant, transfert, colis/DMA, cloche, carte, signature, photo, sync, magasin, clé (maintenance), camion (transport).
- **Composants** : cartes blanches radius 12 avec ombre douce (`0 8px 28px rgba(21,34,48,.18)` en élévation), boutons radius 14 hauteur ≥ 56 px, inputs radius 10, badges statuts strictement identiques au web (pastille + fond teinté), skeletons de chargement (pas de spinners bruts), micro-transitions (entrées 6px translateY + fade, cf. animations `mkIn`), safe-areas iOS
- Navigation : **bottom tab bar** 4 onglets + bouton scan central surélevé (accent orange, ombre portée)

*Note : dans les schémas ASCII ci-dessous, les symboles (⚠, ⛽, 📷…) sont des **placeholders de lecture** — en implémentation ce sont exclusivement les SVG du set ci-dessus.*

## Direction artistique premium (inspirée des UI kits mobiles 2025-2026)

Analyse des tendances des kits premium (Envato/Dribbble/Behance — bento grids, glassmorphism, flat minimal, dark mode adaptatif) transposée à la charte MIKA :

1. **Accueil en bento grid** : modules de tailles variées (hero scan 2×1, KPIs 1×1, flux en cours 2×2) plutôt qu'une liste verticale plate — densité d'information sans surcharge, respiration généreuse (gaps 12-16 px).
2. **Header sombre en dégradé** `#0F1B26 → #152230` avec léger motif topographique en overlay (opacité 4-6 %), contenu qui glisse dessous au scroll avec effet **frosted-glass** (backdrop-blur) sur la barre repliée.
3. **Cartes** : blanc pur sur fond `#F4F6F8`, radius 16, ombre à deux niveaux (`0 1px 2px rgba(20,24,27,.06), 0 8px 24px -8px rgba(20,24,27,.12)`), bordure hairline `#DFE5EB`. Jamais de bordures épaisses.
4. **Hiérarchie typographique forte** : gros chiffres Barlow Condensed 700 tabular-nums (classe `.db-display-num` du web), labels uppercase 11 px letterspacing +0.08em muted, corps Barlow 15-16 px.
5. **Statuts = pills** : pastille 8 px + fond teinté 10-12 % + texte 600 — mêmes couples couleur que le web, zéro texte brut coloré.
6. **Micro-interactions utiles** (pas décoratives) : press-state scale 0.98, entrées `mkIn` (fade + translateY 6px) en cascade 40 ms, pull-to-refresh, transition de la timeline étape par étape, haptique légère sur scan réussi.
7. **Skeletons shimmer** (pattern `salle-skel` existant) pour tous les chargements — jamais de spinner plein écran.
8. **Dark mode complet** dès la conception (tokens `--db-*` dark du web : fond `#0F0F11`, surface `#18181B`, accent désaturé `#FF8255`).
9. **Scan central** : bouton flottant circulaire 64 px accent orange, ombre portée `rgba(255,107,53,.35)`, encoche dans la tab bar — signature visuelle de l'app.
10. **Photos plein cadre** : fiches engin avec image en hero 16:9 + dégradé de lisibilité, vignettes rondes 12 px dans les listes.

Sources d'inspiration : [Mobile App Design Trends 2026 — UX Pilot](https://uxpilot.ai/blogs/mobile-app-design-trends), [Bento Grid Layout — Peterdraw](https://peterdraw.studio/blog/bento-grid-layou), [Bento UI — Dribbble](https://dribbble.com/tags/bento-ui), [UX/UI Design Trends 2025 — BairesDev](https://www.bairesdev.com/blog/ux-ui-design-trends/), [Field-first design — FleetRabbit](https://fleetrabbit.com/industry/construction-management-system/mobile-fleet-management-app-construction-teams-2026)

---

## E01 — Accueil (tableau de bord terrain)

```
┌──────────────────────────────────┐
│ ▓▓ #0F1B26                       │
│ MIKA Terrain            🔔(3) ↻ │   ← cloche notifications (badge)
│ Bonjour, Olsen                   │
│ mardi 18 août — Chantier BEL AIR │   ← chantier courant
├──────────────────────────────────┤
│ ⚠ 2 engins sans inspection       │   ← bandeau alerte (rouge pâle)
│                                  │
│ ┌──────────────────────────────┐ │
│ │  [■] SCANNER UN ENGIN        │ │   ← bouton principal #FF6B35
│ └──────────────────────────────┘ │
│                                  │
│ MES ENGINS (Barlow Condensed)    │
│ ┌────────┐ ┌────────┐ ┌───────┐  │
│ │ENG-042 │ │ENG-017 │ │ENG-09 │  │   ← cartes horizontales scrollables
│ │Pelle.. │ │Camion  │ │Grue   │  │      photo + badge statut
│ │●EN SERV│ │●DISPO  │ │●PANNE │  │
│ └────────┘ └────────┘ └───────┘  │
│                                  │
│ EN COURS                         │
│ ┌──────────────────────────────┐ │
│ │ ⇄ Transfert ENG-042 → NKOLT. │ │   ← suivis actifs (DMA + transferts)
│ │   En attente validation   ●  │ │
│ ├──────────────────────────────┤ │
│ │ ▤ DMA-118 Ciment 50 sacs     │ │
│ │   En cours de livraison   ●  │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│  🏠      ▤        [■]     ⇄   ☰ │   ← tabs : Accueil, Demandes,
│ Accueil Demandes  SCAN  Transf. +│      SCAN central orange, Transferts, Plus
└──────────────────────────────────┘
```

## E02 — Scan QR (caméra)

```
┌──────────────────────────────────┐
│ ← Scanner              [lampe ⚡]│
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ │      ┌────────────┐          │ │   ← viseur caméra plein écran
│ │      │  ▂ ▂ ▂ ▂  │          │ │      cadre animé accent orange
│ │      └────────────┘          │ │
│ │                              │ │
│ └──────────────────────────────┘ │
│ Visez le QR code de l'engin      │
│ ┌──────────────────────────────┐ │
│ │ Saisir le code manuellement  │ │   ← fallback (offline/QR abîmé)
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

## E03 — Fiche engin (après scan)

```
┌──────────────────────────────────┐
│ ← ENG-2026-042        ● EN SERVICE│
│ ┌──────────────────────────────┐ │
│ │        [photo engin]         │ │
│ └──────────────────────────────┘ │
│ Pelleteuse CAT 320               │
│ 📍 Chantier BEL AIR — depuis 12j │   ← traçabilité : où, depuis quand
│ 👤 K. Mbadinga  ◔ 1 240 h        │      qui, compteur
│ ⛽ Dernier plein : 15/08          │
│                                  │
│ ┌─────────────┐ ┌─────────────┐  │
│ │☑ Inspection │ │⚠ Signaler   │  │   ← grille d'actions 2×3
│ │  du jour    │ │  une panne  │  │      (vert / rouge)
│ ├─────────────┤ ├─────────────┤  │
│ │◔ Relevé     │ │⛽ Ravitail-  │  │      (bleu / ambre)
│ │  compteur   │ │  lement     │  │
│ ├─────────────┤ ├─────────────┤  │
│ │⇄ Demander   │ │🕐 Historique │  │      (orange / gris)
│ │  transfert  │ │             │  │
│ └─────────────┘ └─────────────┘  │
│ [ 📍 Confirmer la position ici ]  │
└──────────────────────────────────┘
```

## E04 — Nouvelle demande de matériel

```
┌──────────────────────────────────┐
│ ← Demande de matériel            │
│ Chantier   [BEL AIR         ▾]   │
│ Priorité   (○ Basse ●Normale ○Urgente)│
│ Souhaité   [ 22/08/2026    📅]   │
│ ARTICLES                         │
│ ┌──────────────────────────────┐ │
│ │ Ciment CPJ 45   50  sacs   ✕ │ │
│ │ Fer à béton Ø12 200 barres ✕ │ │
│ │ [+ Ajouter un article]       │ │
│ └──────────────────────────────┘ │
│ [📷 Ajouter des photos]  (2)     │
│ Commentaire [________________]   │
│ ┌──────────────────────────────┐ │
│ │      SOUMETTRE LA DEMANDE    │ │   ← #FF6B35 ; offline : "sera
│ └──────────────────────────────┘ │      envoyée au retour du réseau"
└──────────────────────────────────┘
```

## E05 — Suivi d'une demande (timeline)

```
┌──────────────────────────────────┐
│ ← DMA-2026-118    ●EN LIVRAISON  │
│ Ciment + fer — BEL AIR           │
│ ──────────────────────────────── │
│ ● Soumise         18/08 07:12 OF │   ← fil chronologique
│ ● Validée chantier 18/08 09:30 KM│      (historique existant)
│ ● Prise en charge 18/08 11:02 LOG│
│ ● En commande     18/08 15:45 LOG│
│ ○ Livraison…                     │   ← étape courante pulsante
│ ──────────────────────────────── │
│ ┌──────────────────────────────┐ │
│ │   ✓ RÉCEPTIONNER LA LIVRAISON│ │   ← visible chef chantier :
│ └──────────────────────────────┘ │      quantités + état + photo + signature
└──────────────────────────────────┘
```

## E06 — Demande de transfert d'engin

```
┌──────────────────────────────────┐
│ ← Transfert d'engin              │
│ Engin        [ENG-042 Pelle.. ▾] │   ← pré-rempli si venu du scan
│ De           BEL AIR (courant)   │
│ Vers         [NKOLTANG       ▾]  │
│ Date souhaitée [21/08/2026  📅]  │
│ Motif [terrassement phase 2___]  │
│ ┌──────────────────────────────┐ │
│ │   ENVOYER À LA LOGISTIQUE    │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

## E07 — Validation logistique (rôle LOGISTIQUE)

```
┌──────────────────────────────────┐
│ ← Demandes de transfert    (4)   │
│ ┌──────────────────────────────┐ │
│ │ DTE-031  ENG-042 Pelleteuse  │ │
│ │ BEL AIR → NKOLTANG  21/08    │ │
│ │ Motif : terrassement phase 2 │ │
│ │ ⚠ Conflit : affectée jusqu'au│ │   ← aide décision (conflits)
│ │   25/08 sur BEL AIR          │ │
│ │ [✓ VALIDER]     [✕ Refuser]  │ │   ← vert / contour rouge
│ └──────────────────────────────┘ │
│ Validation → planifier transport │
│ (date + transporteur) → ordre de │
│ mouvement créé, chantiers notifiés│
└──────────────────────────────────┘
```

## E08 — Confirmation départ / réception (transfert)

```
┌──────────────────────────────────┐
│ ← Départ ENG-042 → NKOLTANG      │
│ 1. État de l'engin               │
│ [📷 Photo obligatoire]  (1/1) ✓  │
│ Commentaire [__________________] │
│ 2. Signature                     │
│ ┌──────────────────────────────┐ │
│ │        ~~~ (canvas) ~~~      │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │   CONFIRMER LE DÉPART        │ │   ← passe engin EN_TRANSIT,
│ └──────────────────────────────┘ │      notifie destination+logistique
└──────────────────────────────────┘
   (écran réception identique : photo état arrivée,
    signale les écarts, clôt le transfert)
```

## E09 — Notifications & file de synchronisation

```
┌──────────────────────────────────┐
│ ← Notifications        Tout lire │
│ ● DTE-031 validée — départ 21/08 │
│ ● DMA-118 en livraison           │
│ ○ ENG-017 inspection manquante   │
├──────────────────────────────────┤
│ SYNCHRONISATION          🟠 3    │   ← visible en mode offline
│ ⏳ Inspection ENG-042  en attente │
│ ⏳ Photo incident      en attente │
│ ✓ Relevé compteur      envoyé    │
└──────────────────────────────────┘
```

Écrans existants conservés (restylés au besoin) : Inspection checklist, Signalement panne, Relevé compteur, Ravitaillement.

---

## Écrans V1.5/V2 (prévus dès la conception, mêmes patterns)

- **E10 Check-in/out outillage** : scan outil → prêt (emprunteur, retour prévu) / retour ; liste "mes emprunts" avec retards en rouge.
- **E11 Magasin** : file des DMA à préparer, sortie de stock par ligne (scan/quantité), reliquats, alertes stock bas.
- **E12 Réservation d'engin** : calendrier de disponibilité (bandes affectations/réservations/maintenances), demande de créneau.
- **E13 Interventions mécanicien** : ma file d'ordres de travail, compte-rendu (travaux, pièces, durée), clôture photo + signature.
- **E14 Mission transporteur** : mes missions du jour, prise en charge → livraison, itinéraire, contacts chantiers.
- **E15 Inventaire** : campagne par site, comptage par scan, écarts théorique/compté surlignés, validation des ajustements.
- **E16 Carte** : engins du chantier (ou parc complet pour la logistique), fond Leaflet, badge statut sur marqueurs, geofence (V2).
- **E17 KPIs par rôle** : logistique (en attente/en transit/pannes), chef chantier (mes flux), pastilles cliquables vers les listes.

Tous ces écrans réutilisent : SubHeader, StatutBadge, PhotoPicker, SignatureCanvas, SyncBadge, bottom-tabs.
