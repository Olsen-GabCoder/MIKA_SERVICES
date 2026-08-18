# Module Engins & Matériel — Spécification fonctionnelle complète

*MIKA Services*

---

## 1. Architecture du domaine

Le module s'articule autour de 8 domaines fonctionnels interconnectés :

```
                    ┌──────────────────────┐
                    │   PARC ÉQUIPEMENTS   │
                    │  (fiche, catégorie,  │
                    │   documents, QR)     │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
┌─────────▼──────────┐ ┌──────▼───────┐ ┌───────────▼──────────┐
│    AFFECTATIONS     │ │  COMPTEURS   │ │     DOCUMENTS &       │
│ (chantier, équipe,  │ │ (heures, km, │ │     CONFORMITÉ        │
│  conducteur, dates) │ │  carburant)  │ │ (assurance, CT,       │
│                     │ │              │ │  certificats, dates)  │
└─────────┬──────────┘ └──────┬───────┘ └───────────┬──────────┘
          │                   │                      │
          │          ┌────────▼────────┐             │
          │          │   MAINTENANCE   │             │
          │          │ (préventive,    │             │
          │          │  corrective,    │             │
          │          │  prédictive)    │             │
          │          └────────┬────────┘             │
          │                   │                      │
┌─────────▼──────────┐ ┌─────▼──────────┐ ┌────────▼───────────┐
│  GÉOLOCALISATION   │ │  INCIDENTS &   │ │      COÛTS &        │
│  (position, carte, │ │  SIGNALEMENTS  │ │      ÉCONOMIE        │
│   historique, QR)  │ │  (panne, alerte)│ │  (achat, location,  │
│                     │ │                │ │   maintenance,      │
└────────────────────┘ └────────────────┘ │   carburant)        │
                                            └────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │   TABLEAU DE BORD    │
                    │      & ALERTES        │
                    └──────────────────────┘
```

---

## 2. Entités et modèle de données

### 2.1 Équipement (entité centrale)

| Champ | Type | Description |
|---|---|---|
| id | Long | Identifiant unique |
| codeInterne | String | Code interne entreprise (ex : ENG-2024-042) |
| designation | String | Nom courant (ex : « Pelle hydraulique 20T ») |
| categorie | Enum | ENGIN_LOURD, ENGIN_LEGER, VEHICULE, MATERIEL_OUTILLAGE, EQUIPEMENT_SECURITE, COFFRAGE, ECHAFAUDAGE, GRUE, COMPACTEUR, GENERATEUR, POMPE, BETON |
| sousCategorie | String | Libre (ex : « Pelle sur chenilles ») |
| marque | String | Constructeur |
| modele | String | Référence modèle |
| numeroSerie | String | Unique, identifiant constructeur |
| immatriculation | String? | Pour les véhicules |
| anneeFabrication | Int? | — |
| dateAcquisition | LocalDate? | — |
| dateMiseEnService | LocalDate? | — |
| modeAcquisition | Enum | ACHAT, LOCATION_LONGUE_DUREE, LOCATION_COURTE, CREDIT_BAIL, PRET |
| proprietaire | Enum | INTERNE, EXTERNE |
| fournisseurId | Long? | Référence vers fournisseur si externe |
| valeurAcquisition | BigDecimal? | Prix d'achat |
| statut | Enum | DISPONIBLE, EN_SERVICE, EN_MAINTENANCE, EN_PANNE, IMMOBILISE, EN_TRANSFERT, HORS_SERVICE, REFORME |
| etat | Enum | NEUF, BON, CORRECT, USE, MAUVAIS, IRREPARABLE |
| projetActuelId | Long? | Chantier actuel |
| conducteurActuelId | Long? | Opérateur actuel |
| responsableId | Long? | Responsable attitré |
| dernierReleve | JSON | {heures: 4520, km: 12340, date: "..."} |
| caracteristiques | JSON | Données techniques libres |
| puissance | String? | Ex : « 150 CV » |
| poids | String? | Ex : « 21 tonnes » |
| capacite | String? | Ex : « 1,2 m3 » |
| carburant | Enum? | DIESEL, ESSENCE, ELECTRIQUE, HYBRIDE, AUCUN |
| photoUrl | String? | Photo principale |
| qrCodeToken | String | Token unique pour QR code |
| alerteMaintenanceActive | Boolean | Indicateur caché pour requête rapide |
| latitude | Double? | Dernière position connue |
| longitude | Double? | — |
| positionMaj | Instant? | Date de dernière position |
| notes | String? | Observations générales |
| actif | Boolean | Suppression logique (soft delete) |

