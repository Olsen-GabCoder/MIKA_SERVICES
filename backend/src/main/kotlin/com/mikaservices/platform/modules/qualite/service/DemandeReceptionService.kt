package com.mikaservices.platform.modules.qualite.service

import com.mikaservices.platform.modules.qualite.dto.request.DemandeReceptionCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.DemandeReceptionUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.response.DemandeReceptionResponse
import com.mikaservices.platform.modules.qualite.dto.response.ReceptionSummaryResponse
import com.mikaservices.platform.modules.qualite.entity.DemandeReception
import com.mikaservices.platform.modules.qualite.enums.NatureReception
import com.mikaservices.platform.modules.qualite.enums.SousTypeReception
import com.mikaservices.platform.modules.qualite.enums.StatutReception
import com.mikaservices.platform.modules.qualite.mapper.DemandeReceptionMapper
import com.mikaservices.platform.modules.qualite.repository.DemandeReceptionRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import jakarta.persistence.EntityNotFoundException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.YearMonth

@Service
@Transactional
class DemandeReceptionService(
    private val repository: DemandeReceptionRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository,
) {

    fun create(request: DemandeReceptionCreateRequest): DemandeReceptionResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { EntityNotFoundException("Projet ${request.projetId} introuvable") }

        val demandeur = request.demandeurId?.let {
            userRepository.findById(it).orElseThrow { EntityNotFoundException("Utilisateur $it introuvable") }
        }

        val mois = request.moisReference ?: YearMonth.now().toString()
        val count = repository.countByProjetAndMois(request.projetId, mois) + 1
        val prefix = when (request.nature) {
            NatureReception.TOPOGRAPHIE -> "TOPO"
            NatureReception.GEOTECHNIQUE_LABORATOIRE -> "GEO"
            NatureReception.OUVRAGE -> "OUV"
        }
        val stPrefix = if (request.sousType == SousTypeReception.TERRASSEMENT) "T" else "GC"
        val reference = "DR-$prefix-$stPrefix-${String.format("%04d", count)}"

        val entity = DemandeReception(
            projet = projet,
            reference = reference,
            titre = request.titre,
            nature = request.nature,
            sousType = request.sousType,
            description = request.description,
            zoneOuvrage = request.zoneOuvrage,
            dateDemande = request.dateDemande ?: LocalDate.now(),
            demandeur = demandeur,
            moisReference = mois,
        )
        return DemandeReceptionMapper.toResponse(repository.save(entity))
    }

    @Transactional(readOnly = true)
    fun findAll(
        projetId: Long?,
        nature: NatureReception?,
        sousType: SousTypeReception?,
        pageable: Pageable
    ): Page<DemandeReceptionResponse> {
        val page = when {
            projetId != null && nature != null && sousType != null ->
                repository.findByProjetIdAndNatureAndSousType(projetId, nature, sousType, pageable)
            projetId != null && nature != null ->
                repository.findByProjetIdAndNature(projetId, nature, pageable)
            projetId != null && sousType != null ->
                repository.findByProjetIdAndSousType(projetId, sousType, pageable)
            projetId != null ->
                repository.findByProjetId(projetId, pageable)
            nature != null && sousType != null ->
                repository.findByNatureAndSousType(nature, sousType, pageable)
            nature != null ->
                repository.findByNature(nature, pageable)
            sousType != null ->
                repository.findBySousType(sousType, pageable)
            else ->
                repository.findAll(pageable)
        }
        return page.map(DemandeReceptionMapper::toResponse)
    }

    @Transactional(readOnly = true)
    fun findByProjet(
        projetId: Long,
        nature: NatureReception?,
        sousType: SousTypeReception?,
        pageable: Pageable
    ): Page<DemandeReceptionResponse> = findAll(projetId, nature, sousType, pageable)

    @Transactional(readOnly = true)
    fun findById(id: Long): DemandeReceptionResponse {
        val entity = repository.findById(id)
            .orElseThrow { EntityNotFoundException("DemandeReception $id introuvable") }
        return DemandeReceptionMapper.toResponse(entity)
    }

    fun update(id: Long, request: DemandeReceptionUpdateRequest): DemandeReceptionResponse {
        val entity = repository.findById(id)
            .orElseThrow { EntityNotFoundException("DemandeReception $id introuvable") }

        request.titre?.let { entity.titre = it }
        request.description?.let { entity.description = it }
        request.zoneOuvrage?.let { entity.zoneOuvrage = it }
        request.dateDemande?.let { entity.dateDemande = it }
        request.observations?.let { entity.observations = it }

        request.statut?.let { newStatut ->
            entity.statut = newStatut
            if (newStatut != StatutReception.ETABLIE && entity.dateDecision == null) {
                entity.dateDecision = request.dateDecision ?: LocalDate.now()
            }
        }

        request.decideurId?.let { decideurId ->
            entity.decideur = userRepository.findById(decideurId)
                .orElseThrow { EntityNotFoundException("Utilisateur $decideurId introuvable") }
        }

        return DemandeReceptionMapper.toResponse(repository.save(entity))
    }

    fun delete(id: Long) {
        if (!repository.existsById(id)) throw EntityNotFoundException("DemandeReception $id introuvable")
        repository.deleteById(id)
    }

    /** Résumé par nature × sous-type pour un mois donné (blocs 1-3 du Document A) */
    @Transactional(readOnly = true)
    fun getSummary(projetId: Long, moisReference: String): List<ReceptionSummaryResponse> {
        val results = mutableListOf<ReceptionSummaryResponse>()
        for (nature in NatureReception.entries) {
            for (sousType in SousTypeReception.entries) {
                val rows = repository.countByProjetAndNatureAndSousTypeAndMois(
                    projetId, nature, sousType, moisReference
                )
                val parStatut = mutableMapOf<StatutReception, Long>()
                var total = 0L
                for (row in rows) {
                    val statut = row[0] as StatutReception
                    val count = row[1] as Long
                    parStatut[statut] = count
                    total += count
                }
                results.add(ReceptionSummaryResponse(nature, sousType, total, parStatut))
            }
        }
        return results
    }
}
