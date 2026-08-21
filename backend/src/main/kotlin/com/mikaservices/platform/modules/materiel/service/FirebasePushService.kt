package com.mikaservices.platform.modules.materiel.service

import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingException
import com.google.firebase.messaging.Message
import com.google.firebase.messaging.MessagingErrorCode
import com.google.firebase.messaging.Notification
import com.mikaservices.platform.modules.materiel.repository.PushTokenRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class FirebasePushService(
    private val pushTokenRepository: PushTokenRepository,
) {
    private val logger = LoggerFactory.getLogger(FirebasePushService::class.java)

    private fun isFirebaseAvailable(): Boolean =
        FirebaseApp.getApps().isNotEmpty()

    /**
     * Envoie une notification push a tous les appareils actifs d'un utilisateur.
     * Async pour ne pas bloquer le thread HTTP appelant.
     * Si Firebase n'est pas initialise (credentials absents), retourne silencieusement.
     */
    @Async
    fun sendToUser(userId: Long, title: String, body: String, data: Map<String, String> = emptyMap()) {
        if (!isFirebaseAvailable()) return
        val tokens = pushTokenRepository.findByUserIdAndActifTrue(userId)
        if (tokens.isEmpty()) return

        for (pushToken in tokens) {
            try {
                val message = Message.builder()
                    .setToken(pushToken.token)
                    .setNotification(
                        Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build()
                    )
                    .putAllData(data)
                    .build()

                FirebaseMessaging.getInstance().send(message)
                pushToken.lastUsedAt = Instant.now()
                pushTokenRepository.save(pushToken)
            } catch (e: FirebaseMessagingException) {
                if (e.messagingErrorCode == MessagingErrorCode.UNREGISTERED ||
                    e.messagingErrorCode == MessagingErrorCode.INVALID_ARGUMENT
                ) {
                    logger.info("[FCM] Token invalide pour user $userId, desactivation : ${pushToken.token.take(20)}...")
                    pushToken.actif = false
                    pushTokenRepository.save(pushToken)
                } else {
                    logger.warn("[FCM] Erreur envoi push user $userId : ${e.message}")
                }
            } catch (e: Exception) {
                logger.warn("[FCM] Erreur inattendue push user $userId : ${e.message}")
            }
        }
    }

    /**
     * Envoie une notification push a plusieurs utilisateurs.
     */
    @Async
    fun sendToUsers(userIds: List<Long>, title: String, body: String, data: Map<String, String> = emptyMap()) {
        for (userId in userIds) {
            sendToUser(userId, title, body, data)
        }
    }
}
