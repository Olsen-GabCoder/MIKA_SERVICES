package com.mikaservices.platform.modules.projet.service

import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.dto.request.SousProjetCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.SousProjetUpdateRequest
import com.mikaservices.platform.modules.projet.dto.response.SousProjetResponse
import com.mikaservices.platform.modules.projet.entity.SousProjet
import com.mikaservices.platform.modules.projet.mapper.SousProjetMapper
import com.mikaservices.platform.modules.projet.repository.SousProjetRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class SousProjetService(
    private val sousProjetRepository: SousProjetRepository,
    private val projetService: ProjetService,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(SousProjetService::class.java)

    fun create(request: SousProjetCreateRequest): SousProjetResponse {
        if (sousProjetRepository.existsByCode(request.code)) {
            throw ConflictException("Un sous-projet avec le code '${request.code}' existe déjà")
        }

        val projet = projetService.getProjetById(request.projetId)

        val sousProjet = SousProjet(
            projet = projet,
            code = request.code,
            nom = request.nom,
            description = request.description,
            typeTravaux = request.typeTravaux,
            statut = request.statut,
            montantHT = request.montantHT,
            montantTTC = request.montantTTC,
            delaiMois = request.delaiMois,
            dateDebut = request.dateDebut,
            dateFin = request.dateFin
        )

        request.responsableId?.let { userId ->
            sousProjet.responsable = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        val saved = sousProjetRepository.save(sousProjet)
        logger.info("Sous-projet créé: ${saved.code} - ${saved.nom}")
        return SousProjetMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<SousProjetResponse> {
        return sousProjetRepository.findByProjetId(projetId, pageable).map { SousProjetMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): SousProjetResponse {
        val sousProjet = getSousProjetById(id)
        return SousProjetMapper.toResponse(sousProjet)
    }

    fun update(id: Long, request: SousProjetUpdateRequest): SousProjetResponse {
        val sousProjet = getSousProjetById(id)

        request.nom?.let { sousProjet.nom = it }
        request.description?.let { sousProjet.description = it }
        request.typeTravaux?.let { sousProjet.typeTravaux = it }
        request.statut?.let { sousProjet.statut = it }
        request.montantHT?.let { sousProjet.montantHT = it }
        request.montantTTC?.let { sousProjet.montantTTC = it }
        request.delaiMois?.let { sousProjet.delaiMois = it }
        request.dateDebut?.let { sousProjet.dateDebut = it }
        request.dateFin?.let { sousProjet.dateFin = it }
        request.avancementPhysique?.let { sousProjet.avancementPhysique = it }

        request.responsableId?.let { userId ->
            sousProjet.responsable = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        val saved = sousProjetRepository.save(sousProjet)
        logger.info("Sous-projet mis à jour: ${saved.code}")
        return SousProjetMapper.toResponse(saved)
    }

    fun delete(id: Long) {
        val sousProjet = getSousProjetById(id)
        sousProjetRepository.delete(sousProjet)
        logger.info("Sous-projet supprimé: ${sousProjet.code}")
    }

    private fun getSousProjetById(id: Long): SousProjet {
        return sousProjetRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Sous-projet non trouvé avec l'ID: $id") }
    }
}
