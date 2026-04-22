# QSHE Module — Phase 3 : Architecture

---

## 1. Sidebar QSHE cible

Ajout progressif — chaque livrable ajoute son entree.

```
QSHE                                    (icone bouclier + coche)
├── Tableau de bord                     (KPIs transversaux TF/TG/NC/actions)
├── Securite & Sante au travail
│   ├── Incidents & AT                 (declaration, investigation, CNSS)
│   ├── Inspections securite           (checklists configurables)
│   ├── Permis de travail              (feu, hauteur, espace confine, fouille)
│   └── Causeries securite             (toolbox talks, presence)
├── Qualite
│   ├── Controles qualite              (PIE, audits, inspections)
│   └── Non-conformites & reserves     (NC, punchlist, reserves)
├── Hygiene & Sante
│   ├── Formations & habilitations     (CACES, electrique, SST, expiration)
│   └── EPI                            (dotation, stock, expiration, QR)
├── Environnement
│   ├── Suivi environnemental          (dechets, mesures, PGES)
│   └── Produits chimiques (FDS)       (inventaire, fiches securite)
├── Risques                            (DUERP, matrices, brut/residuel)
└── Actions (CAPA)                     (correctives/preventives, transversal)
```

---

## 2. Sous-modules priorises

| Priorite | Sous-module | Justification |
|----------|-------------|---------------|
| **P0** | Incidents & AT | Obligation legale declaration CNSS 48h. Risque penal. |
| **P0** | Actions (CAPA) | Liant transversal exige par ISO 45001/9001/14001. |
| **P0** | Tableau de bord QSHE | TF/TG/indicateurs avances — exige par tout client BTP. |
| **P1** | Inspections securite | Processus quotidien sur chantier, source principale de CAPA. |
| **P1** | Controles qualite (refonte) | Enrichir l'existant : checklists, lien sous-projet. |
| **P1** | Non-conformites (refonte) | Enrichir : decision traitement, cout reprise, photos. |
| **P1** | Risques (refonte) | Matrice correcte, brut/residuel, lien incidents. |
| **P2** | Formations & habilitations | Suivi certifications, alertes expiration. |
| **P2** | EPI | Dotation, stock, expiration. |
| **P2** | Causeries securite | Toolbox talks, calendrier, presence. |
| **P2** | Permis de travail | Workflow approbation, timer validite. |
| **P2** | Environnement (dechets, PGES, FDS) | Suivi environnemental, fiches securite chimique. |

---

## 3. Livrables ordonnes

| # | Livrable | Scope |
|---|---------|-------|
| 0 | **Nettoyage** | Supprimer modules securite + qualite existants (entities, controllers, services, repos, DTOs, mappers, enums concernes, frontend features, slices, API, i18n, routes, sidebar entries). Supprimer NiveauDanger (doublon). Nettoyer seed data. |
| 1 | **Entity Incident refondue + CRUD backend** | Nouvelle entity `Incident` avec tous les champs CNSS (victime, lesion, body part, temoins, sous-traitant, declaration CNSS statut/date). Enums refondus (TypeEvenement, CauseIncident, PartieCorp, NatureLesion). Repository, Service, Controller, DTOs, Mapper. |
| 2 | **Entity CAPA + CRUD backend** | Entity `ActionCorrective` transversale avec type (CORRECTION, CORRECTIVE, PREVENTIVE), priorite, suivi efficacite, source polymorphe (sourceType + sourceId). Repository, Service, Controller. |
| 3 | **Sidebar QSHE + page Incidents frontend** | Restructurer la sidebar (groupe QSHE). Page Incidents : dashboard KPIs, liste, formulaire de declaration, detail avec timeline investigation. Connecter CAPA. |
| 4 | **Tableau de bord QSHE** | Page dashboard transversal : TF, TG, heures travaillees, compteur sans AT, indicateurs avances (taux completion inspections, NC ouvertes, CAPA en retard). Endpoint summary backend. |
| 5 | **Inspections securite + checklists** | Entities : `Inspection`, `ChecklistTemplate`, `ChecklistItem`, `InspectionResult`. Backend CRUD. Frontend : page inspections avec checklist interactive, capture photo, scoring. |
| 6 | **Controles qualite refondus** | Refonte entity `ControleQualite` : retirer types SECURITE/ENVIRONNEMENTAL, ajouter lien SousProjet, integrer checklists (reutiliser le pattern du livrable 5). Refonte frontend. |
| 7 | **Non-conformites refondues** | Enrichir `NonConformite` : decision traitement (enum), cout reprise, photos avant/apres, lien sous-traitant, type defaut. Page NC + reserves/punchlist. |
| 8 | **Risques refondus** | Refonte entity `Risque` : matrice prob x gravite calculee, risque brut/residuel, hierarchie controles, lien unite de travail (SousProjet), lien incidents. Page evaluation des risques. |
| 9 | **Formations & habilitations** | Entities : `Certification`, `FormationSession`. Matrice travailleurs x certifications. Alertes expiration (90/60/30j). Page suivi formations. |
| 10 | **EPI** | Entities : `EPI`, `DotationEPI`. Inventaire, affectation par travailleur, expiration, QR code. Page gestion EPI. |
| 11 | **Causeries securite** | Entity `Causerie` avec topic, presenter, date, presence (ManyToMany User). Bibliotheque de sujets. Page causeries + presence. |
| 12 | **Permis de travail** | Entity `PermisTravail` avec type, checklist obligatoire, signatures, timer validite, detection conflit zone. Page permis. |
| 13 | **Environnement** | Entities : `SuiviEnvironnemental`, `DechetRecord`, `ProduitChimique` (FDS). Suivi PGES, dechets (BSD), mesures. Pages environnement + FDS. |
| 14 | **Notifications QSHE + escalade** | Cabler NotificationService dans tous les services QSHE. Escalade temporelle (24/48/72h). Nouveaux TypeNotification. |
| 15 | **Reporting QSHE** | Templates rapports mensuels/trimestriels. Generation PDF. Export Excel. Page reporting. |

---

## 4. Points d'arbitrage

| Sujet | Question | Impact |
|-------|----------|--------|
| **Stockage photos** | Le filesystem local (`uploads/`) suffit pour le dev. Pour la prod Render (stockage ephemere), il faudra migrer vers S3/Cloudinary. On fait quoi maintenant ? (a) rester en local et migrer plus tard, (b) integrer S3 des maintenant. | Livrables 3, 5, 7 (tous ceux avec photos) |
| **Offline** | On code d'abord en online-only et on ajoute l'offline incrementalement, ou on pose l'architecture offline-first des le livrable 1 ? | Architecture globale |

---

*Phase 3 compilee le 2026-04-21. Pret a demarrer le livrable #0 des validation.*
