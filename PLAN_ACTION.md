# PLAN D'ACTION - PLATEFORME DIGITALE MIKA SERVICES

**Date de création** : 2026-02-07  
**Version** : 1.0  
**Statut** : En attente de validation

---

## 📋 TABLE DES MATIÈRES

1. [Résumé exécutif](#résumé-exécutif)
2. [Modules métier identifiés](#modules-métier-identifiés)
3. [Plan de développement par phases](#plan-de-développement-par-phases)
4. [Questions et clarifications](#questions-et-clarifications)
5. [Recommandations](#recommandations)

---

## 🎯 RÉSUMÉ EXÉCUTIF

### Contexte
MIKA SERVICES est une entreprise gabonaise de génie civil spécialisée dans la construction de ponts, voiries, assainissement et travaux publics. La plateforme digitale vise à digitaliser la gestion complète des projets, chantiers, ressources humaines, matériels et budgets.

### Objectifs
- Digitaliser la gestion des projets et chantiers
- Optimiser l'allocation des ressources (humaines, matérielles)
- Suivre en temps réel l'avancement des travaux
- Améliorer la traçabilité et la conformité
- Fournir des tableaux de bord et reporting pour la direction

### Architecture technique
- **Backend** : Spring Boot 4.0.2 + Kotlin 2.2.21 + MySQL
- **Frontend** : React 19.2.0 + TypeScript + Vite 7
- **Communication** : REST API + WebSocket (temps réel)
- **Sécurité** : JWT + Spring Security + RBAC

---

## 📦 MODULES MÉTIER IDENTIFIÉS

### Modules prioritaires (Phase 1 - Fondations)

#### 1. Authentification et Utilisateurs
- **Complexité** : Moyenne
- **Dépendances** : Aucune
- **Justification** : Base pour tous les autres modules
- **Entités principales** : User, Role, Permission, Departement, Specialite, Session, AuditLog

#### 2. Gestion des Projets
- **Complexité** : Élevée
- **Dépendances** : User
- **Justification** : Entité centrale du système
- **Entités principales** : Projet, SousProjet, Client, Partenaire, CAPrevisionnelRealise, PointBloquant, Prevision, RevisionBudget

#### 3. Gestion des Chantiers
- **Complexité** : Élevée
- **Dépendances** : Projet, User
- **Justification** : Cœur métier de l'entreprise
- **Entités principales** : Chantier, Equipe, MembreEquipe, AffectationChantier, AffectationEnginChantier, AffectationMateriauChantier, ZoneChantier, InstallationChantier

### Modules secondaires (Phase 2 - Fonctionnalités métier)

#### 4. Gestion des Ressources Humaines
- **Complexité** : Moyenne
- **Dépendances** : User, Chantier
- **Entités principales** : Equipe, MembreEquipe, AffectationChantier

#### 5. Gestion du Matériel et Engins
- **Complexité** : Moyenne
- **Dépendances** : Chantier
- **Entités principales** : Engin, AffectationEnginChantier

#### 6. Gestion des Matériaux et Stocks
- **Complexité** : Moyenne
- **Dépendances** : Chantier
- **Entités principales** : Materiau, Stock, AffectationMateriauChantier

#### 7. Budget et Performances Financières
- **Complexité** : Élevée
- **Dépendances** : Projet, Chantier
- **Entités principales** : Budget, Depense, PerformanceFinanciere

### Modules avancés (Phase 3 - Optimisation)

#### 8. Planning et Coordination
- **Complexité** : Élevée
- **Dépendances** : Chantier, Ressource, Matériel
- **Entités principales** : Planning, Tache, RessourcePlanning

#### 9. Qualité et Conformité
- **Complexité** : Moyenne
- **Dépendances** : Chantier
- **Entités principales** : ControleQualite, NonConformite

#### 10. Sécurité et Prévention
- **Complexité** : Moyenne
- **Dépendances** : Chantier
- **Entités principales** : Incident, Risque, ActionPrevention

#### 11. Communication et Messagerie
- **Complexité** : Moyenne
- **Dépendances** : User
- **Entités principales** : Message, Notification

#### 12. Reporting et Analyse
- **Complexité** : Élevée
- **Dépendances** : Tous les modules
- **Fonctionnalités** : Rapports, exports PDF/Excel

#### 13. Dashboard et KPI
- **Complexité** : Moyenne
- **Dépendances** : Tous les modules
- **Fonctionnalités** : Tableaux de bord, indicateurs clés

#### 14. Documents
- **Complexité** : Faible
- **Dépendances** : Tous les modules
- **Entités principales** : Document

#### 15. Météo
- **Complexité** : Faible
- **Dépendances** : Planning
- **Fonctionnalités** : Intégration API météo

#### 16. Fournisseurs
- **Complexité** : Faible
- **Dépendances** : Matériaux
- **Entités principales** : Fournisseur, Commande

---

## 🚀 PLAN DE DÉVELOPPEMENT PAR PHASES

### Phase 0 : Configuration et Infrastructure (1-2 jours)

**Objectif** : Mettre en place l'infrastructure de base

#### Backend
- [ ] Configuration Spring Security (JWT)
- [ ] Configuration CORS
- [ ] Configuration Swagger/OpenAPI
- [ ] Configuration WebSocket (pour temps réel)
- [ ] Configuration exception handling globale
- [ ] Configuration logging avancé
- [ ] Configuration validation globale
- [ ] Base entity (audit fields : createdAt, updatedAt, etc.)
- [ ] Utilitaires communs (mappers, validators, constants)

#### Frontend
- [ ] Configuration proxy API (`/api` → `http://localhost:9090`)
- [ ] Configuration alias TypeScript (`@/` → `./src/`)
- [ ] Configuration Axios (intercepteurs, base URL)
- [ ] Configuration React Router
- [ ] Configuration Redux Store
- [ ] Configuration React Query
- [ ] Configuration Socket.io
- [ ] Layout de base (Header, Sidebar, Footer)
- [ ] Système de routing
- [ ] Gestion des erreurs globale
- [ ] Composants UI de base (Button, Input, Card, Modal, etc.)

---

### Phase 1 : Authentification et Utilisateurs (3-5 jours)

**Objectif** : Système d'authentification et gestion des utilisateurs

#### Backend
- [ ] Entités : User, Role, Permission, Departement, Specialite, Session, AuditLog
- [ ] Enums : TypeContrat, NiveauExperience, TypeDepartement, TypeSpecialite, NiveauHierarchique, TypePermission
- [ ] DTOs : LoginRequest, RegisterRequest, UserResponse, RoleResponse, etc.
- [ ] Repositories JPA
- [ ] Services : AuthService, UserService, RoleService
- [ ] Controllers : AuthController, UserController
- [ ] Security : JWT filter, Password encoder (BCrypt)
- [ ] Endpoints :
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `GET /api/users/me`
  - `GET /api/users`
  - `POST /api/users`
  - `PUT /api/users/{id}`
  - `DELETE /api/users/{id}`

#### Frontend
- [ ] Pages : Login, Register, Profile
- [ ] Composants : LoginForm, UserList, UserForm, RoleSelector
- [ ] Services API : authApi, userApi
- [ ] Redux : authSlice, userSlice
- [ ] Guards : ProtectedRoute
- [ ] Hooks : useAuth, useUser

---

### Phase 2 : Gestion des Projets (4-6 jours)

**Objectif** : Gestion complète des projets et marchés

#### Backend
- [ ] Entités : Projet, SousProjet, Client, Partenaire, CAPrevisionnelRealise, PointBloquant, Prevision, RevisionBudget
- [ ] Enums : TypeProjet, StatutProjet, TypeClient, SourceFinancement, TypePartenaire, TypeTravaux, StatutSousProjet, Priorite, StatutPointBloquant, TypePrevision, StatutPrevision
- [ ] DTOs : ProjetRequest, ProjetResponse, SousProjetRequest, etc.
- [ ] Services : ProjetService, SousProjetService, ClientService
- [ ] Controllers : ProjetController, SousProjetController, ClientController
- [ ] Endpoints CRUD complets
- [ ] Logique métier :
  - Calcul avancement global
  - Calcul budget consommé
  - Calcul délai consommé
  - Génération situations

#### Frontend
- [ ] Pages : ProjetList, ProjetDetail, ProjetForm, SousProjetList
- [ ] Composants : ProjetCard, ProjetForm, SousProjetCard, PointBloquantCard
- [ ] Services API : projetApi, clientApi
- [ ] Redux slices : projetSlice, clientSlice
- [ ] Charts : AvancementChart, BudgetChart

---

### Phase 3 : Gestion des Chantiers (5-7 jours)

**Objectif** : Gestion complète des chantiers et affectations

#### Backend
- [ ] Entités : Chantier, Equipe, MembreEquipe, AffectationChantier, AffectationEnginChantier, AffectationMateriauChantier, ZoneChantier, InstallationChantier
- [ ] Enums : TypeChantier, StatutChantier, ConditionAcces, ZoneClimatique, TypeEquipe, RoleDansEquipe, StatutAffectation, TypeZone, NiveauDanger, TypeInstallation, StatutInstallation
- [ ] DTOs : ChantierRequest, ChantierResponse, AffectationRequest, etc.
- [ ] Services : ChantierService, EquipeService, AffectationService
- [ ] Controllers : ChantierController, EquipeController, AffectationController
- [ ] Logique métier :
  - Calcul avancement physique
  - Gestion affectations équipes
  - Gestion affectations engins
  - Gestion affectations matériaux

#### Frontend
- [ ] Pages : ChantierList, ChantierDetail, ChantierForm, AffectationList
- [ ] Composants : ChantierCard, AffectationForm, ZoneChantierMap, InstallationList
- [ ] Services API : chantierApi, equipeApi
- [ ] Redux slices : chantierSlice, equipeSlice
- [ ] Maps : Géolocalisation chantiers

---

### Phase 4 : Gestion des Ressources (3-4 jours)

**Objectif** : Gestion des équipes et affectations

#### Backend
- [ ] Services complémentaires pour équipes
- [ ] Endpoints affectations avancés
- [ ] Logique planning ressources

#### Frontend
- [ ] Pages : EquipeList, EquipeDetail, PlanningRessources
- [ ] Composants : AffectationCalendar, EquipeCard
- [ ] Services API : ressourceApi
- [ ] Redux slice : ressourceSlice

---

### Phase 5 : Gestion Matériel et Engins (3-4 jours)

**Objectif** : Gestion du parc d'engins

#### Backend
- [ ] Entités : Engin, AffectationEnginChantier
- [ ] Enums : TypeEngin, StatutEngin
- [ ] Services : EnginService
- [ ] Controllers : EnginController
- [ ] Logique : Suivi heures d'utilisation, maintenance

#### Frontend
- [ ] Pages : EnginList, EnginDetail, EnginForm
- [ ] Composants : EnginCard, AffectationEnginForm, HeuresUtilisationChart
- [ ] Services API : enginApi
- [ ] Redux slice : enginSlice

---

### Phase 6 : Gestion Matériaux et Stocks (3-4 jours)

**Objectif** : Gestion des matériaux et stocks

#### Backend
- [ ] Entités : Materiau, Stock, AffectationMateriauChantier
- [ ] Enums : TypeMateriau, Unite
- [ ] Services : MateriauService, StockService
- [ ] Controllers : MateriauController, StockController
- [ ] Logique : Suivi consommation, alertes stock faible

#### Frontend
- [ ] Pages : MateriauList, StockList, ConsommationList
- [ ] Composants : StockCard, ConsommationChart, AlerteStock
- [ ] Services API : materiauApi, stockApi
- [ ] Redux slices : materiauSlice, stockSlice

---

### Phase 7 : Budget et Performances (4-5 jours)

**Objectif** : Suivi budgétaire et financier

#### Backend
- [ ] Entités : Budget, Depense, PerformanceFinanciere
- [ ] Services : BudgetService
- [ ] Controllers : BudgetController
- [ ] Logique :
  - Calculs budgétaires
  - Calculs écarts
  - Prévisions vs réalisé

#### Frontend
- [ ] Pages : BudgetDetail, PerformanceDashboard
- [ ] Composants : BudgetChart, EcartChart, PerformanceCard
- [ ] Services API : budgetApi
- [ ] Redux slice : budgetSlice

---

### Phase 8 : Planning et Coordination (4-5 jours)

**Objectif** : Planning des ressources

#### Backend
- [ ] Entités : Planning, Tache, RessourcePlanning
- [ ] Services : PlanningService
- [ ] Controllers : PlanningController
- [ ] Logique : Optimisation affectations, conflits

#### Frontend
- [ ] Pages : PlanningView, TacheList, TacheDetail
- [ ] Composants : PlanningCalendar, GanttChart, TacheCard
- [ ] Services API : planningApi
- [ ] Redux slice : planningSlice

---

### Phase 9 : Qualité et Conformité (3-4 jours)

**Objectif** : Contrôles qualité

#### Backend
- [ ] Entités : ControleQualite, NonConformite
- [ ] Services : QualiteService
- [ ] Controllers : QualiteController

#### Frontend
- [ ] Pages : ControleQualiteList, NonConformiteList
- [ ] Composants : ControleForm, NonConformiteCard
- [ ] Services API : qualiteApi
- [ ] Redux slice : qualiteSlice

---

### Phase 10 : Sécurité et Prévention (3-4 jours)

**Objectif** : Gestion sécurité

#### Backend
- [ ] Entités : Incident, Risque, ActionPrevention
- [ ] Services : SecuriteService
- [ ] Controllers : SecuriteController

#### Frontend
- [ ] Pages : IncidentList, RisqueList, ActionPreventionList
- [ ] Composants : IncidentForm, RisqueCard, AlerteSecurite
- [ ] Services API : securiteApi
- [ ] Redux slice : securiteSlice

---

### Phase 11 : Communication (3-4 jours)

**Objectif** : Messagerie et notifications

#### Backend
- [ ] Entités : Message, Notification
- [ ] Services : CommunicationService, NotificationService
- [ ] Controllers : MessageController, NotificationController
- [ ] WebSocket : Notifications temps réel

#### Frontend
- [ ] Pages : Messagerie, NotificationCenter
- [ ] Composants : MessageList, NotificationBell, ChatWindow
- [ ] Services API : messageApi, notificationApi
- [ ] Redux slices : messageSlice, notificationSlice
- [ ] WebSocket client : Connexion temps réel

---

### Phase 12 : Reporting et Analyse (4-5 jours)

**Objectif** : Rapports et analyses

#### Backend
- [ ] Services : ReportingService
- [ ] Controllers : ReportingController
- [ ] Export : PDF, Excel
- [ ] Logique : Génération rapports personnalisés

#### Frontend
- [ ] Pages : ReportingDashboard, ReportGenerator
- [ ] Composants : ReportGenerator, ExportButton, ReportPreview
- [ ] Services API : reportingApi
- [ ] Redux slice : reportingSlice

---

### Phase 13 : Dashboard et KPI (3-4 jours)

**Objectif** : Tableaux de bord

#### Backend
- [ ] Services : DashboardService
- [ ] Controllers : DashboardController
- [ ] Logique : Calculs KPI

#### Frontend
- [ ] Pages : Dashboard
- [ ] Composants : KPICard, ChartWidget, DashboardGrid
- [ ] Services API : dashboardApi
- [ ] Redux slice : dashboardSlice

---

### Phase 14 : Documents (2-3 jours)

**Objectif** : Gestion documentaire

#### Backend
- [ ] Entités : Document
- [ ] Services : DocumentService
- [ ] Controllers : DocumentController
- [ ] Stockage : Gestion fichiers

#### Frontend
- [ ] Pages : DocumentList, DocumentUpload
- [ ] Composants : DocumentUpload, DocumentViewer, DocumentCard
- [ ] Services API : documentApi
- [ ] Redux slice : documentSlice

---

### Phase 15 : Météo (2 jours)

**Objectif** : Intégration météo

#### Backend
- [ ] Services : MeteoService
- [ ] Intégration API météo externe

#### Frontend
- [ ] Composants : MeteoWidget
- [ ] Services API : meteoApi

---

### Phase 16 : Fournisseurs (2-3 jours)

**Objectif** : Gestion fournisseurs

#### Backend
- [ ] Entités : Fournisseur, Commande
- [ ] Services : FournisseurService
- [ ] Controllers : FournisseurController

#### Frontend
- [ ] Pages : FournisseurList, CommandeList
- [ ] Composants : FournisseurCard, CommandeForm
- [ ] Services API : fournisseurApi
- [ ] Redux slice : fournisseurSlice

---

## ❓ QUESTIONS ET CLARIFICATIONS

### Questions techniques

1. **Langage backend** : Le projet utilise Kotlin, pas Java. Confirmer que c'est volontaire ?
2. **Port backend** : Configuration indique 9090, instructions mentionnent 9092. Quel port utiliser ?
3. **Base de données** : Le mot de passe est en clair dans `application-dev.yml`. Utiliser des variables d'environnement ?
4. **Structure modules** : Les dossiers existent mais sont vides. Dois-je créer les fichiers dans cette structure ou la réorganiser ?

### Questions fonctionnelles

5. **Priorités métier** : Quels modules sont prioritaires pour MIKA SERVICES ?
6. **Authentification** : Besoin d'un système de réinitialisation de mot de passe par email ?
7. **Notifications** : Besoin de notifications push (mobile) ou uniquement web ?
8. **Documents** : Où stocker les fichiers (local, S3, autre) ?
9. **Météo** : Quelle API météo utiliser (OpenWeatherMap, autre) ?
10. **Reporting** : Formats d'export requis (PDF, Excel, autres) ?

### Questions architecture

11. **WebSocket** : Utilisation pour quelles fonctionnalités (notifications, chat, mises à jour temps réel) ?
12. **Mobile** : Un frontend Android est mentionné. Doit-on prévoir une API mobile-friendly ?
13. **Multi-tenant** : Besoin de gérer plusieurs entreprises ou uniquement MIKA SERVICES ?
14. **Internationalisation** : Besoin de plusieurs langues (français, anglais) ?

---

## 💡 RECOMMANDATIONS

### Priorités de développement recommandées

**Ordre suggéré** :
1. ✅ **Phase 0** : Infrastructure (obligatoire)
2. ✅ **Phase 1** : Authentification (obligatoire)
3. ✅ **Phase 2** : Projets (priorité métier)
4. ✅ **Phase 3** : Chantiers (priorité métier)
5. ✅ **Phase 4** : Ressources (nécessaire pour chantiers)
6. ✅ **Phase 5-6** : Matériel et matériaux (nécessaires pour chantiers)
7. ✅ **Phase 7** : Budget (important pour direction)
8. ✅ **Phase 8** : Planning (optimisation)
9. ⏳ **Phases 9-16** : Fonctionnalités avancées (selon besoins)

### Points d'attention

1. **Sécurité** :
   - Mots de passe hashés (BCrypt)
   - JWT avec expiration courte
   - RBAC strict
   - Validation de tous les inputs

2. **Performance** :
   - Indexation base de données
   - Pagination systématique
   - Cache si nécessaire
   - Optimisation requêtes

3. **Traçabilité** :
   - Audit log pour actions critiques
   - Historique des modifications
   - Traçabilité budgétaire

4. **UX** :
   - Interface intuitive
   - Responsive design
   - Accessibilité
   - Feedback utilisateur

5. **Tests** :
   - Tests unitaires pour logique métier critique
   - Tests d'intégration pour API
   - Tests E2E pour flux principaux

---

## 📊 ESTIMATION GLOBALE

| Phase | Durée estimée | Complexité |
|-------|---------------|-------------|
| Phase 0 | 1-2 jours | Moyenne |
| Phase 1 | 3-5 jours | Moyenne |
| Phase 2 | 4-6 jours | Élevée |
| Phase 3 | 5-7 jours | Élevée |
| Phase 4 | 3-4 jours | Moyenne |
| Phase 5 | 3-4 jours | Moyenne |
| Phase 6 | 3-4 jours | Moyenne |
| Phase 7 | 4-5 jours | Élevée |
| Phase 8 | 4-5 jours | Élevée |
| Phase 9 | 3-4 jours | Moyenne |
| Phase 10 | 3-4 jours | Moyenne |
| Phase 11 | 3-4 jours | Moyenne |
| Phase 12 | 4-5 jours | Élevée |
| Phase 13 | 3-4 jours | Moyenne |
| Phase 14 | 2-3 jours | Faible |
| Phase 15 | 2 jours | Faible |
| Phase 16 | 2-3 jours | Faible |
| **TOTAL** | **52-70 jours** | - |

*Estimation basée sur un développeur full-stack expérimenté*

---

## ✅ VALIDATION

- [ ] Plan d'action validé
- [ ] Questions clarifiées
- [ ] Priorités confirmées
- [ ] Prêt pour démarrage Phase 0

---

**STATUT ACTUEL** : ⏳ **EN ATTENTE DE VALIDATION**

---

*Document créé le 2026-02-07*  
*Dernière mise à jour : 2026-02-07*
