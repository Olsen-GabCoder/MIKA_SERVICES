package com.mikaservices.platform.modules.qshe.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.qshe.dto.response.QsheReportResponse
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class QsheReportService(
    private val projetRepository: ProjetRepository,
    private val incidentService: IncidentService,
    private val actionService: ActionCorrectiveService,
    // TODO Qualité v2 — ControleQualiteService et NonConformiteService retirés (nettoyage #0), à recâbler avec EvenementQualite au livrable #8
    private val risqueService: RisqueService,
    private val certificationService: CertificationService,
    private val epiService: EpiService,
    private val causerieService: CauserieService,
    private val permisService: PermisTravailService,
    private val envService: EnvironnementService
) {
    private val logger = LoggerFactory.getLogger(QsheReportService::class.java)

    fun generateReport(projetId: Long): QsheReportResponse {
        val projet = projetRepository.findById(projetId)
            .orElseThrow { ResourceNotFoundException("Projet introuvable : $projetId") }

        logger.info("Génération rapport QSHE pour projet ${projet.nom}")

        return QsheReportResponse(
            projetId = projet.id!!,
            projetNom = projet.nom,
            incidents = incidentService.getSummary(projetId),
            actions = actionService.getSummary(projetId),
            risques = risqueService.getSummary(projetId),
            certifications = certificationService.getSummary(),
            epiSummary = epiService.getSummary(),
            causeries = causerieService.getSummary(projetId),
            permis = permisService.getSummary(projetId),
            environnement = envService.getSummary(projetId)
        )
    }
}
