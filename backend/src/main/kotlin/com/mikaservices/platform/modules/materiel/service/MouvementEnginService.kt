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
import com.mikaservices.platform.common.enums.GraviteIncident
import com.mikaservices.platform.common.enums.TypeIncidentEngin
import com.mikaservices.platform.modules.chantier.repository.AffectationUtilisateurProjetRepository
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.MouvementEnginActionRequest
import com.mikaservices.platform.modules.materiel.dto.request.MouvementEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.ReceptionTransfertRequest
import com.mikaservices.platform.modules.materiel.dto.request.RejetTransfertRequest
import com.mikaservices.platform.modules.materiel.dto.request.ValidationTransfertRequest
import com.mikaservices.platform.modules.materiel.dto.response.MouvementEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.TransfertBonResponse
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
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
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
    private val affectationUtilisateurRepository: AffectationUtilisateurProjetRepository,
    private val incidentEnginService: IncidentEnginService,
) {
    private val logger = LoggerFactory.getLogger(MouvementEnginService::class.java)

    /** Utilisateur connecté (routes web et terrain exigent un token, cf. SecurityConfig). */
    private fun actingUser(): User =
        currentUserService.getCurrentUser()
            ?: throw UnauthorizedException("Authentification requise")

    private val statutsAffectationOuverte = listOf(StatutAffectation.PLANIFIEE, StatutAffectation.EN_COURS)

    private val statutsMouvementActif = listOf(
        StatutMouvementEngin.DEMANDE,
        StatutMouvementEngin.EN_ATTENTE_DEPART,
        StatutMouvementEngin.EN_TRANSIT,
    )

    private val secureRandom = SecureRandom()

    /** Token opaque du QR de réception (32 octets aléatoires → hex, 64 chars). */
    private fun genererQrToken(): String =
        ByteArray(32).also { secureRandom.nextBytes(it) }.joinToString("") { "%02x".format(it) }

    /** Code manuel 6 chiffres (mode dégradé). */
    private fun genererCodeReception(): String = "%06d".format(secureRandom.nextInt(1_000_000))

    fun create(request: MouvementEnginCreateRequest): MouvementEnginResponse {
        // Idempotence offline : requête déjà traitée -> renvoyer l'existant (pas de doublon au replay).
        request.clientRequestId?.let { crid ->
            mouvementRepository.findByClientRequestId(crid)?.let { return MouvementEnginMapper.toResponse(it) }
        }

        val user = actingUser()
        val enginId = request.enginId ?: throw BadRequestException("enginId obligatoire")
        val projetDestinationId = request.projetDestinationId ?: throw BadRequestException("projetDestinationId obligatoire")

        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouvé: $enginId") }

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

        verifierReglesEngin(engin, projetOrigine)

        // Circuit de validation : seule la logistique (ou admin) déclare un transfert à effet
        // immédiat. Tout autre initiateur crée une DEMANDE, sans effet sur l'engin, que la
        // logistique validera, modifiera ou rejettera.
        val autoValide = isLogistiqueOuAdminGlobal(user)

        val mouvement = MouvementEngin(
            engin = engin,
            projetOrigine = projetOrigine,
            projetDestination = projetDestination,
            initiateur = user,
            statut = if (autoValide) StatutMouvementEngin.EN_ATTENTE_DEPART else StatutMouvementEngin.DEMANDE,
            commentaire = request.commentaire,
            clientRequestId = request.clientRequestId,
        )
        if (autoValide) {
            mouvement.qrToken = genererQrToken()
            mouvement.codeReception = genererCodeReception()
            mouvement.validePar = "${user.prenom} ${user.nom}".trim()
            mouvement.dateValidation = LocalDateTime.now()
            engin.statut = StatutEngin.EN_ATTENTE_DEPART
            enginRepository.save(engin)
        }
        val saved = mouvementRepository.save(mouvement)
        enregistrerEvenement(
            saved, user,
            if (autoValide) TypeMouvementEnginEvenement.ORDRE_CREE else TypeMouvementEnginEvenement.DEMANDE_CREEE,
            null
        )
        logger.info("Mouvement engin créé id=${saved.id} statut=${saved.statut} engin=${engin.code} vers projet=${projetDestination.nom}")
        eventPublisher.publishEvent(
            notificationEvent(
                saved,
                if (autoValide) MouvementNotificationKind.ORDRE_CREE else MouvementNotificationKind.DEMANDE_CREEE
            )
        )
        return MouvementEnginMapper.toResponse(saved)
    }

    /** Règles métier engin, vérifiées à la création ET re-vérifiées à la validation logistique. */
    private fun verifierReglesEngin(engin: com.mikaservices.platform.modules.materiel.entity.Engin, projetOrigine: Projet?) {
        if (!engin.actif) throw BadRequestException("L'engin est inactif")
        if (engin.statut == StatutEngin.EN_MAINTENANCE || engin.statut == StatutEngin.EN_PANNE) {
            throw BadRequestException("Impossible de mouvoir un engin en maintenance ou en panne")
        }
        when {
            projetOrigine != null -> {
                if (engin.statut != StatutEngin.EN_SERVICE && engin.statut != StatutEngin.EN_ATTENTE_DEPART) {
                    throw BadRequestException("Pour un départ depuis chantier, l'engin doit être en service sur ce chantier")
                }
                val ouvertes = affectationRepository.findOuvertesParEnginEtProjet(
                    engin.id!!, projetOrigine.id!!, statutsAffectationOuverte
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
    }

    /** Validation logistique d'une DEMANDE : destination modifiable, génère les tokens de réception. */
    fun valider(id: Long, request: ValidationTransfertRequest?): MouvementEnginResponse {
        val user = actingUser()
        if (!isLogistiqueOuAdminGlobal(user)) {
            throw ForbiddenException("Seule la logistique peut valider une demande de transfert")
        }
        val mouvement = getMouvement(id)
        if (mouvement.statut != StatutMouvementEngin.DEMANDE) {
            throw BadRequestException("Seule une demande en attente peut être validée")
        }
        request?.projetDestinationId?.let { destId ->
            if (destId != mouvement.projetDestination.id) {
                val nouvelleDestination = projetRepository.findById(destId)
                    .orElseThrow { ResourceNotFoundException("Projet destination non trouvé: $destId") }
                if (mouvement.projetOrigine?.id == nouvelleDestination.id) {
                    throw BadRequestException("Le chantier d'origine et de destination doivent être distincts")
                }
                mouvement.projetDestination = nouvelleDestination
            }
        }
        verifierReglesEngin(mouvement.engin, mouvement.projetOrigine)

        mouvement.statut = StatutMouvementEngin.EN_ATTENTE_DEPART
        mouvement.qrToken = genererQrToken()
        mouvement.codeReception = genererCodeReception()
        mouvement.validePar = "${user.prenom} ${user.nom}".trim()
        mouvement.dateValidation = LocalDateTime.now()
        request?.commentaire?.takeIf { it.isNotBlank() }?.let { mouvement.commentaire = it }
        mouvement.engin.statut = StatutEngin.EN_ATTENTE_DEPART
        enginRepository.save(mouvement.engin)
        val saved = mouvementRepository.save(mouvement)
        enregistrerEvenement(saved, user, TypeMouvementEnginEvenement.VALIDATION, null)
        logger.info("Transfert validé id=$id par ${mouvement.validePar}")
        eventPublisher.publishEvent(notificationEvent(saved, MouvementNotificationKind.VALIDE))
        return MouvementEnginMapper.toResponse(saved)
    }

    /** Rejet logistique d'une DEMANDE (motif obligatoire). */
    fun rejeter(id: Long, request: RejetTransfertRequest): MouvementEnginResponse {
        val user = actingUser()
        if (!isLogistiqueOuAdminGlobal(user)) {
            throw ForbiddenException("Seule la logistique peut rejeter une demande de transfert")
        }
        val mouvement = getMouvement(id)
        if (mouvement.statut != StatutMouvementEngin.DEMANDE) {
            throw BadRequestException("Seule une demande en attente peut être rejetée")
        }
        val motif = request.motif?.trim().takeUnless { it.isNullOrBlank() }
            ?: throw BadRequestException("Le motif de rejet est obligatoire")
        mouvement.statut = StatutMouvementEngin.REJETE
        mouvement.motifRejet = motif
        val saved = mouvementRepository.save(mouvement)
        enregistrerEvenement(saved, user, TypeMouvementEnginEvenement.REJET, MouvementEnginActionRequest(commentaire = motif))
        logger.info("Transfert rejeté id=$id")
        eventPublisher.publishEvent(notificationEvent(saved, MouvementNotificationKind.REJETE, detail = motif))
        return MouvementEnginMapper.toResponse(saved)
    }

    /** Bon de transfert (QR + code manuel) : réservé logistique/admin, initiateur et acteurs du chantier d'origine. */
    @Transactional(readOnly = true)
    fun getBon(id: Long): TransfertBonResponse {
        val user = actingUser()
        val mouvement = getMouvement(id)
        // Hors périmètre de visibilité → 404 (ne pas révéler l'existence du transfert).
        if (!estVisible(user, mouvement)) throw ResourceNotFoundException("Mouvement non trouvé: $id")
        if (mouvement.statut != StatutMouvementEngin.EN_ATTENTE_DEPART && mouvement.statut != StatutMouvementEngin.EN_TRANSIT) {
            throw BadRequestException("Le bon de transfert n'est disponible qu'après validation")
        }
        val autorise = isLogistiqueOuAdminGlobal(user) ||
            mouvement.initiateur.id == user.id ||
            canActOnSource(user, mouvement.projetOrigine)
        if (!autorise) throw ForbiddenException("Vous n'êtes pas autorisé à consulter ce bon de transfert")
        return TransfertBonResponse(
            mouvementId = mouvement.id!!,
            qrToken = mouvement.qrToken ?: throw BadRequestException("Aucun QR généré pour ce transfert"),
            codeReception = mouvement.codeReception ?: throw BadRequestException("Aucun code de réception généré"),
        )
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

    /**
     * Liste scopée au périmètre de l'utilisateur connecté (accès terrain) :
     * ADMIN/SUPER_ADMIN/LOGISTIQUE voient tout ; les autres voient les transferts dont
     * l'origine OU la destination est un projet affecté EN_COURS, plus ceux qu'ils ont initiés.
     */
    @Transactional(readOnly = true)
    fun findAllVisibles(
        statut: StatutMouvementEngin?,
        enginId: Long?,
        pageable: Pageable,
    ): Page<MouvementEnginResponse> {
        val user = actingUser()
        var spec = MouvementEnginSpecifications.withFilters(statut, enginId, null, null, null)
        if (!isLogistiqueOuAdminGlobal(user)) {
            spec = spec.and(MouvementEnginSpecifications.visiblePar(projetsAffectes(user), user.id!!))
        }
        return mouvementRepository.findAll(spec, pageable).map { MouvementEnginMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findByEnginId(enginId: Long): List<MouvementEnginResponse> {
        return mouvementRepository.findByEnginIdOrderByDateDemandeDesc(enginId).map { MouvementEnginMapper.toResponse(it) }
    }

    /** Détail scopé : hors périmètre → 404 (un 403 confirmerait l'existence du transfert). */
    @Transactional(readOnly = true)
    fun findById(id: Long): MouvementEnginResponse {
        val mouvement = getMouvement(id)
        if (!estVisible(actingUser(), mouvement)) {
            throw ResourceNotFoundException("Mouvement non trouvé: $id")
        }
        return MouvementEnginMapper.toResponse(mouvement)
    }

    fun confirmerDepart(id: Long, body: MouvementEnginActionRequest?): MouvementEnginResponse {
        val user = actingUser()
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

    /**
     * Photos de réserves de réception : transfert visible + périmètre de réception
     * (même règle que receptionner), sinon 404 ; statut EN_TRANSIT ou RECU sinon 400.
     */
    @Transactional(readOnly = true)
    fun assertPeutJoindrePhotosReception(id: Long) {
        val user = actingUser()
        val mouvement = getMouvement(id)
        if (!estVisible(user, mouvement) || !canReceptionner(user, mouvement.projetDestination)) {
            throw ResourceNotFoundException("Mouvement non trouvé: $id")
        }
        if (mouvement.statut != StatutMouvementEngin.EN_TRANSIT && mouvement.statut != StatutMouvementEngin.RECU) {
            throw BadRequestException("Photos de réception possibles uniquement pendant ou juste après la réception")
        }
    }

    /**
     * Réception à destination — SEUL chemin vers RECU : exige le token du QR (scanné sur le
     * téléphone du convoyeur) ou le code manuel 6 chiffres (mode dégradé, tracé).
     * Droits : logistique/admin, ou CHEF_CHANTIER affecté EN_COURS au chantier de destination.
     * Réception avec réserves → incident auto « à qualifier » lié à l'engin et au transfert.
     */
    fun receptionner(id: Long, request: ReceptionTransfertRequest): MouvementEnginResponse {
        val user = actingUser()
        val mouvement = getMouvement(id)
        if (mouvement.statut != StatutMouvementEngin.EN_TRANSIT) {
            throw BadRequestException("Le mouvement n'est pas en transit")
        }
        val destination = mouvement.projetDestination
        if (!canReceptionner(user, destination)) {
            throw ForbiddenException("Réception réservée au chef de chantier de destination ou à la logistique")
        }

        // Preuve de rencontre physique : token QR ou code manuel, rien d'autre.
        val parCodeManuel = when {
            !request.token.isNullOrBlank() && request.token == mouvement.qrToken -> false
            !request.code.isNullOrBlank() && request.code == mouvement.codeReception -> true
            else -> throw BadRequestException("QR code ou code de réception invalide")
        }

        val now = LocalDateTime.now()
        val affectation = AffectationEnginChantier(
            projet = destination,
            engin = mouvement.engin,
            dateDebut = LocalDate.now(),
            dateFin = null,
            statut = StatutAffectation.EN_COURS,
            observations = request.commentaire,
        )
        affectationRepository.save(affectation)

        mouvement.engin.statut = StatutEngin.EN_SERVICE
        enginRepository.save(mouvement.engin)
        mouvement.statut = StatutMouvementEngin.RECU
        mouvement.dateReceptionConfirmee = now
        mouvement.receptionParCodeManuel = parCodeManuel
        mouvement.receptionAvecReserves = request.avecReserves
        mouvement.receptionLatitude = request.latitude
        mouvement.receptionLongitude = request.longitude
        mouvement.receptionPrecisionMetres = request.precisionMetres

        if (request.avecReserves) {
            val photos = request.photos.orEmpty().take(3)
            val description = buildString {
                append("Réserves à la réception du transfert #${mouvement.id} — ")
                append("${mouvement.engin.code} ${mouvement.engin.nom} sur ${destination.nom}.")
                request.commentaire?.takeIf { it.isNotBlank() }?.let { append(" $it") }
                if (photos.isNotEmpty()) append(" Photos : ${photos.joinToString(" ")}")
            }
            val incident = incidentEnginService.create(
                mouvement.engin.id!!,
                IncidentEnginCreateRequest(
                    typeIncident = TypeIncidentEngin.DEFAUT_TECHNIQUE,
                    gravite = GraviteIncident.MOYENNE,
                    dateIncident = LocalDate.now(),
                    description = description,
                    lieu = destination.nom,
                    signalePar = "${user.prenom} ${user.nom}".trim(),
                )
            )
            mouvement.incidentReceptionId = incident.id
        }

        val saved = mouvementRepository.save(mouvement)
        val payload = buildString {
            append("{\"parCodeManuel\":$parCodeManuel,\"avecReserves\":${request.avecReserves}")
            request.latitude?.let { append(",\"latitude\":$it") }
            request.longitude?.let { append(",\"longitude\":$it") }
            request.precisionMetres?.let { append(",\"precisionMetres\":$it") }
            saved.incidentReceptionId?.let { append(",\"incidentId\":$it") }
            request.photos?.takeIf { it.isNotEmpty() }?.let { p ->
                append(",\"photos\":[${p.joinToString(",") { "\"$it\"" }}]")
            }
            append("}")
        }
        enregistrerEvenement(
            saved, user,
            if (request.avecReserves) TypeMouvementEnginEvenement.RECEPTION_RESERVES
            else TypeMouvementEnginEvenement.RECEPTION_CONFIRMEE,
            MouvementEnginActionRequest(commentaire = request.commentaire, payloadJson = payload)
        )
        logger.info("Réception confirmée mouvement id=$id (codeManuel=$parCodeManuel, réserves=${request.avecReserves})")
        eventPublisher.publishEvent(
            notificationEvent(
                saved,
                if (request.avecReserves) MouvementNotificationKind.RECEPTION_AVEC_RESERVES
                else MouvementNotificationKind.RECEPTION_CONFIRMEE,
                detail = request.commentaire,
            )
        )
        return MouvementEnginMapper.toResponse(saved)
    }

    fun annuler(id: Long, body: MouvementEnginActionRequest?): MouvementEnginResponse {
        val user = actingUser()
        val mouvement = getMouvement(id)
        when (mouvement.statut) {
            // Demande non validée : annulable par son initiateur ou la logistique.
            StatutMouvementEngin.DEMANDE -> {
                if (!isLogistiqueOuAdminGlobal(user) && mouvement.initiateur.id != user.id) {
                    throw ForbiddenException("Seuls l'initiateur ou la logistique peuvent annuler cette demande")
                }
            }
            // Transfert validé : logistique seule (l'engin revient à son état antérieur).
            StatutMouvementEngin.EN_ATTENTE_DEPART -> {
                if (!isLogistiqueOuAdminGlobal(user)) {
                    throw ForbiddenException("Seule la logistique peut annuler un transfert validé")
                }
            }
            StatutMouvementEngin.EN_TRANSIT ->
                throw BadRequestException("Un transfert en transit ne peut pas être annulé : réceptionnez-le (avec réserves si besoin) ou créez un transfert retour")
            else -> throw BadRequestException("Annulation possible uniquement tant que le départ n'est pas confirmé")
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

    /** Projets affectés EN_COURS de l'utilisateur (périmètre recalculé à chaque requête). */
    private fun projetsAffectes(user: User): List<Long> =
        affectationUtilisateurRepository
            .findByUserIdAndStatutIn(user.id!!, listOf(StatutAffectation.EN_COURS))
            .mapNotNull { it.projet.id }

    /** Règle de visibilité en lecture (miroir exact de la spec visiblePar). */
    private fun estVisible(user: User, mouvement: MouvementEngin): Boolean {
        if (isLogistiqueOuAdminGlobal(user)) return true
        if (mouvement.initiateur.id == user.id) return true
        val projets = projetsAffectes(user)
        return mouvement.projetDestination.id in projets ||
            mouvement.projetOrigine?.id?.let { it in projets } == true
    }

    /** L'utilisateur est-il affecté (EN_COURS) au projet ? Scoping des chefs de chantier. */
    private fun estAffecteAuProjet(user: User, projetId: Long?): Boolean {
        if (projetId == null) return false
        return affectationUtilisateurRepository
            .findByUserIdAndStatutIn(user.id!!, listOf(StatutAffectation.EN_COURS))
            .any { it.projet.id == projetId }
    }

    /** Origine : trio, ou chef (CHEF_PROJET/CHEF_CHANTIER) AFFECTÉ EN_COURS au chantier d'origine. */
    private fun canActOnSource(user: User, projetOrigine: Projet?): Boolean {
        if (isLogistiqueOuAdminGlobal(user)) return true
        if (projetOrigine == null) return false
        return user.roles.any { it.code == "CHEF_PROJET" || it.code == "CHEF_CHANTIER" } &&
            estAffecteAuProjet(user, projetOrigine.id)
    }

    /** Réception : trio, ou CHEF_CHANTIER/CHEF_PROJET AFFECTÉ EN_COURS à destination (matrice §2.3). */
    private fun canReceptionner(user: User, destination: Projet): Boolean {
        if (isLogistiqueOuAdminGlobal(user)) return true
        return user.roles.any { it.code == "CHEF_CHANTIER" || it.code == "CHEF_PROJET" } &&
            estAffecteAuProjet(user, destination.id)
    }

    private fun notificationEvent(
        mouvement: MouvementEngin,
        kind: MouvementNotificationKind,
        detail: String? = null,
    ) = MouvementNotificationEvent(
        kind = kind,
        mouvementId = mouvement.id!!,
        enginCode = mouvement.engin.code,
        enginNom = mouvement.engin.nom,
        projetOrigineNom = mouvement.projetOrigine?.nom,
        projetOrigineResponsableId = mouvement.projetOrigine?.responsableProjetId,
        projetDestinationNom = mouvement.projetDestination.nom,
        projetDestinationResponsableId = mouvement.projetDestination.responsableProjetId,
        initiateurUserId = mouvement.initiateur.id,
        detail = detail,
    )

    /**
     * Alerte quotidienne : transferts bloqués EN_TRANSIT depuis plus de 3 jours
     * (détection des engins « perdus en route »). Déduplication par événement COMMENTAIRE marqueur.
     */
    @Scheduled(cron = "0 0 7 * * *")
    @Transactional
    fun alerterTransfertsBloques() {
        val seuil = LocalDateTime.now().minusDays(3)
        val bloques = mouvementRepository.findByStatutAndDateDepartConfirmeeBefore(StatutMouvementEngin.EN_TRANSIT, seuil)
        for (mouvement in bloques) {
            val dejaAlerte = evenementRepository.findByMouvementIdOrderByOccurredAtAsc(mouvement.id!!)
                .any { it.payloadJson?.contains("\"alerteTransitProlonge\":true") == true }
            if (dejaAlerte) continue
            enregistrerEvenement(
                mouvement, mouvement.initiateur, TypeMouvementEnginEvenement.COMMENTAIRE,
                MouvementEnginActionRequest(
                    commentaire = "Alerte automatique : engin en transit depuis plus de 3 jours",
                    payloadJson = "{\"alerteTransitProlonge\":true}",
                )
            )
            eventPublisher.publishEvent(notificationEvent(mouvement, MouvementNotificationKind.EN_TRANSIT_TROP_LONG))
            logger.warn("Transfert id=${mouvement.id} EN_TRANSIT depuis plus de 3 jours (engin ${mouvement.engin.code})")
        }
    }
}