### 2.2 AffectationEquipement

| Champ | Type | Description |
|---|---|---|
| id | Long | — |
| equipementId | Long | — |
| projetId | Long | Chantier |
| conducteurId | Long? | Opérateur affecté |
| equipeId | Long? | Équipe affectée |
| responsableId | Long | Qui a affecté |
| dateDebut | LocalDate | — |
| dateFin | LocalDate? | Null = en cours |
| dateFinPrevue | LocalDate? | Prévision |
| motif | String? | Raison de l'affectation |
| statut | Enum | PLANIFIEE, ACTIVE, TERMINEE, ANNULEE |
| notes | String? | — |

### 2.3 CompteurReleve

| Champ | Type | Description |
|---|---|---|
| id | Long | — |
| equipementId | Long | — |
| typeCompteur | Enum | HEURES, KILOMETRES, CYCLES |
| valeur | Double | Valeur relevée |
| dateReleve | Instant | — |
| releveParId | Long | Utilisateur |
| projetId | Long? | Chantier au moment du relevé |
| source | Enum | MANUEL, QR_SCAN, AUTOMATIQUE |
| notes | String? | — |

### 2.4 ConsommationCarburant

| Champ | Type | Description |
|---|---|---|
| id | Long | — |
| equipementId | Long | — |
| projetId | Long? | — |
| dateRavitaillement | LocalDate | — |
| quantiteLitres | Double | — |
| coutTotal | BigDecimal? | — |
| prixUnitaire | BigDecimal? | — |
| compteurAuMoment | Double? | Heures ou km au ravitaillement |
| fournisseur | String? | — |
| enregistreParId | Long | — |
| notes | String? | — |

### 2.5 MaintenanceOperation

| Champ | Type | Description |
|---|---|---|
| id | Long | — |
| equipementId | Long | — |
| type | Enum | PREVENTIVE, CORRECTIVE, REGLEMENTAIRE |
| statut | Enum | PLANIFIEE, EN_COURS, TERMINEE, REPORTEE, ANNULEE |
| priorite | Enum | BASSE, NORMALE, HAUTE, URGENTE |
| titre | String | — |
| description | String? | — |
| datePrevu | LocalDate? | — |
| dateDebut | LocalDate? | — |
| dateFin | LocalDate? | — |
| compteurPrevu | Double? | Déclenchement par compteur |
| typeCompteurPrevu | Enum? | HEURES, KILOMETRES |
| intervalleMaintenance | Int? | Récurrence (jours ou heures) |
| coutMainOeuvre | BigDecimal? | — |
| coutPieces | BigDecimal? | — |
| coutTotal | BigDecimal? | — |
| prestataireExterne | String? | — |
| rapportIntervention | String? | — |
| projetId | Long? | Chantier au moment de la maintenance |
| creeParId | Long | — |
| realiseParId | Long? | — |
| incidentSourceId | Long? | Si corrective suite à incident |
| piecesUtilisees | JSON? | Liste des pièces |

### 2.6 PlanMaintenance (modèles de maintenance récurrente)

| Champ | Type | Description |
|---|---|---|
| id | Long | — |
| equipementId | Long | — |
| titre | String | Ex : « Vidange moteur » |
| description | String? | — |
| type | Enum | PREVENTIVE, REGLEMENTAIRE |
| intervalleJours | Int? | Tous les N jours |
| intervalleHeures | Int? | Toutes les N heures |
| intervalleKm | Int? | Tous les N km |
| seuilAlerte | Int | Jours/heures/km avant échéance pour alerte |
| actif | Boolean | — |
| derniereExecution | LocalDate? | — |
| dernierCompteur | Double? | — |
| prochaineEcheance | LocalDate? | Calculée |
| prochainCompteur | Double? | Calculé |

### 2.7 IncidentEquipement

