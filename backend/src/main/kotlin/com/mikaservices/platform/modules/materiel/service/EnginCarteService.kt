package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.modules.materiel.dto.response.EnginCarteResponse
import com.mikaservices.platform.modules.materiel.repository.AffectationEnginChantierRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class EnginCarteService(
    private val enginRepository: EnginRepository,
    private val affectationRepository: AffectationEnginChantierRepository
) {
    fun getPositions(): List<EnginCarteResponse> {
        val engins = enginRepository.findByActifTrue(Pageable.unpaged()).content
        val enginIds = engins.mapNotNull { it.id }
        val affectationsEnCours = affectationRepository.findByEnginIdInAndStatut(enginIds, StatutAffectation.EN_COURS)
        val affMap = affectationsEnCours.associateBy { it.engin.id }

        return engins.mapNotNull { engin ->
            val aff = affMap[engin.id]
            val projet = aff?.projet
            val lat = projet?.latitude ?: return@mapNotNull null
            val lng = projet.longitude ?: return@mapNotNull null
            EnginCarteResponse(
                id = engin.id!!,
                code = engin.code,
                nom = engin.nom,
                type = engin.type,
                statut = engin.statut,
                marque = engin.marque,
                chantierNom = projet.nom,
                latitude = lat,
                longitude = lng
            )
        }
    }
}
