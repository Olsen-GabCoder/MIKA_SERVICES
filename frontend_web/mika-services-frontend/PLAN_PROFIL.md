# Analyse et plan – Section Profil utilisateur

## 1. État des lieux

### 1.1 Frontend actuel

| Élément | État | Détail |
|--------|------|--------|
| **Page Profil** | Insuffisant | Une seule page avec titre "Mon Profil" + un formulaire (ProfileForm). |
| **Photo de profil** | Absent | Pas d’affichage ni d’upload ; le type `User` a `photo?: string` mais le formulaire ne l’utilise pas. |
| **Année de début MIKA** | Absent | `User.dateEmbauche` existe côté API/types mais n’est ni affiché ni éditable dans le profil. |
| **Fiche de mission** | Absent | Aucun champ "fiche de mission" (ni texte, ni document). |
| **CV** | Absent | Pas de zone CV : pas d’upload, pas de liste, pas de téléchargement ni de consultation sur le site. |
| **Structure / UX** | Faible | Un seul bloc "Informations personnelles" ; pas de sections (en-tête, mission, CV, mot de passe). |
| **Changement mot de passe** | Absent | L’API existe (`PUT /users/{id}/password`) mais pas d’UI dans le profil. |

**Fichiers concernés :** `ProfilePage.tsx`, `ProfileForm.tsx`, `userApi.ts`, `types/index.ts` (User), `types/document.ts` (TypeDocument sans CV).

### 1.2 Backend actuel

| Élément | État | Détail |
|--------|------|--------|
| **User** | Complet pour champs de base | `photo`, `dateEmbauche`, rôles, départements, spécialités, supérieur hiérarchique. |
| **Fiche de mission** | Absent | Pas de champ `ficheMission` (texte ou document) sur l’entité User. |
| **CV** | Partiel | `TypeDocument.CV` existe ; documents liés à un utilisateur via `uploadePar` ; `DocumentService.findByUploadeParIdAndTypeDocumentIn(userId, types)` existe. Pas d’endpoint dédié "mes CV" pour l’utilisateur connecté. |
| **Photo de profil** | Partiel | `User.photo` est une chaîne (URL/path). Pas d’endpoint d’upload de photo (multipart) ni de service de stockage dédié. |
| **Sécurité** | À renforcer | Pas de vérification explicite "utilisateur ne peut modifier que son propre profil" (à imposer côté service/controller pour `update` et changement mot de passe). |
| **Documents** | OK | Upload avec `userId` ; téléchargement par ID ; pas d’endpoint "documents par utilisateur connecté" (ex. GET /documents/me/cv). |

**Fichiers concernés :** `User.kt`, `UserController.kt`, `UserService.kt`, `UserResponse.kt`, `UserUpdateRequest.kt`, `DocumentController.kt`, `DocumentService.kt`, `DocumentRepository.kt`, `TypeDocument` (enum).

---

## 2. Écarts à combler

### 2.1 Données et API

1. **Photo de profil**  
   - Backend : endpoint d’upload (ex. `POST /users/me/photo`) + stockage fichier + mise à jour `User.photo` ; optionnellement endpoint de lecture (ex. `GET /users/me/photo`) ou exposition des fichiers uploadés via un chemin dédié.  
   - Frontend : afficher la photo (ou initiales), permettre l’upload depuis la page profil.

2. **Année de début MIKA**  
   - Backend : déjà présent (`dateEmbauche`).  
   - Frontend : afficher en "Année de début" (ou date complète) dans l’en-tête / bloc identité et dans le formulaire d’édition.

3. **Fiche de mission**  
   - Backend : ajouter un champ texte (ex. `ficheMission: String?` sur User, type TEXT) ; l’exposer dans UserResponse et UserUpdateRequest.  
   - Frontend : une section "Fiche de mission" avec zone de texte (ou rich text) et enregistrement via l’API profil.

4. **CV**  
   - Backend : endpoint GET "mes CV" (ex. `GET /documents/me/cv`) retournant la liste des documents de type CV de l’utilisateur connecté ; réutiliser `findByUploadeParIdAndTypeDocumentIn`. Endpoint de téléchargement existant ; ajouter si besoin un endpoint "preview" (même fichier, Content-Disposition: inline) pour consultation dans le navigateur.  
   - Frontend : ajouter `CV` au type `TypeDocument` ; appel API pour lister les CV de l’utilisateur ; zone "Mon CV" avec upload (typeDocument=CV, userId=me), liste des CV, boutons "Télécharger" et "Consulter" (ouverture dans un nouvel onglet pour PDF).

5. **Sécurité**  
   - Backend : s’assurer que l’utilisateur ne peut mettre à jour que son propre profil (id = utilisateur connecté) et changer que son propre mot de passe ; idem pour photo et liste CV "me".

### 2.2 UX / UI

1. **Structure de la page**  
   - En-tête profil : photo (ou initiales), nom, rôle(s), matricule, année de début MIKA.  
   - Sections en cartes : Identité / Coordonnées, Fiche de mission, CV, Mot de passe (optionnel).

