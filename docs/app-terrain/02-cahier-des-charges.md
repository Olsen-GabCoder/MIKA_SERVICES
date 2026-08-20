# App Mobile Terrain MIKA — Cahier des charges fonctionnel COMPLET

Version 2 — périmètre exhaustif. Chaque exigence est marquée d'un jalon de réalisation (**V1** = socle livrable, **V1.5** = consolidation, **V2** = extension), mais **tout le périmètre est conçu dès maintenant** : modèle de données, API et écrans prévoient l'ensemble.

## 1. Objet et vision

Application mobile (PWA installable, `/terrain`) pour les équipes terrain et logistiques, complémentaire de la plateforme web de pilotage MIKA Services. Elle couvre **l'intégralité du cycle de vie des ressources matérielles** de l'entreprise : engins lourds, petit matériel/outillage, matériaux consommables — de la demande à la réforme, sur tous les chantiers et dépôts.

Vision cible : *à tout instant, pour chaque ressource : où elle est, qui l'utilise, depuis quand, dans quel état, ce qu'elle coûte, et tout ce qui lui est arrivé.*

## 2. Acteurs et rôles

| Rôle | Description | Capacités mobiles principales |
|---|---|---|
| **CONDUCTEUR / OPÉRATEUR** | Utilise les engins | Scan, inspections, relevés, ravitaillements, signalements, check-in/out outillage, consultation |
| **ÉQUIPE TERRAIN (ouvrier, chef d'équipe)** | Consomme matériel | Demandes de matériel, réceptions, retours, check-in/out outillage |
| **CHEF_CHANTIER** | Responsable d'un site | + Demandes de transfert, validations chantier, confirmations départ/réception, inventaires chantier, validation des inspections, planification besoins |
| **CHEF_PROJET** | Responsable projet | + Validation projet des DMA, arbitrages, vue coûts chantier |
| **LOGISTIQUE / CHEF DE PARC** | Gère le parc et les flux | + Validation transferts, planification transports, gestion dépôts, affectations, maintenance, réservations, arbitrage conflits |
| **MAGASINIER** | Gère les stocks dépôt/chantier | + Préparation DMA, sorties/entrées de stock, inventaires, seuils d'alerte |
| **MÉCANICIEN / MAINTENANCE** | Entretient les engins | + Ordres de travail, clôture maintenances, diagnostics pannes, pièces utilisées |
| **TRANSPORTEUR (interne ou externe)** | Déplace les engins | + Missions de transport : prise en charge, suivi, livraison (accès restreint) |
| **ADMIN / SUPER_ADMIN** | Administration | Tout + référentiels, checklists, paramétrage, audit complet |

Exigences transverses rôles :
- R.1 Un utilisateur peut cumuler des rôles ; les capacités s'additionnent.
- R.2 Périmètre de données : par défaut le(s) chantier(s) d'affectation ; logistique/parc/admin = global.
- R.3 **Délégation** : un chef de chantier peut déléguer temporairement ses validations (absence/congés) — période bornée, tracée. (V2)
- R.4 Tous les contrôles sont doublés côté serveur (@PreAuthorize + scoping).

## 3. Périmètre fonctionnel exhaustif

### M1 — Registre des ressources (assets)
- M1.1 **Engins** : fiche complète (photo, type, marque/modèle, immatriculation, n° série, statut, état, compteur, carburant, mode d'acquisition, location + coût journalier, caractéristiques techniques). *(existant)* **V1**
- M1.2 **Petit matériel / outillage** (marteaux-piqueurs, groupes, pompes, échafaudages, coffrages…) : fiche simplifiée, quantité ou unité sérialisée, QR par item ou par lot. **V1.5**
- M1.3 **Matériaux consommables** (ciment, fer, agrégats…) : références, unités, stocks par emplacement. **V1.5**
- M1.4 **Emplacements** : chantiers + **dépôts/parcs** comme lieux à part entière (un transfert peut viser un dépôt). **V1**
- M1.5 Identification physique : QR code unique par engin *(existant)* et par outil sérialisé ; impression d'étiquettes depuis le web. **V1** (engins) / **V1.5** (outillage)
- M1.6 Cycle de vie complet : acquisition → service → maintenance → immobilisation → réforme/cession, avec dates et motifs. **V1.5**

### M2 — Demandes de matériel (DMA)
- M2.1 Création mobile : chantier, priorité (basse/normale/urgente), date souhaitée, lignes (article libre ou du catalogue, quantité, unité), photos justificatives, commentaire. Fonctionne hors-ligne. **V1**
- M2.2 Suivi : liste filtrée (statut, chantier, période), fil chronologique complet des transitions avec acteur/horodatage. **V1**
- M2.3 Workflow complet *(existant, réutilisé)* : SOUMISE → EN_VALIDATION_CHANTIER → EN_VALIDATION_PROJET → PRISE_EN_CHARGE → EN_COMMANDE → LIVREE → CLOTUREE ; déviations REJETEE (motif obligatoire), EN_ATTENTE_COMPLEMENT (dialogue demandeur/valideur), ANNULEE. **V1**
- M2.4 Validation/refus/complément depuis le mobile pour chaque niveau de validation. **V1**
- M2.5 **Préparation magasin** : le magasinier voit les DMA prises en charge, prépare depuis le stock (sortie de stock) ou déclenche l'achat. **V1.5**
- M2.6 **Réception mobile** : quantités reçues par ligne, état (conforme/partiel/endommagé), photos, signature ; livraison partielle → reliquat suivi. **V1**
- M2.7 **Retours de matériel** : retour chantier → dépôt (excédents, fin de chantier), avec réintégration stock. **V1.5**
- M2.8 Modèles de demande récurrents (favoris) et duplication d'une demande passée. **V2**
- M2.9 Seuils budgétaires : montant estimé, escalade de validation si dépassement d'un seuil paramétrable. **V2**

### M3 — Transferts et mouvements d'engins
- M3.1 **Demande de transfert** initiée terrain : engin (scan ou liste), origine (auto), destination (chantier ou dépôt), date souhaitée, motif. **V1**
- M3.2 **Validation logistique** : file des demandes, aide à la décision (affectations en cours, conflits de dates, réservations, distance), accepter/refuser (motif). **V1**
- M3.3 **Planification transport** : date planifiée, transporteur (référentiel interne/externe), type de porte-char, coût transport estimé/réel. **V1** (date) / **V1.5** (transporteur+coûts)
- M3.4 **Confirmation de départ** (origine) : scan QR + photo état + relevé compteur + signature → EN_TRANSIT. **V1**
- M3.5 **Confirmation de réception** (destination) : scan QR + photo état + signature + constat d'écarts éventuels (litige documenté) → RECU, bascule d'affectation automatique. **V1**
- M3.6 **Mission transporteur** : écran dédié au transporteur (mes missions, prise en charge, livraison) avec position en transit. **V2**
- M3.7 Annulation avant départ (motif), suspension. **V1**
- M3.8 **Réservation d'engin** : réserver un engin disponible pour une période future (chantier + dates) ; la logistique arbitre les collisions ; les réservations alimentent la détection de conflits des transferts. **V1.5**
- M3.9 Mouvements d'outillage et de matériaux entre sites (bons de transfert simplifiés, quantités). **V1.5**

### M4 — Inspections & conformité
- M4.1 Inspection quotidienne de prise de poste type DVIR *(existant)* : checklist par item OK/défaut/photo+note, blocage si défaut sans photo, état général, signature, GPS. **V1**
- M4.2 **Checklists configurables par type d'engin** (référentiel administrable web) + versionnage. **V1.5**
- M4.3 Défaut grave → incident créé automatiquement → engin EN_PANNE *(existant)*. **V1**
- M4.4 Inspections périodiques réglementaires (VGP, contrôle technique) : échéancier, rappels, preuve documentaire. **V1.5**
- M4.5 Validation/contre-signature du chef de chantier sur les inspections avec anomalies. **V2**

### M5 — Incidents & pannes
- M5.1 Signalement mobile *(existant)* : type (panne, casse, fuite, accident, vol, vandalisme…), gravité, description, photos multiples, GPS. **V1**
- M5.2 Gravité MAJEURE/CRITIQUE → engin EN_PANNE automatique *(existant)*. **V1**
- M5.3 **Suivi du signalement par le déclarant** : statut (signalé → pris en compte → en réparation → résolu), notification à chaque étape. **V1**
- M5.4 Transformation en maintenance corrective *(existant côté web)* accessible au mécanicien mobile. **V1.5**
- M5.5 Levée de panne : re-mise en service tracée (qui, quand, contrôle post-réparation). **V1**

### M6 — Maintenance
- M6.1 Consultation mobile du planning maintenance d'un engin (opérations, plans récurrents, échéances). **V1**
- M6.2 **Ordres de travail mécanicien** : ma file d'interventions, prise en charge, compte-rendu (travaux réalisés, pièces, durée, coût), clôture avec photo/signature. **V1.5**
- M6.3 Alertes d'échéance (jours/heures/km) *(existant backend)* poussées aux bons acteurs. **V1**
- M6.4 Immobilisation planifiée : blocage des réservations/transferts pendant la fenêtre de maintenance. **V1.5**

### M7 — Compteurs, carburant & coûts
- M7.1 Relevé compteur horaire/km *(existant)* : validation anti-régression, historique. **V1**
- M7.2 Ravitaillement *(existant)* : litres, coût, photo du ticket, lieu. **V1**
- M7.3 Consommation anormale : alerte si dérive vs moyenne engin. **V2**
- M7.4 Coûts par engin (TCO *(existant)*) et **par chantier** : location, carburant, maintenance, transport. **V1.5**
- M7.5 Heures d'utilisation par chantier (imputation) et taux d'utilisation du parc. **V2**

### M8 — Localisation & carte
- M8.1 Confirmation de position au scan *(existant)* + historique des positions. **V1**
- M8.2 Carte mobile : engins du chantier / vue parc (logistique), fond Leaflet. **V1.5**
- M8.3 **Geofencing** : périmètre par chantier, alerte si position confirmée hors zone. **V2**
- M8.4 Préparation télématique : modèle compatible AEMP 2.0 / ISO 15143-3 pour brancher plus tard des boîtiers GPS. **V2**

### M9 — Notifications & temps réel
- M9.1 In-app : cloche, liste, badge non-lues, temps réel STOMP *(existant)*. **V1**
- M9.2 **Push FCM** : app fermée, deep-link vers l'écran concerné, préférences par type. **V1**
- M9.3 Matrice d'adressage complète par événement (voir annexe A). **V1**
- M9.4 **Escalades** : demande sans validation après N heures → relance + escalade au niveau supérieur (paramétrable). **V2**
- M9.5 Rappels planifiés : inspections manquantes du jour, échéances maintenance, documents expirants, réservations à venir. **V1.5**
- M9.6 Email pour les validations importantes (réutilise Spring Mail). **V2**

### M10 — Inventaires & stocks
- M10.1 Stock par emplacement (dépôt, chantier) pour matériaux et outillage : entrées, sorties, transferts, retours. **V1.5**
- M10.2 **Inventaire mobile** : campagne d'inventaire par scan/comptage, écarts calculés, ajustements validés. **V2**
- M10.3 Seuils mini par référence + alerte STOCK_BAS *(type notification existant)*. **V1.5**
- M10.4 Check-in/check-out outillage : prêt à une personne/équipe, retour, retard signalé. **V1.5**

### M11 — Historique, audit & reporting
- M11.1 Journal d'audit append-only de toutes les actions (qui, quoi, quand, où, depuis quel appareil) — consultable web, filtrable. **V1**
- M11.2 Timeline par ressource (carnet de bord *(existant)* enrichi des nouveaux événements). **V1**
- M11.3 KPIs mobiles selon rôle : logistique (demandes en attente, engins en transit, pannes ouvertes), chef chantier (mes flux en cours). **V1.5**
- M11.4 Exports (PDF bon de transfert, bon de livraison, rapport d'inspection signé). **V1.5**
- M11.5 Tableau de bord parc côté web nourri par les données terrain (déjà partiellement existant). **V1**

### M12 — Application : socle technique fonctionnel
- M12.1 **Offline-first complet** : consultation (cache chantier) + toutes les saisies en file locale avec statut visible, sync auto, idempotence serveur, résolution de conflits (dernier écrit gagne + signalement). **V1**
- M12.2 **Scan caméra** QR (BarcodeDetector + fallback ZXing), torche, saisie manuelle. **V1**
- M12.3 Photos : capture caméra, compression client, géotag + horodatage, upload différé Cloudinary. **V1**
- M12.4 Signatures : canvas tactile *(existant)*, associées aux documents générés. **V1**
- M12.5 PWA : installable Android/iOS, manifest dédié terrain, mises à jour avec invite. **V1**
- M12.6 Authentification : login mobile allégé, session longue + refresh, biométrie appareil (WebAuthn) en option, confinement par rôle. **V1** (login) / **V2** (WebAuthn)
- M12.7 i18n FR/EN complet, dark mode, préférences d'accessibilité (taille texte). **V1** (i18n) / **V1.5** (reste)
- M12.8 Administration des référentiels (web) : checklists, types de panne, transporteurs, catalogue articles, seuils, geofences, matrice notifications. **V1.5→V2**

## 4. Exigences non fonctionnelles

- **UX terrain** : cibles ≥ 56 px, 1 action/écran, contraste plein soleil, usage gants et une main, feedback haptique si disponible.
- **Charte** : accent `#FF6B35`, header `#0F1B26`, Barlow/Barlow Condensed, badges statuts strictement identiques au web pilotage.
- **Performance** : démarrage < 3 s (mobile milieu de gamme), listes virtualisées, photos < 500 Ko.
- **Fiabilité offline** : aucune perte de saisie, même après fermeture d'app ou redémarrage du téléphone (persistance IndexedDB).
- **Sécurité** : JWT, TLS, permissions serveur systématiques, journal immuable, pas de données sensibles en cache non chiffrable au-delà du nécessaire.
- **RGPD/rétention** : géolocalisation liée à l'action professionnelle uniquement (pas de tracking continu des personnes), durées de rétention paramétrables, information des utilisateurs. **V1**
- **Compatibilité** : Chrome Android ≥ 100, Safari iOS ≥ 16.4 (push), mode dégradé sans caméra.
- **Interopérabilité** : API REST commune avec le web, base commune, WebSocket partagé ; aucune divergence de modèle.

## 5. Critères d'acceptation (extraits)

1. Transfert complet demandé, validé, transporté, réceptionné : traçable avec photos/signatures aux deux bouts, affectations à jour, notifications reçues par les 4 acteurs.
2. DMA créée hors-ligne dans une zone blanche part seule au retour réseau, sans doublon, et suit le workflow complet jusqu'à réception signée avec reliquat géré.
3. Fiche d'une ressource : localisation, utilisateur, ancienneté sur site, état, coûts, historique exhaustif — cohérente entre mobile et web.
4. Un opérateur ne peut pas soumettre une inspection avec défaut sans photo ; un défaut critique immobilise l'engin et notifie maintenance + logistique en < 5 s (en ligne).
5. Un inventaire chantier fait apparaître les écarts vs stock théorique ; les ajustements sont tracés.
6. L'audit permet de reconstituer toute la vie d'une demande ou d'un transfert sans zone d'ombre.

## Annexe A — Matrice de notifications (évènement → destinataires)

| Événement | Demandeur | Chef chantier orig. | Chef chantier dest. | Chef projet | Logistique | Magasinier | Mécanicien | Transporteur |
|---|---|---|---|---|---|---|---|---|
| DMA soumise | ✓(accusé) | ✓ | — | — | — | — | — | — |
| DMA validée chantier | ✓ | — | — | ✓ | — | — | — | — |
| DMA validée projet / prise en charge | ✓ | ✓ | — | — | ✓ | ✓ | — | — |
| DMA en commande / en livraison | ✓ | ✓ | — | — | — | ✓ | — | — |
| DMA livrée / réceptionnée | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | — |
| DMA rejetée / complément requis | ✓ | ✓ | — | — | — | — | — | — |
| Transfert demandé | ✓(accusé) | ✓ | ✓ | — | ✓ | — | — | — |
| Transfert validé + transport planifié | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Transfert refusé | ✓ | ✓ | — | — | — | — | — | — |
| Départ confirmé (EN_TRANSIT) | ✓ | — | ✓ | — | ✓ | — | — | ✓ |
| Réception confirmée | ✓ | ✓ | — | — | ✓ | — | — | — |
| Litige à réception | — | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Incident MAJEUR/CRITIQUE | ✓(accusé) | ✓ | — | ✓ | ✓ | — | ✓ | — |
| Incident résolu | ✓ | ✓ | — | — | ✓ | — | — | — |
| Échéance maintenance proche | — | ✓ | — | — | ✓ | — | ✓ | — |
| Inspection manquante (rappel du jour) | ✓(opérateur) | ✓ | — | — | — | — | — | — |
| Document engin expirant | — | — | — | — | ✓ | — | — | — |
| Stock bas | — | ✓ | — | — | ✓ | ✓ | — | — |
| Retard retour outillage | ✓(emprunteur) | ✓ | — | — | — | ✓ | — | — |
| Réservation confirmée / conflit | ✓ | ✓ | — | — | ✓ | — | — | — |
