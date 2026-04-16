# Diagramme de Classes — 08 · Budget, Fournisseurs & Commandes

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
    class TypeDepense {
        <<enumeration>>
        MAIN_OEUVRE
        MATERIAU
        MATERIEL
        SOUS_TRAITANCE
        TRANSPORT
        CARBURANT
        LOCATION
        FRAIS_GENERAUX
        AUTRE
    }

    class StatutDepense {
        <<enumeration>>
        BROUILLON
        SOUMISE
        VALIDEE
        REJETEE
        PAYEE
    }

    class StatutCommande {
        <<enumeration>>
        BROUILLON
        ENVOYEE
        CONFIRMEE
        EN_COURS_LIVRAISON
        LIVREE
        ANNULEE
    }

    %% ══════════════ ENTITÉS ══════════════
    class Depense {
        +String reference
        +String libelle
        +TypeDepense type
        +BigDecimal montant
        +LocalDate dateDepense
        +StatutDepense statut
        +String fournisseur
        +String numeroFacture
        +String observations
        +LocalDate dateValidation
    }

    class Fournisseur {
        +String code
        +String nom
        +String adresse
        +String telephone
        +String email
        +String contactNom
        +String specialite
        +Integer noteEvaluation
        +Boolean actif
    }

    class Commande {
        +String reference
        +String designation
        +BigDecimal montantTotal
        +StatutCommande statut
        +LocalDate dateCommande
        +LocalDate dateLivraisonPrevue
        +LocalDate dateLivraisonEffective
        +String notes
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
    BaseEntity <|-- Depense
    BaseEntity <|-- Fournisseur
    BaseEntity <|-- Commande

    %% ══════════════ RELATIONS ══════════════
    Depense "n" --> "1" Projet : projet
    Depense "n" --> "0..1" User : validePar

    Commande "n" --> "1" Fournisseur : fournisseur
    Commande "n" --> "0..1" Projet : projet
    Fournisseur "1" --> "n" Commande : commandes

    %% ══════════════ ENUMS ══════════════
    Depense --> TypeDepense
    Depense --> StatutDepense
    Commande --> StatutCommande
```

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
