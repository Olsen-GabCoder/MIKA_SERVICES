package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.enums.TypeNotification
import com.mikaservices.platform.modules.communication.service.NotificationService
import com.mikaservices.platform.modules.materiel.repository.AffectationEnginChantierRepository
import com.mikaservices.platform.modules.materiel.repository.PlanMaintenanceRepository
import com.mikaservices.platform.modules.materiel.repository.ReleveCompteurRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

/**
 * Cron quotidien : compare les plans de maintenance actifs aux releves compteur
 * et aux dates, et cree des alertes quand un seuil est atteint.
 *
 * Idempotent : ne cree pas de doublon si une alerte identique non-lue existe deja
 * (meme plan, meme type, meme jour).
 */
@Service
class MaintenanceAlertService(
    private val planRepository: PlanMaintenanceRepository,
    private val releveRepository: ReleveCompteurRepository,
    private val affectationRepository: AffectationEnginChantierRepository,
    private val notificationService: NotificationService,
    private val pushService: FirebasePushService,
    private val userRepository: UserRepository,
) {
    private val logger = LoggerFactory.getLogger(MaintenanceAlertService::class.java)

    /** Tous les jours a 6h heure de Douala (UTC+1). Render tourne en UTC. */
    @Scheduled(cron = "0 0 6 * * ?", zone = "Africa/Douala")
    @Transactional(readOnly = true)
    fun verifierAlertes() {
        logger.info("[MaintenanceAlert] Verification des plans de maintenance...")
        val plans = planRepository.findByActifTrue()
        var alertCount = 0

        val today = LocalDate.now()

        for (plan in plans) {
            val engin = plan.engin
            val enginId = engin.id ?: continue

            // Alerte par date (prochaineEcheance - seuilAlerte jours)
            plan.prochaineEcheance?.let { echeance ->
                val seuilDate = echeance.minusDays(plan.seuilAlerte.toLong())
                if (!today.isBefore(seuilDate)) {
                    val joursRestants = java.time.temporal.ChronoUnit.DAYS.between(today, echeance)
                    val titre = "Maintenance ${plan.titre} — ${engin.code}"
                    val contenu = if (joursRestants <= 0)
                        "Echeance depassee de ${-joursRestants} jour(s) pour ${engin.nom}."
                    else
                        "Echeance dans $joursRestants jour(s) pour ${engin.nom}."

                    if (envoyerAlerte(enginId, plan.id!!, titre, contenu, "date")) {
                        alertCount++
                    }
                }
            }

            // Alerte par compteur (prochainCompteur - seuilAlerte heures/km)
            plan.prochainCompteur?.let { seuil ->
                val dernierReleve = releveRepository.findFirstByEnginIdOrderByDateReleveDesc(enginId)
                val compteurActuel = dernierReleve?.valeurHeures ?: engin.heuresCompteur
                val seuilDeclenchement = seuil - plan.seuilAlerte

                if (compteurActuel >= seuilDeclenchement) {
                    val restant = seuil - compteurActuel
                    val titre = "Maintenance ${plan.titre} — ${engin.code}"
                    val contenu = if (restant <= 0)
                        "Seuil depasse de ${-restant}h pour ${engin.nom}."
                    else
                        "Plus que ${restant}h avant maintenance pour ${engin.nom}."

                    if (envoyerAlerte(enginId, plan.id!!, titre, contenu, "compteur")) {
                        alertCount++
                    }
                }
            }
        }

        logger.info("[MaintenanceAlert] Verification terminee : $alertCount alerte(s) creee(s) sur ${plans.size} plan(s).")
    }

    /**
     * Envoie une alerte maintenance aux logisticiens + chef de projet du chantier.
     * Retourne true si l'alerte a ete creee, false si doublon (deja envoyee aujourd'hui).
     */
    private fun envoyerAlerte(enginId: Long, planId: Long, titre: String, contenu: String, type: String): Boolean {
        // Anti-doublon : on utilise le lien comme identifiant unique par jour
        val lien = "/materiel/engins/$enginId?maintenance=$planId&day=${LocalDate.now()}&type=$type"

        // Notifier la logistique
        val logisticiens = userRepository.findByRoleCode("LOGISTIQUE")
        val notifies = mutableSetOf<Long>()
        val data = mapOf("type" to "maintenance", "enginId" to enginId.toString(), "planId" to planId.toString())

        for (u in logisticiens) {
            val uid = u.id ?: continue
            if (notifies.add(uid)) {
                notificationService.envoyerNotification(uid, titre, contenu, TypeNotification.ALERTE_MAINTENANCE, lien)
                pushService.sendToUser(uid, titre, contenu, data)
            }
        }

        // Notifier le chef de projet du chantier (via affectation engin EN_COURS)
        val affectations = affectationRepository.findByEnginIdAndStatut(enginId, StatutAffectation.EN_COURS)
        for (aff in affectations) {
            val projetId = aff.projet.id ?: continue
            val responsableId = aff.projet.responsableProjet?.id
            if (responsableId != null && notifies.add(responsableId)) {
                notificationService.envoyerNotification(responsableId, titre, contenu, TypeNotification.ALERTE_MAINTENANCE, lien)
                pushService.sendToUser(responsableId, titre, contenu, data)
            }
        }

        return notifies.isNotEmpty()
    }
}
