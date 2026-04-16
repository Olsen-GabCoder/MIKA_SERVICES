---
title: Diagrammes de Classes — Mika Services Platform
author: Généré automatiquement depuis le code Kotlin
date: 2026-04-13
---

# Diagrammes de Classes — Mika Services Platform

\newpage

# Diagramme de Classes — 01 · Utilisateurs & Authentification


![Diagramme de Classes — 01 · Utilisateurs & Authentification — diagramme 1](C:\Projet_Mika_Services\diagrammes_projet\exports\01_Diagramme_Classes_Utilisateurs_Authentification_diag01.png)


## Tables DB

| Entité | Table |
|--------|-------|
| User | `users` |
| Role | `roles` |
| Permission | `permissions` |
| Departement | `departements` |
| Specialite | `specialites` |
| Session | `sessions` |
| PasswordResetToken | `password_reset_tokens` |
| AuditLog | `audit_logs` |

## Tables de jointure N:N

| Table | Relation |
|-------|----------|
| `user_roles` | User ↔ Role |
| `user_departements` | User ↔ Departement |
| `user_specialites` | User ↔ Specialite |
| `role_permissions` | Role ↔ Permission |

\newpage

# Diagramme de Classes — 02 · Projets & Marchés


![Diagramme de Classes — 02 · Projets & Marchés — diagramme 1](C:\Projet_Mika_Services\diagrammes_projet\exports\02_Diagramme_Classes_Projets_Marches_diag01.png)


## Tables DB

| Entité | Table |
|--------|-------|
| Projet | `projets` |
| Client | `clients` |
| Partenaire | `partenaires` |
| SousProjet | `sous_projets` |
| PointBloquant | `points_bloquants` |
| CAPrevisionnelRealise | `ca_previsionnel_realise` |
| RevisionBudget | `revisions_budget` |
| Prevision | `previsions` |
| AvancementEtudeProjet | `avancement_etude_projet` |

## Tables de jointure

| Table | Relation |
|-------|----------|
| `projet_partenaires` | Projet ↔ Partenaire (N:N) |
| `projet_types` | Projet ↔ TypeProjet (collection élémentaire) |

\newpage

# Diagramme de Classes — 03 · Chantiers & Affectations


![Diagramme de Classes — 03 · Chantiers & Affectations — diagramme 1](C:\Projet_Mika_Services\diagrammes_projet\exports\03_Diagramme_Classes_Chantiers_Affectations_diag01.png)


## Tables DB

| Entité | Table |
|--------|-------|
| Equipe | `equipes` |
| MembreEquipe | `membres_equipe` |
| AffectationChantier | `affectations_projet` |
| InstallationChantier | `installations_projet` |
| ZoneChantier | `zones_projet` |

\newpage

# Diagramme de Classes — 04 · Communication & Messagerie


![Diagramme de Classes — 04 · Communication & Messagerie — diagramme 1](C:\Projet_Mika_Services\diagrammes_projet\exports\04_Diagramme_Classes_Communication_Messagerie_diag01.png)


## Tables DB

| Entité | Table |
|--------|-------|
| Message | `messages` |
| Notification | `notifications` |
| MessageMention | `message_mentions` |
| MessagePieceJointe | `message_pieces_jointes` |
| MessageSuppression | `message_suppressions` |
| ConversationArchive | `conversation_archives` |

## Règles métier

