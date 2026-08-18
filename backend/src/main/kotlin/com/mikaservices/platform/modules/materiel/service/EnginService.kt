package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.TypeEngin
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.AffectationEnginRequest
import com.mikaservices.platform.modules.materiel.dto.request.AffectationEnginUpdateRequest
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
import com.mikaservices.platform.common.service.FileStorageService
import org.slf4j.LoggerFactory
import org.springframework.core.io.Resource
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.time.LocalDate
import java.time.Year
import java.util.UUID

@Service
@Transactional
class EnginService(
    private val enginRepository: EnginRepository,
    private val affectationRepository: AffectationEnginChantierRepository,
    private val projetRepository: ProjetRepository,
    private val fileStorage: FileStorageService
) {
    private val logger = LoggerFactory.getLogger(EnginService::class.java)

    fun create(request: EnginCreateRequest): EnginResponse {
        val code = if (request.code.isNullOrBlank()) generateCode() else request.code
        if (enginRepository.existsByCode(code)) {
            throw ConflictException("Un engin avec le code '$code' existe déjà")
        }
        val engin = Engin(
            code = code, nom = request.nom, type = request.type,
            marque = request.marque, modele = request.modele,
            immatriculation = request.immatriculation, numeroSerie = request.numeroSerie,
            anneeFabrication = request.anneeFabrication, dateAcquisition = request.dateAcquisition,
            dateMiseEnService = request.dateMiseEnService,
            valeurAcquisition = request.valeurAcquisition, proprietaire = request.proprietaire,
            estLocation = request.estLocation, coutLocationJournalier = request.coutLocationJournalier,
            etat = request.etat, modeAcquisition = request.modeAcquisition,
            carburant = request.carburant, puissance = request.puissance,
            poids = request.poids, capacite = request.capacite,
            caracteristiques = request.caracteristiques, notes = request.notes,
            qrCodeToken = UUID.randomUUID().toString().replace("-", "")
        )
        val saved = enginRepository.save(engin)
        logger.info("Engin créé: ${saved.code} - ${saved.nom}")
        return EnginMapper.toResponse(saved)
    }

    /** Génère un code au format ENG-{année}-{séquence sur 3 chiffres}. */
    private fun generateCode(): String {
        val year = Year.now().value
        val prefix = "ENG-$year-"
        val maxSeq = enginRepository.findMaxSequenceForPrefix("$prefix%") ?: 0
        return "$prefix${(maxSeq + 1).toString().padStart(3, '0')}"
    }

    /** Construit un index enginId -> nom du chantier en cours, en un seul batch. */
    private fun buildChantierIndex(enginIds: List<Long>): Map<Long, String> {
        if (enginIds.isEmpty()) return emptyMap()
        val affectations = affectationRepository.findByEnginIdInAndStatut(enginIds, StatutAffectation.EN_COURS)
        return affectations.associate { it.engin.id!! to it.projet.nom }
    }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable, statut: StatutEngin? = null, type: TypeEngin? = null, projetId: Long? = null): Page<EnginSummaryResponse> {
        val page = if (projetId != null) {
            enginRepository.findByChantier(projetId, statut, type, pageable)
        } else if (statut == null && type == null) {
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
        request.etat?.let { engin.etat = it }
        request.modeAcquisition?.let { engin.modeAcquisition = it }
        request.dateMiseEnService?.let { engin.dateMiseEnService = it }
        request.carburant?.let { engin.carburant = it }
        request.puissance?.let { engin.puissance = it }
        request.poids?.let { engin.poids = it }
        request.capacite?.let { engin.capacite = it }
        request.caracteristiques?.let { engin.caracteristiques = it }
        request.notes?.let { engin.notes = it }
        request.latitude?.let { engin.latitude = it }
        request.longitude?.let { engin.longitude = it }
        if (request.latitude != null || request.longitude != null) {
            engin.positionMaj = java.time.Instant.now()
        }
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

        // Détection de conflit d'affectation
        val dateFin = request.dateFin ?: LocalDate.now().plusYears(10)
        val conflits = affectationRepository.findConflits(request.enginId, request.dateDebut, dateFin)
        if (conflits.isNotEmpty()) {
            val conflit = conflits.first()
            throw ConflictException(
                "Conflit d'affectation : l'engin ${engin.code} est déjà affecté au projet " +
                "${conflit.projet.nom} du ${conflit.dateDebut} au ${conflit.dateFin ?: "indéterminé"}"
            )
        }

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

    fun updateAffectation(affectationId: Long, request: AffectationEnginUpdateRequest): AffectationEnginResponse {
        val affectation = affectationRepository.findById(affectationId)
            .orElseThrow { ResourceNotFoundException("Affectation non trouvée avec l'ID: $affectationId") }

        val newDateDebut = request.dateDebut ?: affectation.dateDebut
        val newDateFin = request.dateFin ?: affectation.dateFin
        if (newDateFin != null && newDateFin.isBefore(newDateDebut)) {
            throw BadRequestException("La date de fin ne peut pas être antérieure à la date de début")
        }

        // Re-vérifier les conflits si l'affectation reste active
        val newStatut = request.statut ?: affectation.statut
        if (newStatut in listOf(StatutAffectation.PLANIFIEE, StatutAffectation.EN_COURS)) {
            val borneFin = newDateFin ?: LocalDate.now().plusYears(10)
            val conflits = affectationRepository.findConflits(affectation.engin.id!!, newDateDebut, borneFin)
                .filter { it.id != affectationId }
            if (conflits.isNotEmpty()) {
                val conflit = conflits.first()
                throw ConflictException(
                    "Conflit d'affectation : l'engin ${affectation.engin.code} est déjà affecté au projet " +
                    "${conflit.projet.nom} du ${conflit.dateDebut} au ${conflit.dateFin ?: "indéterminé"}"
                )
            }
        }

        affectation.dateDebut = newDateDebut
        affectation.dateFin = newDateFin
        request.heuresPrevues?.let { affectation.heuresPrevues = it }
        request.heuresReelles?.let { affectation.heuresReelles = it }
        request.statut?.let { affectation.statut = it }
        request.observations?.let { affectation.observations = it }

        val saved = affectationRepository.save(affectation)
        logger.info("Affectation $affectationId mise à jour (engin ${affectation.engin.code}, statut ${saved.statut})")
        return EnginMapper.toAffectationResponse(saved)
    }

    fun terminerAffectation(affectationId: Long): AffectationEnginResponse {
        val affectation = affectationRepository.findById(affectationId)
            .orElseThrow { ResourceNotFoundException("Affectation non trouvée avec l'ID: $affectationId") }
        if (affectation.statut == StatutAffectation.TERMINEE) {
            throw BadRequestException("Cette affectation est déjà terminée")
        }
        affectation.statut = StatutAffectation.TERMINEE
        if (affectation.dateFin == null || affectation.dateFin!!.isAfter(LocalDate.now())) {
            affectation.dateFin = LocalDate.now()
        }
        val saved = affectationRepository.save(affectation)
        logger.info("Affectation $affectationId terminée (engin ${affectation.engin.code} libéré)")
        return EnginMapper.toAffectationResponse(saved)
    }

    fun deleteAffectation(affectationId: Long) {
        val affectation = affectationRepository.findById(affectationId)
            .orElseThrow { ResourceNotFoundException("Affectation non trouvée avec l'ID: $affectationId") }
        affectationRepository.delete(affectation)
        logger.info("Affectation $affectationId supprimée (engin ${affectation.engin.code})")
    }

    @Transactional(readOnly = true)
    fun findAffectationsForPlanning(): List<AffectationEnginResponse> {
        val statuts = listOf(StatutAffectation.PLANIFIEE, StatutAffectation.EN_COURS, StatutAffectation.SUSPENDUE)
        return affectationRepository.findByStatutIn(statuts).map { EnginMapper.toAffectationResponse(it) }
    }

    // ========== Photo ==========
    fun uploadPhoto(id: Long, file: MultipartFile): EnginResponse {
        val maxSize = 5L * 1024 * 1024
        if (file.size > maxSize) throw BadRequestException("Fichier trop volumineux (max 5 Mo)")
        val allowedTypes = listOf("image/jpeg", "image/png", "image/webp")
        if (file.contentType !in allowedTypes) throw BadRequestException("Format non autorisé (JPEG, PNG ou WebP uniquement)")
        val engin = getEnginById(id)
        val ancien = engin.photo
        engin.photo = fileStorage.store(file, "engins", "${engin.id}_${System.currentTimeMillis()}")
        if (ancien != null && ancien != engin.photo) fileStorage.delete(ancien)
        enginRepository.save(engin)
        logger.info("Photo mise à jour pour l'engin: ${engin.code}")
        return EnginMapper.toResponse(engin)
    }

    @Transactional(readOnly = true)
    fun getPhotoResource(id: Long): Resource? {
        val engin = getEnginById(id)
        return fileStorage.resolve(engin.photo)
    }

    private fun getEnginById(id: Long): Engin {
        return enginRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Engin non trouvé avec l'ID: $id") }
    }
}
