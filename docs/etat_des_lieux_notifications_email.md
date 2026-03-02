# État des lieux — Notifications par e-mail

Document d’analyse exhaustive des fonctionnalités et cas d’usage liés aux notifications par e-mail dans le projet MIKA Services (backend + frontend). Objectif : distinguer ce qui est implémenté de ce qui ne l’est pas, et repérer les lacunes ou incohérences.

---

## 1. Synthèse exécutive

| Catégorie | Implémenté | Non implémenté / partiel |
|-----------|------------|---------------------------|
| **E-mails transactionnels (auth / compte)** | 6 types d’e-mails (bienvenue, reset MDP, connexion, MDP modifié, 2FA activée/désactivée) | — |
| **Préférence utilisateur « notifications par e-mail »** | Non | Aucune préférence par utilisateur ; comportement piloté uniquement par config globale (`MAIL_NOTIFY_ON_LOGIN`) |
| **Préférence « alerte nouvelle connexion »** | Partiel | Config globale côté backend ; pas de choix utilisateur dans Paramètres |
| **Notifications in-app → e-mail** | Non | Les notifications in-app (module communication) ne déclenchent aucun envoi d’e-mail |
| **Digest / rappels par e-mail** | Non | Aucun digest quotidien/hebdo, aucun rappel tâches/réunions par e-mail |
| **Frontend Paramètres > Notifications** | UI seule | Tous les réglages (e-mail, in-app, son, digest, alerte connexion) sont en « Bientôt » ou switches désactivés, sans lien avec le backend |

---

## 2. Backend — Ce qui existe

### 2.1 Infrastructure

| Élément | Fichier / ressource | Rôle |
|--------|----------------------|------|
| **Envoi SMTP** | `config/mail/EmailService.kt` | Service unique d’envoi : `JavaMailSender`, `app.mail.from`, `app.mail.frontend-base-url`. Méthode interne `sendGenericNotification(to, subject, body, logLabel)` (UTF-8, log succès/échec). |
| **Configuration SMTP** | `application.yml` + `.env` | `spring.mail.*` (host, port, username, password, auth, starttls). Variables documentées dans `docs/VARIABLES_ENVIRONNEMENT.md` (MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM, FRONTEND_BASE_URL, MAIL_NOTIFY_ON_LOGIN). |
| **Diagnostic au démarrage** | `config/mail/MailConfigDiagnostic.kt` | `ApplicationRunner` qui log si SMTP est configuré (host + username) ou non, pour faciliter le diagnostic des échecs d’envoi. |

Aucune préférence « notifications par e-mail » n’est stockée en base (pas de champ sur l’entité User, pas de table de préférences). Le comportement d’envoi dépend uniquement du code et de la configuration applicative.

### 2.2 E-mails implémentés et déclencheurs

Tous les e-mails sont envoyés **côté backend** via `EmailService`. Les échecs sont loggés ; l’envoi n’est pas bloquant pour la réponse HTTP (sauf pour le mail de bienvenue qui peut être relancé en async en cas d’échec synchrone).

#### 1. E-mail de bienvenue (nouvel utilisateur)

| Attribut | Détail |
|----------|--------|
| **Méthode** | `EmailService.sendWelcomeEmail(to, prenom, temporaryPassword)` |
| **Déclencheur** | `UserService.create(UserCreateRequest)` : après création du compte, mot de passe généré (ou fourni), envoi synchrone ; en cas d’échec, relance asynchrone `sendWelcomeEmailAsync`. |
| **Contenu** | Lien de connexion (frontend), email du compte, mot de passe temporaire, invitation à le modifier à la première connexion. |
| **Condition** | Toujours envoyé si SMTP configuré (pas de préférence utilisateur ; l’utilisateur n’existe pas encore au moment de l’envoi). |
| **Réponse API** | `UserResponse.welcomeEmailSent` indique si l’envoi synchrone a réussi (utilisé par le frontend pour afficher un message type « email de bienvenue non envoyé »). |

#### 2. E-mail de réinitialisation du mot de passe (lien « Mot de passe oublié »)

