package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.StatutMouvementEngin
import com.mikaservices.platform.common.enums.TypeMouvementEnginEvenement
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ForbiddenException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.common.exception.UnauthorizedException
import com.mikaservices.platform.modules.materiel.dto.request.MouvementEnginActionRequest
import com.mikaservices.platform.modules.materiel.dto.request.MouvementEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.response.MouvementEnginResponse
import com.mikaservices.platform.modules.materiel.entity.AffectationEnginChantier
import com.mikaservices.platform.modules.materiel.entity.MouvementEngin
import com.mikaservices.platform.modules.materiel.entity.MouvementEnginEvenement
import com.mikaservices.platform.modules.materiel.event.MouvementNotificationEvent
import com.mikaservices.platform.modules.materiel.event.MouvementNotificationKind
import com.mikaservices.platform.modules.materiel.mapper.MouvementEnginMapper
import com.mikaservices.platform.modules.materiel.repository.AffectationEnginChantierRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.MouvementEnginEvenementRepository
import com.mikaservices.platform.modules.materiel.repository.MouvementEnginRepository
import com.mikaservices.platform.modules.materiel.spec.MouvementEnginSpecifications
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Service
@Transactional
class MouvementEnginService(
    private val mouvementRepository: MouvementEnginRepository,
    private val evenementRepository: MouvementEnginEvenementRepository,
    private val enginRepository: EnginRepository,
    private val projetRepository: ProjetRepository,
    private val affectationRepository: AffectationEnginChantierRepository,
    private val currentUserService: CurrentUserService,
    private val eventPublisher: ApplicationEventPublisher,
) {
    private val logger = LoggerFactory.getLogger(MouvementEnginService::class.java)

    private val statutsAffectationOuverte = listOf(StatutAffectation.PLANIFIEE, StatutAffectation.EN_COURS)

    private val statutsMouvementActif = listOf(StatutMouvementEngin.EN_ATTENTE_DEPART, StatutMouvementEngin.EN_TRANSIT)

    fun create(request: MouvementEnginCreateRequest): MouvementEnginResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val enginId = request.enginId ?: throw BadRequestException("enginId obligatoire")
        val projetDestinationId = request.projetDestinationId ?: throw BadRequestException("projetDestinationId obligatoire")

        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouvé: $enginId") }
        if (!engin.actif) throw BadRequestException("L'engin est inactif")
        if (engin.statut == StatutEngin.EN_MAINTENANCE || engin.statut == StatutEngin.EN_PANNE) {
            throw BadRequestException("Impossible de mouvoir un engin en maintenance ou en panne")
        }

        val actifs = mouvementRepository.findByEnginIdAndStatutIn(enginId, statutsMouvementActif)
        if (actifs.isNotEmpty()) {
            throw ConflictException("Un mouvement est déjà en cours pour cet engin")
        }

        val projetDestination = projetRepository.findById(projetDestinationId)
            .orElseThrow { ResourceNotFoundException("Projet destination non trouvé: $projetDestinationId") }

        val projetOrigine = request.projetOrigineId?.let { oid ->
            projetRepository.findById(oid).orElseThrow { ResourceNotFoundException("Projet origine non trouvé: $oid") }
        }

        if (projetOrigine != null && projetOrigine.id == projetDestination.id) {
            throw BadRequestException("Le chantier d'origine et de destination doivent être distincts")
        }

        when {
            projetOrigine != null -> {
                if (engin.statut != StatutEngin.EN_SERVICE && engin.statut != StatutEngin.EN_ATTENTE_DEPART) {
                    throw BadRequestException("Pour un départ depuis chantier, l'engin doit être en service sur ce chantier")
                }
                val ouvertes = affectationRepository.findOuvertesParEnginEtProjet(
                    enginId, projetOrigine.id!!, statutsAffectationOuverte
                )
                if (ouvertes.isEmpty()) {
                    throw BadRequestException("Aucune affectation ouverte de cet engin sur le chantier d'origine")
                }
            }
            else -> {
                if (engin.statut != StatutEngin.DISPONIBLE) {
                    throw BadRequestException("Départ depuis dépôt : l'engin doit être disponible")
                }
            }
        }

        val mouvement = MouvementEngin(
            engin = engin,
            projetOrigine = projetOrigine,
            projetDestination = projetDestination,
            initiateur = user,
            statut = StatutMouvementEngin.EN_ATTENTE_DEPART,
            commentaire = request.commentaire,
        )
        engin.statut = StatutEngin.EN_ATTENTE_DEPART
        enginRepository.save(engin)
        val saved = mouvementRepository.save(mouvement)
        logger.info("Mouvement engin créé id=${saved.id} engin=${engin.code} vers projet=${projetDestination.nom}")
        eventPublisher.publishEvent(
            MouvementNotificationEvent(
                kind = MouvementNotificationKind.ORDRE_CREE,
                mouvementId = saved.id!!,
                enginCode = engin.code,
                enginNom = engin.nom,
                projetOrigineNom = projetOrigine?.nom,
                projetOrigineResponsableId = projetOrigine?.responsableProjetId,
                projetDestinationNom = projetDestination.nom,
                projetDestinationResponsableId = projetDestination.responsableProjetId,
            )
        )
        return MouvementEnginMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAllFiltered(
        statut: StatutMouvementEngin?,
        enginId: Long?,
        projetId: Long?,
        dateFrom: LocalDateTime?,
        dateTo: LocalDateTime?,
        pageable: Pageable,
    ): Page<MouvementEnginResponse> {
        val spec = MouvementEnginSpecifications.withFilters(statut, enginId, projetId, dateFrom, dateTo)
        return mouvementRepository.findAll(spec, pageable).map { MouvementEnginMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findByEnginId(enginId: Long): List<MouvementEnginResponse> {
        return mouvementRepository.findByEnginIdOrderByDateDemandeDesc(enginId).map { MouvementEnginMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): MouvementEnginResponse {
        return MouvementEnginMapper.toResponse(getMouvement(id))
    }

    fun confirmerDepart(id: Long, body: MouvementEnginActionRequest?): MouvementEnginResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val mouvement = getMouvement(id)
        if (mouvement.statut != StatutMouvementEngin.EN_ATTENTE_DEPART) {
            throw BadRequestException("Le mouvement n'est pas en attente de départ")
        }
        val origine = mouvement.projetOrigine
        if (!canActOnSource(user, origine)) {
            throw ForbiddenException("Vous n'êtes pas autorisé à confirmer le départ pour ce chantier source")
        }

        val now = LocalDateTime.now()
        if (origine != null) {
            val ouvertes = affectationRepository.findOuvertesParEnginEtProjet(
                mouvement.engin.id!!, origine.id!!, statutsAffectationOuverte
            )
            val affectation = ouvertes.firstOrNull()
                ?: throw BadRequestException("Aucune affectation ouverte à clôturer sur le chantier d'origine")
            affectation.dateFin = LocalDate.now()
            affectation.statut = StatutAffectation.TERMINEE
            affectation.mouvementEngin = mouvement
            affectationRepository.save(affectation)
        }

        mouvement.engin.statut = StatutEngin.EN_TRANSIT
        enginRepository.save(mouvement.engin)
        mouvement.statut = StatutMouvementEngin.EN_TRANSIT
        mouvement.dateDepartConfirmee = now
        val saved = mouvementRepository.save(mouvement)
        enregistrerEvenement(saved, user, TypeMouvementEnginEvenement.DEPART_CONFIRME, body)
        logger.info("Départ confirmé mouvement id=$id")
        eventPublisher.publishEvent(
            MouvementNotificationEvent(
                kind = MouvementNotificationKind.DEPART_CONFIRME,
                mouvementId = saved.id!!,
                enginCode = saved.engin.code,
                enginNom = saved.engin.nom,
                projetOrigineNom = origine?.nom,
                projetOrigineResponsableId = origine?.responsableProjetId,
                projetDestinationNom = saved.projetDestination.nom,
                projetDestinationResponsableId = saved.projetDestination.responsableProjetId,
            )
        )
        return MouvementEnginMapper.toResponse(saved)
    }

    fun confirmerReception(id: Long, body: MouvementEnginActionRequest?): MouvementEnginResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val mouvement = getMouvement(id)
        if (mouvement.statut != StatutMouvementEngin.EN_TRANSIT) {
            throw BadRequestException("Le mouvement n'est pas en transit")
        }
        val destination = mouvement.projetDestination
        if (!canActOnDestination(user, destination)) {
            throw ForbiddenException("Vous n'êtes pas autorisé à confirmer la réception sur ce chantier de destination")
        }

        val now = LocalDateTime.now()
        val affectation = AffectationEnginChantier(
            projet = destination,
            engin = mouvement.engin,
            dateDebut = LocalDate.now(),
            dateFin = null,
            statut = StatutAffectation.EN_COURS,
            observations = body?.commentaire,
        )
        affectationRepository.save(affectation)

        mouvement.engin.statut = StatutEngin.EN_SERVICE
        enginRepository.save(mouvement.engin)
        mouvement.statut = StatutMouvementEngin.RECU
        mouvement.dateReceptionConfirmee = now
        val saved = mouvementRepository.save(mouvement)
        enregistrerEvenement(saved, user, TypeMouvementEnginEvenement.RECEPTION_CONFIRMEE, body)
        logger.info("Réception confirmée mouvement id=$id")
        eventPublisher.publishEvent(
            MouvementNotificationEvent(
                kind = MouvementNotificationKind.RECEPTION_CONFIRMEE,
                mouvementId = saved.id!!,
                enginCode = saved.engin.code,
                enginNom = saved.engin.nom,
                projetOrigineNom = saved.projetOrigine?.nom,
                projetOrigineResponsableId = saved.projetOrigine?.responsableProjetId,
                projetDestinationNom = saved.projetDestination.nom,
                projetDestinationResponsableId = saved.projetDestination.responsableProjetId,
            )
        )
        return MouvementEnginMapper.toResponse(saved)
    }

    fun annuler(id: Long, body: MouvementEnginActionRequest?): MouvementEnginResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        if (!isLogistiqueOuAdminGlobal(user)) {
            throw ForbiddenException("Seule la logistique peut annuler un ordre de mouvement")
        }
        val mouvement = getMouvement(id)
        if (mouvement.statut != StatutMouvementEngin.EN_ATTENTE_DEPART) {
            throw BadRequestException("Annulation possible uniquement tant que le départ n'est pas confirmé")
        }
        mouvement.statut = StatutMouvementEngin.ANNULE
        if (mouvement.engin.statut == StatutEngin.EN_ATTENTE_DEPART) {
            mouvement.engin.statut = if (mouvement.projetOrigine != null) StatutEngin.EN_SERVICE else StatutEngin.DISPONIBLE
            enginRepository.save(mouvement.engin)
        }
        val saved = mouvementRepository.save(mouvement)
        enregistrerEvenement(saved, user, TypeMouvementEnginEvenement.ANNULATION, body)
        logger.info("Mouvement annulé id=$id")
        eventPublisher.publishEvent(
            MouvementNotificationEvent(
                kind = MouvementNotificationKind.ANNULE,
                mouvementId = saved.id!!,
                enginCode = saved.engin.code,
                enginNom = saved.engin.nom,
                projetOrigineNom = saved.projetOrigine?.nom,
                projetOrigineResponsableId = saved.projetOrigine?.responsableProjetId,
                projetDestinationNom = saved.projetDestination.nom,
                projetDestinationResponsableId = saved.projetDestination.responsableProjetId,
            )
        )
        return MouvementEnginMapper.toResponse(saved)
    }

    private fun enregistrerEvenement(
        mouvement: MouvementEngin,
        auteur: User,
        type: TypeMouvementEnginEvenement,
        body: MouvementEnginActionRequest?,
    ) {
        val evt = MouvementEnginEvenement(
            mouvement = mouvement,
            typeEvenement = type,
            auteur = auteur,
            occurredAt = LocalDateTime.now(),
            payloadJson = body?.payloadJson,
        )
        evenementRepository.save(evt)
    }

    private fun getMouvement(id: Long): MouvementEngin {
        return mouvementRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Mouvement non trouvé: $id") }
    }

    private fun isLogistiqueOuAdminGlobal(user: User): Boolean {
        return user.roles.any { it.code == "LOGISTIQUE" || it.code == "SUPER_ADMIN" || it.code == "ADMIN" }
    }

    private fun canActOnSource(user: User, projetOrigine: Projet?): Boolean {
        if (isLogistiqueOuAdminGlobal(user)) return true
        if (projetOrigine == null) return false
        if (user.roles.any { it.code == "CHEF_PROJET" } && currentUserService.canEditProjet(projetOrigine.responsableProjetId)) {
            return true
        }
        if (user.roles.any { it.code == "CHEF_CHANTIER" }) {
            return true
        }
        return false
    }

    private fun canActOnDestination(user: User, destination: com.mikaservices.platform.modules.projet.entity.Projet): Boolean {
        if (isLogistiqueOuAdminGlobal(user)) return true
        if (user.roles.any { it.code == "CHEF_PROJET" } && currentUserService.canEditProjet(destination.responsableProjetId)) {
            return true
        }
        if (user.roles.any { it.code == "CHEF_CHANTIER" }) {
            return true
        }
        return false
    }
}
