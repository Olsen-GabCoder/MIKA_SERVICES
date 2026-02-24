# Politique de mot de passe – MIKA Services Platform

La même politique s’applique à tous les flux où un mot de passe est défini ou modifié.

## Règles (backend)

- **Longueur minimale** : 8 caractères.
- **Complexité** :
  - Au moins une lettre minuscule (a-z)
  - Au moins une lettre majuscule (A-Z)
  - Au moins un chiffre (0-9)
  - Au moins un caractère spécial (tout caractère qui n’est ni lettre ni chiffre)

Implémentation : `com.mikaservices.platform.common.validation.PasswordPolicy` (regex et message d’erreur).

## Où la politique est appliquée

| Flux | DTO / champ | Validation |
|------|-------------|------------|
| Changement de mot de passe (utilisateur connecté) | `ChangePasswordRequest.newPassword` | Bean Validation `@Pattern(PasswordPolicy.REGEX)` |
| Réinitialisation par lien email (Mot de passe oublié) | `ResetPasswordRequest.newPassword` | Idem |
| Réinitialisation par un administrateur | `AdminResetPasswordRequest.newPassword` | Idem |
| Création d’utilisateur (admin, mot de passe optionnel) | `UserCreateRequest.password` | Idem si fourni (sinon mot de passe généré côté serveur) |

## Message d’erreur (API)

En cas de non-respect : *« Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial »* (ou équivalent selon la langue du message de validation).

## Frontend

Les formulaires (changement de mot de passe, reset password, etc.) doivent afficher les mêmes exigences et, si possible, valider côté client avant envoi (ex. longueur min 8, complexité) pour un retour utilisateur immédiat.
