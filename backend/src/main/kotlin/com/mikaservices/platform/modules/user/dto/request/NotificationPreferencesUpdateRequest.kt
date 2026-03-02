package com.mikaservices.platform.modules.user.dto.request

/**
 * Mise à jour des préférences de notification (e-mail) de l'utilisateur connecté.
 * Seuls les champs non null sont appliqués.
 */
data class NotificationPreferencesUpdateRequest(
    val emailNotificationsEnabled: Boolean? = null,
    val alertNewLoginEnabled: Boolean? = null,
    val dailyDigestEnabled: Boolean? = null,
    val weeklyDigestEnabled: Boolean? = null,
    val digestTime: String? = null,
    val inAppNotificationsEnabled: Boolean? = null,
    val notificationSoundEnabled: Boolean? = null
)
