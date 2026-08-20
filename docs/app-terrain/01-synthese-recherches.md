# App Mobile Terrain MIKA — Synthèse des recherches

Date : 2026-08-18 · Cadrage validé : **PWA React** (évolution de `/terrain`), **offline-first v1**, volumétrie **PME** (5-20 chantiers, <100 users, quelques dizaines d'engins), notifications **in-app + push FCM**.

## 1. Panorama des solutions du marché

| Solution | Positionnement | Points clés |
|---|---|---|
| **Trackunit** | Télématique construction pure | Données CAN bus multi-OEM, santé machine, maintenance ; visibilité petits assets via passerelles BLE ; prix premium, alert fatigue |
| **Tenna** | Plateforme tout-en-un contractors | Suivi mixte engins/véhicules/outils/consommables via GPS + Bluetooth + **QR codes** ; intégrations ERP (Procore, Viewpoint) |
| **Dispatcher (Volvo)** | Dispatch/planification flotte | Ordonnancement des mouvements d'assets (pas de routing colis) |
| **Hiboo** | Agrégateur télématique (EU) | Consolidation données multi-constructeurs, API AEMP 2.0 / ISO 15143-3 |
| **EquipmentShare T3, HCSS** | Gestion opérations chantier | Dispatch, timecards, maintenance, utilisation |
| **Procore Materials / Kojo / StruxHub** | Gestion matériaux | Demandes de matériel, réception mobile, transferts inter-chantiers |

**Enseignement** : les leaders combinent (1) identification physique de l'asset (QR/BLE/GPS), (2) workflows de dispatch à états explicites, (3) app mobile offline, (4) audit trail complet. Pour une PME, le QR code + saisie mobile suffit (pas de télématique embarquée en v1).

## 2. Fonctionnalités standard du marché

**Must-have (v1)**
- Registre d'assets avec QR code unique, photo, statut, localisation courante
- Check-in/check-out : scan QR → fiche → action
- Demande de matériel : création terrain → validation → suivi jusqu'à livraison
- Ordre de transfert d'engin : demande → validation logistique → transport → réception confirmée
- Inspections quotidiennes type DVIR : checklist visuelle pass/fail + photo obligatoire sur défaut + signature
- Photos géotaguées/horodatées comme preuves
- Mode hors-ligne complet : saisie locale + sync auto au retour réseau
- Notifications à chaque transition d'état
- Journal d'audit (qui, quoi, quand, où)

**Nice-to-have (v2+)**
- Télématique GPS temps réel (AEMP 2.0 / ISO 15143-3), tags BLE pour petit outillage
- Heures d'utilisation automatiques, taux d'utilisation du parc
- Maintenance prédictive, planification transporteur, coûts par chantier

## 3. Workflows métier typiques

### 3.1 Demande de matériel (material request)
```
BROUILLON → SOUMISE → EN_VALIDATION → VALIDÉE → EN_PRÉPARATION/COMMANDE
         → EN_LIVRAISON → LIVRÉE (réception mobile : quantités + état + photo) → CLÔTURÉE
Déviations : REJETÉE (motif obligatoire), COMPLÉMENT_REQUIS (aller-retour), ANNULÉE
```
Bonnes pratiques : routage automatique vers le validateur, matériaux tagués projet+emplacement à réception, réception mobile capture quantités/état/photos instantanément.

### 3.2 Transfert d'engin inter-chantiers (dispatch)
```
DEMANDE (chantier B a besoin / chantier A libère)
→ VALIDATION LOGISTIQUE (arbitrage disponibilité, conflits d'affectation)
→ PLANIFICATION TRANSPORT (date, transporteur)
→ DÉPART CONFIRMÉ (chantier A : scan QR + photo état + signature) — engin EN_TRANSIT
→ RÉCEPTION CONFIRMÉE (chantier B : scan QR + photo état + signature) — engin affecté au chantier B
Déviations : REFUSÉ, ANNULÉ (avant départ), litige à réception (écart d'état documenté par photos)
```

### 3.3 Inspection quotidienne (DVIR)
- Checklist par type d'engin, chaque item : OK / défaut / photo+note
- Blocage de soumission si défaut sans photo ; métadonnées GPS + timestamp intégrées
- Défaut grave → incident créé automatiquement → engin EN_PANNE

## 4. Patterns de modèle de données du domaine

- **Asset** (engin/matériel) : identité, QR, statut, localisation courante *dérivée des événements*
- **Assignment** : lien asset↔chantier avec période (jamais d'écrasement, historique complet)
- **Transfer order** : machine à états avec horodatage + acteur par transition
- **Material request** + lignes + historique des transitions
- **Movement/event log** : journal immuable append-only (source de vérité de la traçabilité)
- **Notification** : générée par événement de transition, adressée par rôle + périmètre chantier
- **Push token** : enregistrement des appareils par utilisateur (FCM)

## 5. Recommandations UX mobile terrain

- Cibles tactiles ≥ 56 px (gants), contrastes forts (plein soleil), une action par écran
- Scan QR comme geste central (bouton principal permanent)
- Offline-first : tout fonctionne sans signal (checklists, photos, scan, signatures) ; file de sync visible avec statut par élément ; download des données du chantier avant départ
- Photos compressées côté client avant upload ; géotag + horodatage automatiques
- Badges de statut couleur cohérents entre web et mobile

## Sources
- [7 Best Construction Telematics Software Compared — Tenna](https://www.tenna.com/blog/best-construction-telematics-software/)
- [Fleet Management Software Comparison 2026 — Equipment Insider](https://www.equipmentinsiderhq.com/posts/2025-11-30-fleet-management-software-comparison-2026/)
- [Best Construction Fleet Management Software — Expert Market](https://www.expertmarket.com/fleet-management/best-construction-fleet-management-software)
- [Construction Material Management — Procore](https://www.procore.com/materials)
- [Best Construction Materials Management Software — StruxHub](https://struxhub.com/blog/best-construction-materials-management-software-for-tracking-inventory-and-orders/)
- [Construction Materials Tracking 2026 — ServiceTitan](https://www.servicetitan.com/blog/construction-materials-tracking)
- [Offline Fleet Inspection App — FleetRabbit](https://fleetrabbit.com/blogs/post/offline-inspection-app)
- [Best Equipment Inspection Apps QR — BasinCheck](https://basincheck.com/resources/best-equipment-inspection-apps-qr)
- [12 Best DVIR Software 2026 — Guideflow](https://www.guideflow.com/blog/dvir-software)
