package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.StatutAffectation
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
import com.mikaservices.platform.modules.materiel.dto.response.DemandeMaterielHistoriqueResponse
import com.mikaservices.platform.modules.materiel.dto.response.DemandeMaterielResponse
import com.mikaservices.platform.modules.materiel.entity.DemandeMateriel
import com.mikaservices.platform.modules.materiel.entity.DemandeMaterielHistorique
import com.mikaservices.platform.modules.materiel.entity.DemandeMaterielLigne
import com.mikaservices.platform.modules.materiel.mapper.DemandeMaterielMapper
import com.mikaservices.platform.modules.materiel.repository.DemandeMaterielRepository
import com.mikaservices.platform.modules.materiel.repository.MateriauRepository
import com.mikaservices.platform.modules.chantier.repository.AffectationUtilisateurProjetRepository
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
    private val affectationUtilisateurRepository: AffectationUtilisateurProjetRepository,
    private val pdfGenerator: com.mikaservices.platform.modules.materiel.pdf.DemandeMaterielPdfGenerator,
) {
    private val logger = LoggerFactory.getLogger(DemandeMaterielService::class.java)

    /** Utilisateur connecté (routes web et terrain exigent un token, cf. SecurityConfig). */
    private fun actingUser(): User =
        currentUserService.getCurrentUser()
            ?: throw UnauthorizedException("Authentification requise")

    fun create(request: DemandeMaterielCreateRequest): DemandeMaterielResponse {
        // Idempotence offline : requête déjà traitée -> renvoyer l'existant (pas de doublon au replay).
        request.clientRequestId?.let { crid ->
            demandeMaterielRepository.findByClientRequestId(crid)?.let { return DemandeMaterielMapper.toResponse(it) }
        }

        val user = actingUser()
        val projetId = request.projetId ?: throw BadRequestException("projetId obligatoire")
        val lignesPayload = request.lignes ?: throw BadRequestException("Au moins une ligne est requise")
        if (lignesPayload.isEmpty()) throw BadRequestException("Au moins une ligne est requise")

        val projet = projetRepository.findById(projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé: $projetId") }

        // Périmètre : impossible de créer une DMA sur un projet hors affectation
        // (sauf trio logistique/admin). Responsable ⇒ affecté, par construction (synchro).
        if (!isLogistiqueOuAdmin(user) && projet.id !in projetsAffectes(user)) {
            throw ForbiddenException("Vous n'êtes pas affecté à ce chantier")
        }
        request.dateSouhaitee?.let {
            if (it.isBefore(java.time.LocalDate.now())) {
                throw BadRequestException("La date souhaitée ne peut pas être dans le passé")
            }
        }

        // Circuit à une seule porte (réforme 2026-08-20, aligné transferts) : le chantier
        // soumet, la logistique arbitre. La DMA naît SOUMISE = en attente logistique.
        val reference = generateUniqueReference()
        val dma = DemandeMateriel(
            reference = reference,
            projet = projet,
            createur = user,
            statut = StatutDemandeMateriel.SOUMISE,
            priorite = request.priorite,
            dateSouhaitee = request.dateSouhaitee,
            commentaire = request.commentaire,
            clientRequestId = request.clientRequestId,
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
        val user = actingUser()
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
        val user = actingUser()
        val dma = getDemandeWithCollections(id)
        assertCanView(user, dma)
        return DemandeMaterielMapper.toResponse(dma)
    }

    /** Export PDF : exactement le même contrôle de périmètre que le détail (404 hors périmètre). */
    @Transactional(readOnly = true)
    fun exportPdf(id: Long): Pair<String, ByteArray> {
        val user = actingUser()
        val dma = getDemandeWithCollections(id)
        assertCanView(user, dma)
        return dma.reference to pdfGenerator.generate(dma)
    }

    @Transactional(readOnly = true)
    fun findAll(
        statut: StatutDemandeMateriel?,
        projetId: Long?,
        pageable: Pageable,
    ): Page<DemandeMaterielResponse> {
        val user = actingUser()
        val spec = listSpecification(user, statut, projetId)
        return demandeMaterielRepository.findAll(spec, pageable).map { dma ->
            touchDmaCollections(dma)
            DemandeMaterielMapper.toResponse(dma)
        }
    }

    @Transactional(readOnly = true)
    fun findHistorique(demandeId: Long): List<DemandeMaterielHistoriqueResponse> {
        val user = actingUser()
        val dma = getDemandeWithCollections(demandeId)
        assertCanView(user, dma)
        return dma.historique.sortedBy { it.dateTransition }.map { DemandeMaterielMapper.toHistoriqueResponse(it) }
    }

    fun prendreEnCharge(id: Long, body: DemandeMaterielCommentaireRequest?): DemandeMaterielResponse {
        val user = actingUser()
        requireLogistiqueOuAdmin(user)
        val dma = getDemandeWithCollections(id)
        if (dma.statut != StatutDemandeMateriel.SOUMISE) {
            throw BadRequestException("La DMA doit être au statut SOUMISE pour prise en charge")
        }
        val from = dma.statut
        dma.statut = StatutDemandeMateriel.PRISE_EN_CHARGE
        appendHistorique(dma, user, from, dma.statut, body?.commentaire)
        val saved = demandeMaterielRepository.save(dma)
        publishDmaNotification(DmaNotificationKind.PRISE_EN_CHARGE, saved)
        return DemandeMaterielMapper.toResponse(saved)
    }

    fun demanderComplement(id: Long, body: DemandeMaterielCommentaireRequest?): DemandeMaterielResponse {
        val user = actingUser()
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
        val user = actingUser()
        val dma = getDemandeWithCollections(id)
        if (dma.statut != StatutDemandeMateriel.EN_ATTENTE_COMPLEMENT) {
            throw BadRequestException("La DMA n'est pas en attente de complément")
        }
        val ok = dma.createur.id == user.id || isLogistiqueOuAdmin(user)
        if (!ok) throw ForbiddenException("Seul le créateur ou la logistique peut renvoyer la demande après complément")
        val from = dma.statut
        dma.statut = StatutDemandeMateriel.PRISE_EN_CHARGE
        recalcMontantEstime(dma)
        appendHistorique(dma, user, from, dma.statut, body?.commentaire)
        return DemandeMaterielMapper.toResponse(demandeMaterielRepository.save(dma))
    }

    fun commander(id: Long, request: DemandeMaterielCommanderRequest): DemandeMaterielResponse {
        val user = actingUser()
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
        val user = actingUser()
        val dma = getDemandeWithCollections(id)
        if (dma.statut != StatutDemandeMateriel.EN_COMMANDE) {
            throw BadRequestException("La DMA doit être en EN_COMMANDE pour enregistrer la livraison")
        }
        val ok = isLogistiqueOuAdmin(user) || dma.createur.id == user.id
        if (!ok) throw ForbiddenException("Livraison : logistique ou créateur de la demande")
        val from = dma.statut
        dma.statut = StatutDemandeMateriel.LIVRE
        appendHistorique(dma, user, from, dma.statut, body?.commentaire)
        val saved = demandeMaterielRepository.save(dma)
        publishDmaNotification(DmaNotificationKind.LIVREE, saved)
        return DemandeMaterielMapper.toResponse(saved)
    }

    fun cloturer(id: Long, body: DemandeMaterielCommentaireRequest?): DemandeMaterielResponse {
        val user = actingUser()
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
        val user = actingUser()
        val commentaire = request.commentaire.trim()
        if (commentaire.isEmpty()) throw BadRequestException("Le commentaire de rejet est obligatoire")
        val dma = getDemandeWithCollections(id)
        assertCanView(user, dma)
        val from = dma.statut
        when (from) {
            StatutDemandeMateriel.SOUMISE, StatutDemandeMateriel.PRISE_EN_CHARGE ->
                requireLogistiqueOuAdmin(user)
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
                chefsProjetAffectesIds = chefsProjetAffectes(dma.projet.id!!),
            ),
        )
    }

    /** CP affectés EN_COURS au projet — destinataires du garde-fou informel à la création. */
    private fun chefsProjetAffectes(projetId: Long): List<Long> =
        affectationUtilisateurRepository
            .findByProjetIdAndStatutIn(projetId, listOf(StatutAffectation.EN_COURS))
            .filter { a -> a.user.roles.any { it.code == "CHEF_PROJET" } }
            .mapNotNull { it.user.id }
            .distinct()

    private fun User.hasRole(code: String): Boolean = roles.any { it.code == code }

    private fun isLogistiqueOuAdmin(user: User): Boolean =
        user.hasRole("LOGISTIQUE") || user.hasRole("SUPER_ADMIN") || user.hasRole("ADMIN")

    private fun requireLogistiqueOuAdmin(user: User) {
        if (!isLogistiqueOuAdmin(user)) throw ForbiddenException("Action réservée à la logistique")
    }

    /** Projets affectés EN_COURS de l'utilisateur (périmètre recalculé à chaque requête). */
    private fun projetsAffectes(user: User): List<Long> =
        affectationUtilisateurRepository
            .findByUserIdAndStatutIn(user.id!!, listOf(StatutAffectation.EN_COURS))
            .mapNotNull { it.projet.id }

    /**
     * Périmètre DMA (règle unique, docs/matrice-roles-perimetres.md) : trio logistique/admin = tout ;
     * sinon projet affecté EN_COURS OU créateur — sur TOUT le cycle de vie.
     */
    private fun estDansPerimetre(user: User, dma: DemandeMateriel): Boolean {
        if (isLogistiqueOuAdmin(user)) return true
        if (dma.createur.id == user.id) return true
        return dma.projet.id in projetsAffectes(user)
    }

    /** Lecture hors périmètre → 404 (un 403 confirmerait l'existence de la DMA). */
    private fun assertCanView(user: User, dma: DemandeMateriel) {
        if (!estDansPerimetre(user, dma)) throw ResourceNotFoundException("DMA non trouvée: ${dma.id}")
    }

    private fun canEditLignes(user: User, dma: DemandeMateriel): Boolean {
        if (isLogistiqueOuAdmin(user)) return true
        return dma.createur.id == user.id
    }

    private fun listSpecification(user: User, statut: StatutDemandeMateriel?, projetId: Long?): Specification<DemandeMateriel> {
        val affectes = if (isLogistiqueOuAdmin(user)) emptyList() else projetsAffectes(user)
        return Specification { root, query, cb ->
            query?.distinct(true)
            val preds = mutableListOf<Predicate>()
            statut?.let { preds.add(cb.equal(root.get<StatutDemandeMateriel>("statut"), it)) }
            projetId?.let { pid ->
                val p = root.join<DemandeMateriel, Projet>("projet")
                preds.add(cb.equal(p.get<Long>("id"), pid))
            }

            // Périmètre : trio = tout ; sinon projet affecté EN_COURS OU créateur.
            if (!isLogistiqueOuAdmin(user)) {
                val p = root.join<DemandeMateriel, Projet>("projet")
                val cr = root.join<DemandeMateriel, User>("createur")
                val ors = mutableListOf<Predicate>(
                    cb.equal(cr.get<Long>("id"), user.id!!),
                )
                if (affectes.isNotEmpty()) ors.add(p.get<Long>("id").`in`(affectes))
                preds.add(cb.or(*ors.toTypedArray()))
            }
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
