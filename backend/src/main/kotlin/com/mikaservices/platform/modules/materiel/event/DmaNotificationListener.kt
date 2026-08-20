package com.mikaservices.platform.modules.materiel.event

import com.mikaservices.platform.common.enums.TypeNotification
import com.mikaservices.platform.modules.communication.service.NotificationService
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class DmaNotificationListener(
    private val notificationService: NotificationService,
    private val userRepository: UserRepository,
) {
    private val log = LoggerFactory.getLogger(DmaNotificationListener::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onDmaNotification(event: DmaNotificationEvent) {
        try {
            dispatch(event)
        } catch (e: Exception) {
            log.warn("Échec notification DMA {} ({}): {}", event.kind, event.reference, e.message)
        }
    }

    private fun dispatch(e: DmaNotificationEvent) {
        val lien = "/materiel/dma/${e.dmaId}"
        when (e.kind) {
            DmaNotificationKind.SOUMISE -> {
                // Circuit à une porte : la logistique arbitre ; les chefs de projet affectés
                // sont informés immédiatement (garde-fou informel — pas de veto formel,
                // mais jamais de perte d'information).
                val titre = "Nouvelle DMA ${e.reference}"
                val contenuLogistique = "Projet : ${e.projetNom}. En attente logistique."
                val notifies = mutableSetOf<Long>()
                userRepository.findByRoleCode("LOGISTIQUE").forEach { u ->
                    if (notifies.add(u.id!!)) {
                        notificationService.envoyerNotification(
                            u.id!!, titre, contenuLogistique, TypeNotification.DMA_SOUMISE, lien,
                        )
                    }
                }
                val contenuChef = "Demande émise sur votre projet ${e.projetNom}. " +
                    "Vous pouvez demander le rejet à la logistique avant engagement."
                e.chefsProjetAffectesIds.forEach { cid ->
                    if (cid != e.createurId && notifies.add(cid)) {
                        notificationService.envoyerNotification(
                            cid, titre, contenuChef, TypeNotification.DMA_SOUMISE, lien,
                        )
                    }
                }
            }
            DmaNotificationKind.PRISE_EN_CHARGE -> {
                val titre = "DMA ${e.reference} prise en charge"
                val contenu = "La logistique traite votre demande (${e.projetNom})."
                notifyDistinct(e.createurId, e.responsableProjetId, titre, contenu, TypeNotification.DMA_PRISE_EN_CHARGE, lien)
            }
            DmaNotificationKind.COMPLEMENT_REQUIS -> {
                notificationService.envoyerNotification(
                    e.createurId,
                    "Complément requis — DMA ${e.reference}",
                    "La logistique demande des précisions pour ${e.projetNom}.",
                    TypeNotification.DMA_COMPLEMENT_REQUIS,
                    lien,
                )
            }
            DmaNotificationKind.COMMANDEE -> {
                notificationService.envoyerNotification(
                    e.createurId,
                    "DMA ${e.reference} en commande",
                    "Votre demande pour ${e.projetNom} a été passée en commande.",
                    TypeNotification.DMA_COMMANDEE,
                    lien,
                )
            }
            DmaNotificationKind.LIVREE -> {
                val titre = "Livraison enregistrée — DMA ${e.reference}"
                val contenu = "Mise à jour pour le projet ${e.projetNom}."
                notifyDistinct(e.createurId, e.responsableProjetId, titre, contenu, TypeNotification.DMA_LIVREE, lien)
                userRepository.findByRoleCode("LOGISTIQUE").forEach { u ->
                    if (u.id != e.createurId && u.id != e.responsableProjetId) {
                        notificationService.envoyerNotification(
                            u.id!!, titre, contenu, TypeNotification.DMA_LIVREE, lien,
                        )
                    }
                }
            }
            DmaNotificationKind.REJETEE -> {
                notificationService.envoyerNotification(
                    e.createurId,
                    "DMA ${e.reference} rejetée",
                    "Votre demande sur ${e.projetNom} a été rejetée. Consultez l'historique.",
                    TypeNotification.DMA_REJETEE,
                    lien,
                )
            }
        }
    }

    private fun notifyDistinct(
        a: Long,
        b: Long?,
        titre: String,
        contenu: String?,
        type: TypeNotification,
        lien: String,
    ) {
        notificationService.envoyerNotification(a, titre, contenu, type, lien)
        if (b != null && b != a) {
            notificationService.envoyerNotification(b, titre, contenu, type, lien)
        }
    }
}
