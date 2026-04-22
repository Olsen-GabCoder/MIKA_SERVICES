package com.mikaservices.platform.modules.qshe.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.qshe.dto.request.PermisTravailCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.PermisTravailUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.PermisTravailResponse
import com.mikaservices.platform.modules.qshe.dto.response.PermisTravailSummaryResponse
import com.mikaservices.platform.modules.qshe.entity.PermisTravail
import com.mikaservices.platform.modules.qshe.enums.StatutPermis
import com.mikaservices.platform.modules.qshe.mapper.PermisTravailMapper
import com.mikaservices.platform.modules.qshe.repository.PermisTravailRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Service
@Transactional
class PermisTravailService(
    private val permisRepository: PermisTravailRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(PermisTravailService::class.java)

    fun create(req: PermisTravailCreateRequest): PermisTravailResponse {
        val projet = projetRepository.findById(req.projetId)
            .orElseThrow { ResourceNotFoundException("Projet introuvable : ${req.projetId}") }
        val demandeur = req.demandeurId?.let { userRepository.findById(it).orElse(null) }
        val reference = "PTW-%05d".format(permisRepository.count() + 1)

        val permis = PermisTravail(
            projet = projet, reference = reference, typePermis = req.typePermis,
            descriptionTravaux = req.descriptionTravaux, zoneTravail = req.zoneTravail,
            dateDebutValidite = req.dateDebutValidite, heureDebut = req.heureDebut,
            dateFinValidite = req.dateFinValidite, heureFin = req.heureFin,
            mesuresSecurite = req.mesuresSecurite, conditionsParticulieres = req.conditionsParticulieres,
            demandeur = demandeur
        )
        val saved = permisRepository.save(permis)
        logger.info("Permis de travail créé : ${saved.reference} (${saved.typePermis})")
        return PermisTravailMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long, pageable: Pageable): Page<PermisTravailResponse> =
        permisRepository.findByProjetId(projetId, pageable).map { PermisTravailMapper.toResponse(it) }

    @Transactional(readOnly = true)
    fun findById(id: Long): PermisTravailResponse = PermisTravailMapper.toResponse(getById(id))

    fun update(id: Long, req: PermisTravailUpdateRequest): PermisTravailResponse {
        val permis = getById(id)
        req.typePermis?.let { permis.typePermis = it }
        req.descriptionTravaux?.let { permis.descriptionTravaux = it }
        req.statut?.let {
            permis.statut = it
            if (it == StatutPermis.APPROUVE && permis.dateApprobation == null) permis.dateApprobation = LocalDateTime.now()
            if (it == StatutPermis.CLOTURE && permis.dateCloture == null) permis.dateCloture = LocalDateTime.now()
        }
        req.zoneTravail?.let { permis.zoneTravail = it }
        req.dateDebutValidite?.let { permis.dateDebutValidite = it }
        req.heureDebut?.let { permis.heureDebut = it }
        req.dateFinValidite?.let { permis.dateFinValidite = it }
        req.heureFin?.let { permis.heureFin = it }
        req.mesuresSecurite?.let { permis.mesuresSecurite = it }
        req.conditionsParticulieres?.let { permis.conditionsParticulieres = it }
        req.autorisateurId?.let { permis.autorisateur = userRepository.findById(it).orElse(null) }
        req.observationsCloture?.let { permis.observationsCloture = it }
        val saved = permisRepository.save(permis)
        logger.info("Permis mis à jour : ${saved.reference} → ${saved.statut}")
        return PermisTravailMapper.toResponse(saved)
    }

    fun delete(id: Long) { permisRepository.delete(getById(id)); logger.info("Permis supprimé : id=$id") }

    @Transactional(readOnly = true)
    fun getSummary(projetId: Long): PermisTravailSummaryResponse {
        val total = permisRepository.countByProjetId(projetId)
        val actifs = permisRepository.countActifsByProjet(projetId)
        val expires = permisRepository.findExpires(LocalDate.now()).count { it.projet.id == projetId }.toLong()
        return PermisTravailSummaryResponse(total, actifs, expires)
    }

    private fun getById(id: Long): PermisTravail = permisRepository.findById(id)
        .orElseThrow { ResourceNotFoundException("Permis introuvable : $id") }
}
