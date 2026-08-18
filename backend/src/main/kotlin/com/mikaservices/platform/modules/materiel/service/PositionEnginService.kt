package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.PositionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.response.PositionEnginResponse
import com.mikaservices.platform.modules.materiel.entity.PositionEngin
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.PositionEnginRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional
class PositionEnginService(
    private val positionRepository: PositionEnginRepository,
    private val enginRepository: EnginRepository
) {
    private val logger = LoggerFactory.getLogger(PositionEnginService::class.java)

    fun create(enginId: Long, request: PositionEnginCreateRequest): PositionEnginResponse {
        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouvé avec l'ID: $enginId") }

        val horodatage = Instant.now()
        val position = positionRepository.save(PositionEngin(
            engin = engin,
            latitude = request.latitude,
            longitude = request.longitude,
            source = request.source,
            precisionMetres = request.precisionMetres,
            chantierNom = request.chantierNom,
            confirmePar = request.confirmePar,
            horodatage = horodatage
        ))

        // Mise à jour de la dernière position connue de l'engin
        engin.latitude = request.latitude
        engin.longitude = request.longitude
        engin.positionMaj = horodatage
        enginRepository.save(engin)

        logger.info("Position enregistrée pour engin ${engin.code} (${request.source})")
        return toResponse(position)
    }

    @Transactional(readOnly = true)
    fun findByEnginId(enginId: Long, pageable: Pageable): Page<PositionEnginResponse> {
        return positionRepository.findByEnginIdOrderByHorodatageDesc(enginId, pageable).map { toResponse(it) }
    }

    private fun toResponse(p: PositionEngin) = PositionEnginResponse(
        id = p.id!!,
        enginId = p.engin.id!!,
        latitude = p.latitude,
        longitude = p.longitude,
        source = p.source,
        precisionMetres = p.precisionMetres,
        chantierNom = p.chantierNom,
        confirmePar = p.confirmePar,
        horodatage = p.horodatage
    )
}
