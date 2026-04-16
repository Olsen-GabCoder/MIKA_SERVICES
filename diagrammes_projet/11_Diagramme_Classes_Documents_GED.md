# Diagramme de Classes — 11 · Gestion Électronique des Documents (GED)

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
    class TypeDocument {
        <<enumeration>>
        PLAN
        RAPPORT
        PHOTO
        CONTRAT
        FACTURE
        PV_REUNION
        FICHE_TECHNIQUE
        FICHE_MISSION
        CV
        PERMIS
        ATTESTATION
        AUTRE
    }

    %% ══════════════ ENTITÉS ══════════════
    class Document {
        +String nomFichier
        +String nomOriginal
        +String cheminStockage
        +String typeMime
        +Long tailleOctets
        +TypeDocument typeDocument
        +String description
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
    BaseEntity <|-- Document

    %% ══════════════ RELATIONS ══════════════
    Document "n" --> "0..1" Projet : projet
    Document "n" --> "0..1" User : uploadePar

    %% ══════════════ ENUMS ══════════════
    Document --> TypeDocument
```

## Tables DB

| Entité | Table |
|--------|-------|
| Document | `documents` |

## Points clés

- Un document peut être lié à un projet (`projet`) ou être un document général (sans projet).
- `nomFichier` : nom unique en stockage (UUID-based). `nomOriginal` : nom d'origine côté utilisateur.
- `cheminStockage` : chemin absolu ou relatif selon la configuration du serveur de fichiers.
- `TypeDocument.FICHE_MISSION` et `CV` sont utilisés pour les documents RH des utilisateurs.
