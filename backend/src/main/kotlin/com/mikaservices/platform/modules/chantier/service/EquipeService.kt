package com.mikaservices.platform.modules.chantier.service

import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.chantier.dto.request.*
import com.mikaservices.platform.modules.chantier.dto.response.*
import com.mikaservices.platform.modules.chantier.entity.*
import com.mikaservices.platform.modules.chantier.mapper.EquipeMapper
import com.mikaservices.platform.modules.chantier.repository.*
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class EquipeService(
    private val equipeRepository: EquipeRepository,
    private val membreEquipeRepository: MembreEquipeRepository,
    private val affectationChantierRepository: AffectationChantierRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(EquipeService::class.java)

    // ========== Équipes ==========
    fun createEquipe(request: EquipeCreateRequest): EquipeResponse {
        if (equipeRepository.existsByCode(request.code)) {
            throw ConflictException("Une équipe avec le code '${request.code}' existe déjà")
        }
        val equipe = Equipe(code = request.code, nom = request.nom, type = request.type, effectif = request.effectif)
        request.chefEquipeId?.let { userId ->
            equipe.chefEquipe = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }
        val saved = equipeRepository.save(equipe)
        logger.info("Équipe créée: ${saved.code} - ${saved.nom}")
        return EquipeMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAllEquipes(pageable: Pageable): Page<EquipeResponse> {
        return equipeRepository.findByActifTrue(pageable).map { EquipeMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findEquipeById(id: Long): EquipeResponse {
        return EquipeMapper.toResponse(getEquipeById(id))
    }

    fun updateEquipe(id: Long, request: EquipeUpdateRequest): EquipeResponse {
        val equipe = getEquipeById(id)
        request.nom?.let { equipe.nom = it }
        request.type?.let { equipe.type = it }
        request.effectif?.let { equipe.effectif = it }
        request.chefEquipeId?.let { userId ->
            equipe.chefEquipe = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }
        val saved = equipeRepository.save(equipe)
        logger.info("Équipe mise à jour: ${saved.code}")
        return EquipeMapper.toResponse(saved)
    }

    fun deleteEquipe(id: Long) {
        val equipe = getEquipeById(id)
        equipe.actif = false
        equipeRepository.save(equipe)
        logger.info("Équipe désactivée: ${equipe.code}")
    }

    // ========== Membres ==========
    fun ajouterMembre(request: MembreEquipeRequest): MembreEquipeResponse {
        val equipe = getEquipeById(request.equipeId)
        val user = userRepository.findById(request.userId)
            .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: ${request.userId}") }
        if (membreEquipeRepository.existsByEquipeIdAndUserIdAndActifTrue(request.equipeId, request.userId)) {
            throw ConflictException("Cet utilisateur est déjà membre de cette équipe")
        }
        val membre = MembreEquipe(equipe = equipe, user = user, role = request.role, dateAffectation = request.dateAffectation)
        val saved = membreEquipeRepository.save(membre)
        equipe.effectif = membreEquipeRepository.findByEquipeIdAndActifTrue(equipe.id!!).size
        equipeRepository.save(equipe)
        logger.info("Membre ajouté à l'équipe ${equipe.code}: ${user.prenom} ${user.nom}")
        return EquipeMapper.toMembreResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findMembres(equipeId: Long): List<MembreEquipeResponse> {
        return membreEquipeRepository.findByEquipeIdAndActifTrue(equipeId).map { EquipeMapper.toMembreResponse(it) }
    }

    // ========== Affectations ==========
    fun affecterEquipe(request: AffectationChantierRequest): AffectationChantierResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: ${request.projetId}") }
        val equipe = getEquipeById(request.equipeId)
        val affectation = AffectationChantier(
            projet = projet, equipe = equipe, dateDebut = request.dateDebut,
            dateFin = request.dateFin, statut = request.statut, observations = request.observations
        )
        val saved = affectationChantierRepository.save(affectation)
        logger.info("Équipe ${equipe.code} affectée au projet ${projet.nom}")
        return EquipeMapper.toAffectationResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAffectations(projetId: Long, pageable: Pageable): Page<AffectationChantierResponse> {
        return affectationChantierRepository.findByProjetId(projetId, pageable)
            .map { EquipeMapper.toAffectationResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findAffectationsByUserId(userId: Long): List<AffectationChantierResponse> {
        val membres = membreEquipeRepository.findByUserIdAndActifTrue(userId)
        val equipeIds = membres.map { it.equipe.id!! }.distinct()
        return equipeIds.flatMap { equipeId ->
            affectationChantierRepository.findByEquipeId(equipeId)
                .map { EquipeMapper.toAffectationResponse(it) }
        }.sortedByDescending { it.createdAt }
    }

    private fun getEquipeById(id: Long): Equipe {
        return equipeRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Équipe non trouvée avec l'ID: $id") }
    }
}
