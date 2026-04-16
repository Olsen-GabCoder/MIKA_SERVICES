package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.StatutDemandeMateriel
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ForbiddenException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.common.exception.UnauthorizedException
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielCommentaireRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielLignePayload
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielCommanderRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielRejetRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielValidationRequest
import com.mikaservices.platform.modules.materiel.dto.response.DemandeMaterielHistoriqueResponse
import com.mikaservices.platform.modules.materiel.dto.response.DemandeMaterielResponse
import com.mikaservices.platform.modules.materiel.entity.DemandeMateriel
import com.mikaservices.platform.modules.materiel.entity.DemandeMaterielHistorique
import com.mikaservices.platform.modules.materiel.entity.DemandeMaterielLigne
import com.mikaservices.platform.modules.materiel.mapper.DemandeMaterielMapper
import com.mikaservices.platform.modules.materiel.repository.DemandeMaterielRepository
import com.mikaservices.platform.modules.materiel.repository.MateriauRepository
import com.mikaservices.platform.modules.fournisseur.repository.CommandeRepository
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.materiel.event.DmaNotificationEvent
import com.mikaservices.platform.modules.materiel.event.DmaNotificationKind
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.service.CurrentUserService
import jakarta.persistence.criteria.Predicate
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.domain.Specification
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Year

