# Structure des données – MIKA Services Platform

Analyse des entités JPA et tables MySQL du backend.

---

## 1. Tables principales (domaine métier)

### 1.1 Utilisateurs et organisation

| Table | Entité | Description |
|-------|--------|--------------|
| **users** | `User` | Utilisateurs (matricule, nom, prénom, email, mot de passe, préférences, 2FA, etc.) |
| **roles** | `Role` | Rôles (code, nom, niveau hiérarchique) |
| **permissions** | `Permission` | Permissions associées aux rôles |
| **user_roles** | (MTM) | Liaison user ↔ role |
| **role_permissions** | (MTM) | Liaison role ↔ permission |
| **departements** | `Departement` | Départements (code, nom, type, responsable) |
| **specialites** | `Specialite` | Spécialités (code, nom, catégorie) |
| **user_departements** | (MTM) | Liaison user ↔ departement |
| **user_specialites** | (MTM) | Liaison user ↔ specialite |
| **audit_logs** | `AuditLog` | Journaux d’audit |

**User** hérite de `BaseEntity` (id, created_at, updated_at, created_by, updated_by) et contient notamment :
- Identité : matricule, nom, prenom, email, mot_de_passe, telephone
- Civilité / adresse : date_naissance, adresse, ville, quartier, province, numero_cni, numero_passeport
- Pro : date_embauche, photo, fiche_mission, salaire_mensuel, type_contrat, niveau_experience
- Sécurité : actif, last_login, totp_secret, totp_enabled, must_change_password, failed_login_attempts, lockout_until
- Préférences (notifications, digest, session, etc.)
- FK : superieur_hierarchique_id → users(id)

### 1.2 Auth / sessions

| Table | Entité | Description |
|-------|--------|--------------|
| **sessions** | `Session` | Sessions utilisateur (token, expiration, etc.) |
| **password_reset_tokens** | `PasswordResetToken` | Tokens de réinitialisation MDP |

### 1.3 Projets

| Table | Entité | Description |
|-------|--------|--------------|
| **projets** | `Projet` | Projets (code, nom, statut, client, responsable_projet_id, montants, dates, etc.) |
| **projet_types** | (collection) | Types multiples par projet |
| **clients** | `Client` | Clients |
| **partenaires** | `Partenaire` | Partenaires |
| **projet_partenaires** | (MTM) | projet ↔ partenaire |
| **sous_projets** | `SousProjet` | Sous-projets |
| **previsions** | `Prevision` | Prévisions (CA, etc.) |
| **revisions_budget** | `RevisionBudget` | Révisions de budget |
| **ca_previsionnel_realise** | `CAPrevisionnelRealise` | CA prévisionnel réalisé |
| **points_bloquants** | `PointBloquant` | Points bloquants |
| **avancement_etude_projet** | `AvancementEtudeProjet` | Avancement études |

**projets** : FK client_id → clients(id), responsable_projet_id → users(id).

### 1.4 Chantier / équipes / matériel

| Table | Entité | Description |
|-------|--------|--------------|
| **equipes** | `Equipe` | Équipes |
| **membres_equipe** | `MembreEquipe` | Membres d’équipe |
| **zones_projet** | `ZoneChantier` | Zones chantier |
| **installations_projet** | `InstallationChantier` | Installations |
| **affectations_projet** | `AffectationChantier` | Affectations chantier |
| **engins** | `Engin` | Engins |
| **materiaux** | `Materiau` | Matériaux |
| **affectations_engin_projet** | `AffectationEnginChantier` | Affectations engins |
| **affectations_materiau_projet** | `AffectationMateriauChantier` | Affectations matériaux |

### 1.5 Budget / fournisseurs / documents

| Table | Entité | Description |
|-------|--------|--------------|
| **depenses** | `Depense` | Dépenses |
| **fournisseurs** | `Fournisseur` | Fournisseurs |
| **commandes** | `Commande` | Commandes |
| **documents** | `Document` | Documents |

### 1.6 Communication

| Table | Entité | Description |
|-------|--------|--------------|
| **messages** | `Message` | Messages |
| **message_mentions** | `MessageMention` | Mentions |
| **message_pieces_jointes** | `MessagePieceJointe` | Pièces jointes |
| **message_suppressions** | `MessageSuppression` | Suppressions |
| **conversation_archives** | `ConversationArchive` | Archives de conversations |
| **notifications** | `Notification` | Notifications |

### 1.7 Réunions / qualité / sécurité

| Table | Entité | Description |
|-------|--------|--------------|
| **reunions_hebdo** | `ReunionHebdo` | Réunions hebdomadaires |
| **participants_reunion** | `ParticipantReunion` | Participants |
| **point_projet_pv** | (PV) | Points projet dans les PV |
| **controles_qualite** | `ControleQualite` | Contrôles qualité |
| **non_conformites** | `NonConformite` | Non-conformités |
| **risques** | `Risque` | Risques |
| **incidents** | `Incident` | Incidents |
| **actions_prevention** | `ActionPrevention` | Actions de prévention |

### 1.8 Planning

| Table | Entité | Description |
|-------|--------|--------------|
| **taches** | `Tache` | Tâches planning |

---

## 2. Colonnes de la table `users`

Héritage **BaseEntity** sur toutes les entités principales :

- **id** (PK, auto)
- **created_at**, **updated_at** (datetime)
- **created_by**, **updated_by** (varchar 100, nullable)

Colonnes **User** :

- matricule, nom, prenom, email, mot_de_passe
- telephone, date_naissance, adresse, ville, quartier, province
- numero_cni, numero_passeport, date_embauche, photo, fiche_mission
- salaire_mensuel, type_contrat, niveau_experience
- actif, last_login, totp_secret, totp_enabled, must_change_password
- failed_login_attempts, lockout_until
- email_notifications_enabled, alert_new_login_enabled
- daily_digest_enabled, weekly_digest_enabled, digest_time
- in_app_notifications_enabled, notification_sound_enabled
- default_session_duration, logout_on_browser_close
- **superieur_hierarchique_id** (FK → users.id)

---

## 3. Tables de liaison many-to-many (users)

- **user_roles** : user_id → users(id), role_id → roles(id)
- **user_departements** : user_id → users(id), departement_id → departements(id)
- **user_specialites** : user_id → users(id), specialite_id → specialites(id)