- Un `Message` peut avoir un `parent` (réponse → thread de conversation).
- `MessageSuppression` : suppression "pour moi" uniquement (l'autre utilisateur voit toujours le message).
- `ConversationArchive` : archive une conversation entre deux utilisateurs (user ↔ peerUserId).
- `MessageMention` : l'utilisateur est mentionné dans le corps du message (`@user`).

\newpage

# Diagramme de Classes — 05 · Matériel, Engins & Demandes de Matériel (DMA)


![Diagramme de Classes — 05 · Matériel, Engins & Demandes de Matériel (DMA) — diagramme 1](C:\Projet_Mika_Services\diagrammes_projet\exports\05_Diagramme_Classes_Materiel_Engins_DMA_diag01.png)


## Tables DB

| Entité | Table |
|--------|-------|
| Engin | `engins` |
| AffectationEnginChantier | `affectations_engin_projet` |
| MouvementEngin | `mouvements_engin` |
| MouvementEnginEvenement | `mouvements_engin_evenements` |
| Materiau | `materiaux` |
| AffectationMateriauChantier | `affectations_materiau_projet` |
| DemandeMateriel | `demandes_materiel` |
| DemandeMaterielLigne | `demandes_materiel_lignes` |
| DemandeMaterielHistorique | `demandes_materiel_historique` |

## Machine à états DMA

```
SOUMISE → EN_VALIDATION_CHANTIER → EN_VALIDATION_PROJET
       → PRISE_EN_CHARGE → EN_ATTENTE_COMPLEMENT
       → EN_COMMANDE → LIVRE → CLOTUREE
       → REJETEE (depuis tout statut)
```

## Machine à états Mouvement Engin

```
EN_ATTENTE_DEPART → EN_TRANSIT → RECU
                  → ANNULE (depuis tout statut)
```

\newpage

# Diagramme de Classes — 06 · Sécurité, Incidents & Prévention des Risques


![Diagramme de Classes — 06 · Sécurité, Incidents & Prévention des Risques — diagramme 1](C:\Projet_Mika_Services\diagrammes_projet\exports\06_Diagramme_Classes_Securite_Incidents_diag01.png)


## Tables DB

| Entité | Table |
|--------|-------|
| Incident | `incidents` |
| ActionPrevention | `actions_prevention` |
| Risque | `risques` |

## Machine à états Incident

```
DECLARE → EN_INVESTIGATION → ANALYSE → ACTIONS_EN_COURS → CLOTURE
```

## Machine à états ActionPrevention

```
PLANIFIEE → EN_COURS → REALISEE → VERIFIEE
          → ANNULEE (depuis tout statut)
```

\newpage

# Diagramme de Classes — 07 · Qualité & Conformité


![Diagramme de Classes — 07 · Qualité & Conformité — diagramme 1](C:\Projet_Mika_Services\diagrammes_projet\exports\07_Diagramme_Classes_Qualite_Conformite_diag01.png)


## Tables DB

| Entité | Table |
|--------|-------|
| ControleQualite | `controles_qualite` |
| NonConformite | `non_conformites` |

## Machine à états ControleQualite

```
PLANIFIE → EN_COURS → CONFORME
                    → NON_CONFORME (génère NonConformites)
         → ANNULE
```

## Machine à états NonConformite

```
OUVERTE → EN_TRAITEMENT → ACTION_CORRECTIVE → VERIFIEE → CLOTUREE
```

\newpage

# Diagramme de Classes — 08 · Budget, Fournisseurs & Commandes


![Diagramme de Classes — 08 · Budget, Fournisseurs & Commandes — diagramme 1](C:\Projet_Mika_Services\diagrammes_projet\exports\08_Diagramme_Classes_Budget_Fournisseurs_Commandes_diag01.png)


## Tables DB

| Entité | Table |
|--------|-------|
| Depense | `depenses` |
| Fournisseur | `fournisseurs` |
| Commande | `commandes` |

## Machine à états Depense

```
BROUILLON → SOUMISE → VALIDEE → PAYEE
                    → REJETEE
```

## Machine à états Commande

```
BROUILLON → ENVOYEE → CONFIRMEE → EN_COURS_LIVRAISON → LIVREE
          → ANNULEE (depuis tout statut)
```

## Lien avec DMA

La `Commande` est liée à une `DemandeMateriel` (champ `commande` sur l'entité DemandeMateriel). Quand une DMA passe au statut `EN_COMMANDE`, une commande fournisseur peut être associée.

\newpage

# Diagramme de Classes — 09 · Planning & Tâches


![Diagramme de Classes — 09 · Planning & Tâches — diagramme 1](C:\Projet_Mika_Services\diagrammes_projet\exports\09_Diagramme_Classes_Planning_Taches_diag01.png)


## Tables DB

| Entité | Table |
|--------|-------|
| Tache | `taches` |

## Points clés

- **Hiérarchie** : une `Tache` peut avoir un parent (`tacheParent`) pour modéliser des sous-tâches.
- **Avancement** : `pourcentageAvancement` (0–100%) mis à jour manuellement ou par agrégation des sous-tâches.
- **Priorité partagée** : l'enum `Priorite` est partagé avec `PointBloquant`.

## Machine à états Tache

```
A_FAIRE → EN_COURS → EN_ATTENTE → EN_COURS
        → EN_COURS → TERMINEE
        → ANNULEE (depuis tout statut)
```

\newpage

# Diagramme de Classes — 10 · Réunions Hebdomadaires & Procès-Verbaux


![Diagramme de Classes — 10 · Réunions Hebdomadaires & Procès-Verbaux — diagramme 1](C:\Projet_Mika_Services\diagrammes_projet\exports\10_Diagramme_Classes_Reunions_Hebdomadaires_diag01.png)


## Tables DB

| Entité | Table |
|--------|-------|
| ReunionHebdo | `reunions_hebdo` |
| ParticipantReunion | `participants_reunion` |
| PointProjetPV | `points_projet_pv` |

## Points clés

- **ParticipantReunion** : peut être un utilisateur inscrit (`user`) ou un participant externe (champs `nomManuel`, `prenomManuel`).
- **PointProjetPV** : un point de PV par projet par réunion (contrainte unique `reunion_id, projet_id`).
- **PointProjetPV** reprend les indicateurs d'avancement (physique, financier, délai) + commentaires.
- Le statut `VALIDE` verrouille la réunion et génère le PV officiel.

\newpage

# Diagramme de Classes — 11 · Gestion Électronique des Documents (GED)


![Diagramme de Classes — 11 · Gestion Électronique des Documents (GED) — diagramme 1](C:\Projet_Mika_Services\diagrammes_projet\exports\11_Diagramme_Classes_Documents_GED_diag01.png)


## Tables DB

| Entité | Table |
|--------|-------|
| Document | `documents` |

## Points clés

- Un document peut être lié à un projet (`projet`) ou être un document général (sans projet).
- `nomFichier` : nom unique en stockage (UUID-based). `nomOriginal` : nom d'origine côté utilisateur.
- `cheminStockage` : chemin absolu ou relatif selon la configuration du serveur de fichiers.
- `TypeDocument.FICHE_MISSION` et `CV` sont utilisés pour les documents RH des utilisateurs.

\newpage

# Diagramme de Classes — 12 · Barème & Référentiel de Prix


![Diagramme de Classes — 12 · Barème & Référentiel de Prix — diagramme 1](C:\Projet_Mika_Services\diagrammes_projet\exports\12_Diagramme_Classes_Bareme_Referentiel_Prix_diag01.png)


## Tables DB

| Entité | Table |
|--------|-------|
| CorpsEtatBareme | `bareme_corps_etat` |
| FournisseurBareme | `bareme_fournisseurs` |
| LignePrixBareme | `bareme_lignes_prix` |
| BaremeMatRefSequence | `bareme_mat_ref_sequence` |

## Structure du barème

Le barème est importé depuis un fichier Excel structuré en feuilles (= corps d'état) :

```
CorpsEtatBareme (ex. "Gros-Oeuvre", "Électricité", "Plomberie")
  └── LignePrixBareme (MATERIAU)          → ligne référentiel prix matériaux
  └── LignePrixBareme (PRESTATION_ENTETE) → titre d'un poste de prestation
       └── LignePrixBareme (PRESTATION_LIGNE)  → détail de décomposition
       └── LignePrixBareme (PRESTATION_TOTAL)  → total Déboursé / Prix Vente
```

## Référence matériaux

`BaremeMatRefSequence` gère l'allocation atomique des références matériaux au format `MAT-YYYY-NNNNN` (verrou optimiste via `@Version`).

## Champs selon le type

| Champ | MATERIAU | PRESTATION_ENTETE | PRESTATION_LIGNE | PRESTATION_TOTAL |
|-------|----------|------------------|-----------------|-----------------|
| `reference` | ✓ | — | — | — |
| `libelle` | ✓ | ✓ | ✓ | ✓ |
| `unite` + `prixTtc` | ✓ | — | — | — |
| `famille` / `categorie` | ✓ | — | — | — |
| `fournisseurBareme` | ✓ | — | — | — |
| `quantite` / `prixUnitaire` / `somme` | — | — | ✓ | — |
| `debourse` / `prixVente` | — | — | — | ✓ |
| `parent` | — | — | ✓ | ✓ |

\newpage

