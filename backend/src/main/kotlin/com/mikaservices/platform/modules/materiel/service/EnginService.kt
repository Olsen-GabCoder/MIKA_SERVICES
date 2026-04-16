package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.TypeEngin
import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.AffectationEnginRequest
import com.mikaservices.platform.modules.materiel.dto.request.EnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.EnginUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.response.AffectationEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginSummaryResponse
import com.mikaservices.platform.modules.materiel.entity.AffectationEnginChantier
import com.mikaservices.platform.modules.materiel.entity.Engin
import com.mikaservices.platform.modules.materiel.mapper.EnginMapper
import com.mikaservices.platform.modules.materiel.repository.AffectationEnginChantierRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class EnginService(
    private val enginRepository: EnginRepository,
    private val affectationRepository: AffectationEnginChantierRepository,
    private val projetRepository: ProjetRepository
) {
    private val logger = LoggerFactory.getLogger(EnginService::class.java)

    fun create(request: EnginCreateRequest): EnginResponse {
        if (enginRepository.existsByCode(request.code)) {
            throw ConflictException("Un engin avec le code '${request.code}' existe déjà")
        }
        val engin = Engin(
            code = request.code, nom = request.nom, type = request.type,
            marque = request.marque, modele = request.modele,
            immatriculation = request.immatriculation, numeroSerie = request.numeroSerie,
            anneeFabrication = request.anneeFabrication, dateAcquisition = request.dateAcquisition,
            valeurAcquisition = request.valeurAcquisition, proprietaire = request.proprietaire,
            estLocation = request.estLocation, coutLocationJournalier = request.coutLocationJournalier
        )
        val saved = enginRepository.save(engin)
        logger.info("Engin créé: ${saved.code} - ${saved.nom}")
        return EnginMapper.toResponse(saved)
    }

    /** Construit un index enginId → nom du chantier en cours, en un seul batch. */
    private fun buildChantierIndex(enginIds: List<Long>): Map<Long, String> {
        if (enginIds.isEmpty()) return emptyMap()
        val affectations = affectationRepository.findByEnginIdInAndStatut(enginIds, StatutAffectation.EN_COURS)
        return affectations.associate { it.engin.id!! to it.projet.nom }
    }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable, statut: StatutEngin? = null, type: TypeEngin? = null): Page<EnginSummaryResponse> {
        val page = if (statut == null && type == null) {
            enginRepository.findByActifTrue(pageable)
        } else {
            enginRepository.findByFilters(statut, type, pageable)
        }
        val chantierIndex = buildChantierIndex(page.content.mapNotNull { it.id })
        return page.map { EnginMapper.toSummaryResponse(it, chantierIndex[it.id]) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): EnginResponse {
        return EnginMapper.toResponse(getEnginById(id))
    }

    @Transactional(readOnly = true)
    fun search(search: String, pageable: Pageable): Page<EnginSummaryResponse> {
        val page = enginRepository.search(search, pageable)
        val chantierIndex = buildChantierIndex(page.content.mapNotNull { it.id })
        return page.map { EnginMapper.toSummaryResponse(it, chantierIndex[it.id]) }
    }

    @Transactional(readOnly = true)
    fun findDisponibles(): List<EnginSummaryResponse> {
        return enginRepository.findByStatutAndActifTrue(StatutEngin.DISPONIBLE)
            .map { EnginMapper.toSummaryResponse(it) }
    }

    fun update(id: Long, request: EnginUpdateRequest): EnginResponse {
        val engin = getEnginById(id)
        request.nom?.let { engin.nom = it }
        request.type?.let { engin.type = it }
        request.marque?.let { engin.marque = it }
        request.modele?.let { engin.modele = it }
        request.immatriculation?.let { engin.immatriculation = it }
        request.numeroSerie?.let { engin.numeroSerie = it }
        request.anneeFabrication?.let { engin.anneeFabrication = it }
        request.heuresCompteur?.let { engin.heuresCompteur = it }
        request.statut?.let { engin.statut = it }
        request.proprietaire?.let { engin.proprietaire = it }
        request.estLocation?.let { engin.estLocation = it }
        request.coutLocationJournalier?.let { engin.coutLocationJournalier = it }
        val saved = enginRepository.save(engin)
        logger.info("Engin mis à jour: ${saved.code}")
        return EnginMapper.toResponse(saved)
    }

    fun delete(id: Long) {
        val engin = getEnginById(id)
        engin.actif = false
        enginRepository.save(engin)
        logger.info("Engin désactivé: ${engin.code}")
    }

    // ========== Affectations ==========
    fun affecterEngin(request: AffectationEnginRequest): AffectationEnginResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: ${request.projetId}") }
        val engin = getEnginById(request.enginId)
        val affectation = AffectationEnginChantier(
            projet = projet, engin = engin, dateDebut = request.dateDebut,
            dateFin = request.dateFin, heuresPrevues = request.heuresPrevues,
            statut = request.statut, observations = request.observations
        )
        val saved = affectationRepository.save(affectation)
        logger.info("Engin ${engin.code} affecté au projet ${projet.nom}")
        return EnginMapper.toAffectationResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAffectationsByProjet(projetId: Long, pageable: Pageable): Page<AffectationEnginResponse> {
        return affectationRepository.findByProjetId(projetId, pageable)
            .map { EnginMapper.toAffectationResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findAffectationsByEngin(enginId: Long): List<AffectationEnginResponse> {
        return affectationRepository.findByEnginId(enginId).map { EnginMapper.toAffectationResponse(it) }
    }

    private fun getEnginById(id: Long): Engin {
        return enginRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Engin non trouvé avec l'ID: $id") }
    }
}