| Champ | Type | Description |
|---|---|---|
| id | Long | — |
| equipementId | Long | — |
| projetId | Long? | — |
| type | Enum | PANNE, CASSE, USURE_ANORMALE, FUITE, PROBLEME_ELECTRIQUE, PROBLEME_HYDRAULIQUE, ACCIDENT, AUTRE |
| gravite | Enum | MINEURE, MODEREE, MAJEURE, CRITIQUE, BLOQUANTE |
| statut | Enum | SIGNALE, EN_COURS_ANALYSE, EN_REPARATION, RESOLU, CLOS |
| titre | String | — |
| description | String? | — |
| dateSignalement | Instant | — |
| signaleParId | Long | — |
| latitude | Double? | Position au signalement |
| longitude | Double? | — |
| photos | JSON? | URLs des photos |
| immobilisant | Boolean | L'équipement est-il immobilisé ? |
| dateResolution | Instant? | — |
| resoluParId | Long? | — |
| rapportResolution | String? | — |
| maintenanceId | Long? | Maintenance corrective liée |

### 2.8 DocumentEquipement

| Champ | Type | Description |
|---|---|---|
| id | Long | — |
| equipementId | Long | — |
| type | Enum | CARTE_GRISE, ASSURANCE, CONTROLE_TECHNIQUE, CERTIFICAT_CONFORMITE, CONTRAT_LOCATION, FACTURE, GARANTIE, PERMIS_CIRCULATION, FICHE_TECHNIQUE, AUTRE |
| titre | String | — |
| fichierUrl | String | — |
| dateEmission | LocalDate? | — |
| dateExpiration | LocalDate? | — |
| alerteJoursAvant | Int | Défaut 30 |
| notes | String? | — |
| uploadeParId | Long | — |

### 2.9 PositionEquipement (historique géographique)

| Champ | Type | Description |
|---|---|---|
| id | Long | — |
| equipementId | Long | — |
| latitude | Double | — |
| longitude | Double | — |
| precision | Double? | Mètres |
| source | Enum | QR_SCAN, GPS_MANUEL, GPS_AUTO |
| enregistreParId | Long? | — |
| projetId | Long? | — |
| timestamp | Instant | — |

### 2.10 InspectionQuotidienne

| Champ | Type | Description |
|---|---|---|
| id | Long | — |
| equipementId | Long | — |
| projetId | Long? | — |
| inspecteurId | Long | — |
| dateInspection | LocalDate | — |
| heureDebut | LocalTime? | — |
| compteurActuel | Double? | — |
| checklistResultats | JSON | {items: [{code, label, ok, commentaire}]} |
| etatGeneral | Enum | BON, CORRECT, MAUVAIS |
| anomaliesDetectees | Boolean | — |
| commentaireGeneral | String? | — |
| photos | JSON? | — |
| signature | String? | Base64 ou URL |
| incidentCreeId | Long? | Si anomalie → incident automatique |

### 2.11 TransfertEquipement

| Champ | Type | Description |
|---|---|---|
| id | Long | — |
| equipementId | Long | — |
| projetOrigineId | Long | — |
| projetDestinationId | Long | — |
| dateDepart | LocalDate | — |
| dateArrivee | LocalDate? | — |
| statut | Enum | PLANIFIE, EN_TRANSIT, ARRIVE, ANNULE |
| transporteur | String? | — |
| motif | String? | — |
| demandeParId | Long | — |
| valideParId | Long? | — |

### 2.12 CoutEquipement (journal des dépenses)

| Champ | Type | Description |
|---|---|---|
| id | Long | — |
| equipementId | Long | — |
| type | Enum | ACQUISITION, LOCATION, MAINTENANCE, CARBURANT, ASSURANCE, REPARATION, PIECE_DETACHEE, TRANSPORT, AMENDE, AUTRE |
| montant | BigDecimal | — |
| dateDepense | LocalDate | — |
| description | String? | — |
| projetId | Long? | Imputation chantier |
| fournisseur | String? | — |
| referenceFacture | String? | — |
| enregistreParId | Long | — |

---

## 3. Fonctionnalités — classification par priorité

### 3.1 Indispensables (Phase 1 — MVP)

#### A. Gestion du parc