| Attribut | Détail |
|----------|--------|
| **Méthode** | `EmailService.sendPasswordResetEmail(to, prenom, token)` |
| **Déclencheur** | `AuthService.forgotPassword(ForgotPasswordRequest)` : après validation de l’email (compte existant et actif), création d’un token (1 h), envoi du lien `{frontendBaseUrl}/reset-password?token=...`. |
| **Condition** | Envoyé uniquement si l’email correspond à un utilisateur actif (sinon réponse HTTP identique, sans révéler l’existence du compte). |
| **Logique métier** | Ne révèle jamais si l’email existe ou non (protection contre l’énumération). |

#### 3. Notification « Nouvelle connexion »

| Attribut | Détail |
|----------|--------|
| **Méthode** | `EmailService.sendLoginNotification(to, prenom, ip, userAgent)` |
| **Déclencheur** | `AuthService.login()` après création de session (sans 2FA) ; `AuthService.verify2FA()` après validation du code 2FA et création de session. |
| **Contenu** | IP, extrait User-Agent (200 car.), message de sécurité. |
| **Condition** | **Uniquement si** `app.mail.notify-on-login` est `true` (config : `MAIL_NOTIFY_ON_LOGIN`, défaut `true` dans `application.yml`). Aucune préférence par utilisateur. |

#### 4. Notification « Mot de passe modifié »

| Attribut | Détail |
|----------|--------|
| **Méthode** | `EmailService.sendPasswordChangedNotification(to, prenom)` |
| **Déclencheurs** | (1) `AuthService.resetPassword(ResetPasswordRequest)` après réinitialisation via token ; (2) `UserService.changeMyPassword(ChangePasswordRequest)` (utilisateur connecté) ; (3) `UserService.changePassword(id, ...)` (admin change le MDP d’un utilisateur) ; (4) `UserService.adminResetPassword(id, ...)` (admin réinitialise le MDP). |
| **Condition** | Toujours tenté après chaque succès de l’action (pas de préférence utilisateur). |

#### 5. Notification « 2FA activée »

| Attribut | Détail |
|----------|--------|
| **Méthode** | `EmailService.send2FAEnabledNotification(to, prenom)` |
| **Déclencheur** | `AuthService.verifySetup2FA(Verify2FASetupRequest)` après validation du code TOTP et activation de la 2FA. |
| **Condition** | Toujours tenté (pas de préférence). |

#### 6. Notification « 2FA désactivée »

| Attribut | Détail |
|----------|--------|
| **Méthode** | `EmailService.send2FADisabledNotification(to, prenom)` |
| **Déclencheurs** | (1) `AuthService.disable2FA(Disable2FARequest)` (utilisateur désactive sa 2FA) ; (2) `UserService.adminDisable2FA(id)` (admin désactive la 2FA d’un utilisateur). |
| **Condition** | Toujours tenté (pas de préférence). |

### 2.3 Récapitulatif des appels à EmailService

| Service | Méthode | Appel email |
|---------|---------|-------------|
| **AuthService** | `login` | `sendLoginNotification` (si `notifyOnLogin`) |
| **AuthService** | `verify2FA` | `sendLoginNotification` (si `notifyOnLogin`) |
| **AuthService** | `verifySetup2FA` | `send2FAEnabledNotification` |
| **AuthService** | `disable2FA` | `send2FADisabledNotification` |
| **AuthService** | `forgotPassword` | `sendPasswordResetEmail` |
| **AuthService** | `resetPassword` | `sendPasswordChangedNotification` |
| **UserService** | `create` | `sendWelcomeEmail` (+ `sendWelcomeEmailAsync` en retry) |
| **UserService** | `changeMyPassword` | `sendPasswordChangedNotification` |
| **UserService** | `changePassword` (admin) | `sendPasswordChangedNotification` |
| **UserService** | `adminResetPassword` | `sendPasswordChangedNotification` |
| **UserService** | `adminDisable2FA` | `send2FADisabledNotification` |

Aucun autre module (projet, réunion, qualité, sécurité, document, planning, budget, etc.) n’injecte ni n’utilise `EmailService`.

### 2.4 Notifications in-app (module communication)

