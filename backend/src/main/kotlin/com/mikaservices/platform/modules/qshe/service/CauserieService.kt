package com.mikaservices.platform.modules.qshe.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.qshe.dto.request.CauserieCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.CauserieUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.CauserieResponse
import com.mikaservices.platform.modules.qshe.dto.response.CauserieSummaryResponse
import com.mikaservices.platform.modules.qshe.entity.Causerie
import com.mikaservices.platform.modules.qshe.mapper.CauserieMapper
import com.mikaservices.platform.modules.qshe.repository.CauserieRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class CauserieService(
    private val causerieRepository: CauserieRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(CauserieService::class.java)

    fun create(req: CauserieCreateRequest): CauserieResponse {
        val projet = projetRepository.findById(req.projetId)
            .orElseThrow { ResourceNotFoundException("Projet introuvable : ${req.projetId}") }
        val animateur = req.animateurId?.let { userRepository.findById(it).orElse(null) }
        val reference = "CAU-%05d".format(causerieRepository.count() + 1)

        val causerie = Causerie(
            projet = projet, reference = reference, sujet = req.sujet,
            description = req.description, dateCauserie = req.dateCauserie,
            heureDebut = req.heureDebut, dureeMinutes = req.dureeMinutes,
            lieu = req.lieu, animateur = animateur
        )
        if (req.participantIds.isNotEmpty()) {
            causerie.participants.addAll(userRepository.findAllById(req.participantIds))
        }
        val saved = causerieRepository.save(causerie)
        logger.info("Causerie créée : ${saved.reference} (${saved.participants.size} participants)")
        return CauserieMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long, pageable: Pageable): Page<CauserieResponse> =
        causerieRepository.findByProjetId(projetId, pageable).map { CauserieMapper.toResponse(it) }

    @Transactional(readOnly = true)
    fun findById(id: Long): CauserieResponse = CauserieMapper.toResponse(getById(id))

    fun update(id: Long, req: CauserieUpdateRequest): CauserieResponse {
        val causerie = getById(id)
        req.sujet?.let { causerie.sujet = it }
        req.description?.let { causerie.description = it }
        req.dateCauserie?.let { causerie.dateCauserie = it }
        req.heureDebut?.let { causerie.heureDebut = it }
        req.dureeMinutes?.let { causerie.dureeMinutes = it }
        req.lieu?.let { causerie.lieu = it }
        req.animateurId?.let { causerie.animateur = userRepository.findById(it).orElse(null) }
        req.observations?.let { causerie.observations = it }
        req.participantIds?.let { ids ->
            causerie.participants.clear()
            causerie.participants.addAll(userRepository.findAllById(ids))
        }
        val saved = causerieRepository.save(causerie)
        logger.info("Causerie mise à jour : ${saved.reference}")
        return CauserieMapper.toResponse(saved)
    }

    fun delete(id: Long) { causerieRepository.delete(getById(id)); logger.info("Causerie supprimée : id=$id") }

    @Transactional(readOnly = true)
    fun getSummary(projetId: Long): CauserieSummaryResponse {
        val total = causerieRepository.countByProjetId(projetId)
        val debut = LocalDate.now().withDayOfMonth(1)
        val fin = debut.plusMonths(1).minusDays(1)
        val ceMois = causerieRepository.countByProjetIdAndPeriode(projetId, debut, fin)
        val all = causerieRepository.findByProjetId(projetId, Pageable.unpaged()).content
        val moyParticipants = if (all.isNotEmpty()) all.map { it.participants.size.toDouble() }.average() else 0.0
        return CauserieSummaryResponse(total, ceMois, Math.round(moyParticipants * 10.0) / 10.0)
    }

    private fun getById(id: Long): Causerie = causerieRepository.findById(id)
        .orElseThrow { ResourceNotFoundException("Causerie introuvable : $id") }
}
