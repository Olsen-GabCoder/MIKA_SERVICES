# Diagramme de Classes — 03 · Chantiers & Affectations

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
    class TypeEquipe {
        <<enumeration>>
        MACONNERIE
        FERRAILLAGE
        COFFRAGE
        TERRASSEMENT
        ELECTRICITE
        PLOMBERIE
        VOIRIE
        MIXTE
        AUTRE
    }

    class RoleDansEquipe {
        <<enumeration>>
        CHEF_EQUIPE
        TECHNICIEN
        OUVRIER_QUALIFIE
        OUVRIER
        APPRENTI
        CONDUCTEUR_ENGIN
    }

    class StatutAffectation {
        <<enumeration>>
        PLANIFIEE
        EN_COURS
        TERMINEE
        ANNULEE
    }

    class TypeInstallation {
        <<enumeration>>
        BASE_VIE
        BUREAU_CHANTIER
        MAGASIN
        ENTREPOT
        LABORATOIRE
        POSTE_SECOURS
        TOILETTE
        CLÔTURE
        ECLAIRAGE
        AUTRE
    }

    class StatutInstallation {
        <<enumeration>>
        PLANIFIEE
        EN_COURS
        INSTALLEE
        DEMONTEE
        ANNULEE
    }

    class TypeZone {
        <<enumeration>>
        TERRASSEMENT
        FONDATION
        GROS_OEUVRE
        SECOND_OEUVRE
        VOIRIE
        STOCKAGE
        SECURITE
        AUTRE
    }

    class NiveauDanger {
        <<enumeration>>
        FAIBLE
        MODERE
        ELEVE
        TRES_ELEVE
    }

    %% ══════════════ ENTITÉS CHANTIER ══════════════
    class Equipe {
        +String code
        +String nom
        +TypeEquipe type
        +Integer effectif
        +Boolean actif
    }

    class MembreEquipe {
        +RoleDansEquipe role
        +LocalDate dateAffectation
        +LocalDate dateFin
        +Boolean actif
    }

    class AffectationChantier {
        +LocalDate dateDebut
        +LocalDate dateFin
        +StatutAffectation statut
        +String observations
    }

    class InstallationChantier {
        +TypeInstallation type
        +String description
        +LocalDate dateInstallation
        +LocalDate dateRetrait
        +StatutInstallation statut
    }

    class ZoneChantier {
        +String code
        +String nom
        +TypeZone type
        +String description
        +Double latitude
        +Double longitude
        +BigDecimal superficie
        +NiveauDanger niveauDanger
        +Boolean actif
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
    BaseEntity <|-- Equipe
    BaseEntity <|-- MembreEquipe
    BaseEntity <|-- AffectationChantier
    BaseEntity <|-- InstallationChantier
    BaseEntity <|-- ZoneChantier

    %% ══════════════ RELATIONS ══════════════
    Equipe "1" --> "n" MembreEquipe : membres
    Equipe "n" --> "0..1" User : chefEquipe
    MembreEquipe "n" --> "1" User : user

    AffectationChantier "n" --> "1" Projet : projet
    AffectationChantier "n" --> "1" Equipe : equipe

    InstallationChantier "n" --> "1" Projet : projet
    ZoneChantier "n" --> "1" Projet : projet

    %% ══════════════ ENUMS ══════════════
    Equipe --> TypeEquipe
    MembreEquipe --> RoleDansEquipe
    AffectationChantier --> StatutAffectation
    InstallationChantier --> TypeInstallation
    InstallationChantier --> StatutInstallation
    ZoneChantier --> TypeZone
    ZoneChantier --> NiveauDanger
```

## Tables DB

| Entité | Table |
|--------|-------|
| Equipe | `equipes` |
| MembreEquipe | `membres_equipe` |
| AffectationChantier | `affectations_projet` |
| InstallationChantier | `installations_projet` |
| ZoneChantier | `zones_projet` |
