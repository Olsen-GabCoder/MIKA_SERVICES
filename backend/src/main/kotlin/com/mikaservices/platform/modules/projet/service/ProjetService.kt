package com.mikaservices.platform.modules.projet.service

import com.mikaservices.platform.common.enums.StatutPointBloquant
import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ForbiddenException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.dto.request.AvancementEtudeProjetRequest
import com.mikaservices.platform.modules.projet.dto.request.CAPrevisionnelRealiseRequest
import com.mikaservices.platform.modules.projet.dto.request.PrevisionCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.PrevisionUpdateRequest
import com.mikaservices.platform.modules.projet.dto.request.ProjetCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.ProjetUpdateRequest
import com.mikaservices.platform.modules.projet.dto.response.AvancementEtudeProjetResponse
import com.mikaservices.platform.modules.projet.dto.response.CAPrevisionnelRealiseResponse
import com.mikaservices.platform.modules.projet.dto.response.PeriodeHistoriqueResponse
import com.mikaservices.platform.modules.projet.dto.response.PrevisionResponse
import com.mikaservices.platform.modules.projet.dto.response.ProjetHistoriqueResponse
import com.mikaservices.platform.modules.projet.dto.response.ProjetResponse
import com.mikaservices.platform.modules.projet.dto.response.ProjetSummaryResponse
import com.mikaservices.platform.modules.projet.dto.response.PvResumeResponse
import com.mikaservices.platform.modules.projet.entity.AvancementEtudeProjet
import com.mikaservices.platform.modules.projet.entity.CAPrevisionnelRealise
import com.mikaservices.platform.modules.projet.entity.Client
import com.mikaservices.platform.modules.projet.entity.Prevision
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.mapper.AvancementEtudeProjetMapper
import com.mikaservices.platform.modules.projet.mapper.CAPrevisionnelRealiseMapper
import com.mikaservices.platform.modules.projet.mapper.PointBloquantMapper
import com.mikaservices.platform.modules.projet.mapper.PrevisionMapper
import com.mikaservices.platform.modules.projet.mapper.ProjetMapper
import com.mikaservices.platform.modules.projet.repository.AvancementEtudeProjetRepository
import com.mikaservices.platform.modules.projet.repository.CAPrevisionnelRealiseRepository
import com.mikaservices.platform.modules.projet.repository.PartenaireRepository
import com.mikaservices.platform.modules.projet.repository.PointBloquantRepository
import com.mikaservices.platform.modules.planning.dto.request.TacheCreateRequest
import com.mikaservices.platform.modules.planning.service.PlanningService
import com.mikaservices.platform.modules.projet.repository.PrevisionRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.reunionhebdo.repository.PointProjetPVRepository
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.repository.UserRepository
import com.mikaservices.platform.modules.user.service.CurrentUserService
import jakarta.persistence.criteria.JoinType
import jakarta.persistence.criteria.Predicate
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.domain.Specification
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.RoundingMode
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.time.temporal.WeekFields
import java.util.Locale
import java.util.UUID

