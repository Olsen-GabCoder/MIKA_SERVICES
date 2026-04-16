package com.mikaservices.platform.modules.reunionhebdo.scheduler

import com.mikaservices.platform.config.mail.EmailService
import com.mikaservices.platform.config.mail.PointProjetPVEmailRow
import com.mikaservices.platform.config.mail.ReunionHebdoPVEmailData
import com.mikaservices.platform.modules.reunionhebdo.entity.PointProjetPV
import com.mikaservices.platform.modules.reunionhebdo.repository.PointProjetPVRepository
import com.mikaservices.platform.modules.reunionhebdo.repository.ReunionHebdoRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters

/**
 * Envoie automatiquement le PV de la réunion hebdomadaire chaque jeudi à 18h00
 * (heure de Libreville, Africa/Libreville).
 *
 * Contenu du PV :
 *  - Informations générales : date, lieu, horaires, ordre du jour
 *  - Points par projet : avancement physique/financier/délai, travaux/prévisions,
 *    points bloquants, besoins matériels et humains, propositions
 *  - Pas de liste de participants
 *
 * Totalement indépendant de la logique de génération PDF client (@react-pdf/renderer).
 * Route admin : POST /api/admin/scheduler/pv-hebdo
 */
@Component
class ReunionHebdoPVScheduler(
    private val reunionHebdoRepository: ReunionHebdoRepository,
    private val pointProjetPVRepository: PointProjetPVRepository,
    private val userRepository: UserRepository,
    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(ReunionHebdoPVScheduler::class.java)

    // ─── Jeudi 18h00 : envoi automatique du PV hebdomadaire ───────

    @Scheduled(cron = "\${app.scheduler.pv-hebdo-jeudi:0 0 18 * * THU}", zone = "Africa/Libreville")
    fun envoyerPVHebdo() {
        logger.info("[ReunionHebdoPVScheduler] Démarrage envoi automatique PV hebdomadaire (jeudi 18h00)")
        try {
            val data = construireData() ?: run {
                logger.info("[ReunionHebdoPVScheduler] Aucune réunion trouvée pour cette semaine — envoi ignoré.")
                return
            }

            if (data.pointsProjets.isEmpty()) {
                logger.info("[ReunionHebdoPVScheduler] Aucun point projet pour la réunion du ${data.dateReunion} — envoi ignoré.")
                return
            }

            // TODO TEST — retirer ce filtre après validation
            val TEST_EMAIL = "olsenkampala@gmail.com"
            val destinataires = userRepository.findByActifTrue()
                .filter { it.email.equals(TEST_EMAIL, ignoreCase = true) }

            if (destinataires.isEmpty()) {
                logger.info("[ReunionHebdoPVScheduler] Aucun destinataire email actif — envoi ignoré.")
                return
            }

            var nbEnvoyes = 0
            destinataires.forEach { user ->
                try {
                    emailService.sendPVHebdoEmail(
                        to     = user.email,
                        prenom = user.prenom,
                        sexe   = user.sexe,
                        data   = data
                    )
                    nbEnvoyes++
                } catch (e: Exception) {
                    logger.error("[ReunionHebdoPVScheduler] Erreur envoi vers ${user.email}: ${e.message}", e)
                }
            }
            logger.info("[ReunionHebdoPVScheduler] PV hebdo envoyé à $nbEnvoyes/${destinataires.size} utilisateur(s).")
        } catch (e: Exception) {
            logger.error("[ReunionHebdoPVScheduler] Erreur globale: ${e.message}", e)
        }
    }

    // ─── Construction des données ──────────────────────────────────

    /**
     * Cherche la réunion de la semaine courante dans l'ordre suivant :
     *  1. Réunion dont la date est aujourd'hui (jeudi)
     *  2. Réunion la plus récente dans la semaine courante (lundi → aujourd'hui)
     *  3. En dernier recours, la réunion la plus récente en base toutes semaines confondues
     */
    fun construireData(): ReunionHebdoPVEmailData? {
        val aujourd_hui = LocalDate.now()
        val lundiSemaine = aujourd_hui.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        val nbJoursDepuisLundi = aujourd_hui.toEpochDay() - lundiSemaine.toEpochDay()

        val reunion = reunionHebdoRepository.findByDateReunion(aujourd_hui)
            ?: (0L..nbJoursDepuisLundi).asSequence()
                .map { offset -> lundiSemaine.plusDays(nbJoursDepuisLundi - offset) }
                .drop(1) // aujourd'hui déjà essayé
                .mapNotNull { date -> reunionHebdoRepository.findByDateReunion(date) }
                .firstOrNull()
            ?: reunionHebdoRepository
                .findAllByOrderByDateReunionDesc(PageRequest.of(0, 1))
                .content
                .firstOrNull()

        if (reunion == null) return null

        val points = pointProjetPVRepository
            .findByReunionIdOrderByOrdreAffichageAsc(reunion.id!!)
            .map { toEmailRow(it) }

        return ReunionHebdoPVEmailData(
            reunionId     = reunion.id!!,
            dateReunion   = reunion.dateReunion,
            lieu          = reunion.lieu,
            heureDebut    = reunion.heureDebut,
            heureFin      = reunion.heureFin,
            ordreDuJour   = reunion.ordreDuJour,
            divers        = reunion.divers,
            pointsProjets = points
        )
    }

    private fun toEmailRow(point: PointProjetPV): PointProjetPVEmailRow {
        val projet = point.projet
        val responsable = projet.responsableProjet
        return PointProjetPVEmailRow(
            ordreAffichage           = point.ordreAffichage,
            projetNom                = projet.nom,
            projetCode               = projet.codeProjet,
            chefProjetNom            = responsable?.let { "${it.prenom} ${it.nom}" },
            avancementPhysiquePct    = point.avancementPhysiquePct,
            avancementFinancierPct   = point.avancementFinancierPct,
            delaiConsommePct         = point.delaiConsommePct,
            resumeTravauxPrevisions  = point.resumeTravauxPrevisions,
            pointsBloquantsResume    = point.pointsBloquantsResume,
            besoinsMateriel          = point.besoinsMateriel,
            besoinsHumain            = point.besoinsHumain,
            propositionsAmelioration = point.propositionsAmelioration
        )
    }
}