| # | Fonctionnalité | Description |
|---|---|---|
| A1 | Fiche équipement complète | Création, édition, consultation avec tous les champs techniques |
| A2 | Catalogue catégorisé | Navigation par catégorie, sous-catégorie, filtres multiples |
| A3 | Statuts et états | Cycle de vie complet : disponible → en service → maintenance → panne → réformé |
| A4 | Recherche et filtres avancés | Par statut, catégorie, chantier, disponibilité, marque, modèle |
| A5 | Photo équipement | Upload et affichage de la photo principale |
| A6 | Génération QR code | QR unique par équipement, téléchargeable/imprimable |
| A7 | Code interne auto-généré | Format standardisé (ex : ENG-2024-042) |

#### B. Affectations

| # | Fonctionnalité | Description |
|---|---|---|
| B1 | Affecter à un chantier | Avec dates, conducteur, équipe, motif |
| B2 | Désaffecter / libérer | Fin d'affectation, retour disponible |
| B3 | Historique des affectations | Timeline complète par équipement |
| B4 | Vue affectations actives | Qui est où, depuis quand |
| B5 | Détection conflits | Alerte si double affectation sur la même période |
| B6 | Affectation planifiée | Réservation future avec dates prévues |

#### C. Maintenance

| # | Fonctionnalité | Description |
|---|---|---|
| C1 | Créer une opération de maintenance | Préventive ou corrective, avec détails |
| C2 | Suivi des opérations | Statut, dates, coûts, rapport |
| C3 | Plans de maintenance récurrents | Modèles avec intervalles (jours, heures, km) |
| C4 | Alertes maintenance | Notification quand échéance approche ou est dépassée |
| C5 | Historique maintenance | Journal complet par équipement |
| C6 | Coûts de maintenance | Suivi main-d'œuvre + pièces + prestataire |

#### D. Incidents et signalements

| # | Fonctionnalité | Description |
|---|---|---|
| D1 | Signaler un incident | Type, gravité, description, photos, localisation |
| D2 | Suivi des incidents | Workflow : signalé → analyse → réparation → résolu → clos |
| D3 | Lien incident → maintenance | Création automatique d'une maintenance corrective |
| D4 | Alertes pannes critiques | Notification immédiate au responsable logistique |
| D5 | Historique incidents | Par équipement et par chantier |

#### E. Documents

| # | Fonctionnalité | Description |
|---|---|---|
| E1 | Associer des documents | Upload avec type, dates émission/expiration |
| E2 | Alertes expiration | Notification N jours avant échéance |
| E3 | Consultation documents | Visualisation et téléchargement |
| E4 | Types standardisés | Assurance, contrôle technique, certificat, contrat, facture... |

#### F. Compteurs et consommations

| # | Fonctionnalité | Description |
|---|---|---|
| F1 | Relevé de compteur | Saisie heures, km, cycles avec date |
| F2 | Historique compteurs | Évolution dans le temps |
| F3 | Enregistrer ravitaillement | Litres, coût, compteur au moment |
| F4 | Consommation moyenne | Calcul automatique L/h ou L/100 km |

#### G. Tableau de bord responsable logistique

| # | Fonctionnalité | Description |
|---|---|---|
| G1 | KPIs globaux | Total parc, disponibles, en service, en panne, en maintenance |
| G2 | Donut répartition statuts | Visuel instantané |
| G3 | Alertes actives | Maintenances dues, documents expirants, incidents ouverts |
| G4 | Liste équipements par statut | Accès rapide aux équipements problématiques |
| G5 | Vue par chantier | Quels équipements sur quel chantier |

#### H. Terrain / mobile

| # | Fonctionnalité | Description |
|---|---|---|
| H1 | Scan QR code | Caméra du téléphone, identification instantanée |
| H2 | Fiche mobile simplifiée | Infos essentielles, statut, dernier relevé |
| H3 | Signaler une panne (mobile) | Formulaire rapide avec photo et géolocalisation |
| H4 | Relevé compteur (mobile) | Saisie rapide après scan QR |
| H5 | Confirmer position | Enregistrer la localisation actuelle de l'équipement |

### 3.2 Importantes (Phase 2 — Enrichissement)

