# DIAGRAMME DE CLASSES UML 1
## GESTION UTILISATEURS & AUTHENTIFICATION

```mermaid
classDiagram
    %% ========================================
    %% ENTITÉS PRINCIPALES
    %% ========================================
    
    class User {
        +Long id
        +String matricule
        +String nom
        +String prenom
        +String email
        +String motDePasse
        +String telephone
        +Date dateNaissance
        +String adresse
        +String ville
        +String quartier
        +String province
        +String numeroCNI
        +String numeroPasseport
        +Date dateEmbauche
        +String photo
        +BigDecimal salaireMensuel
        +TypeContrat typeContrat
        +NiveauExperience niveauExperience
        +Boolean actif
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
        +LocalDateTime lastLogin
        --
        +login()
        +logout()
        +resetPassword()
        +updateProfile()
        +hasPermission()
        +hasRole()
    }
    
    class Role {
        +Long id
        +String code
        +String nom
        +String description
        +NiveauHierarchique niveau
        +Boolean actif
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
        --
        +addPermission()
        +removePermission()
        +getUsers()
    }
    
    class Permission {
        +Long id
        +String code
        +String nom
        +String module
        +TypePermission type
        +String description
        +Boolean actif
        +LocalDateTime createdAt
        --
        +isGranted()
    }
    
    class Departement {
        +Long id
        +String code
        +String nom
        +TypeDepartement type
        +String description
        +User responsable
        +Boolean actif
        +LocalDateTime createdAt
        --
        +getEmployes()
        +addEmploye()
        +removeEmploye()
    }
    
    class Specialite {
        +Long id
        +String code
        +String nom
        +TypeSpecialite categorie
        +String description
        +Boolean actif
        --
        +getUsers()
    }
    
    class Session {
        +Long id
        +User user
        +String token
        +String refreshToken
        +String ipAddress
        +String userAgent
        +LocalDateTime dateDebut
        +LocalDateTime dateExpiration
        +LocalDateTime lastActivity
        +Boolean active
        --
        +isValid()
        +refresh()
        +terminate()
    }
    
    class AuditLog {
        +Long id
        +User user
        +String action
        +String module
        +String details
        +String ipAddress
        +LocalDateTime createdAt
        --
        +log()
        +getHistory()
    }
    
    %% ========================================
    %% ENUMERATIONS
    %% ========================================
    
    class TypeContrat {
        <<enumeration>>
        CDI
        CDD
        PRESTATAIRE
        SOUS_TRAITANT
        STAGE
        INTERIM
    }
    
    class NiveauExperience {
        <<enumeration>>
        DEBUTANT
        CONFIRME
        EXPERT
        SENIOR
    }
    
    class TypeDepartement {
        <<enumeration>>
        BUREAU_ETUDE
        DIRECTION
        TERRAIN
        ADMINISTRATION
        LOGISTIQUE
        QUALITE
        HSE
        FINANCE
        RH
        MECANIQUE
        LABORATOIRE
        TOPOGRAPHIE
    }
    
    class TypeSpecialite {
        <<enumeration>>
        MACON
        FERRAILLEUR
        ELECTRICIEN
        PLOMBIER
        CARRELEUR
        PEINTRE
        MENUISIER
        SOUDEUR
        CONDUCTEUR_ENGINS
        TOPOGRAPHE
        LABORANTIN
        MECANICIEN
        AUTRE
    }
    
    class NiveauHierarchique {
        <<enumeration>>
        DIRECTION
        CADRE_SUPERIEUR
        CADRE_MOYEN
        AGENT_MAITRISE
        EMPLOYE
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
    
    %% ========================================
    %% RÔLES SPÉCIFIQUES MIKA SERVICES
    %% ========================================
    
    class RolesMikaServices {
        <<interface>>
        DIRECTEUR_EXPLOITATION_TRAVAUX
        DIRECTEUR_BUREAU_ETUDES
        RESPONSABLE_PROJET
        CONDUCTEUR_TRAVAUX
        CHEF_CHANTIER_TERRASSEMENT
        CHEF_CHANTIER_ASSAINISSEMENT
        CHEF_CHANTIER_VOIRIE
        CHEF_EQUIPE
        GESTIONNAIRE_CHANTIER
        COORDINATEUR_HSE
        ANIMATEUR_HSE
        INGENIEUR_QUALITE
        INGENIEUR_ETUDES
        INGENIEUR_STRUCTURE
        PROJETEUR_SENIOR
        CHARGE_ETUDES
        RESPONSABLE_TOPO
        OPERATEUR_TOPO
        AIDE_TOPO
        RESPONSABLE_LABO
        LABORANTIN
        AIDE_LABORANTIN
        CHEF_ATELIER_MECANIQUE
        MECANICIEN
        CONDUCTEUR_ENGINS
        CHEF_EQUIPE_TERRAIN
        OUVRIER_QUALIFIE
        MAGASINIER
        POINTEUR
        POMPISTE
        GARDIEN
        AGENT_SIGNALEUR
        OPERATRICE_SAISIE
        TECHNICIENNE_SURFACE
        ASSISTANT_PROJET
        ASSISTANT_LOGISTIQUE
        CHEF_SALLE
        ADMIN_SYSTEME
        CLIENT_ETAT
        FOURNISSEUR
    }
    
    %% ========================================
    %% RELATIONS
    %% ========================================
    
    User "1" --> "*" Role : possède
    User "1" --> "*" Departement : appartient
    User "1" --> "*" Specialite : maîtrise
    User "0..1" --> "0..1" User : supérieurHiérarchique
    
    Role "*" --> "*" Permission : contient
    
    User "1" --> "*" Session : a
    User "1" --> "*" AuditLog : génère
    
    User --> TypeContrat
    User --> NiveauExperience
    Departement --> TypeDepartement
    Specialite --> TypeSpecialite
    Role --> NiveauHierarchique
    Permission --> TypePermission
    
    Role ..|> RolesMikaServices : implémente

```

