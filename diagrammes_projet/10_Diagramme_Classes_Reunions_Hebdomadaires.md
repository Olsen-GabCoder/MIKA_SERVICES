# Diagramme de Classes — 10 · Réunions Hebdomadaires & Procès-Verbaux

```mermaid
classDiagram
    direction TB

    %% ══════════════ BASE ══════════════
    class BaseEntity {
        <<abstract>>
        +Long id
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
        +String createdBy
        +String updatedBy
    }

    %% ══════════════ ENUMS ══════════════
    class StatutReunion {
        <<enumeration>>
        BROUILLON
        VALIDE
    }

    %% ══════════════ ENTITÉS ══════════════
    class ReunionHebdo {
        +LocalDate dateReunion
        +String lieu
        +LocalTime heureDebut
        +LocalTime heureFin
        +String ordreDuJour
        +StatutReunion statut
        +String divers
    }

    class ParticipantReunion {
        +String nomManuel
        +String prenomManuel
        +String initiales
        +String telephone
        +Boolean present
    }

    class PointProjetPV {
        +BigDecimal avancementPhysiquePct
        +BigDecimal avancementFinancierPct
        +BigDecimal delaiConsommePct
        +String resumeTravauxPrevisions
        +String pointsBloquantsResume
        +String besoinsMateriel
        +String besoinsHumain
        +String propositionsAmelioration
        +Integer ordreAffichage
    }

    %% Références externes (simplifiées)
    class Projet {
        +String codeProjet
        +String nom
    }

    class User {
        +String matricule
        +String nom
        +String prenom
    }

    %% ══════════════ HÉRITAGE ══════════════
    BaseEntity <|-- ReunionHebdo
    BaseEntity <|-- ParticipantReunion
    BaseEntity <|-- PointProjetPV

    %% ══════════════ RELATIONS ══════════════
    ReunionHebdo "n" --> "0..1" User : redacteur
    ReunionHebdo "1" --> "n" ParticipantReunion : participants
    ReunionHebdo "1" --> "n" PointProjetPV : pointsProjet

    ParticipantReunion "n" --> "1" ReunionHebdo : reunion
    ParticipantReunion "n" --> "0..1" User : user

    PointProjetPV "n" --> "1" ReunionHebdo : reunion
    PointProjetPV "n" --> "1" Projet : projet

    %% ══════════════ ENUMS ══════════════
    ReunionHebdo --> StatutReunion
```

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
