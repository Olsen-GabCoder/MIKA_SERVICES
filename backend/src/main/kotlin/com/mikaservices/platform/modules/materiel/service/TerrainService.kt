package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.modules.materiel.entity.SourcePosition
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.ConsommationCarburantCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.InspectionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.PositionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.ReleveCompteurCreateRequest
import com.mikaservices.platform.modules.materiel.dto.response.TerrainEnginResponse
import com.mikaservices.platform.modules.materiel.entity.Engin
import com.mikaservices.platform.modules.materiel.repository.AffectationEnginChantierRepository
import com.mikaservices.platform.modules.materiel.repository.ConsommationCarburantRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.InspectionEnginRepository
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

/**
 * Service de l'application mobile terrain (conducteurs d'engins).
 * Délègue aux services métier existants sans modifier leurs règles.
 */
@Service
@Transactional(readOnly = true)
class TerrainService(
    private val enginRepository: EnginRepository,
    private val affectationRepository: AffectationEnginChantierRepository,
    private val inspectionRepository: InspectionEnginRepository,
    private val consommationRepository: ConsommationCarburantRepository,
    private val positionEnginService: PositionEnginService,
    private val releveCompteurService: ReleveCompteurService,
    private val consommationCarburantService: ConsommationCarburantService,
    private val incidentEnginService: IncidentEnginService,
    private val inspectionEnginService: InspectionEnginService,
    private val currentUserService: CurrentUserService
) {

    /** Nom complet de l'utilisateur connecté (pour tracer qui agit sur le terrain). */
    private fun currentUserNom(): String? =
        currentUserService.getCurrentUser()?.let { "${it.prenom} ${it.nom}".trim() }

    private fun chantierEnCours(enginId: Long): String? =
        affectationRepository.findByEnginIdAndStatut(enginId, StatutAffectation.EN_COURS)
            .firstOrNull()?.projet?.nom

    private fun toTerrainResponse(engin: Engin): TerrainEnginResponse {
        val id = engin.id!!
        return TerrainEnginResponse(
            id = id,
            code = engin.code,
            nom = engin.nom,
            type = engin.type,
            statut = engin.statut,
            marque = engin.marque,
            modele = engin.modele,
            heuresCompteur = engin.heuresCompteur,
            chantierNom = chantierEnCours(id),
            inspectionFaiteAujourdhui = inspectionRepository.existsByEnginIdAndDateInspection(id, LocalDate.now()),
            dernierPlein = consommationRepository.findByEnginIdOrderByDatePleinDesc(id).firstOrNull()?.datePlein
        )
    }

    /** Engins en affectation EN_COURS (v1 : pas encore de lien nominatif conducteur/engin). */
    fun mesEngins(): List<TerrainEnginResponse> =
        affectationRepository.findByStatutIn(listOf(StatutAffectation.EN_COURS))
            .map { it.engin }
            .filter { it.actif }
            .distinctBy { it.id }
            .map { toTerrainResponse(it) }

    /**
     * Résout un engin depuis un scan QR ou une saisie manuelle.
     * Accepte : le code engin (ENG-2024-042), le token QR, ou l'URL encodée dans le QR (…/engins/{id}).
     */
    fun scan(q: String): TerrainEnginResponse {
        val query = q.trim()
        val engin = enginRepository.findByCode(query).orElse(null)
            ?: enginRepository.findByQrCodeToken(query).orElse(null)
            ?: Regex("""/engins/(\d+)""").find(query)?.groupValues?.get(1)?.toLongOrNull()
                ?.let { enginRepository.findById(it).orElse(null) }
            ?: throw ResourceNotFoundException("Aucun engin trouvé pour « $query »")
        if (!engin.actif) throw ResourceNotFoundException("Engin inactif : ${engin.code}")
        return toTerrainResponse(engin)
    }

    /** Confirmation de position au scan QR : source forcée QR_SCAN, traçabilité conducteur + chantier. */
    @Transactional
    fun confirmerPosition(enginId: Long, request: PositionEnginCreateRequest) =
        positionEnginService.create(
            enginId,
            request.copy(
                source = SourcePosition.QR_SCAN,
                confirmePar = request.confirmePar ?: currentUserNom(),
                chantierNom = request.chantierNom ?: chantierEnCours(enginId)
            )
        )

    @Transactional
    fun creerReleve(enginId: Long, request: ReleveCompteurCreateRequest) =
        releveCompteurService.create(enginId, request.copy(relevePar = request.relevePar ?: currentUserNom()))

    @Transactional
    fun creerRavitaillement(enginId: Long, request: ConsommationCarburantCreateRequest) =
        consommationCarburantService.create(enginId, request.copy(pleinPar = request.pleinPar ?: currentUserNom()))

    @Transactional
    fun signalerIncident(enginId: Long, request: IncidentEnginCreateRequest) =
        incidentEnginService.create(enginId, request.copy(signalePar = request.signalePar ?: currentUserNom()))

    @Transactional
    fun creerInspection(enginId: Long, request: InspectionEnginCreateRequest) =
        inspectionEnginService.create(enginId, request.copy(inspectePar = request.inspectePar ?: currentUserNom()))
}
