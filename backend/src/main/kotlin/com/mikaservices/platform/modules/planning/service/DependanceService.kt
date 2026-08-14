package com.mikaservices.platform.modules.planning.service

import com.mikaservices.platform.common.enums.TypeDependance
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.planning.dto.request.DependanceCreateRequest
import com.mikaservices.platform.modules.planning.dto.response.DependanceResponse
import com.mikaservices.platform.modules.planning.dto.response.GanttDataResponse
import com.mikaservices.platform.modules.planning.dto.response.TacheResponse
import com.mikaservices.platform.modules.planning.entity.DependanceTache
import com.mikaservices.platform.modules.planning.entity.Tache
import com.mikaservices.platform.modules.planning.mapper.TacheMapper
import com.mikaservices.platform.common.exception.ForbiddenException
import com.mikaservices.platform.modules.planning.repository.DependanceTacheRepository
import com.mikaservices.platform.modules.planning.repository.TacheRepository
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
@Transactional
class DependanceService(
    private val dependanceRepository: DependanceTacheRepository,
    private val tacheRepository: TacheRepository,
    private val currentUserService: CurrentUserService
) {

    fun create(request: DependanceCreateRequest): DependanceResponse {
        if (request.tacheSourceId == request.tacheCibleId) {
            throw BadRequestException("Une tâche ne peut pas dépendre d'elle-même")
        }
        if (dependanceRepository.existsByTacheSourceIdAndTacheCibleId(request.tacheSourceId, request.tacheCibleId)) {
            throw BadRequestException("Cette dépendance existe déjà")
        }

        val source = tacheRepository.findById(request.tacheSourceId)
            .orElseThrow { ResourceNotFoundException("Tâche source non trouvée: ${request.tacheSourceId}") }
        val cible = tacheRepository.findById(request.tacheCibleId)
            .orElseThrow { ResourceNotFoundException("Tâche cible non trouvée: ${request.tacheCibleId}") }

        if (source.projet.id != cible.projet.id) {
            throw BadRequestException("Les deux tâches doivent appartenir au même projet")
        }

        // Vérification de cycle simple : la cible ne doit pas déjà être un prédécesseur de la source
        if (hasCycle(request.tacheCibleId, request.tacheSourceId)) {
            throw BadRequestException("Cette dépendance créerait un cycle")
        }

        val dep = DependanceTache(
            tacheSource = source,
            tacheCible = cible,
            typeDependance = request.typeDependance,
            delaiJours = request.delaiJours
        )
        val saved = dependanceRepository.save(dep)
        return toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long): List<DependanceResponse> {
        return dependanceRepository.findByProjetId(projetId).map { toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findByTache(tacheId: Long): List<DependanceResponse> {
        return dependanceRepository.findByTacheId(tacheId).map { toResponse(it) }
    }

    fun delete(id: Long) {
        val dep = dependanceRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Dépendance non trouvée: $id") }
        if (!currentUserService.canEditProjet(dep.tacheSource.projet.responsableProjet?.id)) {
            throw ForbiddenException("Seul le chef de projet peut supprimer les dépendances de ce projet.")
        }
        dependanceRepository.delete(dep)
    }

    @Transactional(readOnly = true)
    fun getGanttData(projetId: Long): GanttDataResponse {
        val taches = tacheRepository.findByProjetId(projetId).map { TacheMapper.toResponse(it) }
        val dependances = dependanceRepository.findByProjetId(projetId).map { toResponse(it) }
        return GanttDataResponse(taches = taches, dependances = dependances)
    }

    /**
     * Calcul du chemin critique (CPM simplifié).
     * Retourne les tâches qui se trouvent sur le chemin le plus long du projet.
     */
    @Transactional(readOnly = true)
    fun getCheminCritique(projetId: Long): List<TacheResponse> {
        val taches = tacheRepository.findByProjetId(projetId)
        if (taches.isEmpty()) return emptyList()

        val deps = dependanceRepository.findByProjetId(projetId)

        // Construire le graphe : tacheId -> liste des successeurs (tacheCibleId, délai)
        val successors = mutableMapOf<Long, MutableList<Pair<Long, Int>>>()
        val predecessors = mutableMapOf<Long, MutableList<Long>>()
        for (d in deps) {
            val srcId = d.tacheSource.id!!
            val tgtId = d.tacheCible.id!!
            successors.getOrPut(srcId) { mutableListOf() }.add(tgtId to d.delaiJours)
            predecessors.getOrPut(tgtId) { mutableListOf() }.add(srcId)
        }

        val tacheMap = taches.associateBy { it.id!! }
        val allIds = taches.map { it.id!! }

        // Durée d'une tâche en jours (dateDebut → dateFin, min 1 jour)
        fun duration(t: Tache): Long {
            val start = t.dateDebut ?: return 1
            val end = t.dateFin ?: t.dateEcheance ?: return 1
            val d = ChronoUnit.DAYS.between(start, end)
            return if (d < 1) 1 else d
        }

        // Forward pass : earliest start (ES) et earliest finish (EF)
        val es = mutableMapOf<Long, Long>()
        val ef = mutableMapOf<Long, Long>()
        // Tri topologique
        val inDegree = mutableMapOf<Long, Int>()
        for (id in allIds) inDegree[id] = 0
        for (d in deps) {
            val tgtId = d.tacheCible.id!!
            inDegree[tgtId] = (inDegree[tgtId] ?: 0) + 1
        }
        val queue = ArrayDeque<Long>()
        val topoOrder = mutableListOf<Long>()
        for (id in allIds) {
            es[id] = 0L
            if ((inDegree[id] ?: 0) == 0) queue.add(id)
        }
        while (queue.isNotEmpty()) {
            val current = queue.removeFirst()
            topoOrder.add(current)
            val dur = duration(tacheMap[current]!!)
            ef[current] = es[current]!! + dur
            for ((succId, delai) in successors[current] ?: emptyList()) {
                val newEs = ef[current]!! + delai
                if (newEs > (es[succId] ?: 0L)) es[succId] = newEs
                inDegree[succId] = (inDegree[succId] ?: 1) - 1
                if (inDegree[succId] == 0) queue.add(succId)
            }
        }

        // Si le graphe a des cycles (topoOrder incomplet), retourner vide
        if (topoOrder.size != allIds.size) return emptyList()

        // Backward pass : latest finish (LF) et latest start (LS)
        val projectEnd = ef.values.maxOrNull() ?: 0L
        val lf = mutableMapOf<Long, Long>()
        val ls = mutableMapOf<Long, Long>()
        for (id in allIds) lf[id] = projectEnd

        for (current in topoOrder.reversed()) {
            val dur = duration(tacheMap[current]!!)
            for ((succId, delai) in successors[current] ?: emptyList()) {
                val newLf = (ls[succId] ?: lf[succId]!!) - delai
                if (newLf < lf[current]!!) lf[current] = newLf
            }
            ls[current] = lf[current]!! - dur
        }

        // Tâches critiques : marge totale = 0 (LS - ES = 0)
        val criticalIds = allIds.filter { (ls[it] ?: 0L) - (es[it] ?: 0L) == 0L }.toSet()

        return taches
            .filter { it.id!! in criticalIds }
            .map { TacheMapper.toResponse(it) }
    }

    private fun hasCycle(fromId: Long, targetId: Long): Boolean {
        val visited = mutableSetOf<Long>()
        val queue = ArrayDeque<Long>()
        queue.add(fromId)
        while (queue.isNotEmpty()) {
            val current = queue.removeFirst()
            if (current == targetId) return true
            if (!visited.add(current)) continue
            val deps = dependanceRepository.findByTacheId(current)
            for (d in deps) {
                if (d.tacheSource.id == current) queue.add(d.tacheCible.id!!)
            }
        }
        return false
    }

    private fun toResponse(entity: DependanceTache): DependanceResponse {
        return DependanceResponse(
            id = entity.id!!,
            tacheSourceId = entity.tacheSource.id!!,
            tacheSourceTitre = entity.tacheSource.titre,
            tacheCibleId = entity.tacheCible.id!!,
            tacheCibleTitre = entity.tacheCible.titre,
            typeDependance = entity.typeDependance,
            delaiJours = entity.delaiJours
        )
    }
}
