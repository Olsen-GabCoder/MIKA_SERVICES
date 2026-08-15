package com.mikaservices.platform.modules.projet.scheduler

import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.common.enums.TypeNotification
import com.mikaservices.platform.modules.communication.service.NotificationService
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

/**
 * Rappels automatiques aux chefs de projet pour mettre à jour leurs projets
 * avant la réunion hebdomadaire du vendredi.
 *
 * Notifications in-app uniquement (WebSocket + DB).
 *
 * Calendrier :
 *  - Mercredi 08h00 → premier rappel (J-2)
 *  - Jeudi    16h00 → rappel final  (veille)
 */
@Component
class ProjetRappelScheduler(
    private val projetRepository: ProjetRepository,
    private val notificationService: NotificationService
) {
    private val logger = LoggerFactory.getLogger(ProjetRappelScheduler::class.java)

    private val statutsActifs = listOf(
        StatutProjet.EN_COURS_EXECUTION,
        StatutProjet.INITIALISATION,
        StatutProjet.RECEPTION_PROVISOIRE,
        StatutProjet.EN_AVANCE
    )

    @Scheduled(cron = "\${app.scheduler.rappel-projet-mercredi:0 0 8 * * WED}")
    fun rappelMercredi() {
        logger.info("[ProjetRappelScheduler] Envoi rappel mercredi (J-2 réunion)")
        envoyerRappels(jourReunion = "vendredi")
    }

    @Scheduled(cron = "\${app.scheduler.rappel-projet-jeudi:0 0 16 * * THU}")
    fun rappelJeudi() {
        logger.info("[ProjetRappelScheduler] Envoi rappel jeudi (veille réunion)")
        envoyerRappels(jourReunion = "demain (vendredi)")
    }

    private fun envoyerRappels(jourReunion: String) {
        val projetsActifs = statutsActifs.flatMap { statut ->
            projetRepository.findByStatutAndActifTrue(statut)
        }.filter { it.responsableProjet != null }

        if (projetsActifs.isEmpty()) {
            logger.info("[ProjetRappelScheduler] Aucun projet actif trouvé, rappel ignoré.")
            return
        }

        val parResponsable = projetsActifs.groupBy { it.responsableProjet!! }

        var nbEnvoyes = 0
        parResponsable.forEach { (responsable, projets) ->
            try {
                val nbProjets = projets.size
                notificationService.envoyerNotification(
                    destinataireId = responsable.id!!,
                    titre = "Réunion $jourReunion — mettez à jour vos projets",
                    contenu = "Vous avez $nbProjets projet(s) à actualiser " +
                        "(avancement, points bloquants, besoins) avant la réunion hebdomadaire.",
                    type = TypeNotification.RAPPEL_MAJ_PROJET,
                    lien = "/projets"
                )
                nbEnvoyes++
            } catch (e: Exception) {
                logger.error(
                    "[ProjetRappelScheduler] Erreur lors du rappel pour ${responsable.email}: ${e.message}",
                    e
                )
            }
        }

        logger.info("[ProjetRappelScheduler] Rappel '$jourReunion' envoyé à $nbEnvoyes chef(s) de projet.")
    }
}
