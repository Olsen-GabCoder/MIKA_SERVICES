# Guide de test — Notifications par e-mail et préférences

Comment vérifier, avant d’avancer, tout ce qui a été mis en place (préférences, e-mails transactionnels, notifications in-app → e-mail, messagerie → e-mail).

---

## 1. Prérequis

### 1.1 Base de données

Les colonnes **`email_notifications_enabled`** et **`alert_new_login_enabled`** doivent exister sur la table **`users`**.

- Si vous utilisez **JPA avec `ddl-auto=update`** : redémarrer le backend une fois ; les colonnes sont créées automatiquement (valeurs par défaut `true`).
- Sinon, exécuter une migration, par exemple :

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS alert_new_login_enabled BOOLEAN NOT NULL DEFAULT true;
```

### 1.2 SMTP (pour recevoir vraiment les e-mails)

Pour voir les e-mails envoyés, trois options :

| Option | Usage |
|--------|--------|
| **Variables d’environnement** | Renseigner `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `FRONTEND_BASE_URL` (et éventuellement `MAIL_NOTIFY_ON_LOGIN=true`) dans un fichier `.env` à la racine du projet ou dans `backend/.env`. |
| **MailHog / Mailpit** | Serveur SMTP local qui capture les e-mails et les affiche dans une interface web (ex. http://localhost:8025). Très pratique en dev. |
| **Mailtrap / SendGrid (sandbox)** | Compte de test : les e-mails n’atteignent pas de vraies boîtes mais sont visibles dans le dashboard. |

Sans SMTP configuré, le backend loggue les échecs d’envoi ; les actions métier (création compte, reset MDP, notification, message) réussissent quand même.

---

## 2. Démarrer l’application

1. **Backend** : depuis la racine du projet ou `backend/` :
   ```bash
   ./mvnw spring-boot:run
   ```
   Vérifier dans les logs que le diagnostic mail indique si SMTP est configuré ou non.

2. **Frontend** : depuis `frontend_web/mika-services-frontend/` :
   ```bash
   npm run dev
   ```
   Ouvrir l’URL indiquée (ex. http://localhost:5173).

3. Se connecter avec un compte existant (ex. admin).

---

## 3. Tester les préférences (Paramètres)

### 3.1 Lecture des préférences

1. Aller dans **Paramètres** (menu ou route dédiée).
2. Section **Notifications** :
   - **« Notifications par e-mail »** et **« Alerte nouvelle connexion »** doivent refléter les valeurs du compte (par défaut : activés).
3. Vérifier en parallèle l’API : `GET /api/users/me` (avec le token) doit renvoyer `emailNotificationsEnabled` et `alertNewLoginEnabled` (true/false).

### 3.2 Modification des préférences

1. Désactiver **« Notifications par e-mail »** → sauvegarde automatique (spinner puis mise à jour).
2. Rafraîchir la page : les switches doivent rester dans l’état enregistré.
3. Réactiver **« Notifications par e-mail »**.
4. Désactiver **« Alerte nouvelle connexion »** → sauvegarde.
5. Vérifier en API : `PATCH /api/users/me/preferences/notifications` avec par exemple :
   ```json
   { "emailNotificationsEnabled": false, "alertNewLoginEnabled": false }
   ```
   Puis `GET /api/users/me` : les champs doivent correspondre.

---

## 4. Tester les e-mails transactionnels (avec préférences)

### 4.1 E-mail « Nouvelle connexion » (alerte connexion)

- **Préférence** : « Alerte nouvelle connexion » = activée pour l’utilisateur.
- **Config** : `MAIL_NOTIFY_ON_LOGIN=true` (défaut).
- **Action** : se déconnecter, puis se reconnecter (ou ouvrir une session sur un autre navigateur).
- **Résultat attendu** : un e-mail « MIKA Services — Nouvelle connexion détectée » (IP, navigateur).
- **Contrôle préférence** : désactiver « Alerte nouvelle connexion » pour ce compte, se reconnecter → aucun e-mail « nouvelle connexion » ne doit partir.

### 4.2 E-mail « Mot de passe modifié »

- **Préférence** : « Notifications par e-mail » = activée.
- **Action** : Profil (ou Paramètres) → Changer le mot de passe (ancien + nouveau).
- **Résultat attendu** : e-mail « Votre mot de passe a été modifié ».
- **Contrôle préférence** : désactiver « Notifications par e-mail », changer à nouveau le mot de passe → pas d’e-mail.

### 4.3 E-mail « 2FA activée » / « 2FA désactivée »

- **Préférence** : « Notifications par e-mail » = activée.
- **Action** : Profil → Activer la 2FA (compléter le flux avec un code TOTP) → e-mail « 2FA activée ».
- Puis désactiver la 2FA (mot de passe) → e-mail « 2FA désactivée ».
- Désactiver « Notifications par e-mail » et refaire une activation/désactivation 2FA → pas d’e-mail.

### 4.4 E-mails toujours envoyés (sans préférence)

- **Bienvenue** : créer un nouvel utilisateur (admin) → l’utilisateur doit recevoir l’e-mail avec identifiants + rappel changement MDP + recommandation 2FA. Pas de préférence à vérifier.
- **Reset mot de passe** : depuis la page « Mot de passe oublié », saisir l’e-mail d’un compte actif → e-mail avec lien de réinitialisation. Après clic et nouveau mot de passe → e-mail « Mot de passe modifié » (celui-ci respecte `emailNotificationsEnabled`).

---

## 5. Tester notification in-app → e-mail

### 5.1 Préparation

- Utilisateur **A** : connecté, préférence **« Notifications par e-mail »** = activée.
- Utilisateur **B** (ou Postman/curl) : pour appeler l’API de création de notification en tant que A ou vers A.

### 5.2 Création d’une notification (API)

Appel **authentifié** (token d’un compte autorisé) :

```http
POST /api/notifications
Content-Type: application/json

{
  "destinataireId": <ID_UTILISATEUR_A>,
  "titre": "Test notification",
  "contenu": "Ceci est un test d'envoi par e-mail.",
  "typeNotification": "INFO",
  "lien": "http://localhost:5173/notifications"
}
```

- **Résultat attendu** :  
  - Notification visible dans l’app (centre de notifications / page Notifications) pour l’utilisateur A.  
  - E-mail reçu par A avec objet du type « MIKA Services — Notification : Test notification » et lien (ou lien par défaut vers `/notifications`).

### 5.3 Contrôle préférence

- Désactiver « Notifications par e-mail » pour l’utilisateur A.
- Renvoyer une notification vers A (même appel).
- **Résultat attendu** : notification in-app toujours créée, **aucun e-mail** envoyé.

---

## 6. Tester messagerie interne → e-mail

### 6.1 Préparation

- Utilisateur **A** : destinataire, « Notifications par e-mail » = activée.
- Utilisateur **B** : connecté, envoie un message à A depuis la page **Messagerie**.

### 6.2 Envoi d’un message

1. Se connecter en tant que B.
2. Aller dans **Messagerie** → Nouveau message → choisir A, sujet (optionnel), contenu.
3. Envoyer.

- **Résultat attendu** :  
  - Message visible dans la messagerie pour A (et B).  
  - E-mail reçu par A : « MIKA Services — Nouveau message : [sujet] » avec lien vers `/messagerie`.

### 6.3 Contrôle préférence

- Désactiver « Notifications par e-mail » pour A.
- B envoie un nouveau message à A.
- **Résultat attendu** : message enregistré, **aucun e-mail** pour A.

---

## 7. Récapitulatif des points à valider

| Test | Ce qu’on vérifie |
|------|-------------------|
| Paramètres > Notifications | Lecture/écriture des deux switches, persistance (GET/PATCH /users/me, rechargement page). |
| Alerte nouvelle connexion | E-mail à la connexion si préférence + config activées ; pas d’e-mail si préférence désactivée. |
| Mot de passe modifié / 2FA | E-mails envoyés si « Notifications par e-mail » activé ; pas d’e-mail si désactivé. |
| Bienvenue / Reset MDP | Toujours envoyés (bienvenue à la création, lien reset à la demande). |
| Notification in-app | Création + e-mail au destinataire si préférence activée ; pas d’e-mail si désactivée. |
| Nouveau message | Envoi message + e-mail au destinataire si préférence activée ; pas d’e-mail si désactivée. |
| Digest quotidien / hebdo | Activer « Résumé quotidien » ou « Résumé hebdomadaire » et choisir l’heure dans Paramètres. À l’heure dite (fuseau serveur), e-mail avec nombre de notifications et messages non lus. Hebdo = samedi. |

---

## 8. Tester les digest (résumés)

1. **Paramètres** : activer « Résumé quotidien » et/ou « Résumé hebdomadaire », choisir une heure (ex. 18:00) et sauvegarder.
2. **Envoi** : le job tourne toutes les heures (cron `0 0 * * * ?`). Pour tester sans attendre, mettre l’heure à la prochaine heure (ex. si il est 14h23, mettre 15:00) et attendre 15h00, ou lancer manuellement le scheduler en dev.
3. **Contenu** : l’e-mail « Résumé du jour » ou « Résumé de la semaine » indique le nombre de notifications non lues et de messages non lus, avec liens vers l’app.
4. **Condition** : seuls les utilisateurs avec « Notifications par e-mail » activé reçoivent un digest.

---

## 9. En cas de problème

- **Pas d’e-mail du tout** : vérifier les logs backend (erreurs SMTP, timeout). Vérifier `.env` / variables d’environnement (MAIL_*, FRONTEND_BASE_URL). Tester avec MailHog/Mailtrap pour isoler le réseau.
- **Préférences non prises en compte** : vérifier que les colonnes existent en base et que `GET /api/users/me` renvoie bien `emailNotificationsEnabled` et `alertNewLoginEnabled`. Vérifier que le frontend envoie bien `PATCH /api/users/me/preferences/notifications` et met à jour le store (auth.user).
- **Erreur 500 sur création notification / message** : regarder la stack trace (injection EmailService, type String? pour sujet, etc.).

Une fois ces tests passés, vous pouvez avancer sereinement (par exemple vers digest / rappels ou autres évolutions).
