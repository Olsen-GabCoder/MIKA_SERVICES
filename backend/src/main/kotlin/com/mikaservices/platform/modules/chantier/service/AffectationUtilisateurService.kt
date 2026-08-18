package com.mikaservices.platform.modules.chantier.service

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ForbiddenException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.chantier.dto.AffectationUtilisateurRequest
import com.mikaservices.platform.modules.chantier.dto.AffectationUtilisateurResponse
import com.mikaservices.platform.modules.chantier.dto.AffectationUtilisateurUpdateRequest
import com.mikaservices.platform.modules.chantier.entity.AffectationUtilisateurProjet
import com.mikaservices.platform.modules.chantier.repository.AffectationUtilisateurProjetRepository
import com.mikaservices.platform.modules.projet.dto.response.ProjetUserSummary
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.projet.repository.RoleProjetRepository
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.repository.UserRepository
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Service
@Transactional
class AffectationUtilisateurService(
    private val affectationRepository: AffectationUtilisateurProjetRepository,
    private val userRepository: UserRepository,
    private val projetRepository: ProjetRepository,
    private val roleProjetRepository: RoleProjetRepository,
    private val currentUserService: CurrentUserService
) {
    private val logger = LoggerFactory.getLogger(AffectationUtilisateurService::class.java)

    private val statutsOuverts = listOf(StatutAffectation.PLANIFIEE, StatutAffectation.EN_COURS)
    private val dateFormat = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    companion object {
        private const val CODE_CHEF_PROJET = "RP-CHEF-PROJET"
    }

    fun affecter(request: AffectationUtilisateurRequest): AffectationUtilisateurResponse {
        val user = userRepository.findById(request.userId)
            .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: ${request.userId}") }
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: ${request.projetId}") }

        requireCanManage(projet)
        verifierRegles(user, projet, request.poste, request.dateDebut, request.dateFin, excludeId = null)

        val affectation = AffectationUtilisateurProjet(
            user = user, projet = projet, poste = request.poste,
            dateDebut = request.dateDebut, dateFin = request.dateFin,
            statut = request.statut, observations = request.observations
        )
        val saved = affectationRepository.save(affectation)
        logger.info("Utilisateur ${user.prenom} ${user.nom} affecté au chantier ${projet.nom} comme ${request.poste}")
        return toResponse(saved)
    }

    fun modifier(id: Long, request: AffectationUtilisateurUpdateRequest): AffectationUtilisateurResponse {
        val affectation = getById(id)
        requireCanManage(affectation.projet)
        if (affectation.statut !in statutsOuverts) {
            throw ConflictException(
                "Cette affectation est ${if (affectation.statut == StatutAffectation.TERMINEE) "terminée" else "annulée"} " +
                    "et ne peut plus être modifiée. Créez une nouvelle affectation si nécessaire."
            )
        }
        verifierRegles(affectation.user, affectation.projet, request.poste, request.dateDebut, request.dateFin, excludeId = id)

        affectation.poste = request.poste
        affectation.dateDebut = request.dateDebut
        affectation.dateFin = request.dateFin
        affectation.observations = request.observations
        val saved = affectationRepository.save(affectation)
        logger.info("Affectation $id modifiée : ${affectation.user.prenom} ${affectation.user.nom} — ${request.poste} sur ${affectation.projet.nom}")
        return toResponse(saved)
    }

    /**
     * Garde-fous communs à la création et à la modification d'une affectation.
     * [excludeId] : affectation à ignorer (elle-même, lors d'une modification).
     */
    private fun verifierRegles(
        user: User,
        projet: Projet,
        poste: String,
        dateDebut: LocalDate,
        dateFin: LocalDate?,
        excludeId: Long?
    ) {
        val nouveauRole = roleProjetRepository.findFirstByNomIgnoreCaseAndActifTrue(poste.trim())
        val affectationsOuvertes = affectationRepository.findByUserIdAndStatutIn(user.id!!, statutsOuverts)
            .filter { it.id != excludeId && overlaps(it.dateDebut, it.dateFin, dateDebut, dateFin) }

        // Règle 1 — pas de double affectation sur le même projet pour des périodes qui se chevauchent
        val surMemeProjet = affectationsOuvertes.firstOrNull { it.projet.id == projet.id }
        if (surMemeProjet != null) {
            throw ConflictException(
                "Affectation impossible : ${user.prenom} ${user.nom} est déjà affecté(e) au projet " +
                    "« ${projet.nom} » comme « ${surMemeProjet.poste} » sur la période ${periode(surMemeProjet)}. " +
                    "Terminez d'abord cette affectation ou choisissez des dates qui ne se chevauchent pas."
            )
        }

        // Règle 2 — cumul multi-projets : autorisé uniquement si le nouveau rôle ET le rôle existant sont cumulables
        val surAutreProjet = affectationsOuvertes.firstOrNull { it.projet.id != projet.id }
        if (surAutreProjet != null) {
            val roleExistant = roleProjetRepository.findFirstByNomIgnoreCaseAndActifTrue(surAutreProjet.poste.trim())
            when {
                nouveauRole?.cumulable != true -> throw ConflictException(
                    "Affectation impossible : le rôle « $poste » n'est pas cumulable sur plusieurs projets " +
                        "en même temps, or ${user.prenom} ${user.nom} est déjà affecté(e) au projet " +
                        "« ${surAutreProjet.projet.nom} » comme « ${surAutreProjet.poste} » sur la période " +
                        "${periode(surAutreProjet)}. Terminez d'abord cette affectation ou choisissez des dates " +
                        "qui ne se chevauchent pas."
                )
                roleExistant?.cumulable != true -> throw ConflictException(
                    "Affectation impossible : ${user.prenom} ${user.nom} occupe déjà le rôle " +
                        "« ${surAutreProjet.poste} » (non cumulable) sur le projet « ${surAutreProjet.projet.nom} » " +
                        "sur la période ${periode(surAutreProjet)}. Ce rôle exige une présence exclusive : " +
                        "terminez d'abord cette affectation ou choisissez des dates qui ne se chevauchent pas."
                )
                // Les deux rôles sont cumulables (ex. direction, QSHE transverse) : cumul autorisé
            }
        }

        // Règle 3 — un seul chef de projet actif par projet
        if (nouveauRole?.code == CODE_CHEF_PROJET) {
            val chefActuel = affectationRepository.findByProjetIdAndStatutIn(projet.id!!, statutsOuverts)
                .firstOrNull { autre ->
                    autre.id != excludeId && autre.user.id != user.id &&
                        roleProjetRepository.findFirstByNomIgnoreCaseAndActifTrue(autre.poste.trim())?.code == CODE_CHEF_PROJET &&
                        overlaps(autre.dateDebut, autre.dateFin, dateDebut, dateFin)
                }
            if (chefActuel != null) {
                throw ConflictException(
                    "Affectation impossible : le projet « ${projet.nom} » a déjà un chef de projet — " +
                        "${chefActuel.user.prenom} ${chefActuel.user.nom} (période ${periode(chefActuel)}). " +
                        "Un projet ne peut avoir qu'un seul chef de projet actif à la fois : terminez d'abord " +
                        "son affectation avant d'en désigner un nouveau."
                )
            }
        }
    }

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long): List<AffectationUtilisateurResponse> =
        affectationRepository.findByProjetId(projetId).map { toResponse(it) }.sortedBy { it.user.nom }

    @Transactional(readOnly = true)
    fun findByUser(userId: Long): List<AffectationUtilisateurResponse> =
        affectationRepository.findByUserId(userId).map { toResponse(it) }.sortedByDescending { it.dateDebut }

    @Transactional(readOnly = true)
    fun findEnCours(): List<AffectationUtilisateurResponse> =
        affectationRepository.findByStatutIn(statutsOuverts).map { toResponse(it) }

    fun terminer(id: Long): AffectationUtilisateurResponse {
        val affectation = getById(id)
        requireCanManage(affectation.projet)
        affectation.statut = StatutAffectation.TERMINEE
        if (affectation.dateFin == null) affectation.dateFin = LocalDate.now()
        return toResponse(affectationRepository.save(affectation))
    }

    fun annuler(id: Long): AffectationUtilisateurResponse {
        val affectation = getById(id)
        requireCanManage(affectation.projet)
        affectation.statut = StatutAffectation.ANNULEE
        return toResponse(affectationRepository.save(affectation))
    }

    /**
     * Scoping Phase C : un CHEF_PROJET ne gère les affectations que des projets dont il est
     * responsable (Projet.responsableProjet) ; les admins gardent la main partout.
     */
    private fun requireCanManage(projet: Projet) {
        if (!currentUserService.canEditProjet(projet.responsableProjet?.id)) {
            throw ForbiddenException(
                "Action refusée : vous ne pouvez gérer les affectations que des projets dont vous êtes responsable. " +
                    "Le projet « ${projet.nom} » est sous la responsabilité de " +
                    (projet.responsableProjet?.let { "${it.prenom} ${it.nom}" }
                        ?: "personne (aucun responsable désigné — contactez un administrateur)") + "."
            )
        }
    }

    private fun getById(id: Long): AffectationUtilisateurProjet =
        affectationRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Affectation non trouvée avec l'ID: $id") }

    /** Formate la période d'une affectation pour les messages d'erreur : « du 01/02/2026 au 15/03/2026 » ou « depuis le 01/02/2026 (sans date de fin) ». */
    private fun periode(a: AffectationUtilisateurProjet): String {
        val debut = a.dateDebut.format(dateFormat)
        return a.dateFin?.let { "du $debut au ${it.format(dateFormat)}" } ?: "depuis le $debut (sans date de fin)"
    }

    private fun overlaps(debutA: LocalDate, finA: LocalDate?, debutB: LocalDate, finB: LocalDate?): Boolean {
        val endA = finA ?: LocalDate.MAX
        val endB = finB ?: LocalDate.MAX
        return !debutA.isAfter(endB) && !debutB.isAfter(endA)
    }

    private fun toResponse(a: AffectationUtilisateurProjet) = AffectationUtilisateurResponse(
        id = a.id!!,
        user = ProjetUserSummary(a.user.id!!, a.user.nom, a.user.prenom, a.user.email),
        projetId = a.projet.id!!,
        projetNom = a.projet.nom,
        poste = a.poste,
        dateDebut = a.dateDebut,
        dateFin = a.dateFin,
        statut = a.statut,
        observations = a.observations,
        createdAt = a.createdAt
    )
}