@Service
@Transactional
class DemandeMaterielService(
    private val demandeMaterielRepository: DemandeMaterielRepository,
    private val projetRepository: ProjetRepository,
    private val materiauRepository: MateriauRepository,
    private val commandeRepository: CommandeRepository,
    private val currentUserService: CurrentUserService,
    private val eventPublisher: ApplicationEventPublisher,
) {
    private val logger = LoggerFactory.getLogger(DemandeMaterielService::class.java)

    fun create(request: DemandeMaterielCreateRequest): DemandeMaterielResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val projetId = request.projetId ?: throw BadRequestException("projetId obligatoire")
        val lignesPayload = request.lignes ?: throw BadRequestException("Au moins une ligne est requise")
        if (lignesPayload.isEmpty()) throw BadRequestException("Au moins une ligne est requise")

        val projet = projetRepository.findById(projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé: $projetId") }

        val reference = generateUniqueReference()
        val dma = DemandeMateriel(
            reference = reference,
            projet = projet,
            createur = user,
            statut = StatutDemandeMateriel.SOUMISE,
            priorite = request.priorite,
            dateSouhaitee = request.dateSouhaitee,
            commentaire = request.commentaire,
        )
        for (p in lignesPayload) {
            dma.lignes.add(buildLigne(dma, p))
        }
        recalcMontantEstime(dma)
        appendHistorique(dma, user, null, StatutDemandeMateriel.SOUMISE, "Création de la demande")
        val saved = demandeMaterielRepository.save(dma)
        logger.info("DMA créée ${saved.reference} par ${user.email}")
        publishDmaNotification(DmaNotificationKind.SOUMISE, saved)
        return DemandeMaterielMapper.toResponse(saved)
    }

    fun addLigne(demandeId: Long, payload: DemandeMaterielLignePayload): DemandeMaterielResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val dma = getDemandeWithCollections(demandeId)
        assertCanView(user, dma)
        if (dma.statut != StatutDemandeMateriel.SOUMISE && dma.statut != StatutDemandeMateriel.EN_ATTENTE_COMPLEMENT) {
            throw BadRequestException("Impossible d'ajouter une ligne dans le statut ${dma.statut}")
        }
        if (!canEditLignes(user, dma)) throw ForbiddenException("Modification des lignes non autorisée")
        dma.lignes.add(buildLigne(dma, payload))
        recalcMontantEstime(dma)
        val saved = demandeMaterielRepository.save(dma)
        return DemandeMaterielMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): DemandeMaterielResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val dma = getDemandeWithCollections(id)
        assertCanView(user, dma)
        return DemandeMaterielMapper.toResponse(dma)
    }

    @Transactional(readOnly = true)
    fun findAll(
        statut: StatutDemandeMateriel?,
        projetId: Long?,
        pageable: Pageable,
    ): Page<DemandeMaterielResponse> {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val spec = listSpecification(user, statut, projetId)
        return demandeMaterielRepository.findAll(spec, pageable).map { dma ->
            touchDmaCollections(dma)
            DemandeMaterielMapper.toResponse(dma)
        }
    }

    @Transactional(readOnly = true)
    fun findHistorique(demandeId: Long): List<DemandeMaterielHistoriqueResponse> {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val dma = getDemandeWithCollections(demandeId)
        assertCanView(user, dma)
        return dma.historique.sortedBy { it.dateTransition }.map { DemandeMaterielMapper.toHistoriqueResponse(it) }
    }

    fun validerChantier(id: Long, request: DemandeMaterielValidationRequest): DemandeMaterielResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val approuve = request.approuve ?: throw BadRequestException("approuve est obligatoire")
        val dma = getDemandeWithCollections(id)
        if (dma.statut != StatutDemandeMateriel.SOUMISE) {
            throw BadRequestException("La DMA doit être au statut SOUMISE pour validation chantier")
        }
        if (!user.hasRole("CHEF_CHANTIER") && !user.hasRole("LOGISTIQUE") && !user.hasRole("SUPER_ADMIN")) {
            throw ForbiddenException("Rôle non autorisé pour cette action")
        }
        val from = dma.statut
        if (approuve) {
            dma.statut = StatutDemandeMateriel.EN_VALIDATION_CHANTIER
            appendHistorique(dma, user, from, dma.statut, request.commentaire)
        } else {
            val c = request.commentaire?.trim().orEmpty()
            if (c.isEmpty()) throw BadRequestException("Un commentaire de rejet est obligatoire")
            dma.statut = StatutDemandeMateriel.REJETEE
            appendHistorique(dma, user, from, dma.statut, c)
        }
        val saved = demandeMaterielRepository.save(dma)
        if (approuve) publishDmaNotification(DmaNotificationKind.VALIDEE_CHANTIER, saved)
        else publishDmaNotification(DmaNotificationKind.REJETEE, saved)
        return DemandeMaterielMapper.toResponse(saved)
    }

    fun validerProjet(id: Long, request: DemandeMaterielValidationRequest): DemandeMaterielResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val approuve = request.approuve ?: throw BadRequestException("approuve est obligatoire")
        val dma = getDemandeWithCollections(id)
        if (dma.statut != StatutDemandeMateriel.EN_VALIDATION_CHANTIER) {
            throw BadRequestException("La DMA doit être au statut EN_VALIDATION_CHANTIER pour validation projet")
        }
        val can = user.hasRole("LOGISTIQUE") || user.hasRole("SUPER_ADMIN") ||
            (user.hasRole("CHEF_PROJET") && currentUserService.canEditProjet(dma.projet.responsableProjetId))
        if (!can) throw ForbiddenException("Seul le chef de projet responsable peut valider à ce stade")
        val from = dma.statut
        if (approuve) {
            dma.statut = StatutDemandeMateriel.EN_VALIDATION_PROJET
            appendHistorique(dma, user, from, dma.statut, request.commentaire)
        } else {
            val c = request.commentaire?.trim().orEmpty()
            if (c.isEmpty()) throw BadRequestException("Un commentaire de rejet est obligatoire")
            dma.statut = StatutDemandeMateriel.REJETEE
            appendHistorique(dma, user, from, dma.statut, c)
        }
        val saved = demandeMaterielRepository.save(dma)
        if (approuve) publishDmaNotification(DmaNotificationKind.VALIDEE_PROJET, saved)
        else publishDmaNotification(DmaNotificationKind.REJETEE, saved)
        return DemandeMaterielMapper.toResponse(saved)
    }

    fun prendreEnCharge(id: Long, body: DemandeMaterielCommentaireRequest?): DemandeMaterielResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        requireLogistiqueOuAdmin(user)
        val dma = getDemandeWithCollections(id)
        if (dma.statut != StatutDemandeMateriel.EN_VALIDATION_PROJET) {
            throw BadRequestException("La DMA doit être au statut EN_VALIDATION_PROJET pour prise en charge")
        }
        val from = dma.statut
        dma.statut = StatutDemandeMateriel.PRISE_EN_CHARGE
        appendHistorique(dma, user, from, dma.statut, body?.commentaire)
        val saved = demandeMaterielRepository.save(dma)
        publishDmaNotification(DmaNotificationKind.PRISE_EN_CHARGE, saved)
        return DemandeMaterielMapper.toResponse(saved)
    }

    fun demanderComplement(id: Long, body: DemandeMaterielCommentaireRequest?): DemandeMaterielResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        requireLogistiqueOuAdmin(user)
        val dma = getDemandeWithCollections(id)
        if (dma.statut != StatutDemandeMateriel.PRISE_EN_CHARGE) {
            throw BadRequestException("Demande de complément possible uniquement en PRISE_EN_CHARGE")
        }
        val from = dma.statut
        dma.statut = StatutDemandeMateriel.EN_ATTENTE_COMPLEMENT
        appendHistorique(dma, user, from, dma.statut, body?.commentaire)
        val saved = demandeMaterielRepository.save(dma)
        publishDmaNotification(DmaNotificationKind.COMPLEMENT_REQUIS, saved)
        return DemandeMaterielMapper.toResponse(saved)
    }

    fun completer(id: Long, body: DemandeMaterielCommentaireRequest?): DemandeMaterielResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val dma = getDemandeWithCollections(id)
        if (dma.statut != StatutDemandeMateriel.EN_ATTENTE_COMPLEMENT) {
            throw BadRequestException("La DMA n'est pas en attente de complément")
        }
        val ok = dma.createur.id == user.id || user.hasRole("LOGISTIQUE") || user.hasRole("SUPER_ADMIN")
        if (!ok) throw ForbiddenException("Seul le créateur ou la logistique peut renvoyer la demande après complément")
        val from = dma.statut
        dma.statut = StatutDemandeMateriel.PRISE_EN_CHARGE
        recalcMontantEstime(dma)
        appendHistorique(dma, user, from, dma.statut, body?.commentaire)
        return DemandeMaterielMapper.toResponse(demandeMaterielRepository.save(dma))
    }

    fun commander(id: Long, request: DemandeMaterielCommanderRequest): DemandeMaterielResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        requireLogistiqueOuAdmin(user)
        val dma = getDemandeWithCollections(id)
        if (dma.statut != StatutDemandeMateriel.PRISE_EN_CHARGE) {
            throw BadRequestException("La DMA doit être en PRISE_EN_CHARGE pour passer commande")
        }
        val commandeId = request.commandeId
        if (commandeId != null) {
            val cmd = commandeRepository.findById(commandeId)
                .orElseThrow { ResourceNotFoundException("Commande non trouvée: $commandeId") }
            dma.commande = cmd
        }
        val from = dma.statut
        dma.statut = StatutDemandeMateriel.EN_COMMANDE
        appendHistorique(dma, user, from, dma.statut, if (commandeId != null) "Commande #$commandeId" else null)
        val saved = demandeMaterielRepository.save(dma)
        publishDmaNotification(DmaNotificationKind.COMMANDEE, saved)
        return DemandeMaterielMapper.toResponse(saved)
    }

    fun livrer(id: Long, body: DemandeMaterielCommentaireRequest?): DemandeMaterielResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val dma = getDemandeWithCollections(id)
        if (dma.statut != StatutDemandeMateriel.EN_COMMANDE) {
            throw BadRequestException("La DMA doit être en EN_COMMANDE pour enregistrer la livraison")
        }
        val ok = user.hasRole("LOGISTIQUE") || user.hasRole("SUPER_ADMIN") || dma.createur.id == user.id
        if (!ok) throw ForbiddenException("Livraison : logistique ou créateur de la demande")
        val from = dma.statut
        dma.statut = StatutDemandeMateriel.LIVRE
        appendHistorique(dma, user, from, dma.statut, body?.commentaire)
        val saved = demandeMaterielRepository.save(dma)
        publishDmaNotification(DmaNotificationKind.LIVREE, saved)
        return DemandeMaterielMapper.toResponse(saved)
    }

    fun cloturer(id: Long, body: DemandeMaterielCommentaireRequest?): DemandeMaterielResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        requireLogistiqueOuAdmin(user)
        val dma = getDemandeWithCollections(id)
        if (dma.statut != StatutDemandeMateriel.LIVRE) {
            throw BadRequestException("La DMA doit être au statut LIVRE pour clôture")
        }
        val from = dma.statut
        dma.statut = StatutDemandeMateriel.CLOTUREE
        appendHistorique(dma, user, from, dma.statut, body?.commentaire)
        return DemandeMaterielMapper.toResponse(demandeMaterielRepository.save(dma))
    }

    fun rejeter(id: Long, request: DemandeMaterielRejetRequest): DemandeMaterielResponse {
        val user = currentUserService.getCurrentUser() ?: throw UnauthorizedException("Authentification requise")
        val commentaire = request.commentaire.trim()
        if (commentaire.isEmpty()) throw BadRequestException("Le commentaire de rejet est obligatoire")
        val dma = getDemandeWithCollections(id)
        val from = dma.statut
        when (from) {
            StatutDemandeMateriel.SOUMISE -> {
                if (!user.hasRole("CHEF_CHANTIER") && !user.hasRole("LOGISTIQUE") && !user.hasRole("SUPER_ADMIN")) {
                    throw ForbiddenException("Rejet à ce stade : chef de chantier ou logistique")
                }
            }
            StatutDemandeMateriel.EN_VALIDATION_CHANTIER -> {
                val can = user.hasRole("LOGISTIQUE") || user.hasRole("SUPER_ADMIN") ||
                    (user.hasRole("CHEF_PROJET") && currentUserService.canEditProjet(dma.projet.responsableProjetId))
                if (!can) throw ForbiddenException("Rejet : chef de projet responsable ou logistique")
            }
            StatutDemandeMateriel.EN_VALIDATION_PROJET -> requireLogistiqueOuAdmin(user)
            else -> throw BadRequestException("Rejet impossible depuis le statut $from")
        }
        dma.statut = StatutDemandeMateriel.REJETEE
        appendHistorique(dma, user, from, dma.statut, commentaire)
        val saved = demandeMaterielRepository.save(dma)
        publishDmaNotification(DmaNotificationKind.REJETEE, saved)
        return DemandeMaterielMapper.toResponse(saved)
    }

    private fun publishDmaNotification(kind: DmaNotificationKind, dma: DemandeMateriel) {
        eventPublisher.publishEvent(
            DmaNotificationEvent(
                kind = kind,
                dmaId = dma.id!!,
                reference = dma.reference,
                projetNom = dma.projet.nom,
                projetId = dma.projet.id!!,
                createurId = dma.createur.id!!,
                responsableProjetId = dma.projet.responsableProjetId,
            ),
        )
    }

    private fun User.hasRole(code: String): Boolean = roles.any { it.code == code }

    private fun requireLogistiqueOuAdmin(user: User) {
        if (!user.hasRole("LOGISTIQUE") && !user.hasRole("SUPER_ADMIN") && !user.hasRole("ADMIN")) {
            throw ForbiddenException("Action réservée à la logistique")
        }
    }

    private fun assertCanView(user: User, dma: DemandeMateriel) {
        if (!canView(user, dma)) throw ForbiddenException("Accès à cette DMA refusé")
    }

    private fun canView(user: User, dma: DemandeMateriel): Boolean {
        if (user.hasRole("LOGISTIQUE") || user.hasRole("SUPER_ADMIN") || user.hasRole("ADMIN")) return true
        if (dma.createur.id == user.id) return true
        if (user.hasRole("CHEF_PROJET") && user.id == dma.projet.responsableProjetId) return true
        if (user.hasRole("CHEF_CHANTIER")) {
            if (dma.statut == StatutDemandeMateriel.SOUMISE) return true
            if (user.id == dma.projet.responsableProjetId) return true
            if (dma.createur.id == user.id) return true
        }
        return false
    }

    private fun canEditLignes(user: User, dma: DemandeMateriel): Boolean {
        if (user.hasRole("LOGISTIQUE") || user.hasRole("SUPER_ADMIN")) return true
        return dma.createur.id == user.id
    }

    private fun listSpecification(user: User, statut: StatutDemandeMateriel?, projetId: Long?): Specification<DemandeMateriel> {
        return Specification { root, query, cb ->
            query?.distinct(true)
            val preds = mutableListOf<Predicate>()
            statut?.let { preds.add(cb.equal(root.get<StatutDemandeMateriel>("statut"), it)) }
            projetId?.let { pid ->
                val p = root.join<DemandeMateriel, Projet>("projet")
                preds.add(cb.equal(p.get<Long>("id"), pid))
            }

            val scope: Predicate = when {
                user.hasRole("LOGISTIQUE") || user.hasRole("SUPER_ADMIN") || user.hasRole("ADMIN") -> cb.conjunction()
                user.hasRole("CHEF_PROJET") -> {
                    val p = root.join<DemandeMateriel, Projet>("projet")
                    cb.equal(p.get<Long>("responsableProjetId"), user.id!!)
                }
                user.hasRole("CHEF_CHANTIER") -> {
                    val p = root.join<DemandeMateriel, Projet>("projet")
                    val cr = root.join<DemandeMateriel, User>("createur")
                    cb.or(
                        cb.equal(root.get<StatutDemandeMateriel>("statut"), StatutDemandeMateriel.SOUMISE),
                        cb.equal(p.get<Long>("responsableProjetId"), user.id!!),
                        cb.equal(cr.get<Long>("id"), user.id!!)
                    )
                }
                else -> {
                    val cr = root.join<DemandeMateriel, User>("createur")
                    cb.equal(cr.get<Long>("id"), user.id!!)
                }
            }
            preds.add(scope)
            cb.and(*preds.toTypedArray())
        }
    }

    private fun touchDmaCollections(dma: DemandeMateriel) {
        dma.lignes.size
        dma.historique.size
        dma.projet.nom
        dma.createur.nom
        dma.commande?.reference
        dma.lignes.forEach { it.materiau?.code }
        dma.historique.forEach { it.user.nom }
    }

    private fun getDemandeWithCollections(id: Long): DemandeMateriel {
        val dma = demandeMaterielRepository.fetchWithBasicsById(id)
            .orElseThrow { ResourceNotFoundException("DMA non trouvée: $id") }
        touchDmaCollections(dma)
        return dma
    }

    private fun buildLigne(dma: DemandeMateriel, p: DemandeMaterielLignePayload): DemandeMaterielLigne {
        val designation = p.designation?.trim().orEmpty()
        if (designation.isEmpty()) throw BadRequestException("Désignation de ligne invalide")
        val q = p.quantite ?: throw BadRequestException("Quantité obligatoire")
        if (q <= BigDecimal.ZERO) throw BadRequestException("La quantité doit être positive")
        val unite = p.unite?.trim().orEmpty()
        if (unite.isEmpty()) throw BadRequestException("Unité obligatoire")
        val materiau = p.materiauId?.let { mid ->
            materiauRepository.findById(mid).orElseThrow { ResourceNotFoundException("Matériau non trouvé: $mid") }
        }
        return DemandeMaterielLigne(
            demande = dma,
            designation = designation,
            materiau = materiau,
            quantite = q,
            unite = unite,
            prixUnitaireEst = p.prixUnitaireEst,
            fournisseurSuggere = p.fournisseurSuggere?.trim()?.takeIf { it.isNotEmpty() },
        )
    }

    private fun recalcMontantEstime(dma: DemandeMateriel) {
        var sum = BigDecimal.ZERO
        var any = false
        for (l in dma.lignes) {
            val pu = l.prixUnitaireEst ?: continue
            any = true
            sum = sum.add(pu.multiply(l.quantite))
        }
        dma.montantEstime = if (any) sum else null
    }

    private fun appendHistorique(
        dma: DemandeMateriel,
        user: User,
        de: StatutDemandeMateriel?,
        vers: StatutDemandeMateriel,
        commentaire: String?,
    ) {
        dma.historique.add(
            DemandeMaterielHistorique(
                demande = dma,
                deStatut = de,
                versStatut = vers,
                user = user,
                commentaire = commentaire?.trim()?.takeIf { it.isNotEmpty() },
            )
        )
    }

    private fun generateUniqueReference(): String {
        val year = Year.now().value
        val prefix = "DMA-$year-"
        repeat(5) {
            val last = demandeMaterielRepository.findFirstByReferenceStartingWithOrderByReferenceDesc(prefix)
            val next = if (last == null) 1 else {
                val suffix = last.reference.removePrefix(prefix).toIntOrNull() ?: 0
                suffix + 1
            }
            val ref = prefix + next.toString().padStart(5, '0')
            if (!demandeMaterielRepository.existsByReference(ref)) return ref
        }
        throw ConflictException("Impossible de générer une référence DMA unique")
    }
}
