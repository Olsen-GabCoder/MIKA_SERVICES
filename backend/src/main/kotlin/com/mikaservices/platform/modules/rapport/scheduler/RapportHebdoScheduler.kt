package com.mikaservices.platform.modules.rapport.scheduler

import com.mikaservices.platform.common.enums.StatutPointBloquant
import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.config.mail.EmailService
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.repository.PointBloquantRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.rapport.data.PointBloquantRapportRow
import com.mikaservices.platform.modules.rapport.data.ProjetRapportRow
import com.mikaservices.platform.modules.rapport.data.RapportHebdoData
import com.mikaservices.platform.modules.rapport.pdf.RapportHebdoPdfGenerator
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDate
import java.time.temporal.IsoFields

/**
 * Envoie chaque jeudi à 18h00 (heure de Libreville) un rapport PDF hebdomadaire
 * à tous les utilisateurs actifs avec notifications email activées.
 *
 * Source des données : entités Projet uniquement.
 * Aucune dépendance envers ReunionHebdo ou PointProjetPV.
 *
 * Route admin (déclenchement manuel) : POST /api/admin/scheduler/rapport-hebdo
 */
@Component
class RapportHebdoScheduler(
    private val projetRepository: ProjetRepository,
    private val pointBloquantRepository: PointBloquantRepository,
    private val userRepository: UserRepository,
    private val pdfGenerator: RapportHebdoPdfGenerator,
    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(RapportHebdoScheduler::class.java)

    private val statutsActifs = listOf(
        StatutProjet.EN_COURS,
        StatutProjet.PLANIFIE,
        StatutProjet.EN_ATTENTE,
        StatutProjet.RECEPTION_PROVISOIRE,
        StatutProjet.RECEPTION_DEFINITIVE,
        StatutProjet.SUSPENDU
    )

    private val statutsPBActifs = listOf(
        StatutPointBloquant.OUVERT,
        StatutPointBloquant.EN_COURS,
        StatutPointBloquant.ESCALADE
    )

    // ─── Jeudi 18h00 : envoi automatique ──────────────────────────

    @Scheduled(cron = "\${app.scheduler.rapport-hebdo-jeudi:0 0 18 * * THU}", zone = "Africa/Libreville")
    fun envoyerRapportHebdo() {
        logger.info("[RapportHebdoScheduler] Démarrage envoi rapport hebdomadaire PDF")
        try {
            val data = construireData()

            if (data.totalProjets == 0) {
                logger.info("[RapportHebdoScheduler] Aucun projet actif — rapport ignoré.")
                return
            }

            // Génération du PDF
            val pdfBytes = pdfGenerator.generate(data)
            logger.info("[RapportHebdoScheduler] PDF généré (${pdfBytes.size / 1024} Ko) — ${data.totalProjets} projet(s)")

            // TODO TEST — retirer ce filtre après validation
            val TEST_EMAIL = "olsenkampala@gmail.com"
            val destinataires = userRepository.findByActifTrue()
                .filter { it.email.equals(TEST_EMAIL, ignoreCase = true) }

            if (destinataires.isEmpty()) {
                logger.info("[RapportHebdoScheduler] Aucun destinataire — rapport ignoré.")
                return
            }

            val nomFichier = "rapport-hebdo-S${data.semaine}-${data.annee}.pdf"
            var nbEnvoyes = 0

            destinataires.forEach { user ->
                try {
                    emailService.sendRapportHebdoEmail(
                        to        = user.email,
                        prenom    = user.prenom,
                        sexe      = user.sexe,
                        data      = data,
                        pdfBytes  = pdfBytes,
                        nomFichier = nomFichier
                    )
                    nbEnvoyes++
                } catch (e: Exception) {
                    logger.error("[RapportHebdoScheduler] Erreur envoi vers ${user.email}: ${e.message}", e)
                }
            }

            logger.info("[RapportHebdoScheduler] Rapport envoyé à $nbEnvoyes/${destinataires.size} utilisateur(s).")
        } catch (e: Exception) {
            logger.error("[RapportHebdoScheduler] Erreur globale: ${e.message}", e)
        }
    }

    // ─── Construction des données ──────────────────────────────────

    fun construireData(): RapportHebdoData {
        val today = LocalDate.now()
        val semaine = today.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR)
        val annee   = today.get(IsoFields.WEEK_BASED_YEAR)

        // 1. Projets actifs par statut
        val projetsParStatut = statutsActifs.associateWith { statut ->
            projetRepository.findByStatutAndActifTrue(statut)
        }

        // 2. Points bloquants actifs — une seule requête, groupés par projet
        val pbParProjetId = pointBloquantRepository
            .findByStatutIn(statutsPBActifs)
            .groupBy { it.projet.id!! }

        fun buildRows(projets: List<Projet>): List<ProjetRapportRow> = projets.map { p ->
            val pbDuProjet = pbParProjetId[p.id] ?: emptyList()
            ProjetRapportRow(
                id                    = p.id!!,
                nom                   = p.nom,
                codeProjet            = p.codeProjet,
                responsableNom        = p.responsableProjet?.let { "${it.prenom} ${it.nom}" },
                avancementPhysiquePct = p.avancementPhysiquePct,
                avancementFinancierPct = p.avancementFinancierPct,
                delaiConsommePct      = p.delaiConsommePct,
                besoinsMateriel       = p.besoinsMateriel,
                besoinsHumain         = p.besoinsHumain,
                observations          = p.observations,
                propositionsAmelioration = p.propositionsAmelioration,
                pointsBloquants       = pbDuProjet.map { pb ->
                    PointBloquantRapportRow(
                        titre    = pb.titre,
                        priorite = pb.priorite,
                        statut   = pb.statut
                    )
                }
            )
        }

        return RapportHebdoData(
            semaine                    = semaine,
            annee                      = annee,
            dateEmission               = today,
            projetsEnCours             = buildRows(projetsParStatut[StatutProjet.EN_COURS]              ?: emptyList()),
            projetsPlanifies           = buildRows(projetsParStatut[StatutProjet.PLANIFIE]              ?: emptyList()),
            projetsEnAttente           = buildRows(projetsParStatut[StatutProjet.EN_ATTENTE]            ?: emptyList()),
            projetsReceptionProvisoire = buildRows(projetsParStatut[StatutProjet.RECEPTION_PROVISOIRE]  ?: emptyList()),
            projetsReceptionDefinitive = buildRows(projetsParStatut[StatutProjet.RECEPTION_DEFINITIVE]  ?: emptyList()),
            projetsSuspendus           = buildRows(projetsParStatut[StatutProjet.SUSPENDU]              ?: emptyList())
        )
    }
}
