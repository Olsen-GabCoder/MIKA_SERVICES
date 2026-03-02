package com.mikaservices.platform.modules.user.dto.request

/**
 * Mise à jour des préférences de session de l'utilisateur connecté.
 * defaultSessionDuration : "SHORT" (1 h), "LONG" (5 h), ou null pour utiliser le choix au login (rememberMe).
 * logoutOnBrowserClose : si true, le client stocke le token en sessionStorage (déconnexion à la fermeture de l'onglet).
 */
data class SessionPreferencesUpdateRequest(
    val defaultSessionDuration: String? = null,
    val logoutOnBrowserClose: Boolean? = null
)
