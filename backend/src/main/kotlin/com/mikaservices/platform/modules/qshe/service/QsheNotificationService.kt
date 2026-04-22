package com.mikaservices.platform.modules.qshe.service

import com.mikaservices.platform.common.enums.TypeNotification
import com.mikaservices.platform.modules.communication.service.NotificationService
import com.mikaservices.platform.modules.qshe.entity.Incident
import com.mikaservices.platform.modules.qshe.enums.GraviteIncident
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

/**
 * Cable les notifications QSHE vers le systeme de notification existant.
 * Appele depuis les services QSHE lors d'evenements significatifs.
 */
@Service
class QsheNotificationService(
    private val notificationService: NotificationService
) {
    private val logger = LoggerFactory.getLogger(QsheNotificationService::class.java)

    fun notifierIncidentCree(incident: Incident) {
        val responsableId = incident.projet.responsableProjet?.id ?: return
        val type = if (incident.gravite in listOf(GraviteIncident.GRAVE, GraviteIncident.MORTELLE))
            TypeNotification.QSHE_INCIDENT_GRAVE else TypeNotification.INCIDENT

        notificationService.envoyerNotification(
            destinataireId = responsableId,
            titre = "Incident ${incident.reference} — ${incident.gravite}",
            contenu = "${incident.titre} sur ${incident.projet.nom}",
            type = type,
            lien = "/qshe/incidents"
        )
        logger.info("Notification incident envoyée : ${incident.reference} → user $responsableId")
    }

    // TODO Qualité v2 — notifierNonConformiteCree() retiré, sera recréé dans QualiteNotificationService

    fun notifierCnssEnRetard(incident: Incident) {
        val responsableId = incident.projet.responsableProjet?.id ?: return
        notificationService.envoyerNotification(
            destinataireId = responsableId,
            titre = "CNSS en retard — ${incident.reference}",
            contenu = "La déclaration CNSS de l'incident ${incident.reference} a dépassé le délai de 48h",
            type = TypeNotification.QSHE_CNSS_EN_RETARD,
            lien = "/qshe/incidents"
        )
    }

    fun notifierActionEnRetard(responsableId: Long, actionRef: String, titre: String) {
        notificationService.envoyerNotification(
            destinataireId = responsableId,
            titre = "Action CAPA en retard — $actionRef",
            contenu = titre,
            type = TypeNotification.QSHE_ACTION_EN_RETARD,
            lien = "/qshe/dashboard"
        )
    }

    fun notifierCertificationExpire(userId: Long, libelle: String) {
        notificationService.envoyerNotification(
            destinataireId = userId,
            titre = "Certification expirée",
            contenu = "Votre certification « $libelle » a expiré",
            type = TypeNotification.QSHE_CERTIFICATION_EXPIRE,
            lien = "/qshe/formations"
        )
    }

    fun notifierPermisExpire(responsableId: Long, permisRef: String) {
        notificationService.envoyerNotification(
            destinataireId = responsableId,
            titre = "Permis de travail expiré — $permisRef",
            contenu = "Le permis $permisRef a expiré. Renouveler ou clôturer.",
            type = TypeNotification.QSHE_PERMIS_EXPIRE,
            lien = "/qshe/permis"
        )
    }

    fun notifierDepassementEnvironnemental(responsableId: Long, parametre: String, projetNom: String) {
        notificationService.envoyerNotification(
            destinataireId = responsableId,
            titre = "Dépassement environnemental — $parametre",
            contenu = "Mesure de $parametre dépasse la limite réglementaire sur $projetNom",
            type = TypeNotification.QSHE_DEPASSEMENT_ENVIRONNEMENTAL,
            lien = "/qshe/environnement"
        )
    }
}
