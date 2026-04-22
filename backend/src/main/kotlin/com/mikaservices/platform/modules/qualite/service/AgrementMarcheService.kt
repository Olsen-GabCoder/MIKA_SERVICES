package com.mikaservices.platform.modules.qualite.service

import com.mikaservices.platform.modules.qualite.dto.request.AgrementMarcheCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.AgrementMarcheUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.response.AgrementMarcheResponse
import com.mikaservices.platform.modules.qualite.dto.response.AgrementSummaryResponse
import com.mikaservices.platform.modules.qualite.entity.AgrementMarche
import com.mikaservices.platform.modules.qualite.enums.StatutAgrement
import com.mikaservices.platform.modules.qualite.mapper.AgrementMarcheMapper
import com.mikaservices.platform.modules.qualite.repository.AgrementMarcheRepository
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
class AgrementMarcheService(
    private val repository: AgrementMarcheRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository,
) {

    fun create(request: AgrementMarcheCreateRequest): AgrementMarcheResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { EntityNotFoundException("Projet ${request.projetId} introuvable") }

        val mois = request.moisReference ?: YearMonth.now().toString()
        val count = repository.countTotalByProjetAndMois(request.projetId, mois) + 1
        val reference = "AG-${String.format("%04d", count)}"

        val entity = AgrementMarche(
            projet = projet,
            reference = reference,
            objet = request.objet,
            titre = request.titre,
            statut = request.statut ?: StatutAgrement.PREVU_AU_MARCHE,
            description = request.description,
            dateSoumission = request.dateSoumission ?: LocalDate.now(),
            moisReference = mois,
        )
        return AgrementMarcheMapper.toResponse(repository.save(entity))
    }

    @Transactional(readOnly = true)
    fun findAll(
        projetId: Long?,
        statut: StatutAgrement?,
        pageable: Pageable
    ): Page<AgrementMarcheResponse> {
        val page = when {
            projetId != null && statut != null ->
                repository.findByProjetIdAndStatut(projetId, statut, pageable)
            projetId != null ->
                repository.findByProjetId(projetId, pageable)
            statut != null ->
                repository.findByStatut(statut, pageable)
            else ->
                repository.findAll(pageable)
        }
        return page.map(AgrementMarcheMapper::toResponse)
    }

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long, statut: StatutAgrement?, pageable: Pageable): Page<AgrementMarcheResponse> =
        findAll(projetId, statut, pageable)

    @Transactional(readOnly = true)
    fun findById(id: Long): AgrementMarcheResponse {
        val entity = repository.findById(id)
            .orElseThrow { EntityNotFoundException("AgrementMarche $id introuvable") }
        return AgrementMarcheMapper.toResponse(entity)
    }

    fun update(id: Long, request: AgrementMarcheUpdateRequest): AgrementMarcheResponse {
        val entity = repository.findById(id)
            .orElseThrow { EntityNotFoundException("AgrementMarche $id introuvable") }

        request.objet?.let { entity.objet = it }
        request.titre?.let { entity.titre = it }
        request.description?.let { entity.description = it }
        request.dateSoumission?.let { entity.dateSoumission = it }
        request.observations?.let { entity.observations = it }

        request.statut?.let { newStatut ->
            entity.statut = newStatut
            if (newStatut !in listOf(StatutAgrement.PREVU_AU_MARCHE, StatutAgrement.ETABLI) && entity.dateDecision == null) {
                entity.dateDecision = request.dateDecision ?: LocalDate.now()
            }
        }

        request.decideurId?.let { decideurId ->
            entity.decideur = userRepository.findById(decideurId)
                .orElseThrow { EntityNotFoundException("Utilisateur $decideurId introuvable") }
        }

        return AgrementMarcheMapper.toResponse(repository.save(entity))
    }

    fun delete(id: Long) {
        if (!repository.existsById(id)) throw EntityNotFoundException("AgrementMarche $id introuvable")
        repository.deleteById(id)
    }

    @Transactional(readOnly = true)
    fun getStats(projetId: Long?): Map<StatutAgrement, Long> {
        val rows = if (projetId != null) {
            repository.countByProjetGroupByStatut(projetId)
        } else {
            repository.countAllGroupByStatut()
        }
        return rows.associate { (it[0] as StatutAgrement) to (it[1] as Long) }
    }

    @Transactional(readOnly = true)
    fun getSummary(projetId: Long, moisReference: String): AgrementSummaryResponse {
        val rows = repository.countByProjetAndMois(projetId, moisReference)
        val parStatut = mutableMapOf<StatutAgrement, Long>()
        var total = 0L
        for (row in rows) {
            val statut = row[0] as StatutAgrement
            val count = row[1] as Long
            parStatut[statut] = count
            total += count
        }
        return AgrementSummaryResponse(total, parStatut)
    }
}