| Élément | Fichier | Comportement |
|---------|---------|--------------|
| **Création** | `NotificationService.creerNotification(NotificationCreateRequest)` | Persiste en base, envoie un message WebSocket vers `/queue/notifications` pour le destinataire. **Aucun envoi d’e-mail.** |
| **Utilitaire** | `NotificationService.envoyerNotification(destinataireId, titre, contenu, type, lien)` | Crée une notification in-app (idem ci-dessus). **Aucun e-mail.** |
| **Utilisation** | Aucune référence à `NotificationService` ou `envoyerNotification` en dehors de `NotificationController` | Les notifications in-app sont créées soit via l’API REST (controller), soit potentiellement par d’autres services à l’avenir ; actuellement **aucun autre module n’appelle** `envoyerNotification`. Donc aucun flux métier (projet, tâche, incident, message, etc.) ne crée de notification in-app ni d’e-mail. |

Les types définis (`TypeNotification` : INFO, ALERTE, TACHE_ASSIGNEE, INCIDENT, NON_CONFORMITE, ECHEANCE, STOCK_BAS, MESSAGE, SYSTEME) ne sont pas encore branchés à des événements métier côté backend (pas d’envoi automatique sur création de message, incident, tâche assignée, etc.).

### 2.5 Messages (messagerie interne)

`MessageService.envoyerMessage` : enregistre le message en base et envoie un message WebSocket vers `/queue/messages`. **Aucun e-mail** n’est envoyé au destinataire (pas d’intégration avec `EmailService`).

---

## 3. Frontend — Ce qui existe

### 3.1 Paramètres > Notifications (ParametresPage)

| Ligne | Libellé (i18n) | Composant | État |
|-------|----------------|-----------|------|
| Notifications par e-mail | `notifications.emailEnabled` | `SettingSwitch` checked={false} disabled | **Non branché** : pas d’état, pas d’API, pas de préférence backend. |
| Notifications in-app | `notifications.inAppEnabled` | `SettingSwitch` checked disabled | **Non branché**. |
| Son des notifications | `notifications.soundEnabled` | `SettingSwitch` checked={false} disabled | **Non branché**. |
| Fréquence rappels, rappels tâches/réunions, événements projets/réunions/messages/documents | Plusieurs clés | `SoonBadge` | **Non implémenté**. |
| Digest quotidien / hebdo | `dailyDigest`, `weeklyDigest` | `SettingSwitch` checked={false} disabled | **Non branché**. |
| Heure digest, Ne pas déranger, Types de notifications | — | `SoonBadge` | **Non implémenté**. |
| Alerte nouvelle connexion | `notifications.alertNewLogin` | `SettingSwitch` checked disabled | **Sémantiquement proche** de `MAIL_NOTIFY_ON_LOGIN` côté backend, mais **aucune liaison** : le backend ne lit aucune préférence utilisateur ; le frontend n’envoie aucune préférence. |

Aucune préférence de la section Notifications n’est donc persistée ni lue (ni en frontend ni en backend). L’UI est une maquette.

### 3.2 Sécurité > Alerte nouvelle connexion

Dans la section Sécurité des paramètres, une ligne « Alerte nouvelle connexion » avec le même type de switch (désactivé) existe aussi ; même constat : pas de lien avec le backend.

### 3.3 Affichage des e-mails non envoyés (côté utilisateur)

- Création d’utilisateur : le frontend affiche un message si `welcomeEmailSent === false` (texte du type « Utilisateur créé mais email de bienvenue non envoyé… »), en s’appuyant sur la réponse de l’API. C’est cohérent avec le backend.

### 3.4 Flux qui déclenchent des e-mails (côté backend, sans réglage frontend)

- **Mot de passe oublié** : formulaire → `POST /auth/forgot-password` → backend envoie l’e-mail de reset si le compte existe et est actif. Pas de réglage « notifications par e-mail ».
- **Réinitialisation mot de passe** (lien reçu par e-mail) : `POST /auth/reset-password` → backend envoie « Mot de passe modifié ».
- **Connexion** : selon `MAIL_NOTIFY_ON_LOGIN`, le backend envoie « Nouvelle connexion » ; l’utilisateur ne peut pas activer/désactiver cela dans l’app.
- **Profil** : changement de mot de passe, activation/désactivation 2FA → e-mails « Mot de passe modifié » et « 2FA activée/désactivée » sans possibilité de désactivation par l’utilisateur.

---

## 4. Lacunes et incohérences

### 4.1 Préférence utilisateur « notifications par e-mail »