| # | Fonctionnalité | Description |
|---|---|---|
| I1 | Carte géolocalisation | Carte interactive avec positions des équipements |
| I2 | Historique positions | Trace des déplacements dans le temps |
| I3 | Inspections quotidiennes | Checklist avant utilisation avec signature |
| I4 | Transferts inter-chantiers | Workflow planifié → en transit → arrivé |
| I5 | Gestion des locations | Contrat, fournisseur, dates, coûts, échéances |
| I6 | Journal des coûts | Toutes les dépenses par équipement, type, chantier |
| I7 | Analyse TCO | Coût total de possession par équipement |
| I8 | Taux d'utilisation | Heures productives / heures disponibles |
| I9 | Export Excel du parc | Fichier complet du parc avec toutes les données |
| I10 | Planning affectations (timeline) | Gantt des affectations par équipement |
| I11 | Consommations anormales | Détection automatique de dérives |
| I12 | Tableau de bord chantier | Vue équipements par chantier spécifique |

### 3.3 Avancées (Phase 3 — Excellence)

| # | Fonctionnalité | Description |
|---|---|---|
| J1 | Maintenance prédictive | Analyse des compteurs + historique pour anticiper les pannes |
| J2 | Mode hors ligne complet | Cache local, synchronisation différée, gestion des conflits |
| J3 | Gestion pièces détachées | Stock, commandes, association aux maintenances |
| J4 | Calendrier de maintenance | Vue calendaire de toutes les opérations planifiées |
| J5 | Rapports PDF automatiques | Fiche équipement, rapport mensuel, bilan parc |
| J6 | Tableau de bord analytique avancé | Graphiques tendances, comparaisons, prévisions |
| J7 | Geofencing | Alertes si un équipement quitte une zone définie |
| J8 | Notifications push terrain | Alerte mobile pour les conducteurs/opérateurs |
| J9 | Signature électronique | Pour les inspections et les transferts |
| J10 | Intégration comptable | Export des coûts vers la comptabilité |
| J11 | Amortissement | Calcul automatique de la valeur résiduelle |
| J12 | Scoring équipement | Note de fiabilité basée sur l'historique |

---

## 4. Fonctionnalités supplémentaires identifiées

Au-delà de ce qui a été demandé, voici des besoins opérationnels critiques en BTP identifiés :

### 4.1 Checklist d'inspection pré-utilisation

En BTP, la réglementation impose une vérification avant chaque utilisation d'un engin. Le module doit proposer des checklists paramétrables par catégorie d'équipement :

- Pelle hydraulique : niveaux d'huile, état des flexibles, fonctionnement du godet, avertisseur de recul, rétroviseurs, feux...
- Grue : limiteur de charge, anémomètre, état des câbles, extincteur, carnet de bord...
- Véhicule : pneumatiques, freins, éclairage, trousse de premiers secours, gilet, triangle...

L'inspection doit pouvoir :

- Être obligatoire avant tout relevé de compteur ou confirmation d'utilisation
- Générer automatiquement un incident si une anomalie critique est détectée
- Être signée électroniquement par l'inspecteur
- Être archivée pour conformité réglementaire

### 4.2 Gestion des habilitations conducteur

Un conducteur ne peut pas utiliser n'importe quel engin. Le module doit pouvoir :

- Associer les habilitations/CACES à chaque utilisateur (via le module Certifications QSHE existant)
- Vérifier à l'affectation que le conducteur possède l'habilitation requise pour la catégorie d'engin
- Alerter si une habilitation expire pendant la période d'affectation

### 4.3 Immobilisation et mise hors service

Le cycle de vie d'un équipement comprend des périodes d'immobilisation volontaire (hivernage, attente de pièces, attente de décision) et la mise hors service définitive (réforme). Le module doit :

- Permettre de déclarer une immobilisation avec motif et date prévisionnelle de remise en service
- Gérer la réforme avec un processus validé (motif, décision, valorisation résiduelle)
- Exclure les équipements réformés des indicateurs d'utilisation

### 4.4 Gestion des accessoires et équipements associés

Un engin peut avoir des accessoires interchangeables (godets de différentes tailles, brise-roche, tarière...). Le module doit pouvoir :

- Associer des sous-équipements à un équipement parent
- Suivre la disponibilité et l'affectation des accessoires indépendamment

### 4.5 Alertes météo et conditions d'utilisation

Certains engins ont des restrictions d'utilisation en fonction des conditions météo (grues par vent fort, enrobés par température basse). Le module pourrait intégrer des alertes météo liées aux chantiers.

### 4.6 Carnet de bord numérique

Chaque engin doit disposer d'un carnet de bord numérique consolidant automatiquement :

