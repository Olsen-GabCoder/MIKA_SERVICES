package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.StatutMaintenance
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.OperationMaintenanceCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.OperationMaintenanceUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.response.OperationMaintenanceResponse
import com.mikaservices.platform.modules.materiel.entity.OperationMaintenance
import com.mikaservices.platform.modules.materiel.mapper.OperationMaintenanceMapper
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.OperationMaintenanceRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class OperationMaintenanceService(
    private val maintenanceRepository: OperationMaintenanceRepository,
    private val enginRepository: EnginRepository
) {
    private val logger = LoggerFactory.getLogger(OperationMaintenanceService::class.java)

    fun create(enginId: Long, request: OperationMaintenanceCreateRequest): OperationMaintenanceResponse {
        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouve avec l'ID: $enginId") }
        val op = OperationMaintenance(
            engin = engin,
            typeOperation = request.typeOperation,
            description = request.description,
            echeanceDate = request.echeanceDate,
            echeanceHeures = request.echeanceHeures,
            coutEstime = request.coutEstime,
            executePar = request.executePar
        )
        val saved = maintenanceRepository.save(op)
        logger.info("Maintenance creee pour engin ${engin.code}: ${saved.typeOperation}")
        return OperationMaintenanceMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByEnginId(enginId: Long, pageable: Pageable): Page<OperationMaintenanceResponse> {
        return maintenanceRepository.findByEnginId(enginId, pageable)
            .map { OperationMaintenanceMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findAllGlobal(
        pageable: Pageable,
        statut: StatutMaintenance? = null,
        type: com.mikaservices.platform.common.enums.TypeOperationMaintenance? = null,
        enginId: Long? = null
    ): Page<OperationMaintenanceResponse> {
        return maintenanceRepository.findAllGlobal(statut, type, enginId, pageable)
            .map { OperationMaintenanceMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findByPeriode(debut: java.time.LocalDate, fin: java.time.LocalDate): List<OperationMaintenanceResponse> {
        return maintenanceRepository.findByPeriode(debut, fin).map { OperationMaintenanceMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(enginId: Long, maintenanceId: Long): OperationMaintenanceResponse {
        val op = getAndVerify(enginId, maintenanceId)
        return OperationMaintenanceMapper.toResponse(op)
    }

    fun update(enginId: Long, maintenanceId: Long, request: OperationMaintenanceUpdateRequest): OperationMaintenanceResponse {
        val op = getAndVerify(enginId, maintenanceId)
        request.typeOperation?.let { op.typeOperation = it }
        request.statut?.let { op.statut = it }
        request.description?.let { op.description = it }
        request.echeanceDate?.let { op.echeanceDate = it }
        request.echeanceHeures?.let { op.echeanceHeures = it }
        request.coutEstime?.let { op.coutEstime = it }
        request.coutReel?.let { op.coutReel = it }
        request.executePar?.let { op.executePar = it }
        request.dateRealisation?.let { op.dateRealisation = it }
        val saved = maintenanceRepository.save(op)
        logger.info("Maintenance ${saved.id} mise a jour pour engin $enginId")
        return OperationMaintenanceMapper.toResponse(saved)
    }

    fun delete(enginId: Long, maintenanceId: Long) {
        val op = getAndVerify(enginId, maintenanceId)
        maintenanceRepository.delete(op)
        logger.info("Maintenance $maintenanceId supprimee pour engin $enginId")
    }

    @Transactional(readOnly = true)
    fun countPlanifiees(enginId: Long): Long {
        return maintenanceRepository.countByEnginIdAndStatut(enginId, StatutMaintenance.PLANIFIEE)
    }

    private fun getAndVerify(enginId: Long, maintenanceId: Long): OperationMaintenance {
        val op = maintenanceRepository.findById(maintenanceId)
            .orElseThrow { ResourceNotFoundException("Operation de maintenance non trouvee avec l'ID: $maintenanceId") }
        if (op.engin.id != enginId) {
            throw ResourceNotFoundException("L'operation $maintenanceId n'appartient pas a l'engin $enginId")
        }
        return op
    }
}
