package com.mikaservices.platform.modules.qshe.service

import com.mikaservices.platform.common.enums.NiveauRisque
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.projet.repository.SousProjetRepository
import com.mikaservices.platform.modules.qshe.dto.request.RisqueCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.RisqueUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.RisqueResponse
import com.mikaservices.platform.modules.qshe.dto.response.RisqueSummaryResponse
import com.mikaservices.platform.modules.qshe.entity.Risque
import com.mikaservices.platform.modules.qshe.mapper.RisqueMapper
import com.mikaservices.platform.modules.qshe.repository.RisqueRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class RisqueService(
    private val risqueRepository: RisqueRepository,
    private val projetRepository: ProjetRepository,
    private val sousProjetRepository: SousProjetRepository
) {
    private val logger = LoggerFactory.getLogger(RisqueService::class.java)

    fun create(request: RisqueCreateRequest): RisqueResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet introuvable : ${request.projetId}") }
        val sousProjet = request.sousProjetId?.let {
            sousProjetRepository.findById(it).orElseThrow { ResourceNotFoundException("Sous-projet introuvable : $it") }
        }

        val reference = "RSK-%05d".format(risqueRepository.count() + 1)

        val risque = Risque(
            projet = projet, reference = reference, titre = request.titre,
            description = request.description, categorie = request.categorie,
            uniteTravail = request.uniteTravail, dangerIdentifie = request.dangerIdentifie,
            probabiliteBrute = request.probabiliteBrute, graviteBrute = request.graviteBrute,
            mesuresElimination = request.mesuresElimination, mesuresSubstitution = request.mesuresSubstitution,
            mesuresIngenierie = request.mesuresIngenierie, mesuresAdministratives = request.mesuresAdministratives,
            mesuresEpi = request.mesuresEpi,
            probabiliteResiduelle = request.probabiliteResiduelle,
            graviteResiduelle = request.graviteResiduelle,
            sousProjet = sousProjet, zoneConcernee = request.zoneConcernee
        )
        risque.calculerNiveauBrut()
        risque.calculerNiveauResiduel()

        val saved = risqueRepository.save(risque)
        logger.info("Risque créé : ${saved.reference} (brut=${saved.niveauBrut}, résiduel=${saved.niveauResiduel})")
        return RisqueMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long, pageable: Pageable): Page<RisqueResponse> {
        return risqueRepository.findByProjetIdAndActifTrue(projetId, pageable).map { RisqueMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): RisqueResponse = RisqueMapper.toResponse(getById(id))

    fun update(id: Long, request: RisqueUpdateRequest): RisqueResponse {
        val risque = getById(id)
        var recalcBrut = false
        var recalcResiduel = false

        request.titre?.let { risque.titre = it }
        request.description?.let { risque.description = it }
        request.categorie?.let { risque.categorie = it }
        request.uniteTravail?.let { risque.uniteTravail = it }
        request.dangerIdentifie?.let { risque.dangerIdentifie = it }
        request.probabiliteBrute?.let { risque.probabiliteBrute = it; recalcBrut = true }
        request.graviteBrute?.let { risque.graviteBrute = it; recalcBrut = true }
        request.mesuresElimination?.let { risque.mesuresElimination = it }
        request.mesuresSubstitution?.let { risque.mesuresSubstitution = it }
        request.mesuresIngenierie?.let { risque.mesuresIngenierie = it }
        request.mesuresAdministratives?.let { risque.mesuresAdministratives = it }
        request.mesuresEpi?.let { risque.mesuresEpi = it }
        request.probabiliteResiduelle?.let { risque.probabiliteResiduelle = it; recalcResiduel = true }
        request.graviteResiduelle?.let { risque.graviteResiduelle = it; recalcResiduel = true }
        request.zoneConcernee?.let { risque.zoneConcernee = it }
        request.actif?.let { risque.actif = it }

        if (recalcBrut) risque.calculerNiveauBrut()
        if (recalcResiduel) risque.calculerNiveauResiduel()

        val saved = risqueRepository.save(risque)
        logger.info("Risque mis à jour : ${saved.reference} (brut=${saved.niveauBrut}, résiduel=${saved.niveauResiduel})")
        return RisqueMapper.toResponse(saved)
    }

    fun delete(id: Long) {
        val risque = getById(id)
        risqueRepository.delete(risque)
        logger.info("Risque supprimé : ${risque.reference}")
    }

    @Transactional(readOnly = true)
    fun getSummary(projetId: Long): RisqueSummaryResponse {
        val total = risqueRepository.countByProjetId(projetId)
        val actifs = risqueRepository.countActifsByProjet(projetId)
        val critiques = risqueRepository.countActifsByProjetAndNiveauBrutIn(projetId, listOf(NiveauRisque.CRITIQUE, NiveauRisque.ELEVE))
        val all = risqueRepository.findByProjetIdAndActifTrue(projetId, Pageable.unpaged()).content
        val parNiveau = all.groupBy { it.niveauBrut.name }.mapValues { it.value.size.toLong() }

        return RisqueSummaryResponse(totalRisques = total, risquesActifs = actifs, critiquesOuEleves = critiques, parNiveauBrut = parNiveau)
    }

    private fun getById(id: Long): Risque = risqueRepository.findById(id)
        .orElseThrow { ResourceNotFoundException("Risque introuvable : $id") }
}
