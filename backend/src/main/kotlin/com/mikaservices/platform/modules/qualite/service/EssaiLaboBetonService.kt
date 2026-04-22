package com.mikaservices.platform.modules.qualite.service

import com.mikaservices.platform.modules.qualite.dto.request.EssaiLaboBetonCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.EssaiLaboBetonUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.response.EssaiLaboBetonResponse
import com.mikaservices.platform.modules.qualite.entity.EssaiLaboratoireBeton
import com.mikaservices.platform.modules.qualite.mapper.EssaiLaboBetonMapper
import com.mikaservices.platform.modules.qualite.repository.EssaiLaboBetonRepository
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
class EssaiLaboBetonService(
    private val repository: EssaiLaboBetonRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository,
) {

    fun create(request: EssaiLaboBetonCreateRequest): EssaiLaboBetonResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { EntityNotFoundException("Projet ${request.projetId} introuvable") }

        val mois = request.moisReference ?: YearMonth.now().toString()

        repository.findByProjetIdAndMoisReference(request.projetId, mois).ifPresent {
            throw IllegalStateException("Un essai existe déjà pour ce projet et ce mois ($mois)")
        }

        val saisiPar = request.saisiParId?.let {
            userRepository.findById(it).orElseThrow { EntityNotFoundException("Utilisateur $it introuvable") }
        }

        val entity = EssaiLaboratoireBeton(
            projet = projet,
            moisReference = mois,
            nbCamionsMalaxeursVolumeCoulee = request.nbCamionsMalaxeursVolumeCoulee,
            nbEssaisSlump = request.nbEssaisSlump,
            nbJoursCoulage = request.nbJoursCoulage,
            nbPrelevements = request.nbPrelevements,
            observations = request.observations,
            saisiPar = saisiPar,
        )
        return EssaiLaboBetonMapper.toResponse(repository.save(entity))
    }

    @Transactional(readOnly = true)
    fun findAll(projetId: Long?, pageable: Pageable): Page<EssaiLaboBetonResponse> =
        if (projetId != null) repository.findByProjetId(projetId, pageable).map(EssaiLaboBetonMapper::toResponse)
        else repository.findAll(pageable).map(EssaiLaboBetonMapper::toResponse)

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long, pageable: Pageable): Page<EssaiLaboBetonResponse> =
        findAll(projetId, pageable)

    @Transactional(readOnly = true)
    fun findByProjetAndMois(projetId: Long, moisReference: String): EssaiLaboBetonResponse? =
        repository.findByProjetIdAndMoisReference(projetId, moisReference)
            .map(EssaiLaboBetonMapper::toResponse)
            .orElse(null)

    @Transactional(readOnly = true)
    fun findById(id: Long): EssaiLaboBetonResponse {
        val entity = repository.findById(id)
            .orElseThrow { EntityNotFoundException("EssaiLaboratoireBeton $id introuvable") }
        return EssaiLaboBetonMapper.toResponse(entity)
    }

    fun update(id: Long, request: EssaiLaboBetonUpdateRequest): EssaiLaboBetonResponse {
        val entity = repository.findById(id)
            .orElseThrow { EntityNotFoundException("EssaiLaboratoireBeton $id introuvable") }

        request.nbCamionsMalaxeursVolumeCoulee?.let { entity.nbCamionsMalaxeursVolumeCoulee = it }
        request.nbEssaisSlump?.let { entity.nbEssaisSlump = it }
        request.nbJoursCoulage?.let { entity.nbJoursCoulage = it }
        request.nbPrelevements?.let { entity.nbPrelevements = it }
        request.observations?.let { entity.observations = it }

        return EssaiLaboBetonMapper.toResponse(repository.save(entity))
    }

    fun delete(id: Long) {
        if (!repository.existsById(id)) throw EntityNotFoundException("EssaiLaboratoireBeton $id introuvable")
        repository.deleteById(id)
    }
}
