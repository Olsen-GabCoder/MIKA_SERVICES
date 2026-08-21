package com.mikaservices.platform.modules.materiel.event

import com.mikaservices.platform.modules.materiel.service.FirebasePushService
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

/**
 * Listener FCM push : ecoute les memes evenements que les listeners in-app existants
 * et envoie des push notifications via Firebase Cloud Messaging.
 * Separe des listeners in-app pour eviter toute regression.
 */
@Component
class FcmPushListener(
    private val pushService: FirebasePushService,
    private val userRepository: UserRepository,
) {
    private val log = LoggerFactory.getLogger(FcmPushListener::class.java)

    // ── DMA ──────────────────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onDma(event: DmaNotificationEvent) {
        try {
            dispatchDma(event)
        } catch (e: Exception) {
            log.warn("[FCM] Erreur push DMA {}: {}", event.reference, e.message)
        }
    }

    private fun dispatchDma(e: DmaNotificationEvent) {
        val data = mapOf("type" to "dma", "id" to e.dmaId.toString(), "ref" to e.reference)
        when (e.kind) {
            DmaNotificationKind.SOUMISE -> {
                val title = "Nouvelle DMA ${e.reference}"
                val body = "Projet ${e.projetNom} — en attente logistique."
                userRepository.findByRoleCode("LOGISTIQUE").forEach { u ->
                    pushService.sendToUser(u.id!!, title, body, data)
                }
                e.chefsProjetAffectesIds.filter { it != e.createurId }.forEach { cid ->
                    pushService.sendToUser(cid, title, "Demande \u00e9mise sur ${e.projetNom}.", data)
                }
            }
            DmaNotificationKind.PRISE_EN_CHARGE -> {
                pushDistinct(e.createurId, e.responsableProjetId,
                    "DMA ${e.reference} prise en charge",
                    "La logistique traite votre demande.", data)
            }
            DmaNotificationKind.COMPLEMENT_REQUIS -> {
                pushService.sendToUser(e.createurId,
                    "Compl\u00e9ment demande \u2014 ${e.reference}",
                    "La logistique demande des pr\u00e9cisions.", data)
            }
            DmaNotificationKind.COMMANDEE -> {
                pushService.sendToUser(e.createurId,
                    "DMA ${e.reference} en commande",
                    "Le mat\u00e9riel a \u00e9t\u00e9 command\u00e9.", data)
            }
            DmaNotificationKind.LIVREE -> {
                pushDistinct(e.createurId, e.responsableProjetId,
                    "DMA ${e.reference} livr\u00e9e",
                    "Le mat\u00e9riel est arriv\u00e9 sur ${e.projetNom}.", data)
            }
            DmaNotificationKind.REJETEE -> {
                pushService.sendToUser(e.createurId,
                    "DMA ${e.reference} rejet\u00e9e",
                    "Votre demande a \u00e9t\u00e9 refus\u00e9e par la logistique.", data)
            }
        }
    }

    // ── Transferts ───────────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onMouvement(event: MouvementNotificationEvent) {
        try {
            dispatchMouvement(event)
        } catch (e: Exception) {
            log.warn("[FCM] Erreur push transfert {}: {}", event.mouvementId, e.message)
        }
    }

    private fun dispatchMouvement(e: MouvementNotificationEvent) {
        val data = mapOf("type" to "transfert", "id" to e.mouvementId.toString())
        when (e.kind) {
            MouvementNotificationKind.DEMANDE_CREEE -> {
                userRepository.findByRoleCode("LOGISTIQUE").forEach { u ->
                    pushService.sendToUser(u.id!!,
                        "Nouveau transfert demand\u00e9",
                        "${e.enginCode} vers ${e.projetDestinationNom}.", data)
                }
            }
            MouvementNotificationKind.VALIDE -> {
                e.initiateurUserId?.let { uid ->
                    pushService.sendToUser(uid,
                        "Transfert valid\u00e9",
                        "${e.enginCode} — bon de transfert disponible.", data)
                }
            }
            MouvementNotificationKind.REJETE -> {
                e.initiateurUserId?.let { uid ->
                    pushService.sendToUser(uid,
                        "Transfert rejet\u00e9",
                        e.detail ?: "${e.enginCode} \u2014 demande refus\u00e9e.", data)
                }
            }
            MouvementNotificationKind.DEPART_CONFIRME -> {
                e.projetDestinationResponsableId?.let { cpId ->
                    pushService.sendToUser(cpId,
                        "${e.enginCode} en route",
                        "D\u00e9part confirm\u00e9 vers ${e.projetDestinationNom}.", data)
                }
            }
            MouvementNotificationKind.RECEPTION_CONFIRMEE -> {
                userRepository.findByRoleCode("LOGISTIQUE").forEach { u ->
                    pushService.sendToUser(u.id!!,
                        "${e.enginCode} r\u00e9ceptionn\u00e9",
                        "Re\u00e7u sur ${e.projetDestinationNom}.", data)
                }
            }
            MouvementNotificationKind.RECEPTION_AVEC_RESERVES -> {
                userRepository.findByRoleCode("LOGISTIQUE").forEach { u ->
                    pushService.sendToUser(u.id!!,
                        "${e.enginCode} re\u00e7u avec r\u00e9serves",
                        "Incident cree automatiquement.", data)
                }
            }
            else -> { /* ORDRE_CREE, ANNULE, EN_TRANSIT_TROP_LONG : push optionnel, a ajouter si besoin */ }
        }
    }

    // ── Incidents ────────────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onIncident(event: IncidentNotificationEvent) {
        try {
            val data = mapOf("type" to "incident", "id" to event.incidentId.toString())
            event.projetResponsableId?.let { cpId ->
                pushService.sendToUser(cpId,
                    "Incident signal\u00e9 \u2014 ${event.enginCode}",
                    event.description?.take(100) ?: "Un incident a \u00e9t\u00e9 signal\u00e9.", data)
            }
            userRepository.findByRoleCode("LOGISTIQUE").forEach { u ->
                if (u.id != event.projetResponsableId) {
                    pushService.sendToUser(u.id!!,
                        "Incident signal\u00e9 \u2014 ${event.enginCode}",
                        event.description?.take(100) ?: "Un incident a \u00e9t\u00e9 signal\u00e9.", data)
                }
            }
        } catch (e: Exception) {
            log.warn("[FCM] Erreur push incident {}: {}", event.incidentId, e.message)
        }
    }

    // ── Helpers ──────────────────────────────────────────────────

    private fun pushDistinct(id1: Long, id2: Long?, title: String, body: String, data: Map<String, String>) {
        pushService.sendToUser(id1, title, body, data)
        if (id2 != null && id2 != id1) {
            pushService.sendToUser(id2, title, body, data)
        }
    }
}