- Les relevés de compteur
- Les inspections
- Les ravitaillements
- Les incidents
- Les maintenances
- Les affectations
- Les positions

Ce carnet doit être exportable en PDF pour les audits ou contrôles.

---

## 5. Workflows et règles métier

### 5.1 Cycle de vie d'un équipement

```
CRÉATION → DISPONIBLE ←→ EN_SERVICE
                ↕              ↕
          IMMOBILISÉ    EN_MAINTENANCE
                ↕              ↕
           EN_PANNE ←──────────┘
                ↕
          HORS_SERVICE → RÉFORME (irréversible)
```

### 5.2 Workflow d'affectation

```
DEMANDE → VALIDATION → ACTIVE → TERMINÉE
                ↓
             REFUSÉE
```

Règles :

- Vérification de disponibilité avant affectation
- Vérification des habilitations du conducteur
- Alerte si maintenance prévue pendant la période d'affectation
- Alerte si document expire pendant la période

### 5.3 Workflow d'incident

```
SIGNALÉ → EN_COURS_ANALYSE → EN_RÉPARATION → RÉSOLU → CLOS
                                    ↓
                        (crée une maintenance corrective)
```

Règles :

- Incident CRITIQUE ou BLOQUANT → notification immédiate au responsable logistique
- Incident immobilisant → statut équipement passe automatiquement à EN_PANNE
- Résolution → statut équipement revient à l'état précédent

### 5.4 Déclenchement automatique des maintenances

```
Plan de maintenance actif
    │
    ├── Intervalle JOURS  : prochaineÉchéance = dernièreExécution + intervalleJours
    ├── Intervalle HEURES : prochainCompteur  = dernierCompteur + intervalleHeures
    └── Intervalle KM     : prochainCompteur  = dernierCompteur + intervalleKm
    │
    ├── seuilAlerte atteint  → ALERTE (notification)
    └── échéance dépassée    → ALERTE CRITIQUE (notification urgente + badge rouge)
```

### 5.5 Détection des consommations anormales

```
Nouveau ravitaillement enregistré
    │
    └── Calcul consommation = litres / (compteur_actuel - compteur_précédent)
        │
        ├── > moyenne_équipement × 1,3 → ALERTE « Surconsommation détectée »
        └── < moyenne_équipement × 0,5 → ALERTE « Consommation anormalement basse (fuite ?) »
```

---

## 6. Structure des alertes

| Priorité | Type | Déclencheur | Destinataire |
|---|---|---|---|
| CRITIQUE | Panne bloquante | Incident de gravité BLOQUANTE/CRITIQUE | Responsable logistique + chef de chantier |
| HAUTE | Maintenance dépassée | Échéance dépassée sans intervention | Responsable logistique |
| HAUTE | Document expiré | Date d'expiration atteinte | Responsable logistique |
| NORMALE | Maintenance proche | Échéance dans N jours (seuil configurable) | Responsable logistique |
| NORMALE | Document bientôt expiré | Expiration dans 30 jours | Responsable logistique |
| NORMALE | Conflit d'affectation | Double affectation détectée | Responsable logistique |
| BASSE | Consommation anormale | Dérive détectée | Responsable logistique |
| BASSE | Inspection manquante | Équipement en service sans inspection du jour | Conducteur + responsable |
| INFO | Transfert arrivé | Équipement arrivé à destination | Demandeur du transfert |
| INFO | Habilitation proche expiration | CACES expirant dans 60 jours | Conducteur + RH |

---

## 7. Permissions et rôles

| Action | Terrain (conducteur) | Chef de chantier | Resp. logistique | Admin |
|---|---|---|---|---|
| Consulter fiche équipement | Oui | Oui | Oui | Oui |
| Scanner QR code | Oui | Oui | Oui | Oui |
| Relevé compteur | Oui | Oui | Oui | Oui |
| Signaler un incident | Oui | Oui | Oui | Oui |
| Inspection quotidienne | Oui | Oui | Oui | Oui |
| Confirmer position | Oui | Oui | Oui | Oui |
| Enregistrer ravitaillement | Oui | Oui | Oui | Oui |
| Créer/modifier équipement | Non | Non | Oui | Oui |
| Affecter équipement | Non | Demande | Oui | Oui |
| Gérer maintenance | Non | Non | Oui | Oui |
| Consulter coûts | Non | Non | Oui | Oui |
| Gérer documents | Non | Non | Oui | Oui |
| Tableau de bord complet | Non | Partiel (son chantier) | Oui | Oui |
| Carte géolocalisation | Non | Son chantier | Oui | Oui |
| Réforme équipement | Non | Non | Non | Oui |
| Export des données | Non | Non | Oui | Oui |

