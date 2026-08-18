package com.mikaservices.platform.modules.planning.service

import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.common.enums.StatutTache
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ForbiddenException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.planning.dto.request.TacheCreateRequest
import com.mikaservices.platform.modules.planning.dto.request.TacheUpdateRequest
import com.mikaservices.platform.modules.planning.dto.response.ProjetPlanningStatsResponse
import com.mikaservices.platform.modules.planning.dto.response.TacheResponse
import com.mikaservices.platform.modules.planning.entity.Tache
import com.mikaservices.platform.modules.planning.mapper.TacheMapper
import com.mikaservices.platform.modules.planning.repository.DependanceTacheRepository
import com.mikaservices.platform.modules.planning.repository.TacheRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class PlanningService(
    private val tacheRepository: TacheRepository,
    private val dependanceTacheRepository: DependanceTacheRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository,
    private val currentUserService: CurrentUserService
) {
    private val logger = LoggerFactory.getLogger(PlanningService::class.java)

    fun createTache(request: TacheCreateRequest): TacheResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: ${request.projetId}") }
        if (!currentUserService.canEditProjet(projet.responsableProjet?.id)) {
            throw ForbiddenException("Seul le chef de projet peut créer des tâches pour ce projet.")
        }
        requireProjetNonGele(projet)
        validateDates(request.dateDebut, request.dateFin, request.dateEcheance)
        validateDatesDansPeriodeProjet(projet, request.dateDebut, request.dateFin, request.dateEcheance)

        val tache = Tache(
            projet = projet, titre = request.titre,
            description = request.description, statut = request.statut, priorite = request.priorite,
            dateDebut = request.dateDebut, dateFin = request.dateFin, dateEcheance = request.dateEcheance,
            semaine = request.semaine, annee = request.annee, typePrevision = request.typePrevision,
            pourcentageAvancement = request.pourcentageAvancement ?: 0,
            estJalon = request.estJalon, couleur = request.couleur, ordreAffichage = request.ordreAffichage
        )

        request.assigneAId?.let { userId ->
            tache.assigneA = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        request.tacheParentId?.let { parentId ->
            tache.tacheParent = tacheRepository.findById(parentId)
                .orElseThrow { ResourceNotFoundException("Tâche parente non trouvée avec l'ID: $parentId") }
        }

        val saved = tacheRepository.save(tache)
        logger.info("Tâche créée: ${saved.titre} pour le projet ${projet.nom}")
        return TacheMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long, pageable: Pageable): Page<TacheResponse> {
        return tacheRepository.findByProjetId(projetId, pageable).map { TacheMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): TacheResponse {
        val tache = tacheRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Tâche non trouvée avec l'ID: $id") }
        return TacheMapper.toResponse(tache)
    }

    @Transactional(readOnly = true)
    fun findMesTaches(userId: Long): List<TacheResponse> {
        // Sécurité : un utilisateur ne peut voir que ses propres tâches, sauf admin
        val currentUserId = currentUserService.getCurrentUserId()
        if (currentUserId != userId && !currentUserService.hasGlobalAdminRole()) {
            throw ForbiddenException("Vous ne pouvez consulter que vos propres tâches")
        }
        val statuts = listOf(StatutTache.A_FAIRE, StatutTache.EN_COURS, StatutTache.EN_ATTENTE)
        return tacheRepository.findTachesEnCoursParUtilisateur(userId, statuts).map { TacheMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findTachesEnRetard(): List<TacheResponse> {
        val statutsEnRetard = listOf(StatutTache.A_FAIRE, StatutTache.EN_COURS)
        val allEnRetard = tacheRepository.findTachesEnRetard(LocalDate.now(), statutsEnRetard)
        // Admin voit tout, sinon filtrer par projets dont l'utilisateur est responsable ou assigné
        if (currentUserService.hasGlobalAdminRole()) {
            return allEnRetard.map { TacheMapper.toResponse(it) }
        }
        val currentUserId = currentUserService.getCurrentUserId()
        return allEnRetard
            .filter { it.projet.responsableProjet?.id == currentUserId || it.assigneA?.id == currentUserId }
            .map { TacheMapper.toResponse(it) }
    }

    fun updateTache(id: Long, request: TacheUpdateRequest): TacheResponse {
        val tache = tacheRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Tâche non trouvée avec l'ID: $id") }
        if (!currentUserService.canEditProjet(tache.projet.responsableProjet?.id)) {
            throw ForbiddenException("Seul le chef de projet peut modifier les tâches de ce projet.")
        }
        requireProjetNonGele(tache.projet)

        request.titre?.let { tache.titre = it }
        request.description?.let { tache.description = it }
        request.statut?.let { tache.statut = it }
        request.priorite?.let { tache.priorite = it }
        request.dateDebut?.let { tache.dateDebut = it }
        request.dateFin?.let { tache.dateFin = it }
        request.dateEcheance?.let { tache.dateEcheance = it }
        request.pourcentageAvancement?.let { tache.pourcentageAvancement = it }

        // assigneAId: 0 ou négatif → désassigner, positif → assigner
        if (request.assigneAId != null) {
            if (request.assigneAId <= 0) {
                tache.assigneA = null
            } else {
                tache.assigneA = userRepository.findById(request.assigneAId)
                    .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: ${request.assigneAId}") }
            }
        }
        request.semaine?.let { tache.semaine = it }
        request.annee?.let { tache.annee = it }
        request.typePrevision?.let { tache.typePrevision = it }
        request.estJalon?.let { tache.estJalon = it }
        request.couleur?.let { tache.couleur = it }
        request.ordreAffichage?.let { tache.ordreAffichage = it }

        if (request.tacheParentId != null) {
            val parentId = request.tacheParentId
            if (parentId <= 0) {
                tache.tacheParent = null
            } else {
                if (parentId == tache.id) {
                    throw BadRequestException("Une tâche ne peut pas être son propre parent")
                }
                val parent = tacheRepository.findById(parentId)
                    .orElseThrow { ResourceNotFoundException("Tâche parente non trouvée avec l'ID: $parentId") }
                // Vérifier la circularité : remonter la chaîne des parents
                var ancestor = parent.tacheParent
                while (ancestor != null) {
                    if (ancestor.id == tache.id) {
                        throw BadRequestException("Référence circulaire détectée : cette tâche est déjà un ancêtre du parent choisi")
                    }
                    ancestor = ancestor.tacheParent
                }
                tache.tacheParent = parent
            }
        }

        // Valider la cohérence des dates après application des modifications
        validateDates(
            request.dateDebut ?: tache.dateDebut,
            request.dateFin ?: tache.dateFin,
            request.dateEcheance ?: tache.dateEcheance
        )
        // Ne valider la période projet que si une date a été modifiée (évite de bloquer
        // les tâches existantes dont les dates historiques débordent déjà)
        if (request.dateDebut != null || request.dateFin != null || request.dateEcheance != null) {
            validateDatesDansPeriodeProjet(tache.projet, tache.dateDebut, tache.dateFin, tache.dateEcheance)
        }

        // Interdire de terminer une tâche parente tant que des sous-tâches ne sont pas terminées
        if (request.statut == StatutTache.TERMINEE) {
            val enfantsNonTermines = tache.tachesEnfants.filter { it.statut != StatutTache.TERMINEE && it.statut != StatutTache.ANNULEE }
            if (enfantsNonTermines.isNotEmpty()) {
                val apercu = enfantsNonTermines.take(3).joinToString(", ") { it.titre }
                throw BadRequestException(
                    "Impossible de terminer cette tâche : ${enfantsNonTermines.size} sous-tâche(s) non terminée(s) ($apercu${if (enfantsNonTermines.size > 3) ", …" else ""})."
                )
            }
        }

        // Si terminée, mettre avancement à 100
        if (tache.statut == StatutTache.TERMINEE) {
            if (tache.pourcentageAvancement != 100) {
                logger.debug("Tâche ${tache.id}: avancement forcé de ${tache.pourcentageAvancement}% à 100% (statut TERMINEE)")
            }
            tache.pourcentageAvancement = 100
            if (tache.dateFin == null) tache.dateFin = LocalDate.now()
        }

        val saved = tacheRepository.save(tache)
        logger.info("Tâche mise à jour: ${saved.titre} (statut: ${saved.statut})")
        return TacheMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAllByProjet(projetId: Long): List<TacheResponse> {
        return tacheRepository.findByProjetId(projetId).map { TacheMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findPrevisionsByProjet(projetId: Long): List<TacheResponse> {
        return tacheRepository.findPrevisionsByProjetId(projetId).map { TacheMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findPrevisionsByProjetAndAnnee(projetId: Long, annee: Int): List<TacheResponse> {
        return tacheRepository.findByProjetIdAndAnnee(projetId, annee)
            .filter { it.typePrevision != null }
            .map { TacheMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findPrevisionsByProjetAndSemaineAndAnnee(projetId: Long, semaine: Int, annee: Int): List<TacheResponse> {
        return tacheRepository.findByProjetIdAndSemaineAndAnnee(projetId, semaine, annee)
            .filter { it.typePrevision != null }
            .map { TacheMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun getStatsMesProjets(): List<ProjetPlanningStatsResponse> {
        val currentUserId = currentUserService.getCurrentUserId()
        val isAdmin = currentUserService.hasGlobalAdminRole()

        // Récupérer les projets accessibles par l'utilisateur
        val projets = if (isAdmin) {
            projetRepository.findAll()
        } else {
            // Projets où l'utilisateur est responsable
            val mesProjets = projetRepository.findByResponsableProjetIdAndActifTrue(currentUserId!!)
            // Projets où l'utilisateur a des tâches assignées
            val tachesAssignees = tacheRepository.findByAssigneAId(currentUserId)
            val projetIdsAssignes = tachesAssignees.map { it.projet.id!! }.toSet()
            val projetsAssignes = projetIdsAssignes
                .filter { id -> mesProjets.none { it.id == id } }
                .mapNotNull { id -> projetRepository.findById(id).orElse(null) }
            mesProjets + projetsAssignes
        }

        if (projets.isEmpty()) return emptyList()

        val projetIds = projets.mapNotNull { it.id }
        if (projetIds.isEmpty()) return emptyList()

        val rows = tacheRepository.getStatsByProjetIds(projetIds)

        // Mapper les résultats — projets sans tâches doivent quand même apparaître
        val statsMap = rows.associate { row ->
            val projetId = (row[0] as Number).toLong()
            projetId to ProjetPlanningStatsResponse(
                projetId = projetId,
                projetNom = row[1] as String,
                ville = row[2] as? String,
                total = (row[3] as Number).toLong(),
                aFaire = (row[4] as Number).toLong(),
                enCours = (row[5] as Number).toLong(),
                enAttente = (row[6] as Number).toLong(),
                terminees = (row[7] as Number).toLong(),
                annulees = (row[8] as Number).toLong(),
                enRetard = (row[9] as Number).toLong(),
                avancement = (row[10] as Number).toInt()
            )
        }

        return projets.map { p ->
            statsMap[p.id] ?: ProjetPlanningStatsResponse(
                projetId = p.id!!, projetNom = p.nom, ville = p.ville,
                total = 0, aFaire = 0, enCours = 0, enAttente = 0,
                terminees = 0, annulees = 0, enRetard = 0, avancement = 0
            )
        }
    }

    fun deleteTache(id: Long) {
        val tache = tacheRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Tâche non trouvée avec l'ID: $id") }
        if (!currentUserService.canEditProjet(tache.projet.responsableProjet?.id)) {
            throw ForbiddenException("Seul le chef de projet peut supprimer les tâches de ce projet.")
        }
        requireProjetNonGele(tache.projet)
        // Supprimer les dépendances liées avant de supprimer la tâche (évite les orphelins)
        val deps = dependanceTacheRepository.findByTacheId(id)
        if (deps.isNotEmpty()) {
            dependanceTacheRepository.deleteAll(deps)
            logger.info("${deps.size} dépendance(s) nettoyée(s) pour la tâche $id")
        }
        val childCount = tache.tachesEnfants.size
        tacheRepository.delete(tache)
        logger.info("Tâche supprimée: ${tache.titre} (+ $childCount sous-tâches)")
    }

    /** C4 : gel du planning après réception définitive du projet. */
    private fun requireProjetNonGele(projet: com.mikaservices.platform.modules.projet.entity.Projet) {
        if (projet.statut == StatutProjet.RECEPTION_DEFINITIVE) {
            throw BadRequestException(
                "Le projet « ${projet.nom} » a été réceptionné définitivement : son planning est gelé et ne peut plus être modifié."
            )
        }
    }

    /** C3 : les dates d'une tâche doivent rester dans la période du projet (si définie). */
    private fun validateDatesDansPeriodeProjet(
        projet: com.mikaservices.platform.modules.projet.entity.Projet,
        dateDebut: LocalDate?,
        dateFin: LocalDate?,
        dateEcheance: LocalDate?
    ) {
        val debutProjet = projet.dateDebut
        val finProjet = projet.dateFin
        if (debutProjet != null && dateDebut != null && dateDebut.isBefore(debutProjet)) {
            throw BadRequestException("La date de début de la tâche ($dateDebut) est antérieure au début du projet ($debutProjet)")
        }
        if (finProjet != null) {
            val derniereDate = listOfNotNull(dateFin, dateEcheance).maxOrNull()
            if (derniereDate != null && derniereDate.isAfter(finProjet)) {
                throw BadRequestException("La fin de la tâche ($derniereDate) dépasse la date de fin du projet ($finProjet)")
            }
        }
    }

    private fun validateDates(dateDebut: LocalDate?, dateFin: LocalDate?, dateEcheance: LocalDate?) {
        if (dateDebut != null && dateFin != null && dateFin.isBefore(dateDebut)) {
            throw BadRequestException("La date de fin ne peut pas être antérieure à la date de début")
        }
        if (dateDebut != null && dateEcheance != null && dateEcheance.isBefore(dateDebut)) {
            throw BadRequestException("La date d'échéance ne peut pas être antérieure à la date de début")
        }
        if (dateFin != null && dateEcheance != null && dateFin.isAfter(dateEcheance)) {
            throw BadRequestException("La date de fin ne peut pas être postérieure à la date d'échéance")
        }
    }
}
