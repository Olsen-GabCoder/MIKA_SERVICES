package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.StatutMaintenance
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.PlanMaintenanceCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.PlanMaintenanceUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.response.OperationMaintenanceResponse
import com.mikaservices.platform.modules.materiel.dto.response.PlanMaintenanceResponse
import com.mikaservices.platform.modules.materiel.entity.OperationMaintenance
import com.mikaservices.platform.modules.materiel.entity.PlanMaintenance
import com.mikaservices.platform.modules.materiel.mapper.OperationMaintenanceMapper
import com.mikaservices.platform.modules.materiel.mapper.PlanMaintenanceMapper
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.OperationMaintenanceRepository
import com.mikaservices.platform.modules.materiel.repository.PlanMaintenanceRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class PlanMaintenanceService(
    private val planRepository: PlanMaintenanceRepository,
    private val maintenanceRepository: OperationMaintenanceRepository,
    private val enginRepository: EnginRepository
) {
    private val logger = LoggerFactory.getLogger(PlanMaintenanceService::class.java)

    fun create(enginId: Long, request: PlanMaintenanceCreateRequest): PlanMaintenanceResponse {
        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouvé avec l'ID: $enginId") }

        val plan = PlanMaintenance(
            engin = engin,
            titre = request.titre,
            description = request.description,
            typeOperation = request.typeOperation,
            intervalleJours = request.intervalleJours,
            intervalleHeures = request.intervalleHeures,
            intervalleKm = request.intervalleKm,
            seuilAlerte = request.seuilAlerte
        )
        // Calcul initial des prochaines échéances
        plan.recalculerEcheances()

        val saved = planRepository.save(plan)
        logger.info("Plan de maintenance créé pour engin ${engin.code}: ${saved.titre}")
        return PlanMaintenanceMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByEnginId(enginId: Long): List<PlanMaintenanceResponse> {
        return planRepository.findByEnginId(enginId)
            .map { PlanMaintenanceMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(enginId: Long, planId: Long): PlanMaintenanceResponse {
        val plan = getAndVerify(enginId, planId)
        return PlanMaintenanceMapper.toResponse(plan)
    }

    fun update(enginId: Long, planId: Long, request: PlanMaintenanceUpdateRequest): PlanMaintenanceResponse {
        val plan = getAndVerify(enginId, planId)
        request.titre?.let { plan.titre = it }
        request.description?.let { plan.description = it }
        request.typeOperation?.let { plan.typeOperation = it }
        request.intervalleJours?.let { plan.intervalleJours = it }
        request.intervalleHeures?.let { plan.intervalleHeures = it }
        request.intervalleKm?.let { plan.intervalleKm = it }
        request.seuilAlerte?.let { plan.seuilAlerte = it }
        request.actif?.let { plan.actif = it }
        // Recalculer les échéances si les intervalles changent
        plan.recalculerEcheances()
        val saved = planRepository.save(plan)
        logger.info("Plan de maintenance ${saved.id} mis à jour pour engin $enginId")
        return PlanMaintenanceMapper.toResponse(saved)
    }

    fun delete(enginId: Long, planId: Long) {
        val plan = getAndVerify(enginId, planId)
        planRepository.delete(plan)
        logger.info("Plan de maintenance $planId supprimé pour engin $enginId")
    }

    /**
     * Exécute un plan : crée une opération de maintenance et recalcule les échéances.
     * Appelé manuellement ou par un scheduler.
     */
    fun executerPlan(enginId: Long, planId: Long): OperationMaintenanceResponse {
        val plan = getAndVerify(enginId, planId)

        val operation = OperationMaintenance(
            engin = plan.engin,
            typeOperation = plan.typeOperation,
            statut = StatutMaintenance.PLANIFIEE,
            description = "${plan.titre} (plan récurrent)",
            echeanceDate = plan.prochaineEcheance,
            echeanceHeures = plan.prochainCompteur,
            planMaintenanceId = plan.id
        )
        val savedOp = maintenanceRepository.save(operation)

        // Mettre à jour le plan après exécution
        plan.derniereExecution = LocalDate.now()
        plan.dernierCompteur = plan.engin.heuresCompteur
        plan.recalculerEcheances()
        planRepository.save(plan)

        logger.info("Plan ${plan.titre} exécuté pour engin ${plan.engin.code}, opération ${savedOp.id} créée")
        return OperationMaintenanceMapper.toResponse(savedOp)
    }

    /**
     * Retourne les plans dont l'échéance est proche ou dépassée (pour alertes).
     */
    @Transactional(readOnly = true)
    fun findPlansEnAlerte(): List<PlanMaintenanceResponse> {
        val dateLimite = LocalDate.now().plusDays(60) // Horizon 60 jours
        val parDate = planRepository.findPlansEcheanceDateProche(dateLimite)
        val parCompteur = planRepository.findPlansEcheanceCompteurProche()
        val ids = mutableSetOf<Long>()
        val result = mutableListOf<PlanMaintenanceResponse>()
        (parDate + parCompteur).forEach { plan ->
            if (ids.add(plan.id!!)) {
                result.add(PlanMaintenanceMapper.toResponse(plan))
            }
        }
        return result
    }

    private fun getAndVerify(enginId: Long, planId: Long): PlanMaintenance {
        val plan = planRepository.findById(planId)
            .orElseThrow { ResourceNotFoundException("Plan de maintenance non trouvé avec l'ID: $planId") }
        if (plan.engin.id != enginId) {
            throw ResourceNotFoundException("Le plan $planId n'appartient pas à l'engin $enginId")
        }
        return plan
    }
}