- **Lacune** : Aucune préférence par utilisateur (ni en base ni en API). Tous les e-mails transactionnels (sauf « nouvelle connexion ») sont envoyés systématiquement ; « nouvelle connexion » dépend uniquement de `MAIL_NOTIFY_ON_LOGIN` (global).
- **Incohérence** : La page Paramètres propose un switch « Notifications par e-mail » et « Alerte nouvelle connexion » sans qu’ils aient d’effet. L’utilisateur peut s’attendre à pouvoir désactiver les e-mails (au moins certains).

### 4.2 Alerte « nouvelle connexion »

- **Lacune** : Le choix est uniquement global (config déploiement). Un utilisateur ne peut pas décider d’activer ou désactiver l’e-mail de nouvelle connexion pour son compte.
- **Incohérence** : Le libellé « Alerte nouvelle connexion » (Paramètres) correspond exactement à ce que fait `sendLoginNotification`, mais le frontend ne peut pas modifier ce comportement.

### 4.3 Notifications in-app et e-mail

- **Lacune** : Les notifications in-app (création via `NotificationService`) ne déclenchent aucun e-mail. Il n’existe pas de règle du type « si l’utilisateur a activé les notifications par e-mail, envoyer aussi un e-mail pour les alertes / tâches assignées / messages », etc.
- **Lacune** : Aucun autre module n’utilise `NotificationService.envoyerNotification` pour des événements métier (projet, tâche, incident, message, etc.), donc pas de chaîne in-app + e-mail même si on l’ajoutait plus tard.

### 4.4 Digest et rappels

- **Lacune** : Aucun job planifié n’envoie de digest (quotidien/hebdo) ni de rappels par e-mail (tâches, réunions). Les libellés existent en i18n et en UI (Paramètres) mais ne sont pas implémentés.

### 4.5 Messagerie interne

- **Lacune** : L’envoi d’un message interne (MessageService) ne déclenche pas d’e-mail au destinataire. Souhaitable ou non selon la productivité / bruit ; à trancher au niveau produit.

### 4.6 Gestion des erreurs d’envoi

- **Existant** : Les échecs d’envoi sont loggés ; pour le mail de bienvenue, retry asynchrone et indicateur `welcomeEmailSent` dans la réponse.
- **Lacune** : Pour les autres e-mails (reset, login, MDP modifié, 2FA), en cas d’échec SMTP l’action métier est tout de même considérée comme réussie (pas de retry, pas de retour à l’utilisateur). Acceptable pour de la notification, mais à documenter ou à faire évoluer si on veut une politique de retry ou de reporting.

---

## 5. Tableau récapitulatif des cas d’usage

| Cas d’usage | Backend | Frontend (Paramètres / préférence) | Remarque |
|-------------|---------|-------------------------------------|----------|
| E-mail de bienvenue (création compte) | Implémenté | N/A (pas de préférence) | Réponse API `welcomeEmailSent` utilisée pour afficher un message si échec. |
| E-mail reset mot de passe (lien) | Implémenté | N/A | Flux « Mot de passe oublié » fonctionnel. |
| E-mail « Nouvelle connexion » | Implémenté (si `MAIL_NOTIFY_ON_LOGIN`) | UI présente, non branchée | Comportement uniquement global. |
| E-mail « Mot de passe modifié » | Implémenté (toujours) | Aucune préférence | Envoi après reset, change password (self/admin), admin reset. |
| E-mail « 2FA activée / désactivée » | Implémenté (toujours) | Aucune préférence | — |
| Préférence « Notifications par e-mail » (globale par user) | Non | UI en « Bientôt » / disabled | À implémenter (modèle + API + lecture dans les services d’envoi). |
| Préférence « Alerte nouvelle connexion » (par user) | Non | UI présente, non branchée | Pourrait s’appuyer sur une préférence utilisateur en base. |
| Notifications in-app envoyées aussi par e-mail | Non | — | NotificationService n’envoie pas d’e-mail. |
| Digest quotidien / hebdo par e-mail | Non | UI en « Bientôt » | Aucun scheduler ni template. |
| Rappels (tâches, réunions) par e-mail | Non | UI en « Bientôt » | Idem. |
| E-mail à la réception d’un message interne | Non | — | MessageService sans EmailService. |

---

## 6. Recommandations pour la suite

