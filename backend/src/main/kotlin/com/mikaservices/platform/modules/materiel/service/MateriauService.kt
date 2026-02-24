package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.AffectationMateriauRequest
import com.mikaservices.platform.modules.materiel.dto.request.MateriauCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.MateriauUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.response.AffectationMateriauResponse
import com.mikaservices.platform.modules.materiel.dto.response.MateriauResponse
import com.mikaservices.platform.modules.materiel.dto.response.MateriauSummaryResponse
import com.mikaservices.platform.modules.materiel.entity.AffectationMateriauChantier
import com.mikaservices.platform.modules.materiel.entity.Materiau
import com.mikaservices.platform.modules.materiel.mapper.MateriauMapper
import com.mikaservices.platform.modules.materiel.repository.AffectationMateriauChantierRepository
import com.mikaservices.platform.modules.materiel.repository.MateriauRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class MateriauService(
    private val materiauRepository: MateriauRepository,
    private val affectationRepository: AffectationMateriauChantierRepository,
    private val projetRepository: ProjetRepository
) {
    private val logger = LoggerFactory.getLogger(MateriauService::class.java)

    fun create(request: MateriauCreateRequest): MateriauResponse {
        if (materiauRepository.existsByCode(request.code)) {
            throw ConflictException("Un matériau avec le code '${request.code}' existe déjà")
        }
        val materiau = Materiau(
            code = request.code, nom = request.nom, type = request.type, unite = request.unite,
            description = request.description, prixUnitaire = request.prixUnitaire,
            stockActuel = request.stockActuel, stockMinimum = request.stockMinimum,
            fournisseur = request.fournisseur
        )
        val saved = materiauRepository.save(materiau)
        logger.info("Matériau créé: ${saved.code} - ${saved.nom}")
        return MateriauMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<MateriauSummaryResponse> {
        return materiauRepository.findByActifTrue(pageable).map { MateriauMapper.toSummaryResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): MateriauResponse {
        return MateriauMapper.toResponse(getMateriauById(id))
    }

    @Transactional(readOnly = true)
    fun search(search: String, pageable: Pageable): Page<MateriauSummaryResponse> {
        return materiauRepository.search(search, pageable).map { MateriauMapper.toSummaryResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findStockBas(): List<MateriauSummaryResponse> {
        return materiauRepository.findStockBas().map { MateriauMapper.toSummaryResponse(it) }
    }

    fun update(id: Long, request: MateriauUpdateRequest): MateriauResponse {
        val materiau = getMateriauById(id)
        request.nom?.let { materiau.nom = it }
        request.type?.let { materiau.type = it }
        request.unite?.let { materiau.unite = it }
        request.description?.let { materiau.description = it }
        request.prixUnitaire?.let { materiau.prixUnitaire = it }
        request.stockActuel?.let { materiau.stockActuel = it }
        request.stockMinimum?.let { materiau.stockMinimum = it }
        request.fournisseur?.let { materiau.fournisseur = it }
        val saved = materiauRepository.save(materiau)
        logger.info("Matériau mis à jour: ${saved.code}")
        return MateriauMapper.toResponse(saved)
    }

    fun delete(id: Long) {
        val materiau = getMateriauById(id)
        materiau.actif = false
        materiauRepository.save(materiau)
        logger.info("Matériau désactivé: ${materiau.code}")
    }

    // ========== Affectations ==========
    fun affecterMateriau(request: AffectationMateriauRequest): AffectationMateriauResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: ${request.projetId}") }
        val materiau = getMateriauById(request.materiauId)

        val affectation = AffectationMateriauChantier(
            projet = projet, materiau = materiau,
            quantiteAffectee = request.quantiteAffectee, unite = request.unite,
            dateAffectation = request.dateAffectation, observations = request.observations
        )

        // Déduire du stock
        materiau.stockActuel = materiau.stockActuel.subtract(request.quantiteAffectee)
        materiauRepository.save(materiau)

        val saved = affectationRepository.save(affectation)
        logger.info("Matériau ${materiau.code} affecté au projet ${projet.nom}: ${request.quantiteAffectee} ${request.unite}")
        return MateriauMapper.toAffectationResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAffectationsByProjet(projetId: Long, pageable: Pageable): Page<AffectationMateriauResponse> {
        return affectationRepository.findByProjetId(projetId, pageable)
            .map { MateriauMapper.toAffectationResponse(it) }
    }

    private fun getMateriauById(id: Long): Materiau {
        return materiauRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Matériau non trouvé avec l'ID: $id") }
    }
}