---

## 8. Vision Design — Claude Design

### 8.1 Expérience desktop — Responsable logistique

#### Page d'accueil du module (tableau de bord)

Disposition : pleine largeur, grille à 2 colonnes asymétriques (zone principale + barre latérale alertes).

**Zone supérieure — barre de commande :**
- Titre « Parc Engins & Matériel »
- Sous-titre dynamique : « 47 équipements · 12 en service · 3 alertes actives · S33 2026 »
- Boutons : « + Nouvel équipement » (orange), « Exporter » (contour), « Carte » (contour avec icône carte)

**KPIs (4 à 6 cartes) :**
- Total parc (nombre, évolution)
- Disponibles (nombre, vert)
- En service (nombre, bleu)
- En maintenance (nombre, ambre)
- En panne (nombre, rouge, pulsation si > 0)
- Taux d'utilisation (%, jauge circulaire)

**Zone principale gauche :**
- Tableau « Équipements » avec colonnes : photo miniature | code + désignation | catégorie (badge coloré) | statut (badge) | chantier actuel | conducteur | dernier relevé | actions
- Filtres en ligne : catégorie, statut, chantier, disponibilité, recherche texte
- Tri par colonne, pagination
- Clic sur une ligne → panneau latéral coulissant ou page de détail

**Barre latérale droite (350 px) :**
- Alertes actives : liste triée par priorité, icône + texte + lien vers l'équipement concerné
  - « Pelle CAT 320 — Maintenance vidange dépassée de 12 jours » (rouge)
  - « Grue Liebherr LTM — Assurance expire le 28/08 » (ambre)
  - « Compacteur Bomag — Incident panne signalé il y a 2 h » (rouge, pulsation)
- Prochaines échéances : mini-calendrier des 7 prochains jours
- Donut de répartition : par statut ou par catégorie (bascule)

#### Page fiche équipement

Disposition : page entière, navigation par onglets.

**En-tête :**
- Photo de l'équipement (grande, à gauche)
- Infos principales : code, désignation, catégorie, marque/modèle
- Statut actuel (badge grand format)
- Chantier actuel + conducteur
- Boutons d'action : « Affecter », « Signaler incident », « Planifier maintenance », « QR Code »

**Onglets :**
1. Informations : toutes les données techniques, caractéristiques, propriété
2. Affectations : historique en timeline + formulaire d'affectation
3. Maintenance : historique + plans de maintenance récurrents + formulaire
4. Incidents : liste des incidents avec statut, filtre
5. Compteurs & consommations : graphiques d'évolution heures/km, consommation carburant
6. Documents : liste avec alertes d'expiration, upload
7. Positions : mini-carte + historique des localisations
8. Coûts : journal des dépenses, graphiques, TCO
9. Inspections : historique des checklists quotidiennes
10. Carnet de bord : timeline chronologique consolidée de tout

#### Page carte

Disposition : carte plein écran avec panneau latéral rétractable.

**Carte :**
- Fond OpenStreetMap
- Marqueurs colorés par statut (vert = disponible, bleu = en service, rouge = en panne, gris = immobilisé)
- Clusters lorsque le zoom est faible
- Clic sur marqueur → pop-up avec mini-fiche + lien vers le détail

**Panneau latéral :**
- Liste des équipements visibles sur la carte
- Filtres : statut, catégorie, chantier
- Recherche
- Bascule : « Tous » / « Avec position uniquement »

#### Page planning des affectations

Disposition : diagramme de Gantt horizontal.

- Axe Y : équipements
- Axe X : semaines
- Barres colorées par chantier
- Indicateurs : maintenances planifiées (losange), conflits (rouge)
- Glisser-déposer pour modifier les dates
- Barre latérale : liste des demandes d'affectation en attente

#### Page maintenance

Disposition : tableau + calendrier (bascule).

- Vue tableau : toutes les opérations planifiées et en cours
- Vue calendrier : mois avec pastilles colorées par jour
- Filtres : type, statut, équipement, urgence
- Mise en évidence des maintenances dépassées