---

## 📋 DESCRIPTION DES CLASSES

### **User (Utilisateur)**
Représente un employé ou utilisateur du système MIKA SERVICES.

**Attributs principaux :**
- `matricule` : Code unique (ex: EMP-2024-001)
- `nom`, `prenom`, `email`, `telephone` : Informations personnelles
- `dateNaissance`, `adresse`, `ville`, `quartier`, `province` : Coordonnées complètes
- `numeroCNI`, `numeroPasseport` : Documents d'identité
- `dateEmbauche` : Date d'entrée dans l'entreprise
- `salaireMensuel` : Salaire pour calculs budgétaires main d'œuvre
- `typeContrat` : CDI, CDD, Prestataire, etc.
- `niveauExperience` : Débutant, Confirmé, Expert
- `photo` : URL de la photo de profil

**Méthodes :**
- `login()` : Authentification
- `hasPermission()` : Vérifier si l'utilisateur a une permission spécifique
- `hasRole()` : Vérifier si l'utilisateur a un rôle spécifique

---

### **Role (Rôle)**
Définit les rôles utilisateurs avec niveau hiérarchique.

**Attributs :**
- `code` : Code unique (ex: CONDUCTEUR_TRAVAUX)
- `nom` : Nom du rôle
- `niveau` : Position hiérarchique (Direction, Cadre, Employé)

**Rôles identifiés selon organigrammes MIKA SERVICES :**
- Direction : Directeur Exploitation, Directeur Bureau d'Études
- Projets : Responsable Projet, Conducteur Travaux
- Chantier : Chef Chantier (Terrassement, Assainissement, Voirie)
- Terrain : Chef Équipe, Ouvriers, Conducteurs engins
- Support : HSE, Qualité, Topo, Labo, Mécanique

---

### **Permission (Permission)**
Définit les permissions granulaires par module.

**Types de permissions :**
- `CREATE` : Créer des enregistrements
- `READ` : Consulter des données
- `UPDATE` : Modifier des enregistrements
- `DELETE` : Supprimer des enregistrements
- `VALIDATE` : Valider des processus
- `EXPORT` : Exporter des données
- `ADMIN` : Administration complète

**Modules concernés :**
- PROJETS, CHANTIERS, BUDGET, QUALITE, SECURITE, MATERIEL, ENGINS, PLANNING, COMMUNICATION, REPORTING

---

### **Departement (Département)**
Organisationnel au sein de MIKA SERVICES.

**Types de départements :**
- Bureau d'Études
- Direction
- Terrain (Chantiers)
- Administration
- Logistique
- Qualité
- HSE (Santé Sécurité Environnement)
- Finance
- RH
- Mécanique
- Laboratoire
- Topographie

---

### **Specialite (Spécialité)**
Métiers/compétences techniques des ouvriers.

**Catégories :**
- Maçon, Ferrailleur, Électricien, Plombier
- Carreleur, Peintre, Menuisier, Soudeur
- Conducteur d'engins
- Topographe, Laborantin, Mécanicien

---

### **Session (Session utilisateur)**
Gestion des sessions actives pour sécurité.

**Attributs :**
- `token` : JWT token d'authentification
- `refreshToken` : Token de renouvellement
- `dateExpiration` : Date d'expiration
- `ipAddress`, `userAgent` : Traçabilité connexion

---

### **AuditLog (Journal d'audit)**
Traçabilité de toutes les actions critiques.

**Utilité :**
- Conformité réglementaire
- Investigation incidents
- Suivi des modifications budgétaires
- Historique validations

---

## 🔐 SÉCURITÉ & BONNES PRATIQUES

1. **Mots de passe** : Hashage BCrypt avec salt
2. **Tokens JWT** : Expiration courte (15 min) + refresh token (7 jours)
3. **Permissions granulaires** : RBAC (Role-Based Access Control)
4. **Audit complet** : Traçabilité de toutes actions sensibles
5. **Sessions multiples** : Un utilisateur peut avoir plusieurs sessions (web, mobile)
6. **Hiérarchie** : Relation `supérieurHiérarchique` pour workflow validations

---

## 📊 CARDINALITÉS

- **User ↔ Role** : `*-*` (Un utilisateur peut avoir plusieurs rôles)
- **User ↔ Departement** : `*-*` (Multi-affectation possible)
- **User ↔ Specialite** : `*-*` (Plusieurs compétences)
- **User ↔ User** : `0..1-0..1` (Supérieur hiérarchique)
- **Role ↔ Permission** : `*-*` (Un rôle contient plusieurs permissions)

---

**DATE DE CRÉATION** : 07/02/2026
**VERSION** : 1.0
**PROJET** : Plateforme Digitale MIKA SERVICES