2. **Photo**  
   - Grande photo ou avatar en haut ; au survol ou bouton "Modifier la photo" pour upload ; placeholder propre si pas de photo (initiales + fond neutre).

3. **Fiche de mission**  
   - Titre de section + texte libre (ou rich text) avec sauvegarde explicite (bouton "Enregistrer la fiche de mission" ou enregistrement avec le bloc identité selon le choix produit).

4. **CV**  
   - Titre "Mon CV" ; zone d’upload (fichier PDF recommandé) ; liste des CV avec nom, date, "Télécharger", "Consulter" (ouvrir en nouvel onglet pour affichage PDF).

5. **Cohérence**  
   - Réutiliser les composants existants (Card, Button, Input), la charte (couleurs, espacements) et les patterns du reste de l’app (sidebar, header).

---

## 3. Recommandations techniques

### 3.1 Backend

- **User** : ajouter `ficheMission: String?` (TEXT), mapper en lecture/écriture dans UserResponse / UserUpdateRequest.  
- **Photo** :  
  - `POST /users/me/photo` (MultipartFile) : enregistrer le fichier dans un répertoire dédié (ex. `uploads/profil/`), mettre à jour `User.photo` avec un chemin relatif ou une URL servie par l’API.  
  - Servir la photo : soit via un endpoint `GET /users/me/photo` (ou `/users/{id}/photo` pour affichage par d’autres), soit via un mapping de ressources statiques (ex. `/api/uploads/**`).  
- **Documents** :  
  - `GET /documents/me/cv` : retourner la liste des documents de type CV pour l’utilisateur connecté (id récupéré du contexte sécurité).  
  - Optionnel : `GET /documents/{id}/preview` avec `Content-Disposition: inline` pour affichage PDF dans le navigateur.  
- **Sécurité** : dans UserService (ou controller), pour `update(id, ...)`, `changePassword(id, ...)` et upload photo, vérifier `id == currentUserId` (ou n’accepter que "me" en endpoint).

### 3.2 Frontend

- **Types** :  
  - User : ajouter `ficheMission?: string`.  
  - Document : ajouter `CV` (et si besoin `FICHE_MISSION`) à l’enum TypeDocument.  
- **API** :  
  - userApi : `uploadPhoto(file)`, éventuellement `getPhotoUrl(user)` si l’URL est construite côté client.  
  - documentApi : `getMyCv()` appelant GET /documents/me/cv.  
- **Page Profil** :  
  - Composants modulaires : en-tête (photo, nom, rôle, matricule, année), formulaire identité/coordonnées (ex. ProfileForm étendu), bloc Fiche de mission, bloc CV (upload + liste + télécharger/consulter), bloc Mot de passe (optionnel).  
- **Stockage / état** : garder le chargement du profil via `fetchCurrentUser` ; après upload photo ou mise à jour profil, rafraîchir `currentUser` pour mettre à jour l’affichage.

### 3.3 Sécurité et bonnes pratiques

- Ne jamais exposer de champs sensibles (mot de passe, tokens) dans les réponses profil.  
- Valider les types de fichiers (photo : images ; CV : PDF ou types autorisés) et limiter la taille.  
- Utiliser les rôles/permissions existants si un admin doit pouvoir voir/éditer le profil d’un autre ; sinon restreindre strictement à "soi-même" pour édition.

---

## 4. Plan d’implémentation

| Phase | Backend | Frontend |
|-------|---------|----------|
| **1. Données & API** | Ajout `ficheMission` (User, DTOs). Endpoint GET /documents/me/cv. Endpoints POST /users/me/photo et GET /users/me/photo (ou équivalent). Vérification "self" pour update/password/photo. | Types User (ficheMission), TypeDocument (CV). userApi.uploadPhoto, documentApi.getMyCv. |
| **2. Page Profil** | - | Structure : en-tête (photo, nom, rôle, matricule, année). Cartes : Identité, Fiche de mission, CV (upload + liste + télécharger/consulter). Optionnel : mot de passe. |
| **3. Finition** | Optionnel : preview document (inline). Validation type/taille fichier. | Messages de succès/erreur, états de chargement, accessibilité (labels, focus). |

---

## 5. Synthèse

La section Profil actuelle est limitée à un formulaire d’informations personnelles. Pour atteindre le niveau d’une plateforme professionnelle, il faut :

- **Backend** : champ fiche de mission sur User, endpoints "mes CV" et photo de profil (upload + lecture), et renforcement des règles d’accès (un utilisateur ne modifie que son propre profil / photo / mot de passe).  
- **Frontend** : page structurée avec en-tête (photo, nom, rôle, matricule, année de début), sections dédiées (identité, fiche de mission, CV avec upload et consultation), et optionnellement changement de mot de passe.

Cette approche reste alignée avec l’architecture existante (entités User et Document, APIs REST, React + Redux) et avec les attentes UX/UI et sécurité listées ci-dessus.
