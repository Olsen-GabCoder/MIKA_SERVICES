package com.mikaservices.platform.modules.qshe.service

import com.mikaservices.platform.modules.qshe.dto.response.QsheDashboardResponse
import com.mikaservices.platform.modules.qshe.enums.StatutIncident
import com.mikaservices.platform.modules.qshe.enums.TypeIncident
import com.mikaservices.platform.modules.qshe.repository.IncidentRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
@Transactional(readOnly = true)
class QsheDashboardService(
    private val incidentService: IncidentService,
    private val actionService: ActionCorrectiveService,
    private val incidentRepository: IncidentRepository
) {
    private val logger = LoggerFactory.getLogger(QsheDashboardService::class.java)

    fun getDashboard(projetId: Long): QsheDashboardResponse {
        val incidentSummary = incidentService.getSummary(projetId)
        val actionSummary = actionService.getSummary(projetId)

        // TF / TG : necessitent les heures travaillees (non disponibles en v1 — champ a ajouter plus tard)
        // Pour l'instant on retourne null — le frontend affichera "—"
        val heuresTravaillees: Long? = null
        val tf: Double? = if (heuresTravaillees != null && heuresTravaillees > 0) {
            (incidentSummary.incidentsGraves.toDouble() * 1_000_000) / heuresTravaillees
        } else null
        val tg: Double? = if (heuresTravaillees != null && heuresTravaillees > 0) {
            (incidentSummary.totalJoursArret.toDouble() * 1_000) / heuresTravaillees
        } else null

        // Jours depuis dernier AT (avec arret)
        val dernierAT = incidentRepository.findByProjetId(projetId, Pageable.unpaged()).content
            .filter { it.typeIncident == TypeIncident.ACCIDENT_TRAVAIL && it.statut != StatutIncident.BROUILLON }
            .filter { it.victimes.any { v -> v.arretTravail } }
            .maxByOrNull { it.dateIncident }

        val joursDepuisDernierAT = dernierAT?.let {
            ChronoUnit.DAYS.between(it.dateIncident, LocalDate.now())
        }

        return QsheDashboardResponse(
            incidents = incidentSummary,
            actions = actionSummary,
            tauxFrequence = tf,
            tauxGravite = tg,
            heuresTravaillees = heuresTravaillees,
            joursDepuisDernierAT = joursDepuisDernierAT
        )
    }
}
