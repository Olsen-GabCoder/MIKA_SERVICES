package com.mikaservices.platform.modules.reunionhebdo.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.common.enums.StatutReunion
import com.mikaservices.platform.modules.reunionhebdo.dto.request.PointProjetPVRequest
import com.mikaservices.platform.modules.reunionhebdo.dto.request.ReunionHebdoCreateRequest
import com.mikaservices.platform.modules.reunionhebdo.dto.request.ReunionHebdoUpdateRequest
import com.mikaservices.platform.modules.reunionhebdo.dto.response.PointProjetPVResponse
import com.mikaservices.platform.modules.reunionhebdo.dto.response.ReunionHebdoResponse
import com.mikaservices.platform.modules.reunionhebdo.dto.response.ReunionHebdoSummaryResponse
import com.mikaservices.platform.modules.reunionhebdo.entity.ParticipantReunion
import com.mikaservices.platform.modules.reunionhebdo.entity.PointProjetPV
import com.mikaservices.platform.modules.reunionhebdo.entity.ReunionHebdo
import com.mikaservices.platform.modules.reunionhebdo.mapper.ReunionHebdoMapper
import com.mikaservices.platform.modules.reunionhebdo.repository.ParticipantReunionRepository
import com.mikaservices.platform.modules.reunionhebdo.repository.PointProjetPVRepository
import com.mikaservices.platform.modules.reunionhebdo.repository.ReunionHebdoRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class ReunionHebdoService(
    private val reunionHebdoRepository: ReunionHebdoRepository,
    private val participantReunionRepository: ParticipantReunionRepository,
    private val pointProjetPVRepository: PointProjetPVRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(ReunionHebdoService::class.java)

    fun create(request: ReunionHebdoCreateRequest): ReunionHebdoResponse {
        val reunion = ReunionHebdo(
            dateReunion = request.dateReunion,
            lieu = request.lieu,
            heureDebut = request.heureDebut,
            heureFin = request.heureFin,
            ordreDuJour = request.ordreDuJour,
            statut = request.statut,
            divers = request.divers
        )
        request.redacteurId?.let { id ->
            reunion.redacteur = userRepository.findById(id)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé: $id") }
        }
        val saved = reunionHebdoRepository.save(reunion)
        val seenUserIds = mutableSetOf<Long>()
        request.participants.forEach { pr ->
            when {
                pr.userId != null -> {
                    if (!seenUserIds.add(pr.userId!!)) return@forEach
                    val user = userRepository.findById(pr.userId!!)
                        .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé: ${pr.userId}") }
                    saved.participants.add(
                        ParticipantReunion(
                            reunion = saved,
                            user = user,
                            nomManuel = null,
                            prenomManuel = null,
                            initiales = pr.initiales,
                            telephone = pr.telephone ?: user.telephone,
                            present = pr.present
                        )
                    )
                }
                !pr.nomManuel.isNullOrBlank() && !pr.prenomManuel.isNullOrBlank() -> {
                    saved.participants.add(
                        ParticipantReunion(
                            reunion = saved,
                            user = null,
                            nomManuel = pr.nomManuel!!.trim(),
                            prenomManuel = pr.prenomManuel!!.trim(),
                            initiales = pr.initiales?.trim()?.takeIf { it.isNotEmpty() },
                            telephone = pr.telephone?.trim(),
                            present = pr.present
                        )
                    )
                }
            }
        }
        reunionHebdoRepository.save(saved)
        logger.info("Réunion hebdo créée: id=${saved.id}, date=${saved.dateReunion}")
        return ReunionHebdoMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<ReunionHebdoSummaryResponse> {
        return reunionHebdoRepository.findAllByOrderByDateReunionDesc(pageable)
            .map { ReunionHebdoMapper.toSummaryResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): ReunionHebdoResponse {
        val reunion = getReunionById(id)
        return ReunionHebdoMapper.toResponse(reunion)
    }

    @Transactional(readOnly = true)
    fun findByStatut(statut: StatutReunion): List<ReunionHebdoSummaryResponse> {
        return reunionHebdoRepository.findByStatut(statut).map { ReunionHebdoMapper.toSummaryResponse(it) }
    }

    fun update(id: Long, request: ReunionHebdoUpdateRequest): ReunionHebdoResponse {
        val reunion = getReunionById(id)
        request.dateReunion?.let { reunion.dateReunion = it }
        request.lieu?.let { reunion.lieu = it }
        request.heureDebut?.let { reunion.heureDebut = it }
        request.heureFin?.let { reunion.heureFin = it }
        request.ordreDuJour?.let { reunion.ordreDuJour = it }
        request.statut?.let { reunion.statut = it }
        request.divers?.let { reunion.divers = it }
        request.redacteurId?.let { rid ->
            reunion.redacteur = userRepository.findById(rid)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé: $rid") }
        }
        request.participants?.let { list ->
            val rid = reunion.id ?: throw IllegalStateException("Réunion sans id")
            participantReunionRepository.deleteByReunionId(rid)
            reunion.participants.clear()
            val seenUserIds = mutableSetOf<Long>()
            list.forEach { pr ->
                when {
                    pr.userId != null -> {
                        if (!seenUserIds.add(pr.userId!!)) return@forEach
                        val user = userRepository.findById(pr.userId!!)
                            .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé: ${pr.userId}") }
                        reunion.participants.add(
                            ParticipantReunion(
                                reunion = reunion,
                                user = user,
                                nomManuel = null,
                                prenomManuel = null,
                                initiales = pr.initiales,
                                telephone = pr.telephone ?: user.telephone,
                                present = pr.present
                            )
                        )
                    }
                    !pr.nomManuel.isNullOrBlank() && !pr.prenomManuel.isNullOrBlank() -> {
                        reunion.participants.add(
                            ParticipantReunion(
                                reunion = reunion,
                                user = null,
                                nomManuel = pr.nomManuel!!.trim(),
                                prenomManuel = pr.prenomManuel!!.trim(),
                                initiales = pr.initiales?.trim()?.takeIf { it.isNotEmpty() },
                                telephone = pr.telephone?.trim(),
                                present = pr.present
                            )
                        )
                    }
                }
            }
        }
        val saved = reunionHebdoRepository.save(reunion)
        logger.info("Réunion hebdo mise à jour: id=$id")
        return ReunionHebdoMapper.toResponse(saved)
    }

    fun savePointProjet(reunionId: Long, request: PointProjetPVRequest): PointProjetPVResponse {
        val reunion = getReunionById(reunionId)
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé: ${request.projetId}") }
        val existing = pointProjetPVRepository.findByReunionIdAndProjetId(reunionId, request.projetId)
        val point = existing ?: PointProjetPV(reunion = reunion, projet = projet)
        point.avancementPhysiquePct = request.avancementPhysiquePct
        point.avancementFinancierPct = request.avancementFinancierPct
        point.delaiConsommePct = request.delaiConsommePct
        point.resumeTravauxPrevisions = request.resumeTravauxPrevisions
        point.pointsBloquantsResume = request.pointsBloquantsResume
        point.besoinsMateriel = request.besoinsMateriel
        point.besoinsHumain = request.besoinsHumain
        point.propositionsAmelioration = request.propositionsAmelioration
        point.ordreAffichage = request.ordreAffichage
        if (existing == null) {
            reunion.pointsProjet.add(point)
        }
        val saved = pointProjetPVRepository.save(point)
        return ReunionHebdoMapper.toPointProjetPVResponse(saved)
    }

    fun savePointsProjet(reunionId: Long, points: List<PointProjetPVRequest>): ReunionHebdoResponse {
        val reunion = getReunionById(reunionId)
        reunion.pointsProjet.clear()
        pointProjetPVRepository.deleteByReunionId(reunionId)
        points.forEachIndexed { index, req ->
            val projet = projetRepository.findById(req.projetId)
                .orElseThrow { ResourceNotFoundException("Projet non trouvé: ${req.projetId}") }
            val point = PointProjetPV(
                reunion = reunion,
                projet = projet,
                avancementPhysiquePct = req.avancementPhysiquePct,
                avancementFinancierPct = req.avancementFinancierPct,
                delaiConsommePct = req.delaiConsommePct,
                resumeTravauxPrevisions = req.resumeTravauxPrevisions,
                pointsBloquantsResume = req.pointsBloquantsResume,
                besoinsMateriel = req.besoinsMateriel,
                besoinsHumain = req.besoinsHumain,
                propositionsAmelioration = req.propositionsAmelioration,
                ordreAffichage = index
            )
            pointProjetPVRepository.save(point)
            reunion.pointsProjet.add(point)
        }
        reunionHebdoRepository.save(reunion)
        return ReunionHebdoMapper.toResponse(getReunionById(reunionId))
    }

    fun deletePointProjet(reunionId: Long, pointId: Long) {
        val reunion = getReunionById(reunionId)
        val point = reunion.pointsProjet.find { it.id == pointId }
            ?: throw ResourceNotFoundException("Point projet PV non trouvé: $pointId pour réunion $reunionId")
        reunion.pointsProjet.remove(point)
        pointProjetPVRepository.delete(point)
    }

    fun delete(id: Long) {
        val reunion = getReunionById(id)
        reunionHebdoRepository.delete(reunion)
        logger.info("Réunion hebdo supprimée: id=$id")
    }

    internal fun getReunionById(id: Long): ReunionHebdo {
        return reunionHebdoRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Réunion hebdo non trouvée avec l'ID: $id") }
    }
}