1. **Préférences utilisateur** — **IMPLÉMENTÉ**  
   - Champs sur `User` : `emailNotificationsEnabled`, `alertNewLoginEnabled` (défaut `true`).  
   - API : `PATCH /users/me/preferences/notifications` avec body `{ emailNotificationsEnabled?, alertNewLoginEnabled? }` ; `GET /users/me` renvoie ces champs.  
   - `AuthService` : envoi « nouvelle connexion » si `notifyOnLogin && user.alertNewLoginEnabled` ; envoi 2FA / « mot de passe modifié » (reset) si `user.emailNotificationsEnabled`.  
   - `UserService` : envoi MDP modifié / 2FA désactivée si `user.emailNotificationsEnabled`. E-mails bienvenue et reset MDP toujours envoyés (pas de préférence).

2. **Paramètres > Notifications** — **IMPLÉMENTÉ**  
   - Switch « Notifications par e-mail » et « Alerte nouvelle connexion » branchés sur l’API et le store (auth.user) ; sauvegarde via `PATCH /users/me/preferences/notifications`.

3. **Notifications in-app et e-mail** — **IMPLÉMENTÉ**  
   - **Notification in-app** : lorsqu'une notification est créée (`NotificationService.creerNotification`), si le destinataire a `emailNotificationsEnabled`, un e-mail est envoyé (sujet « Notification : {titre} », contenu + lien). Méthode `EmailService.sendInAppNotificationEmail`.  
   - **Nouveau message** : lorsqu'un message est envoyé (`MessageService.envoyerMessage`), si le destinataire a `emailNotificationsEnabled`, un e-mail « Nouveau message : {sujet} » avec lien vers `/messagerie`. Méthode `EmailService.sendNewMessageEmail`. Échecs d'envoi loggés en warn, sans faire échouer la création.  
   - *(Ancien libellé : Décider quels types d’événements (nouvelle notification in-app, nouveau message, etc.) doivent pouvoir déclencher un e-mail selon la préférence utilisateur.  
   - Si oui : dans `NotificationService` (et éventuellement `MessageService`), après création de la notification/message, vérifier la préférence du destinataire et appeler `EmailService` (ou un service dédié « notification par e-mail ») pour envoyer un résumé ou un lien.

4. **Cohérence config / préférence** — **EN PLACE**  
   - Règle appliquée : si `MAIL_NOTIFY_ON_LOGIN` (global) = false, aucun e-mail « nouvelle connexion » ; si true, envoi uniquement si `user.alertNewLoginEnabled`.

5. **Digest et rappels** — **Digest implémenté**  
   - **Préférences** : `dailyDigestEnabled`, `weeklyDigestEnabled`, `digestTime` (HH:mm, défaut 18:00) sur `User` ; exposées en API via `PATCH /users/me/preferences/notifications` et Paramètres (switches + champ heure).  
   - **Envoi** : `DigestScheduler` (cron `app.scheduler.digest-cron`, défaut toutes les heures) ; `DigestService.processDigests()` envoie à chaque utilisateur actif (avec `emailNotificationsEnabled`) dont l’heure correspond à `digestTime`. Quotidien : chaque jour ; hebdo : le samedi à la même heure.  
   - **Contenu** : nombre de notifications non lues + messages non lus, avec liens vers `/notifications` et `/messagerie`.  
   - **Rappels** (tâches, réunions) : non implémentés ; à traiter en évolution séparée.

---

## 7. Références techniques rapides

- **Backend**  
  - `EmailService` : `config/mail/EmailService.kt`  
  - Config mail : `application.yml` (spring.mail, app.mail), `VARIABLES_ENVIRONNEMENT.md`  
  - Appels : `AuthService`, `UserService` (voir tableau section 2.3)  
  - Notifications in-app : `modules/communication/service/NotificationService.kt` (pas d’e-mail)

- **Frontend**  
  - Paramètres Notifications : `features/user/pages/ParametresPage.tsx` (section « notifications »)  
  - i18n : `locales/{fr,en}/parametres.json` (clés `notifications.*`)  
  - Création utilisateur et message « email non envoyé » : utilisation de `welcomeEmailSent` dans la réponse API

Ce document peut servir de base pour un plan d’action détaillé (stories, tâches backend/frontend) et pour éviter les régressions lors des évolutions sur les notifications par e-mail.
