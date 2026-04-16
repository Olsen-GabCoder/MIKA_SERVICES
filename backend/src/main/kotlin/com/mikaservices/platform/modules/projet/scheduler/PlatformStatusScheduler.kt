package com.mikaservices.platform.modules.projet.scheduler

import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutPointBloquant
import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.config.mail.EmailService
import com.mikaservices.platform.config.mail.PlatformStatusEmailData
import com.mikaservices.platform.config.mail.PointBloquantEmailRow
import com.mikaservices.platform.config.mail.ProjetEmailRow
import com.mikaservices.platform.modules.projet.entity.PointBloquant
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.repository.PointBloquantRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDate

/**
 * Envoie chaque jour à 09h00 un rapport complet de l'état de la plateforme
 * à tous les utilisateurs actifs ayant les notifications email activées.
 *
 * Contenu du rapport :
 *  - Résumé global (nb projets, nb points bloquants ouverts)
 *  - Projets EN_COURS avec avancement physique + financier + points bloquants
 *  - Projets PLANIFIE
 *  - Projets RECEPTION_PROVISOIRE
 */
@Component
class PlatformStatusScheduler(
    private val projetRepository: ProjetRepository,
    private val pointBloquantRepository: PointBloquantRepository,
    private val userRepository: UserRepository,
    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(PlatformStatusScheduler::class.java)

    private val statutsActifs = listOf(
        StatutProjet.EN_COURS,
        StatutProjet.PLANIFIE,
        StatutProjet.RECEPTION_PROVISOIRE
    )

    /** Statuts de points bloquants considérés comme "actifs" (non résolus). */
    private val statutsPB = listOf(
        StatutPointBloquant.OUVERT,
        StatutPointBloquant.EN_COURS,
        StatutPointBloquant.ESCALADE
    )

    @Scheduled(cron = "\${app.scheduler.platform-status-cron:0 0 9 * * *}")
    fun envoyerRapportQuotidien() {
        logger.info("[PlatformStatusScheduler] Démarrage du rapport quotidien plateforme")
        try {
            val data = construireData()
            if (data.totalProjets == 0) {
                logger.info("[PlatformStatusScheduler] Aucun projet actif — rapport ignoré.")
                return
            }
            val destinataires = userRepository.findByActifTrue()
                .filter { it.emailNotificationsEnabled && it.email.isNotBlank() }

            if (destinataires.isEmpty()) {
                logger.info("[PlatformStatusScheduler] Aucun destinataire email actif — rapport ignoré.")
                return
            }

            var nbEnvoyes = 0
            destinataires.forEach { user ->
                try {
                    emailService.sendPlatformStatusEmail(
                        to     = user.email,
                        prenom = user.prenom,
                        sexe   = user.sexe,
                        data   = data
                    )
                    nbEnvoyes++
                } catch (e: Exception) {
                    logger.error("[PlatformStatusScheduler] Erreur envoi vers ${user.email}: ${e.message}", e)
                }
            }
            logger.info("[PlatformStatusScheduler] Rapport envoyé à $nbEnvoyes/${destinataires.size} utilisateur(s).")
        } catch (e: Exception) {
            logger.error("[PlatformStatusScheduler] Erreur lors de la construction du rapport: ${e.message}", e)
        }
    }

    // ─── Construction des données ─────────────────────────────────

    private fun construireData(): PlatformStatusEmailData {
        // 1. Projets actifs (une requête par statut, EntityGraph charge responsableProjet)
        val projetsParStatut: Map<StatutProjet, List<Projet>> = statutsActifs.associateWith { statut ->
            projetRepository.findByStatutAndActifTrue(statut)
        }

        // 2. Points bloquants actifs — UNE seule requête, groupés par projet
        val pbParProjetId: Map<Long, List<PointBloquant>> = pointBloquantRepository
            .findByStatutIn(statutsPB)
            .groupBy { it.projet.id!! }

        fun buildRows(projets: List<Projet>): List<ProjetEmailRow> = projets.map { p ->
            val pbDuProjet = pbParProjetId[p.id] ?: emptyList()
            val pbTries = pbDuProjet
                .sortedWith(compareByDescending { prioriteOrdre(it.priorite) })
                .map { pb ->
                    PointBloquantEmailRow(
                        titre          = pb.titre,
                        priorite       = pb.priorite,
                        statut         = pb.statut,
                        dateDetection  = pb.dateDetection
                    )
                }
            val responsable = p.responsableProjet
            ProjetEmailRow(
                id                   = p.id!!,
                nom                  = p.nom,
                responsableNom       = responsable?.let { "${it.prenom} ${it.nom}" },
                avancementPhysique   = p.avancementPhysiquePct,
                avancementFinancier  = p.avancementFinancierPct,
                avancementGlobal     = p.avancementGlobal,
                pointsBloquants      = pbTries
            )
        }

        return PlatformStatusEmailData(
            date                        = LocalDate.now(),
            projetsEnCours              = buildRows(projetsParStatut[StatutProjet.EN_COURS] ?: emptyList()),
            projetsPlanifies            = buildRows(projetsParStatut[StatutProjet.PLANIFIE] ?: emptyList()),
            projetsReceptionProvisoire  = buildRows(projetsParStatut[StatutProjet.RECEPTION_PROVISOIRE] ?: emptyList())
        )
    }

    /** Ordre de tri des priorités : URGENTE > CRITIQUE > HAUTE > NORMALE > BASSE */
    private fun prioriteOrdre(p: Priorite): Int = when (p) {
        Priorite.URGENTE  -> 5
        Priorite.CRITIQUE -> 4
        Priorite.HAUTE    -> 3
        Priorite.NORMALE  -> 2
        Priorite.BASSE    -> 1
    }
}
