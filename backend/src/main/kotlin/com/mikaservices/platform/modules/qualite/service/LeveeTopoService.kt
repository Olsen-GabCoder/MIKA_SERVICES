package com.mikaservices.platform.modules.qualite.service

import com.mikaservices.platform.modules.qualite.dto.request.LeveeTopoCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.LeveeTopoUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.response.LeveeTopoResponse
import com.mikaservices.platform.modules.qualite.entity.LeveeTopographique
import com.mikaservices.platform.modules.qualite.mapper.LeveeTopoMapper
import com.mikaservices.platform.modules.qualite.repository.LeveeTopoRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import jakarta.persistence.EntityNotFoundException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.YearMonth

@Service
@Transactional
class LeveeTopoService(
    private val repository: LeveeTopoRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository,
) {

    fun create(request: LeveeTopoCreateRequest): LeveeTopoResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { EntityNotFoundException("Projet ${request.projetId} introuvable") }

        val mois = request.moisReference ?: YearMonth.now().toString()

        repository.findByProjetIdAndMoisReference(request.projetId, mois).ifPresent {
            throw IllegalStateException("Une levée topographique existe déjà pour ce projet et ce mois ($mois)")
        }

        val saisiPar = request.saisiParId?.let {
            userRepository.findById(it).orElseThrow { EntityNotFoundException("Utilisateur $it introuvable") }
        }

        val entity = LeveeTopographique(
            projet = projet,
            moisReference = mois,
            nbProfilsImplantes = request.nbProfilsImplantes,
            nbProfilsReceptionnes = request.nbProfilsReceptionnes,
            nbControlesRealises = request.nbControlesRealises,
            observations = request.observations,
            saisiPar = saisiPar,
        )
        return LeveeTopoMapper.toResponse(repository.save(entity))
    }

    @Transactional(readOnly = true)
    fun findAll(projetId: Long?, pageable: Pageable): Page<LeveeTopoResponse> =
        if (projetId != null) repository.findByProjetId(projetId, pageable).map(LeveeTopoMapper::toResponse)
        else repository.findAll(pageable).map(LeveeTopoMapper::toResponse)

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long, pageable: Pageable): Page<LeveeTopoResponse> =
        findAll(projetId, pageable)

    @Transactional(readOnly = true)
    fun findByProjetAndMois(projetId: Long, moisReference: String): LeveeTopoResponse? =
        repository.findByProjetIdAndMoisReference(projetId, moisReference)
            .map(LeveeTopoMapper::toResponse)
            .orElse(null)

    @Transactional(readOnly = true)
    fun findById(id: Long): LeveeTopoResponse {
        val entity = repository.findById(id)
            .orElseThrow { EntityNotFoundException("LeveeTopographique $id introuvable") }
        return LeveeTopoMapper.toResponse(entity)
    }

    fun update(id: Long, request: LeveeTopoUpdateRequest): LeveeTopoResponse {
        val entity = repository.findById(id)
            .orElseThrow { EntityNotFoundException("LeveeTopographique $id introuvable") }

        request.nbProfilsImplantes?.let { entity.nbProfilsImplantes = it }
        request.nbProfilsReceptionnes?.let { entity.nbProfilsReceptionnes = it }
        request.nbControlesRealises?.let { entity.nbControlesRealises = it }
        request.observations?.let { entity.observations = it }

        return LeveeTopoMapper.toResponse(repository.save(entity))
    }

    fun delete(id: Long) {
        if (!repository.existsById(id)) throw EntityNotFoundException("LeveeTopographique $id introuvable")
        repository.deleteById(id)
    }
}
