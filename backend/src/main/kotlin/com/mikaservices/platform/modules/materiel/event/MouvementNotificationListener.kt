package com.mikaservices.platform.modules.materiel.event

import com.mikaservices.platform.common.enums.TypeNotification
import com.mikaservices.platform.modules.communication.service.NotificationService
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class MouvementNotificationListener(
    private val notificationService: NotificationService,
    private val userRepository: UserRepository,
) {
    private val log = LoggerFactory.getLogger(MouvementNotificationListener::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onMouvementNotification(event: MouvementNotificationEvent) {
        try {
            dispatch(event)
        } catch (e: Exception) {
            log.warn("Échec notification Mouvement {} (id={}): {}", event.kind, event.mouvementId, e.message)
        }
    }

    private fun dispatch(e: MouvementNotificationEvent) {
        val lien = "/materiel/mouvements/${e.mouvementId}"
        when (e.kind) {

            // Circuit de validation — demande initiée par un non-logistique → Logistique
            MouvementNotificationKind.DEMANDE_CREEE -> {
                val titre = "Demande de transfert — ${e.enginCode} ${e.enginNom}"
                val contenu = buildString {
                    append("Transfert demandé vers ${e.projetDestinationNom}.")
                    if (e.projetOrigineNom != null) append(" Depuis : ${e.projetOrigineNom}.")
                    append(" En attente de validation logistique.")
                }
                userRepository.findByRoleCode("LOGISTIQUE").forEach { u ->
                    notificationService.envoyerNotification(u.id!!, titre, contenu, TypeNotification.MOUVEMENT_DEMANDE, lien)
                }
            }

            // Validation logistique → initiateur + CP origine
            MouvementNotificationKind.VALIDE -> {
                val titre = "Transfert validé — ${e.enginCode} ${e.enginNom}"
                val contenu = "Le transfert vers ${e.projetDestinationNom} a été validé par la logistique."
                val notifies = mutableSetOf<Long>()
                e.initiateurUserId?.let { notifies.add(it) }
                e.projetOrigineResponsableId?.let { notifies.add(it) }
                notifies.forEach { uid ->
                    notificationService.envoyerNotification(uid, titre, contenu, TypeNotification.MOUVEMENT_VALIDE, lien)
                }
            }

            // Rejet logistique → initiateur
            MouvementNotificationKind.REJETE -> {
                val titre = "Transfert rejeté — ${e.enginCode} ${e.enginNom}"
                val contenu = buildString {
                    append("La demande de transfert vers ${e.projetDestinationNom} a été rejetée.")
                    if (!e.detail.isNullOrBlank()) append(" Motif : ${e.detail}")
                }
                e.initiateurUserId?.let { uid ->
                    notificationService.envoyerNotification(uid, titre, contenu, TypeNotification.MOUVEMENT_REJETE, lien)
                }
            }

            // Réception avec réserves → Logistique + CP destination
            MouvementNotificationKind.RECEPTION_AVEC_RESERVES -> {
                val titre = "Réception avec réserves — ${e.enginCode} ${e.enginNom}"
                val contenu = buildString {
                    append("Engin réceptionné sur ${e.projetDestinationNom} AVEC RÉSERVES. Un incident a été créé.")
                    if (!e.detail.isNullOrBlank()) append(" ${e.detail}")
                }
                val notifies = mutableSetOf<Long>()
                userRepository.findByRoleCode("LOGISTIQUE").mapNotNullTo(notifies) { it.id }
                e.projetDestinationResponsableId?.let { notifies.add(it) }
                notifies.forEach { uid ->
                    notificationService.envoyerNotification(uid, titre, contenu, TypeNotification.MOUVEMENT_RESERVES, lien)
                }
            }

            // Alerte : engin en transit depuis trop longtemps → Logistique
            MouvementNotificationKind.EN_TRANSIT_TROP_LONG -> {
                val titre = "Engin en transit prolongé — ${e.enginCode} ${e.enginNom}"
                val contenu = "L'engin est en transit vers ${e.projetDestinationNom} depuis plus de 3 jours sans réception confirmée."
                userRepository.findByRoleCode("LOGISTIQUE").forEach { u ->
                    notificationService.envoyerNotification(u.id!!, titre, contenu, TypeNotification.ALERTE, lien)
                }
            }

            // Spec §7 — Déclencheur : création de l'ordre → CP + Chef Chantier source
            MouvementNotificationKind.ORDRE_CREE -> {
                val titre = "Ordre de mouvement — ${e.enginCode} ${e.enginNom}"
                val contenu = buildString {
                    append("Déplacement vers : ${e.projetDestinationNom}.")
                    if (e.projetOrigineNom != null) append(" Depuis : ${e.projetOrigineNom}.")
                }
                // CP source
                e.projetOrigineResponsableId?.let { rid ->
                    notificationService.envoyerNotification(rid, titre, contenu, TypeNotification.MOUVEMENT_ORDRE_CREE, lien)
                }
                // Tous les Chefs de Chantier
                userRepository.findByRoleCode("CHEF_CHANTIER").forEach { u ->
                    if (u.id != e.projetOrigineResponsableId) {
                        notificationService.envoyerNotification(u.id!!, titre, contenu, TypeNotification.MOUVEMENT_ORDRE_CREE, lien)
                    }
                }
            }

            // Spec §7 — Déclencheur : confirmation départ → CP + Chef Chantier destination + Logistique
            MouvementNotificationKind.DEPART_CONFIRME -> {
                val titre = "Engin ${e.enginCode} ${e.enginNom} en transit"
                val contenu = "L'engin est en route vers ${e.projetDestinationNom}."
                val notifies = mutableSetOf<Long>()
                // CP destination
                e.projetDestinationResponsableId?.let { rid -> notifies.add(rid) }
                // Chefs de Chantier
                userRepository.findByRoleCode("CHEF_CHANTIER").mapNotNullTo(notifies) { it.id }
                // Logistique
                userRepository.findByRoleCode("LOGISTIQUE").mapNotNullTo(notifies) { it.id }
                notifies.forEach { uid ->
                    notificationService.envoyerNotification(uid, titre, contenu, TypeNotification.MOUVEMENT_DEPART_CONFIRME, lien)
                }
            }

            // Spec §7 — Déclencheur : confirmation réception → Resp. Logistique
            MouvementNotificationKind.RECEPTION_CONFIRMEE -> {
                val titre = "Engin ${e.enginCode} ${e.enginNom} réceptionné"
                val contenu = "Arrivée confirmée sur ${e.projetDestinationNom}."
                userRepository.findByRoleCode("LOGISTIQUE").forEach { u ->
                    notificationService.envoyerNotification(u.id!!, titre, contenu, TypeNotification.MOUVEMENT_RECEPTION_CONFIRMEE, lien)
                }
            }

            // Spec §7 — Déclencheur : annulation → CP source + CP destination
            MouvementNotificationKind.ANNULE -> {
                val titre = "Mouvement annulé — ${e.enginCode} ${e.enginNom}"
                val contenu = buildString {
                    append("L'ordre de déplacement vers ${e.projetDestinationNom} a été annulé.")
                    if (e.projetOrigineNom != null) append(" Chantier source : ${e.projetOrigineNom}.")
                }
                val notifies = mutableSetOf<Long>()
                e.projetOrigineResponsableId?.let { notifies.add(it) }
                e.projetDestinationResponsableId?.let { notifies.add(it) }
                notifies.forEach { uid ->
                    notificationService.envoyerNotification(uid, titre, contenu, TypeNotification.MOUVEMENT_ANNULE, lien)
                }
            }
        }
    }
}
