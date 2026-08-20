package com.mikaservices.platform.modules.materiel.event

import com.mikaservices.platform.common.enums.TypeNotification
import com.mikaservices.platform.modules.communication.service.NotificationService
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class IncidentNotificationListener(
    private val notificationService: NotificationService,
    private val userRepository: UserRepository,
) {
    private val log = LoggerFactory.getLogger(IncidentNotificationListener::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onIncidentNotification(event: IncidentNotificationEvent) {
        try {
            dispatch(event)
        } catch (e: Exception) {
            log.warn("Échec notification Incident (id={}): {}", event.incidentId, e.message)
        }
    }

    private fun dispatch(e: IncidentNotificationEvent) {
        val lien = "/materiel/engins/${e.enginId}"
        val titre = "Incident ${e.gravite} — ${e.enginCode} ${e.enginNom}"
        val contenu = buildString {
            append(e.typeIncident)
            if (!e.description.isNullOrBlank()) append(" : ${e.description}")
            if (e.projetNom != null) append(" (chantier ${e.projetNom})")
        }

        val notifies = mutableSetOf<Long>()
        // Responsable du projet où l'engin est affecté
        e.projetResponsableId?.let { notifies.add(it) }
        // Équipe logistique (gestion du parc)
        userRepository.findByRoleCode("LOGISTIQUE").mapNotNullTo(notifies) { it.id }

        notifies.forEach { uid ->
            notificationService.envoyerNotification(uid, titre, contenu, TypeNotification.INCIDENT, lien)
        }
    }
}
