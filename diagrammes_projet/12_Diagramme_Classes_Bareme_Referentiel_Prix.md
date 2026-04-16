# Diagramme de Classes — 12 · Barème & Référentiel de Prix

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
    class TypeLigneBareme {
        <<enumeration>>
        MATERIAU
        PRESTATION_ENTETE
        PRESTATION_LIGNE
        PRESTATION_TOTAL
    }

    %% ══════════════ ENTITÉS ══════════════
    class CorpsEtatBareme {
        +String code
        +String libelle
        +Integer ordreAffichage
    }

    class FournisseurBareme {
        +String nom
        +String contact
    }

    class LignePrixBareme {
        +TypeLigneBareme type
        +String reference
        +String libelle
        +String unite
        +BigDecimal prixTtc
        +String datePrix
        +String refReception
        +String codeFournisseur
        +String contactTexte
        +String famille
        +String categorie
        +String depot
        +BigDecimal quantite
        +BigDecimal prixUnitaire
        +BigDecimal somme
        +BigDecimal debourse
        +BigDecimal prixVente
        +BigDecimal coefficientPv
        +String unitePrestation
        +Integer ordreLigne
        +Integer numeroLigneExcel
        +Boolean prixEstime
    }

    class BaremeMatRefSequence {
        +Integer annee
        +Integer dernierNumero
        +Long version
    }

    %% ══════════════ HÉRITAGE ══════════════
    BaseEntity <|-- CorpsEtatBareme
    BaseEntity <|-- FournisseurBareme
    BaseEntity <|-- LignePrixBareme

    %% ══════════════ RELATIONS ══════════════
    LignePrixBareme "n" --> "1" CorpsEtatBareme : corpsEtat
    LignePrixBareme "n" --> "0..1" FournisseurBareme : fournisseurBareme
    LignePrixBareme "n" --> "0..1" LignePrixBareme : parent
    LignePrixBareme "1" --> "n" LignePrixBareme : enfants

    %% ══════════════ ENUMS ══════════════
    LignePrixBareme --> TypeLigneBareme
```

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