@Service
@Transactional
class ProjetService(
    private val projetRepository: ProjetRepository,
    private val clientService: ClientService,
    private val partenaireRepository: PartenaireRepository,
    private val userRepository: UserRepository,
    private val pointBloquantRepository: PointBloquantRepository,
    private val avancementEtudeProjetRepository: AvancementEtudeProjetRepository,
    private val caPrevisionnelRealiseRepository: CAPrevisionnelRealiseRepository,
    private val previsionRepository: PrevisionRepository,
    private val pointProjetPVRepository: PointProjetPVRepository,
    private val currentUserService: CurrentUserService,
    private val planningService: PlanningService
) {
    private val logger = LoggerFactory.getLogger(ProjetService::class.java)

    private fun computeDelaiMois(dateDebut: LocalDate?, dateFin: LocalDate?): Int? {
        if (dateDebut == null || dateFin == null || dateFin.isBefore(dateDebut)) return null
        val mois = ChronoUnit.MONTHS.between(dateDebut, dateFin).toInt()
        return if (mois < 1) 1 else mois
    }

    /** Vérifie la cohérence des dates (contractuelles et réelles). Lance BadRequestException si incohérent. */
    private fun validateDateCoherence(projet: Projet) {
        val dD = projet.dateDebut
        val dF = projet.dateFin
        val dDR = projet.dateDebutReel
        val dFR = projet.dateFinReelle
        if (dD != null && dF != null && dF.isBefore(dD)) {
            throw BadRequestException("La date de fin contractuelle ne peut pas être antérieure à la date de début.")
        }
        if (dDR != null && dD != null && dDR.isBefore(dD)) {
            throw BadRequestException("La date de début réelle ne peut pas être antérieure à la date de début contractuelle.")
        }
        if (dDR != null && dF != null && dDR.isAfter(dF)) {
            throw BadRequestException("La date de début réelle ne peut pas être postérieure à la date de fin contractuelle.")
        }
        if (dFR != null && dD != null && dFR.isBefore(dD)) {
            throw BadRequestException("La date de fin réelle ne peut pas être antérieure à la date de début contractuelle.")
        }
        if (dFR != null && dDR != null && dFR.isBefore(dDR)) {
            throw BadRequestException("La date de fin réelle ne peut pas être antérieure à la date de début réelle.")
        }
    }

    fun create(request: ProjetCreateRequest): ProjetResponse {
        val codeProjet = request.numeroMarche?.take(50)?.ifBlank { null }
            ?: "PRJ-${UUID.randomUUID().toString().substring(0, 8)}"
        if (projetRepository.findByCodeProjet(codeProjet).isPresent) {
            throw BadRequestException("Un projet avec ce numéro de marché existe déjà. Veuillez utiliser un autre numéro de marché.")
        }
        val typesSet = request.types.toMutableSet()
        val projet = Projet(
            codeProjet = codeProjet,
            numeroMarche = request.numeroMarche,
            nom = request.nom,
            description = request.description,
            type = request.types.first(),
            statut = request.statut,
            sourceFinancement = request.sourceFinancement,
            imputationBudgetaire = request.imputationBudgetaire,
            province = request.province,
            ville = request.ville,
            quartier = request.quartier,
            montantHT = request.montantHT,
            montantTTC = request.montantTTC,
            montantInitial = request.montantInitial,
            delaiMois = computeDelaiMois(request.dateDebut, request.dateFin) ?: request.delaiMois,
            modeSuiviMensuel = request.modeSuiviMensuel,
            dateDebut = request.dateDebut,
            dateFin = request.dateFin,
            partenairePrincipal = request.partenairePrincipal
        )
        projet.types.addAll(typesSet)
        request.typePersonnalise?.takeIf { it.isNotBlank() }?.let { projet.typePersonnalise = it }

        // Associer le client
        request.clientId?.let { clientId ->
            projet.client = clientService.getClientById(clientId)
        }

        // Associer le responsable
        request.responsableProjetId?.let { userId ->
            projet.responsableProjet = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        // Associer les partenaires
        if (request.partenaireIds.isNotEmpty()) {
            val partenaires = partenaireRepository.findAllById(request.partenaireIds)
            projet.partenaires.addAll(partenaires)
        }

        validateDateCoherence(projet)
        val saved = projetRepository.save(projet)
        logger.info("Projet créé: ${saved.nom}")
        return ProjetMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<ProjetSummaryResponse> {
        try {
            return projetRepository.findByActifTrue(pageable).map { ProjetMapper.toSummaryResponse(it) }
        } catch (e: Exception) {
            logger.error("Erreur lors de la récupération des projets (page ${pageable.pageNumber}, size ${pageable.pageSize}): ${e.message}", e)
            throw e
        }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): ProjetResponse {
        val projet = getProjetById(id)
        return ProjetMapper.toResponse(projet)
    }

    @Transactional(readOnly = true)
    fun search(search: String, pageable: Pageable): Page<ProjetSummaryResponse> {
        return projetRepository.search(search, pageable).map { ProjetMapper.toSummaryResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findAllFiltered(
        statut: StatutProjet?,
        type: TypeProjet?,
        clientId: Long?,
        responsableId: Long?,
        pageable: Pageable
    ): Page<ProjetSummaryResponse> {
        val spec = buildFilterSpec(statut = statut, type = type, clientId = clientId, responsableId = responsableId, search = null)
        return projetRepository.findAll(spec, pageable).map { ProjetMapper.toSummaryResponse(it) }
    }

    @Transactional(readOnly = true)
    fun searchFiltered(
        search: String,
        statut: StatutProjet?,
        type: TypeProjet?,
        clientId: Long?,
        responsableId: Long?,
        pageable: Pageable
    ): Page<ProjetSummaryResponse> {
        val spec = buildFilterSpec(statut = statut, type = type, clientId = clientId, responsableId = responsableId, search = search)
        return projetRepository.findAll(spec, pageable).map { ProjetMapper.toSummaryResponse(it) }
    }

    private fun buildFilterSpec(
        statut: StatutProjet?,
        type: TypeProjet?,
        clientId: Long?,
        responsableId: Long?,
        search: String?
    ): Specification<Projet> {
        return Specification { root, query, cb ->
            query.distinct(true)
            val predicates = mutableListOf(cb.equal(root.get<Boolean>("actif"), true))
            if (!search.isNullOrBlank()) {
                val pattern = "%${search.lowercase()}%"
                predicates.add(
                    cb.or(
                        cb.like(cb.lower(root.get("nom")), pattern),
                        cb.like(cb.lower(root.get("numeroMarche")), pattern)
                    )
                )
            }
            statut?.let { predicates.add(cb.equal(root.get<StatutProjet>("statut"), it)) }
            type?.let { t ->
                val typesJoin = root.join<Projet, TypeProjet>("types", JoinType.LEFT)
                predicates.add(cb.or(cb.equal(root.get<TypeProjet>("type"), t), cb.equal(typesJoin, t)))
            }
            clientId?.let {
                val clientJoin = root.join<Projet, Client>("client", JoinType.LEFT)
                predicates.add(cb.equal(clientJoin.get<Long>("id"), it))
            }
            responsableId?.let {
                val respJoin = root.join<Projet, User>("responsableProjet", JoinType.LEFT)
                predicates.add(cb.equal(respJoin.get<Long>("id"), it))
            }
            cb.and(*predicates.toTypedArray())
        }
    }

    @Transactional(readOnly = true)
    fun findByStatut(statut: StatutProjet): List<ProjetSummaryResponse> {
        return projetRepository.findByStatutAndActifTrue(statut).map { ProjetMapper.toSummaryResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findByResponsable(userId: Long): List<ProjetSummaryResponse> {
        return projetRepository.findByResponsableProjetId(userId).map { ProjetMapper.toSummaryResponse(it) }
    }

    @Transactional(readOnly = true)
    fun countByStatut(statut: StatutProjet): Long {
        return projetRepository.countByStatut(statut)
    }

    fun update(id: Long, request: ProjetUpdateRequest): ProjetResponse {
        val projet = getProjetById(id)
        if (!currentUserService.canEditProjet(projet.responsableProjet?.id)) {
            throw ForbiddenException("Vous n'êtes pas autorisé à modifier ce projet")
        }

        projet.numeroMarche = request.numeroMarche?.takeIf { it.isNotBlank() }
        request.nom?.let { projet.nom = it }
        request.description?.let { projet.description = it }
        request.types?.let { types ->
            projet.types.clear()
            projet.types.addAll(types)
            projet.type = types.first()
        }
        if (request.typePersonnalise != null) projet.typePersonnalise = request.typePersonnalise.takeIf { it.isNotBlank() }
        request.statut?.let { projet.statut = it }
        request.sourceFinancement?.let { projet.sourceFinancement = it }
        request.imputationBudgetaire?.let { projet.imputationBudgetaire = it }
        request.province?.let { projet.province = it }
        request.ville?.let { projet.ville = it }
        request.quartier?.let { projet.quartier = it }
        request.montantHT?.let { projet.montantHT = it }
        request.montantTTC?.let { projet.montantTTC = it }
        request.montantInitial?.let { projet.montantInitial = it }
        request.montantRevise?.let { projet.montantRevise = it }
        request.modeSuiviMensuel?.let { projet.modeSuiviMensuel = it }
        request.dateDebut?.let { projet.dateDebut = it }
        request.dateFin?.let { projet.dateFin = it }
        computeDelaiMois(projet.dateDebut, projet.dateFin)?.let { projet.delaiMois = it }
        request.dateDebutReel?.let { projet.dateDebutReel = it }
        request.dateFinReelle?.let { projet.dateFinReelle = it }
        request.avancementGlobal?.let { projet.avancementGlobal = it }
        request.avancementPhysiquePct?.let { projet.avancementPhysiquePct = it }
        request.avancementFinancierPct?.let { projet.avancementFinancierPct = it }
        request.delaiConsommePct?.let { projet.delaiConsommePct = it }
        request.besoinsMateriel?.let { projet.besoinsMateriel = it }
        request.besoinsHumain?.let { projet.besoinsHumain = it }
        request.observations?.let { projet.observations = it }
        request.propositionsAmelioration?.let { projet.propositionsAmelioration = it }
        request.partenairePrincipal?.let { projet.partenairePrincipal = it }

        request.clientId?.let { clientId ->
            projet.client = clientService.getClientById(clientId)
        }

        request.responsableProjetId?.let { userId ->
            projet.responsableProjet = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        request.partenaireIds?.let { ids ->
            projet.partenaires.clear()
            if (ids.isNotEmpty()) {
                val partenaires = partenaireRepository.findAllById(ids)
                projet.partenaires.addAll(partenaires)
            }
        }

        validateDateCoherence(projet)
        val saved = projetRepository.save(projet)
        logger.info("Projet mis à jour: ${saved.nom}")
        return ProjetMapper.toResponse(saved)
    }

    fun delete(id: Long) {
        val projet = getProjetById(id)
        if (!currentUserService.canEditProjet(projet.responsableProjet?.id)) {
            throw ForbiddenException("Vous n'êtes pas autorisé à désactiver ce projet")
        }
        projet.actif = false
        projetRepository.save(projet)
        logger.info("Projet désactivé: ${projet.nom}")
    }

    @Transactional(readOnly = true)
    fun getAvancementEtudes(projetId: Long): List<AvancementEtudeProjetResponse> {
        getProjetById(projetId)
        return avancementEtudeProjetRepository.findByProjetIdOrderByPhase(projetId)
            .map { AvancementEtudeProjetMapper.toResponse(it) }
    }

    fun saveAvancementEtudes(projetId: Long, requests: List<AvancementEtudeProjetRequest>): List<AvancementEtudeProjetResponse> {
        val projet = getProjetById(projetId)
        val existing = avancementEtudeProjetRepository.findByProjetIdOrderByPhase(projetId).associateBy { it.phase }
        requests.forEach { req ->
            val entity = existing[req.phase] ?: AvancementEtudeProjet(projet = projet, phase = req.phase)
            entity.avancementPct = req.avancementPct
            entity.dateDepot = req.dateDepot
            entity.etatValidation = req.etatValidation
            if (entity.id == null) projet.avancementEtudes.add(entity)
            avancementEtudeProjetRepository.save(entity)
        }
        return avancementEtudeProjetRepository.findByProjetIdOrderByPhase(projetId).map { AvancementEtudeProjetMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun getSuiviMensuel(projetId: Long): List<CAPrevisionnelRealiseResponse> {
        getProjetById(projetId)
        return caPrevisionnelRealiseRepository.findByProjetIdOrderByAnneeAscMoisAsc(projetId)
            .map { CAPrevisionnelRealiseMapper.toResponse(it) }
    }

    fun saveSuiviMensuel(projetId: Long, requests: List<CAPrevisionnelRealiseRequest>): List<CAPrevisionnelRealiseResponse> {
        val projet = getProjetById(projetId)
        val existing = caPrevisionnelRealiseRepository.findByProjetIdOrderByAnneeAscMoisAsc(projetId)
            .associateBy { "${it.mois}-${it.annee}" }
        var cumulRealise = java.math.BigDecimal.ZERO
        val budgetTotal = projet.montantRevise ?: projet.montantHT ?: java.math.BigDecimal.ZERO
        requests.sortedWith(compareBy({ it.annee }, { it.mois })).forEach { req ->
            val prev = req.caPrevisionnel ?: java.math.BigDecimal.ZERO
            val real = req.caRealise ?: java.math.BigDecimal.ZERO
            val ecart = real.subtract(prev)
            cumulRealise = cumulRealise.add(real)
            val avancementCumule = if (budgetTotal > java.math.BigDecimal.ZERO) {
                cumulRealise.multiply(java.math.BigDecimal(100)).divide(budgetTotal, 2, RoundingMode.HALF_UP)
            } else java.math.BigDecimal.ZERO
            val key = "${req.mois}-${req.annee}"
            val entity = existing[key] ?: CAPrevisionnelRealise(projet = projet, mois = req.mois, annee = req.annee)
            entity.caPrevisionnel = prev
            entity.caRealise = real
            entity.ecart = ecart
            entity.avancementCumule = avancementCumule
            if (entity.id == null) projet.caPrevisionnelsRealises.add(entity)
            caPrevisionnelRealiseRepository.save(entity)
        }
        return caPrevisionnelRealiseRepository.findByProjetIdOrderByAnneeAscMoisAsc(projetId)
            .map { CAPrevisionnelRealiseMapper.toResponse(it) }
    }

    /**
     * Remplace entièrement le tableau de suivi mensuel.
     * Utilisé par le mode MANUEL : la liste envoyée devient la source de vérité (suppression des lignes absentes).
     * Le mode AUTO conserve l'API historique saveSuiviMensuel (upsert sans suppression).
     */
    fun replaceSuiviMensuel(projetId: Long, requests: List<CAPrevisionnelRealiseRequest>): List<CAPrevisionnelRealiseResponse> {
        getProjetById(projetId)
        val requestKeys = requests.map { "${it.mois}-${it.annee}" }.toSet()
        val existing = caPrevisionnelRealiseRepository.findByProjetIdOrderByAnneeAscMoisAsc(projetId)
        existing.forEach { e ->
            val key = "${e.mois}-${e.annee}"
            if (!requestKeys.contains(key)) {
                caPrevisionnelRealiseRepository.delete(e)
            }
        }
        return saveSuiviMensuel(projetId, requests)
    }

    @Transactional(readOnly = true)
    fun getPrevisions(projetId: Long): List<PrevisionResponse> {
        getProjetById(projetId)
        return previsionRepository.findByProjetId(projetId).map { PrevisionMapper.toResponse(it) }
    }

    fun createPrevision(projetId: Long, request: PrevisionCreateRequest): PrevisionResponse {
        val projet = getProjetById(projetId)
        if (!currentUserService.canEditProjet(projet.responsableProjet?.id)) {
            throw ForbiddenException("Seul le chef de projet peut ajouter des prévisions pour ce projet.")
        }
        val prevision = Prevision(
            projet = projet,
            semaine = request.semaine,
            annee = request.annee,
            description = request.description,
            type = request.type ?: com.mikaservices.platform.common.enums.TypePrevision.HEBDOMADAIRE,
            dateDebut = request.dateDebut,
            dateFin = request.dateFin,
            avancementPct = request.avancementPct
        )
        val saved = previsionRepository.save(prevision)
        // Synchronisation automatique avec Planning : créer une tâche correspondante
        try {
            val (dateDebut, dateFin) = when {
                request.dateDebut != null && request.dateFin != null -> request.dateDebut to request.dateFin
                request.semaine != null -> {
                    val firstDay = LocalDate.of(request.annee, 1, 1).plusDays((request.semaine - 1) * 7L)
                    firstDay to firstDay.plusDays(6)
                }
                else -> null to null
            }
            planningService.createTache(
                TacheCreateRequest(
                    projetId = projetId,
                    titre = request.description?.take(300) ?: "Tâche planifiée (S${request.semaine ?: "?"} ${request.annee})",
                    description = request.description,
                    dateDebut = dateDebut,
                    dateFin = dateFin,
                    dateEcheance = dateFin
                )
            )
            logger.info("Tâche Planning créée automatiquement pour la prévision ${saved.id} (projet $projetId)")
        } catch (e: Exception) {
            logger.warn("Impossible de créer la tâche Planning pour la prévision: ${e.message}")
        }
        return PrevisionMapper.toResponse(saved)
    }

    fun updatePrevision(projetId: Long, previsionId: Long, request: PrevisionUpdateRequest): PrevisionResponse {
        val projet = getProjetById(projetId)
        if (!currentUserService.canEditProjet(projet.responsableProjet?.id)) {
            throw ForbiddenException("Seul le chef de projet peut modifier les prévisions de ce projet.")
        }
        val prevision = previsionRepository.findById(previsionId)
            .orElseThrow { ResourceNotFoundException("Prévision non trouvée avec l'ID: $previsionId") }
        if (prevision.projet.id != projetId) throw ResourceNotFoundException("Prévision non rattachée à ce projet")
        request.semaine?.let { prevision.semaine = it }
        request.annee?.let { prevision.annee = it }
        request.description?.let { prevision.description = it }
        request.type?.let { prevision.type = it }
        request.dateDebut?.let { prevision.dateDebut = it }
        request.dateFin?.let { prevision.dateFin = it }
        request.avancementPct?.let { prevision.avancementPct = it }
        val saved = previsionRepository.save(prevision)
        return PrevisionMapper.toResponse(saved)
    }

    fun deletePrevision(projetId: Long, previsionId: Long) {
        val projet = getProjetById(projetId)
        if (!currentUserService.canEditProjet(projet.responsableProjet?.id)) {
            throw ForbiddenException("Seul le chef de projet peut supprimer les prévisions de ce projet.")
        }
        val prevision = previsionRepository.findById(previsionId)
            .orElseThrow { ResourceNotFoundException("Prévision non trouvée avec l'ID: $previsionId") }
        if (prevision.projet.id != projetId) throw ResourceNotFoundException("Prévision non rattachée à ce projet")
        previsionRepository.delete(prevision)
    }

    internal fun getProjetById(id: Long): Projet {
        return projetRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: $id") }
    }

    /** Historique du projet : périodes passées (semaines) avec prévisions, points bloquants et résumés PV. */
    fun getHistorique(projetId: Long, maxSemaines: Int = 52): ProjetHistoriqueResponse {
        val projet = getProjetById(projetId)
        val now = LocalDate.now()
        val weekFields = WeekFields.of(Locale.getDefault())
        val currentSemaine = now.get(weekFields.weekOfWeekBasedYear()).toInt()
        val currentAnnee = now.get(weekFields.weekBasedYear())

        val previsions = previsionRepository.findByProjetId(projetId)
        val pointsBloquants = pointBloquantRepository.findByProjetId(projetId)
        val pointsPV = pointProjetPVRepository.findByProjetIdOrderByReunion_DateReunionDesc(projetId)

        fun semaineAnneeOf(date: LocalDate): Pair<Int, Int> =
            date.get(weekFields.weekOfWeekBasedYear()).toInt() to date.get(weekFields.weekBasedYear())

        fun isBeforeCurrent(semaine: Int, annee: Int): Boolean =
            annee < currentAnnee || (annee == currentAnnee && semaine < currentSemaine)

        val periodKeys = mutableSetOf<Pair<Int, Int>>()
        previsions.forEach { p ->
            val s = p.semaine ?: return@forEach
            val a = p.annee
            if (isBeforeCurrent(s, a)) periodKeys.add(s to a)
        }
        pointsPV.forEach { pp ->
            val (s, a) = semaineAnneeOf(pp.reunion.dateReunion)
            if (isBeforeCurrent(s, a)) periodKeys.add(s to a)
        }

        val sortedPeriods = periodKeys.sortedWith(
            compareBy<Pair<Int, Int>> { -it.second }.thenBy { -it.first }
        ).take(maxSemaines)

        val previsionResponses = previsions.map { PrevisionMapper.toResponse(it) }
        val pointBloquantResponses = pointsBloquants.map { PointBloquantMapper.toResponse(it) }

        val pvByPeriod: Map<Pair<Int, Int>, com.mikaservices.platform.modules.reunionhebdo.entity.PointProjetPV> =
            pointsPV.associate { pp -> semaineAnneeOf(pp.reunion.dateReunion) to pp }

        val periodes = sortedPeriods.map { (semaine, annee) ->
            val previsionsPeriode = previsionResponses.filter { it.semaine == semaine && it.annee == annee }
            val pv = pvByPeriod[semaine to annee]
            val dateReunion = pv?.reunion?.dateReunion
            val pointsBloquantsPeriode = pointBloquantResponses.filter { pb ->
                val (s, a) = semaineAnneeOf(pb.dateDetection)
                s == semaine && a == annee
            }
            val pvResume = pv?.let {
                PvResumeResponse(
                    reunionId = it.reunion.id!!,
                    dateReunion = it.reunion.dateReunion,
                    resumeTravauxPrevisions = it.resumeTravauxPrevisions,
                    pointsBloquantsResume = it.pointsBloquantsResume,
                    besoinsMateriel = it.besoinsMateriel,
                    besoinsHumain = it.besoinsHumain,
                    propositionsAmelioration = it.propositionsAmelioration,
                    avancementPhysiquePct = it.avancementPhysiquePct,
                    avancementFinancierPct = it.avancementFinancierPct,
                    delaiConsommePct = it.delaiConsommePct
                )
            }
            PeriodeHistoriqueResponse(
                semaine = semaine,
                annee = annee,
                dateReunion = dateReunion,
                previsions = previsionsPeriode,
                pointsBloquants = pointsBloquantsPeriode,
                pvResume = pvResume
            )
        }

        return ProjetHistoriqueResponse(
            projetId = projet.id!!,
            projetNom = projet.nom,
            periodes = periodes
        )
    }
}
