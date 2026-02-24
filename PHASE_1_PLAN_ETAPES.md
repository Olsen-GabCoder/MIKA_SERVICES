# PHASE 1 : AUTHENTIFICATION ET UTILISATEURS - PLAN ÉTAPE PAR ÉTAPE

**Date de démarrage** : 2026-02-07  
**Statut** : 🚀 En cours

---

## 📋 PLAN D'EXÉCUTION

### ÉTAPE 1 : Création des Enums (Backend)
- TypeContrat
- NiveauExperience
- TypeDepartement
- TypeSpecialite
- NiveauHierarchique
- TypePermission

### ÉTAPE 2 : Création des Entités (Backend)
- Permission
- Role
- Departement
- Specialite
- User
- Session
- AuditLog

### ÉTAPE 3 : Création des Repositories (Backend)
- PermissionRepository
- RoleRepository
- DepartementRepository
- SpecialiteRepository
- UserRepository
- SessionRepository
- AuditLogRepository

### ÉTAPE 4 : Création des DTOs (Backend)
- Request DTOs : LoginRequest, RegisterRequest, UserCreateRequest, etc.
- Response DTOs : AuthResponse, UserResponse, RoleResponse, etc.

### ÉTAPE 5 : Création des Mappers (Backend)
- UserMapper
- RoleMapper
- etc.

### ÉTAPE 6 : Création des Services (Backend)
- AuthService
- UserService
- RoleService

### ÉTAPE 7 : Création des Controllers (Backend)
- AuthController
- UserController

### ÉTAPE 8 : Configuration Frontend - Services API
- authApi.ts
- userApi.ts

### ÉTAPE 9 : Configuration Frontend - Redux Slices
- authSlice.ts
- userSlice.ts

### ÉTAPE 10 : Création Frontend - Pages
- Login.tsx
- Register.tsx
- Profile.tsx

### ÉTAPE 11 : Création Frontend - Composants
- LoginForm.tsx
- RegisterForm.tsx
- UserList.tsx
- UserForm.tsx

### ÉTAPE 12 : Configuration Frontend - Routes et Guards
- ProtectedRoute.tsx
- Mise à jour Router.tsx

---

## 🎯 DÉMARRAGE : ÉTAPE 1

**Création des Enums nécessaires pour les entités.**