### 8.2 Expérience mobile — Terrain

#### Écran d'accueil mobile

Disposition : cartes empilées, optimisée pour un usage au pouce.

- Bouton scan QR : énorme, central, icône caméra — action principale
- « Mes équipements » : liste des équipements affectés au conducteur
- Alertes : badge avec nombre, liste courte des alertes personnelles
- Actions rapides : grille 2×2 d'icônes — Signaler panne, Relevé compteur, Ravitaillement, Inspection du jour

#### Écran post-scan QR

Disposition : fiche simplifiée + actions.

- Photo + nom + code + statut (grand, lisible)
- Infos essentielles : chantier, dernier relevé, dernière inspection

**Actions (gros boutons empilés) :**
- « Confirmer ma position » (géolocalisation automatique)
- « Relevé compteur » (champ numérique + bouton)
- « Signaler un problème » (formulaire court)
- « Inspection quotidienne » (checklist)
- « Ravitaillement » (formulaire litres)

#### Écran signalement de panne (mobile)

Disposition : formulaire vertical minimaliste.

- Type de problème (sélecteur avec icônes)
- Gravité (4 boutons visuels : mineur / modéré / majeur / critique)
- Description (zone de texte)
- Photos (bouton caméra, jusqu'à 4 photos)
- Position (auto-détectée, modifiable)
- Bouton « Envoyer le signalement » (pleine largeur, rouge)

#### Écran inspection quotidienne (mobile)

Disposition : checklist défilante.

- En-tête : photo équipement + nom + compteur actuel
- Items de checklist : bascule OK/NOK + champ commentaire si NOK
- Items regroupés par section (moteur, hydraulique, sécurité, structure...)
- Photo optionnelle par item NOK
- Zone de commentaire général
- Zone de signature (surface tactile)
- Bouton « Valider l'inspection »

#### Écran relevé compteur (mobile)

- Équipement : nom + code + photo (en-tête)
- Type : bascule Heures / Kilomètres
- Valeur actuelle : affichée (dernier relevé)
- Nouvelle valeur : grand champ numérique (clavier numérique)
- Validation : vérification de cohérence (pas inférieur au précédent)
- Bouton « Enregistrer »

#### Écran ravitaillement (mobile)

- Équipement : nom + code
- Quantité (litres) : champ numérique
- Coût total : champ numérique (optionnel)
- Compteur actuel : champ numérique (pour calcul de consommation)
- Bouton « Enregistrer »

#### Écran QR Code (vue génération/impression)

- Aperçu du QR code en grand format
- Informations : code équipement, désignation, catégorie
- Boutons : « Télécharger PNG », « Imprimer » (format étiquette)
- Taille ajustable : petit (3 cm), moyen (5 cm), grand (8 cm)

### 8.3 Palette de couleurs spécifique au module

| Élément | Couleur | Usage |
|---|---|---|
| Accent du module | #2563EB (bleu industriel) | En-têtes, boutons primaires du module |
| Disponible | #16A34A (vert) | Badge, marqueur carte |
| En service | #3F6B83 (bleu-gris) | Badge, barre de Gantt |
| En maintenance | #D97706 (ambre) | Badge, alerte |
| En panne | #DC2626 (rouge) | Badge, alerte critique |
| Immobilisé | #6B7280 (gris) | Badge |
| Réformé | #9CA3AF (gris clair) | Badge barré |

L'accent orange MIKA (#FF6B35) reste réservé aux actions principales (bouton créer, CTA), tandis que le module utilise le bleu industriel comme couleur d'identité pour se distinguer visuellement des autres modules.

### 8.4 Spécifications pour Claude Design

Le prompt Claude Design devra inclure :

1. Tableau de bord desktop : la page complète avec KPIs, tableau, barre latérale d'alertes, filtres
2. Fiche équipement desktop : avec les 10 onglets, en-tête, actions
3. Carte géolocalisation : carte + panneau latéral + pop-ups
4. Planning des affectations : Gantt des affectations
5. Mobile — accueil : scan QR + mes équipements + actions rapides
6. Mobile — post-scan : fiche simplifiée + actions
7. Mobile — signalement : formulaire panne avec photos
8. Mobile — inspection : checklist avec signature
