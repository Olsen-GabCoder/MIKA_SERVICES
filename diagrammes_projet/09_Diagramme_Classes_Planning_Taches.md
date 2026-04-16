# Diagramme de Classes — 09 · Planning & Tâches

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
    class StatutTache {
        <<enumeration>>
        A_FAIRE
        EN_COURS
        EN_ATTENTE
        TERMINEE
        ANNULEE
    }

    class Priorite {
        <<enumeration>>
        BASSE
        NORMALE
        HAUTE
        CRITIQUE
        URGENT
    }

    %% ══════════════ ENTITÉS ══════════════
    class Tache {
        +String titre
        +String description
        +StatutTache statut
        +Priorite priorite
        +LocalDate dateDebut
        +LocalDate dateFin
        +LocalDate dateEcheance
        +Integer pourcentageAvancement
    }

    %% Références externes (simplifiées)
    class Projet {
        +String codeProjet
        +String nom
    }

    class User {
        +String matricule
        +String nom
    }

    %% ══════════════ HÉRITAGE ══════════════
    BaseEntity <|-- Tache

    %% ══════════════ RELATIONS ══════════════
    Tache "n" --> "1" Projet : projet
    Tache "n" --> "0..1" User : assigneA
    Tache "n" --> "0..1" Tache : tacheParent

    %% ══════════════ ENUMS ══════════════
    Tache --> StatutTache
    Tache --> Priorite
```

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
