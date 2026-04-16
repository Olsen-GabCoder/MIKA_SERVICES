# Diagramme de Classes — 01 · Utilisateurs & Authentification

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
    class NiveauHierarchique {
        <<enumeration>>
        DIRECTION
        CADRE_SUPERIEUR
        CADRE_MOYEN
        AGENT_MAITRISE
        EMPLOYE
    }

    class NiveauExperience {
        <<enumeration>>
        JUNIOR
        INTERMEDIAIRE
        SENIOR
        EXPERT
    }

    class TypeContrat {
        <<enumeration>>
        CDI
        CDD
        STAGE
        FREELANCE
        CONSULTANT
    }

    class Sexe {
        <<enumeration>>
        M
        F
    }

    class TypeDepartement {
        <<enumeration>>
        DIRECTION
        TECHNIQUE
        ADMINISTRATIF
        FINANCIER
        RH
        INFORMATIQUE
        COMMERCIAL
        AUTRE
    }

    class TypeSpecialite {
        <<enumeration>>
        GENIE_CIVIL
        ELECTRICITE
        MECANIQUE
        TOPOGRAPHIE
        INFORMATIQUE
        COMPTABILITE
        JURIDIQUE
        AUTRE
    }

    class TypePermission {
        <<enumeration>>
        CREATE
        READ
        UPDATE
        DELETE
        VALIDATE
        EXPORT
        ADMIN
    }

    %% ══════════════ ENTITÉS ══════════════
    class User {
        +String matricule
        +String nom
        +String prenom
        +String email
        +Sexe sexe
        +String motDePasse
        +String telephone
        +LocalDate dateNaissance
        +String adresse
        +String ville
        +String quartier
        +String province
        +String numeroCNI
        +String numeroPasseport
        +LocalDate dateEmbauche
        +String photo
        +String ficheMission
        +BigDecimal salaireMensuel
        +TypeContrat typeContrat
        +NiveauExperience niveauExperience
        +Boolean actif
        +LocalDateTime lastLogin
        +String totpSecret
        +Boolean totpEnabled
        +Boolean mustChangePassword
        +Integer failedLoginAttempts
        +LocalDateTime lockoutUntil
        +Boolean emailNotificationsEnabled
        +Boolean alertNewLoginEnabled
        +Boolean dailyDigestEnabled
        +Boolean weeklyDigestEnabled
        +String digestTime
        +Boolean inAppNotificationsEnabled
        +Boolean notificationSoundEnabled
        +String defaultSessionDuration
        +Boolean logoutOnBrowserClose
    }

    class Role {
        +String code
        +String nom
        +String description
        +NiveauHierarchique niveau
        +Boolean actif
    }

    class Permission {
        +String code
        +String nom
        +String module
        +TypePermission type
        +String description
        +Boolean actif
    }

    class Departement {
        +String code
        +String nom
        +TypeDepartement type
        +String description
        +Boolean actif
    }

    class Specialite {
        +Long id
        +String code
        +String nom
        +TypeSpecialite categorie
        +String description
        +Boolean actif
    }

    class Session {
        +Long id
        +String token
        +String refreshToken
        +String ipAddress
        +String userAgent
        +String deviceName
        +LocalDateTime dateDebut
        +LocalDateTime dateExpiration
        +LocalDateTime lastActivity
        +Boolean active
    }

    class PasswordResetToken {
        +Long id
        +String token
        +LocalDateTime dateExpiration
        +Boolean used
        +isExpired() Boolean
    }

    class AuditLog {
        +Long id
        +String action
        +String module
        +String details
        +String ipAddress
        +LocalDateTime createdAt
    }

    %% ══════════════ HÉRITAGE ══════════════
    BaseEntity <|-- User
    BaseEntity <|-- Role
    BaseEntity <|-- Permission
    BaseEntity <|-- Departement

    %% ══════════════ RELATIONS ══════════════
    User "n" --> "0..1" User : superieurHierarchique
    User "n" --> "n" Role : user_roles
    User "n" --> "n" Departement : user_departements
    User "n" --> "n" Specialite : user_specialites
    Role "n" --> "n" Permission : role_permissions
    Departement "n" --> "0..1" User : responsable
    AuditLog "n" --> "0..1" User : user
    Session "n" --> "1" User : user
    PasswordResetToken "n" --> "1" User : user

    %% ══════════════ ENUMS ══════════════
    User --> Sexe
    User --> TypeContrat
    User --> NiveauExperience
    Role --> NiveauHierarchique
    Permission --> TypePermission
    Departement --> TypeDepartement
    Specialite --> TypeSpecialite
```

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
