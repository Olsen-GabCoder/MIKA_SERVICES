package com.mikaservices.platform.modules.budget.service

import com.mikaservices.platform.common.enums.StatutDepense
import com.mikaservices.platform.common.enums.TypeDepense
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.budget.dto.request.DepenseCreateRequest
import com.mikaservices.platform.modules.budget.dto.request.DepenseUpdateRequest
import com.mikaservices.platform.modules.budget.dto.response.BudgetSummaryResponse
import com.mikaservices.platform.modules.budget.dto.response.DepenseResponse
import com.mikaservices.platform.modules.budget.entity.Depense
import com.mikaservices.platform.modules.budget.mapper.DepenseMapper
import com.mikaservices.platform.modules.budget.repository.DepenseRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate

@Service
@Transactional
class BudgetService(
    private val depenseRepository: DepenseRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(BudgetService::class.java)

    fun createDepense(request: DepenseCreateRequest): DepenseResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: ${request.projetId}") }

        val depense = Depense(
            projet = projet, reference = request.reference,
            libelle = request.libelle, type = request.type, montant = request.montant,
            dateDepense = request.dateDepense, fournisseur = request.fournisseur,
            numeroFacture = request.numeroFacture, observations = request.observations
        )
        val saved = depenseRepository.save(depense)
        logger.info("Dépense créée: ${saved.reference} - ${saved.montant} FCFA pour le projet ${projet.nom}")
        return DepenseMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findDepensesByProjet(projetId: Long, pageable: Pageable): Page<DepenseResponse> {
        return depenseRepository.findByProjetId(projetId, pageable).map { DepenseMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findDepenseById(id: Long): DepenseResponse {
        val depense = depenseRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Dépense non trouvée avec l'ID: $id") }
        return DepenseMapper.toResponse(depense)
    }

    fun updateDepense(id: Long, request: DepenseUpdateRequest): DepenseResponse {
        val depense = depenseRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Dépense non trouvée avec l'ID: $id") }

        request.libelle?.let { depense.libelle = it }
        request.type?.let { depense.type = it }
        request.montant?.let { depense.montant = it }
        request.dateDepense?.let { depense.dateDepense = it }
        request.statut?.let { depense.statut = it }
        request.fournisseur?.let { depense.fournisseur = it }
        request.numeroFacture?.let { depense.numeroFacture = it }
        request.observations?.let { depense.observations = it }

        request.valideParId?.let { userId ->
            depense.validePar = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
            depense.dateValidation = LocalDate.now()
        }

        val saved = depenseRepository.save(depense)
        logger.info("Dépense mise à jour: ${saved.reference}")
        return DepenseMapper.toResponse(saved)
    }

    fun deleteDepense(id: Long) {
        val depense = depenseRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Dépense non trouvée avec l'ID: $id") }
        depenseRepository.delete(depense)
        logger.info("Dépense supprimée: ${depense.reference}")
    }

    @Transactional(readOnly = true)
    fun getBudgetSummary(projetId: Long): BudgetSummaryResponse {
        val projet = projetRepository.findById(projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: $projetId") }

        val totalDepenses = depenseRepository.sumMontantByProjetId(projetId)
        val budgetReference = projet.montantRevise ?: projet.montantHT ?: BigDecimal.ZERO
        val budgetRestant = budgetReference.subtract(totalDepenses)
        val tauxConsommation = if (budgetReference > BigDecimal.ZERO) {
            totalDepenses.multiply(BigDecimal(100)).divide(budgetReference, 2, RoundingMode.HALF_UP)
        } else BigDecimal.ZERO

        val depensesParType = TypeDepense.entries.associate { type ->
            type.name to depenseRepository.sumMontantByProjetIdAndType(projetId, type)
        }.filter { it.value > BigDecimal.ZERO }

        return BudgetSummaryResponse(
            projetId = projet.id!!,
            projetNom = projet.nom,
            montantHT = projet.montantHT,
            montantRevise = projet.montantRevise,
            totalDepenses = totalDepenses,
            budgetRestant = budgetRestant,
            tauxConsommation = tauxConsommation,
            depensesParType = depensesParType
        )
    }
}
