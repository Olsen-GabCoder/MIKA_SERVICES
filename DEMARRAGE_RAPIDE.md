# 🚀 Guide de Démarrage Rapide - MIKA SERVICES Platform

## ⚠️ Erreur Actuelle
```
ECONNREFUSED: Le backend n'est pas démarré
```

## 📋 Étapes pour Démarrer l'Application

### 1. Démarrer le Backend (Terminal 1)

```powershell
# Naviguer vers le dossier backend
cd C:\Projet_Mika_Services\backend

# Définir la variable d'environnement JWT_SECRET (OBLIGATOIRE)
$env:JWT_SECRET="votre_secret_jwt_tres_long_et_securise_minimum_32_caracteres_obligatoire"

# Démarrer le backend Spring Boot
./mvnw spring-boot:run

# OU si Maven est installé globalement
mvn spring-boot:run
```

**Vérifications :**
- ✅ Le backend démarre sur `http://localhost:9090`
- ✅ Les logs affichent : "Started MikaServicesPlatformApplication"
- ✅ L'utilisateur admin est créé automatiquement (première fois uniquement)

### 2. Démarrer le Frontend (Terminal 2)

```powershell
# Naviguer vers le dossier frontend
cd C:\Projet_Mika_Services\frontend_web\mika-services-frontend

# Démarrer le serveur de développement
npm run dev
```

**Vérifications :**
- ✅ Le frontend démarre sur `http://localhost:3000`
- ✅ Aucune erreur de proxy dans la console

### 3. Se Connecter

1. Ouvrir `http://localhost:3000` dans le navigateur
2. Utiliser les identifiants :
   - **Email** : `admin@mikaservices.com`
   - **Mot de passe** : `Admin@2024`

## 🔍 Dépannage

### Erreur : "JWT_SECRET environment variable or app.jwt.secret property is required"
**Solution :** Définir la variable d'environnement `JWT_SECRET` (minimum 32 caractères)

```powershell
$env:JWT_SECRET="votre_secret_jwt_tres_long_et_securise_minimum_32_caracteres"
```

### Erreur : "ECONNREFUSED" ou "http proxy error"
**Solution :** Vérifier que le backend est bien démarré sur le port 9090

```powershell
# Vérifier si le port 9090 est utilisé
netstat -ano | findstr :9090
```

### Erreur de connexion à la base de données
**Solution :** 
1. Vérifier que MySQL est démarré
2. Vérifier les credentials dans `application-dev.yml`
3. Vérifier que la base de données `mika_services_dev` existe ou peut être créée

### Le backend ne démarre pas
**Vérifications :**
1. Java est installé (version 17 ou supérieure)
   ```powershell
   java -version
   ```
2. Maven est accessible
   ```powershell
   ./mvnw --version
   ```
3. La variable JWT_SECRET est définie
   ```powershell
   echo $env:JWT_SECRET
   ```

## 📝 Ordre de Démarrage Recommandé

1. **MySQL** → Démarrer le service MySQL
2. **Backend** → Démarrer Spring Boot (port 9090)
3. **Frontend** → Démarrer Vite (port 3000)

## 🔗 URLs Importantes

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:9090/api
- **Swagger UI** : http://localhost:9090/api/swagger-ui.html
- **API Docs** : http://localhost:9090/api/v3/api-docs

## ✅ Checklist de Démarrage

- [ ] MySQL est démarré
- [ ] Variable `JWT_SECRET` est définie (min 32 caractères)
- [ ] Backend démarre sans erreur sur le port 9090
- [ ] Frontend démarre sans erreur sur le port 3000
- [ ] Aucune erreur de proxy dans la console frontend
- [ ] La page de login s'affiche correctement
