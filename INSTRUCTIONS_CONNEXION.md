# Instructions de Connexion - MIKA SERVICES Platform

## 🚀 Démarrage Rapide

### 1. Configuration de l'environnement

#### Backend
1. **Variable d'environnement JWT_SECRET** (obligatoire)
   - Créez un fichier `.env` à la racine du projet backend ou définissez la variable d'environnement :
   ```bash
   # Windows PowerShell
   $env:JWT_SECRET="votre_secret_jwt_tres_long_et_securise_minimum_32_caracteres"
   
   # Linux/Mac
   export JWT_SECRET="votre_secret_jwt_tres_long_et_securise_minimum_32_caracteres"
   ```
   - **Important** : Le secret doit faire au moins 32 caractères pour la sécurité HS256

2. **Base de données MySQL**
   - Assurez-vous que MySQL est démarré
   - La base de données sera créée automatiquement au premier démarrage (mode `dev`)

#### Frontend
- Aucune configuration supplémentaire nécessaire pour le développement

### 2. Démarrage de l'application

#### Backend
```bash
cd backend
./mvnw spring-boot:run
# ou
mvn spring-boot:run
```

Le backend démarre sur `http://localhost:9090/api`

#### Frontend
```bash
cd frontend_web/mika-services-frontend
npm install  # Si première installation
npm run dev
```

Le frontend démarre sur `http://localhost:5173` (ou le port disponible)

### 3. Initialisation automatique

Au premier démarrage du backend (en mode `dev` ou `staging`), un **DataInitializer** s'exécute automatiquement et crée :

✅ **Permissions de base** (USER, ROLE, PROJET, CHANTIER, BUDGET)  
✅ **Rôles de base** :
   - `SUPER_ADMIN` : Accès complet à toutes les fonctionnalités
   - `ADMIN` : Gestion des utilisateurs et rôles
   - `USER` : Accès en lecture aux projets et chantiers

✅ **Utilisateur administrateur par défaut** :
   - **Email** : `admin@mikaservices.com`
   - **Mot de passe** : `Admin@2024`
   - **Rôle** : `SUPER_ADMIN`

### 4. Connexion à l'application

1. Ouvrez votre navigateur et accédez à `http://localhost:5173`
2. Vous serez redirigé vers la page de connexion (`/login`)
3. Utilisez les identifiants suivants :

   ```
   Email: admin@mikaservices.com
   Mot de passe: Admin@2024
   ```

4. Après connexion, vous serez redirigé vers le tableau de bord

### 5. Vérification de l'initialisation

Si l'utilisateur admin n'existe pas, vérifiez les logs du backend. Vous devriez voir :

```
========================================
UTILISATEUR ADMIN CRÉÉ AVEC SUCCÈS
Email: admin@mikaservices.com
Mot de passe: Admin@2024
========================================
```

### 6. Création d'autres utilisateurs

Une fois connecté en tant qu'admin :
1. Allez dans **"Gestion utilisateurs"** (menu latéral ou header)
2. Cliquez sur **"+ Ajouter un utilisateur"**
3. Remplissez le formulaire et assignez les rôles appropriés

## 🔒 Sécurité

⚠️ **IMPORTANT** :
- Changez le mot de passe par défaut de l'admin après la première connexion
- Ne commitez JAMAIS le fichier `.env` ou les secrets dans le code
- En production, utilisez des variables d'environnement sécurisées
- Le DataInitializer ne s'exécute qu'en mode `dev` et `staging` (pas en `prod`)

## 🐛 Dépannage

### Erreur : "JWT_SECRET environment variable or app.jwt.secret property is required"
- **Solution** : Définissez la variable d'environnement `JWT_SECRET` (minimum 32 caractères)

### Erreur : "JWT secret must be at least 32 characters long"
- **Solution** : Utilisez un secret d'au moins 32 caractères

### L'utilisateur admin n'est pas créé
- Vérifiez que vous êtes en mode `dev` ou `staging`
- Vérifiez les logs du backend pour les erreurs
- Vérifiez que la base de données est accessible

### Erreur de connexion à la base de données
- Vérifiez que MySQL est démarré
- Vérifiez les credentials dans `application-dev.yml`
- Vérifiez que le port 3306 est accessible

## 📝 Notes

- L'initialisation ne se fait qu'une seule fois (vérification d'existence)
- Pour réinitialiser, supprimez les données de la base et redémarrez
- En production, créez manuellement l'utilisateur admin via une migration ou un script sécurisé
