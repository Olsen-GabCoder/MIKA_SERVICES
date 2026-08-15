package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.ConsommationCarburantCreateRequest
import com.mikaservices.platform.modules.materiel.dto.response.ConsommationCarburantResponse
import com.mikaservices.platform.modules.materiel.entity.ConsommationCarburant
import com.mikaservices.platform.modules.materiel.repository.ConsommationCarburantRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class ConsommationCarburantService(
    private val consoRepository: ConsommationCarburantRepository,
    private val enginRepository: EnginRepository
) {
    private val logger = LoggerFactory.getLogger(ConsommationCarburantService::class.java)

    fun create(enginId: Long, request: ConsommationCarburantCreateRequest): ConsommationCarburantResponse {
        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouve avec l'ID: $enginId") }
        val conso = ConsommationCarburant(
            engin = engin,
            datePlein = request.datePlein,
            quantiteLitres = request.quantiteLitres,
            coutTotal = request.coutTotal,
            heuresCompteurAuPlein = request.heuresCompteurAuPlein,
            pleinPar = request.pleinPar,
            commentaire = request.commentaire
        )
        val saved = consoRepository.save(conso)
        logger.info("Consommation carburant engin ${engin.code}: ${saved.quantiteLitres}L")
        return toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByEnginId(enginId: Long, pageable: Pageable): Page<ConsommationCarburantResponse> {
        return consoRepository.findByEnginId(enginId, pageable).map { toResponse(it) }
    }

    private fun toResponse(e: ConsommationCarburant) = ConsommationCarburantResponse(
        id = e.id!!, enginId = e.engin.id!!, datePlein = e.datePlein,
        quantiteLitres = e.quantiteLitres, coutTotal = e.coutTotal,
        heuresCompteurAuPlein = e.heuresCompteurAuPlein, pleinPar = e.pleinPar,
        commentaire = e.commentaire, createdAt = e.createdAt
    )
}
