package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.modules.materiel.dto.response.JournalAuditTerrainResponse
import com.mikaservices.platform.modules.materiel.entity.JournalAuditTerrain
import com.mikaservices.platform.modules.materiel.repository.JournalAuditTerrainRepository
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

/**
 * Journal d'audit append-only des actions terrain.
 * L'écriture est non bloquante : un échec d'audit ne fait jamais échouer l'action métier.
 */
@Service
class TerrainAuditService(
    private val repository: JournalAuditTerrainRepository,
    private val currentUserService: CurrentUserService,
) {
    private val logger = LoggerFactory.getLogger(TerrainAuditService::class.java)

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun log(
        action: String,
        entiteType: String,
        entiteId: Long? = null,
        projetId: Long? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        payload: String? = null,
    ) {
        try {
            val user = currentUserService.getCurrentUser()
            repository.save(
                JournalAuditTerrain(
                    acteurId = user?.id,
                    acteurNom = user?.let { "${it.prenom} ${it.nom}".trim() },
                    action = action,
                    entiteType = entiteType,
                    entiteId = entiteId,
                    projetId = projetId,
                    latitude = latitude,
                    longitude = longitude,
                    payload = payload,
                )
            )
        } catch (e: Exception) {
            logger.warn("[TerrainAudit] Échec d'écriture audit ($action/$entiteType/$entiteId) : ${e.message}")
        }
    }

    @Transactional(readOnly = true)
    fun findAll(action: String?, entiteType: String?, acteurId: Long?, pageable: Pageable): Page<JournalAuditTerrainResponse> =
        repository.findFiltered(
            action?.takeIf { it.isNotBlank() },
            entiteType?.takeIf { it.isNotBlank() },
            acteurId,
            pageable,
        ).map {
            JournalAuditTerrainResponse(
                id = it.id!!,
                acteurId = it.acteurId,
                acteurNom = it.acteurNom,
                action = it.action,
                entiteType = it.entiteType,
                entiteId = it.entiteId,
                projetId = it.projetId,
                latitude = it.latitude,
                longitude = it.longitude,
                payload = it.payload,
                dateAction = it.createdAt,
            )
        }
}
