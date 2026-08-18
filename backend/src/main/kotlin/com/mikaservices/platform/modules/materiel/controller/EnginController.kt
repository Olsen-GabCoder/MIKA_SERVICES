package com.mikaservices.platform.modules.materiel.controller

import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.TypeEngin
import com.mikaservices.platform.modules.materiel.dto.request.AffectationEnginRequest
import com.mikaservices.platform.modules.materiel.dto.request.AffectationEnginUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.request.EnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.EnginUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.request.ConsommationCarburantCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.DocumentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.DocumentEnginUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.InspectionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.request.OperationMaintenanceCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.OperationMaintenanceUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.request.PlanMaintenanceCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.PositionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.PlanMaintenanceUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.request.ReleveCompteurCreateRequest
import com.mikaservices.platform.modules.materiel.dto.response.AlerteEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.EcheanceEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.AffectationEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.CarnetEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.CoutEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.ConsommationCarburantResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginCarteResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginStatsResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginSummaryResponse
import com.mikaservices.platform.modules.materiel.dto.response.DocumentEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.IncidentEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.InspectionEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.MouvementEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.HeuresMensuellesResponse
import com.mikaservices.platform.modules.materiel.dto.response.OperationMaintenanceResponse
import com.mikaservices.platform.modules.materiel.dto.response.PlanMaintenanceResponse
import com.mikaservices.platform.modules.materiel.dto.response.PositionEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.ReleveCompteurResponse
import com.mikaservices.platform.modules.materiel.service.EnginService
import com.mikaservices.platform.modules.materiel.service.CarnetEnginService
import com.mikaservices.platform.modules.materiel.service.CoutEnginService
import com.mikaservices.platform.modules.materiel.service.ConsommationCarburantService
import com.mikaservices.platform.modules.materiel.service.DocumentEnginService
import com.mikaservices.platform.modules.materiel.service.EnginCarteService
import com.mikaservices.platform.modules.materiel.service.EnginStatsService
import com.mikaservices.platform.modules.materiel.service.IncidentEnginService
import com.mikaservices.platform.modules.materiel.service.InspectionEnginService
import com.mikaservices.platform.modules.materiel.service.MouvementEnginService
import com.mikaservices.platform.modules.materiel.service.OperationMaintenanceService
import com.mikaservices.platform.modules.materiel.service.PlanMaintenanceService
import com.mikaservices.platform.modules.materiel.service.PositionEnginService
import com.mikaservices.platform.modules.materiel.service.ReleveCompteurService
import com.google.zxing.BarcodeFormat
import com.google.zxing.client.j2se.MatrixToImageWriter
import com.google.zxing.qrcode.QRCodeWriter
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.core.io.Resource
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/engins")
@Tag(name = "Engins", description = "Gestion du parc d'engins et matériel")
class EnginController(
    private val enginService: EnginService,
    private val mouvementEnginService: MouvementEnginService,
    private val maintenanceService: OperationMaintenanceService,
    private val incidentService: IncidentEnginService,
    private val documentService: DocumentEnginService,
    private val releveCompteurService: ReleveCompteurService,
    private val consommationService: ConsommationCarburantService,
    private val statsService: EnginStatsService,
    private val carteService: EnginCarteService,
    private val carnetService: CarnetEnginService,
    private val planMaintenanceService: PlanMaintenanceService,
    private val coutService: CoutEnginService,
    private val inspectionService: InspectionEnginService,
    private val positionService: PositionEnginService,
) {
    @PostMapping
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Créer un engin (code auto-généré si non fourni)")
    fun create(@Valid @RequestBody request: EnginCreateRequest): ResponseEntity<EnginResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(enginService.create(request))
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister les engins (filtres optionnels : statut, type, projetId)")
    fun findAll(
        @RequestParam(required = false) statut: StatutEngin?,
        @RequestParam(required = false) type: TypeEngin?,
        @RequestParam(required = false) projetId: Long?,
        @PageableDefault(size = 20) pageable: Pageable,
    ): ResponseEntity<Page<EnginSummaryResponse>> {
        return ResponseEntity.ok(enginService.findAll(pageable, statut, type, projetId))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Obtenir un engin par ID")
    fun findById(@PathVariable id: Long): ResponseEntity<EnginResponse> {
        return ResponseEntity.ok(enginService.findById(id))
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Statistiques globales du parc d'engins")
    fun getStats(): ResponseEntity<EnginStatsResponse> {
        return ResponseEntity.ok(statsService.getStats())
    }

    @GetMapping("/alertes")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Alertes actives du parc (maintenances en retard, incidents, documents expirant)")
    fun getAlertes(): ResponseEntity<List<AlerteEnginResponse>> {
        return ResponseEntity.ok(statsService.getAlertes())
    }

    @GetMapping("/echeances")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Échéances à venir (maintenances, documents, fins d'affectation)")
    fun getEcheances(@RequestParam(defaultValue = "7") jours: Int): ResponseEntity<List<EcheanceEnginResponse>> {
        return ResponseEntity.ok(statsService.getEcheances(jours))
    }

    @GetMapping("/carte")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Positions des engins sur la carte (via chantier d'affectation)")
    fun getPositions(): ResponseEntity<List<EnginCarteResponse>> {
        return ResponseEntity.ok(carteService.getPositions())
    }

    @GetMapping("/export", produces = ["text/csv"])
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Exporter la liste des engins en CSV")
    fun exportCsv(): ResponseEntity<ByteArray> {
        val engins = enginService.findAll(Pageable.unpaged(), null, null)
        val sb = StringBuilder()
        sb.appendLine("Code;Nom;Type;Marque;Immatriculation;Statut;Etat;Location;Chantier actuel;Heures compteur")
        for (e in engins.content) {
            sb.appendLine("${e.code};${e.nom};${e.type};${e.marque ?: ""};${e.immatriculation ?: ""};${e.statut};${e.etat ?: ""};${if (e.estLocation) "Oui" else "Non"};${e.chantierActuel ?: ""};${e.heuresCompteur}")
        }
        val bytes = sb.toString().toByteArray(Charsets.UTF_8)
        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=engins_export.csv")
            .header("Content-Type", "text/csv; charset=UTF-8")
            .body(bytes)
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Rechercher des engins")
    fun search(@RequestParam q: String, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<EnginSummaryResponse>> {
        return ResponseEntity.ok(enginService.search(q, pageable))
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister les engins disponibles")
    fun findDisponibles(): ResponseEntity<List<EnginSummaryResponse>> {
        return ResponseEntity.ok(enginService.findDisponibles())
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Mettre à jour un engin")
    fun update(@PathVariable id: Long, @Valid @RequestBody request: EnginUpdateRequest): ResponseEntity<EnginResponse> {
        return ResponseEntity.ok(enginService.update(id, request))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Désactiver un engin")
    fun delete(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        enginService.delete(id)
        return ResponseEntity.ok(mapOf("message" to "Engin désactivé avec succès"))
    }

    // ========== Photo ==========
    @PostMapping("/{id}/photo", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Upload de la photo de profil d'un engin")
    fun uploadPhoto(@PathVariable id: Long, @RequestParam("file") file: MultipartFile): ResponseEntity<EnginResponse> {
        return ResponseEntity.ok(enginService.uploadPhoto(id, file))
    }

    @GetMapping("/{id}/photo")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Récupérer la photo de profil d'un engin")
    fun getPhoto(@PathVariable id: Long): ResponseEntity<Resource> {
        val resource = enginService.getPhotoResource(id)
            ?: return ResponseEntity.noContent().build()
        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_JPEG)
            .body(resource)
    }

    // ========== QR Code ==========
    @GetMapping("/{id}/qrcode", produces = [MediaType.IMAGE_PNG_VALUE])
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Générer un QR code PNG pour un engin")
    fun getQrCode(
        @PathVariable id: Long,
        @RequestParam(defaultValue = "300") size: Int,
        @RequestParam(required = false) baseUrl: String?
    ): ResponseEntity<ByteArray> {
        val engin = enginService.findById(id)
        val url = "${baseUrl ?: "https://mika-services.onrender.com"}/materiel/engins/${engin.id}"
        val writer = QRCodeWriter()
        val matrix = writer.encode(url, BarcodeFormat.QR_CODE, size, size)
        val stream = java.io.ByteArrayOutputStream()
        MatrixToImageWriter.writeToStream(matrix, "PNG", stream)
        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_PNG)
            .header("Content-Disposition", "inline; filename=qr_${engin.code}.png")
            .body(stream.toByteArray())
    }

    // ========== Affectations ==========
    @PostMapping("/affectations")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Affecter un engin à un projet (détection automatique des conflits)")
    fun affecterEngin(@Valid @RequestBody request: AffectationEnginRequest): ResponseEntity<AffectationEnginResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(enginService.affecterEngin(request))
    }

    @PutMapping("/affectations/{affectationId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Modifier une affectation (dates, statut, heures) avec re-détection des conflits")
    fun updateAffectation(@PathVariable affectationId: Long, @Valid @RequestBody request: AffectationEnginUpdateRequest): ResponseEntity<AffectationEnginResponse> {
        return ResponseEntity.ok(enginService.updateAffectation(affectationId, request))
    }

    @PatchMapping("/affectations/{affectationId}/terminer")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Terminer une affectation et libérer l'engin")
    fun terminerAffectation(@PathVariable affectationId: Long): ResponseEntity<AffectationEnginResponse> {
        return ResponseEntity.ok(enginService.terminerAffectation(affectationId))
    }

    @DeleteMapping("/affectations/{affectationId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Supprimer une affectation")
    fun deleteAffectation(@PathVariable affectationId: Long): ResponseEntity<Void> {
        enginService.deleteAffectation(affectationId)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/affectations/planning")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Toutes les affectations actives/planifiées pour le planning Gantt")
    fun findAffectationsForPlanning(): ResponseEntity<List<AffectationEnginResponse>> {
        return ResponseEntity.ok(enginService.findAffectationsForPlanning())
    }

    @GetMapping("/affectations/projet/{projetId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister les affectations d'engins d'un projet")
    fun findAffectationsByProjet(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<AffectationEnginResponse>> {
        return ResponseEntity.ok(enginService.findAffectationsByProjet(projetId, pageable))
    }

    @GetMapping("/{id}/affectations")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister les affectations d'un engin")
    fun findAffectationsByEngin(@PathVariable id: Long): ResponseEntity<List<AffectationEnginResponse>> {
        return ResponseEntity.ok(enginService.findAffectationsByEngin(id))
    }

    @PostMapping("/{id}/positions")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Confirmer/enregistrer une position d'engin (historisée)")
    fun createPosition(@PathVariable id: Long, @Valid @RequestBody request: PositionEnginCreateRequest): ResponseEntity<PositionEnginResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(positionService.create(id, request))
    }

    @GetMapping("/{id}/positions")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Historique des positions d'un engin")
    fun findPositionsByEngin(@PathVariable id: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<PositionEnginResponse>> {
        return ResponseEntity.ok(positionService.findByEnginId(id, pageable))
    }

    @PostMapping("/{id}/inspections")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Enregistrer une inspection quotidienne (incident auto si anomalie)")
    fun createInspection(@PathVariable id: Long, @Valid @RequestBody request: InspectionEnginCreateRequest): ResponseEntity<InspectionEnginResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(inspectionService.create(id, request))
    }

    @GetMapping("/{id}/inspections")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Historique des inspections quotidiennes d'un engin")
    fun findInspectionsByEngin(@PathVariable id: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<InspectionEnginResponse>> {
        return ResponseEntity.ok(inspectionService.findByEnginId(id, pageable))
    }

    @GetMapping("/{id}/couts")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Journal des coûts et TCO d'un engin")
    fun getCouts(@PathVariable id: Long): ResponseEntity<CoutEnginResponse> {
        return ResponseEntity.ok(coutService.getCouts(id))
    }

    @GetMapping("/{id}/carnet")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Carnet de bord d'un engin (timeline agrégée)")
    fun getCarnet(@PathVariable id: Long): ResponseEntity<CarnetEnginResponse> {
        return ResponseEntity.ok(carnetService.getCarnet(id))
    }

    @GetMapping("/{id}/mouvements")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Historique des mouvements d'un engin")
    fun findMouvementsByEngin(@PathVariable id: Long): ResponseEntity<List<MouvementEnginResponse>> {
        return ResponseEntity.ok(mouvementEnginService.findByEnginId(id))
    }

    // ========== Maintenances ==========
    @GetMapping("/maintenances")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister toutes les maintenances du parc (filtres : statut, type, enginId)")
    fun findAllMaintenances(
        @RequestParam(required = false) statut: com.mikaservices.platform.common.enums.StatutMaintenance?,
        @RequestParam(required = false) type: com.mikaservices.platform.common.enums.TypeOperationMaintenance?,
        @RequestParam(required = false) enginId: Long?,
        @PageableDefault(size = 50) pageable: Pageable,
    ): ResponseEntity<Page<OperationMaintenanceResponse>> {
        return ResponseEntity.ok(maintenanceService.findAllGlobal(pageable, statut, type, enginId))
    }

    @GetMapping("/maintenances/calendrier")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Maintenances sur une période (vue calendrier)")
    fun findMaintenancesCalendrier(
        @RequestParam debut: java.time.LocalDate,
        @RequestParam fin: java.time.LocalDate,
    ): ResponseEntity<List<OperationMaintenanceResponse>> {
        return ResponseEntity.ok(maintenanceService.findByPeriode(debut, fin))
    }

    @PostMapping("/{id}/maintenances")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Créer une opération de maintenance pour un engin")
    fun createMaintenance(@PathVariable id: Long, @Valid @RequestBody request: OperationMaintenanceCreateRequest): ResponseEntity<OperationMaintenanceResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceService.create(id, request))
    }

    @GetMapping("/{id}/maintenances")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister les maintenances d'un engin")
    fun findMaintenancesByEngin(@PathVariable id: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<OperationMaintenanceResponse>> {
        return ResponseEntity.ok(maintenanceService.findByEnginId(id, pageable))
    }

    @GetMapping("/{id}/maintenances/{maintenanceId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Obtenir une maintenance par ID")
    fun findMaintenanceById(@PathVariable id: Long, @PathVariable maintenanceId: Long): ResponseEntity<OperationMaintenanceResponse> {
        return ResponseEntity.ok(maintenanceService.findById(id, maintenanceId))
    }

    @PutMapping("/{id}/maintenances/{maintenanceId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Mettre à jour une maintenance")
    fun updateMaintenance(@PathVariable id: Long, @PathVariable maintenanceId: Long, @Valid @RequestBody request: OperationMaintenanceUpdateRequest): ResponseEntity<OperationMaintenanceResponse> {
        return ResponseEntity.ok(maintenanceService.update(id, maintenanceId, request))
    }

    @DeleteMapping("/{id}/maintenances/{maintenanceId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Supprimer une maintenance")
    fun deleteMaintenance(@PathVariable id: Long, @PathVariable maintenanceId: Long): ResponseEntity<Map<String, String>> {
        maintenanceService.delete(id, maintenanceId)
        return ResponseEntity.ok(mapOf("message" to "Maintenance supprimée avec succès"))
    }

    // ========== Plans de maintenance récurrents ==========
    @PostMapping("/{id}/plans-maintenance")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Créer un plan de maintenance récurrent pour un engin")
    fun createPlanMaintenance(@PathVariable id: Long, @Valid @RequestBody request: PlanMaintenanceCreateRequest): ResponseEntity<PlanMaintenanceResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(planMaintenanceService.create(id, request))
    }

    @GetMapping("/{id}/plans-maintenance")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister les plans de maintenance d'un engin")
    fun findPlansByEngin(@PathVariable id: Long): ResponseEntity<List<PlanMaintenanceResponse>> {
        return ResponseEntity.ok(planMaintenanceService.findByEnginId(id))
    }

    @GetMapping("/{id}/plans-maintenance/{planId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Obtenir un plan de maintenance par ID")
    fun findPlanById(@PathVariable id: Long, @PathVariable planId: Long): ResponseEntity<PlanMaintenanceResponse> {
        return ResponseEntity.ok(planMaintenanceService.findById(id, planId))
    }

    @PutMapping("/{id}/plans-maintenance/{planId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Mettre à jour un plan de maintenance")
    fun updatePlan(@PathVariable id: Long, @PathVariable planId: Long, @Valid @RequestBody request: PlanMaintenanceUpdateRequest): ResponseEntity<PlanMaintenanceResponse> {
        return ResponseEntity.ok(planMaintenanceService.update(id, planId, request))
    }

    @DeleteMapping("/{id}/plans-maintenance/{planId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Supprimer un plan de maintenance")
    fun deletePlan(@PathVariable id: Long, @PathVariable planId: Long): ResponseEntity<Map<String, String>> {
        planMaintenanceService.delete(id, planId)
        return ResponseEntity.ok(mapOf("message" to "Plan de maintenance supprimé avec succès"))
    }

    @PostMapping("/{id}/plans-maintenance/{planId}/executer")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Exécuter un plan de maintenance (crée une opération et recalcule les échéances)")
    fun executerPlan(@PathVariable id: Long, @PathVariable planId: Long): ResponseEntity<OperationMaintenanceResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(planMaintenanceService.executerPlan(id, planId))
    }

    @GetMapping("/plans-maintenance/alertes")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Plans de maintenance dont l'échéance est proche ou dépassée")
    fun findPlansEnAlerte(): ResponseEntity<List<PlanMaintenanceResponse>> {
        return ResponseEntity.ok(planMaintenanceService.findPlansEnAlerte())
    }

    // ========== Incidents ==========
    @PostMapping("/{id}/incidents")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Signaler un incident sur un engin (passe l'engin EN_PANNE si gravité CRITIQUE/MAJEURE)")
    fun createIncident(@PathVariable id: Long, @Valid @RequestBody request: IncidentEnginCreateRequest): ResponseEntity<IncidentEnginResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(incidentService.create(id, request))
    }

    @GetMapping("/{id}/incidents")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister les incidents d'un engin")
    fun findIncidentsByEngin(@PathVariable id: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<IncidentEnginResponse>> {
        return ResponseEntity.ok(incidentService.findByEnginId(id, pageable))
    }

    @PutMapping("/{id}/incidents/{incidentId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Mettre à jour un incident")
    fun updateIncident(@PathVariable id: Long, @PathVariable incidentId: Long, @Valid @RequestBody request: IncidentEnginUpdateRequest): ResponseEntity<IncidentEnginResponse> {
        return ResponseEntity.ok(incidentService.update(id, incidentId, request))
    }

    @DeleteMapping("/{id}/incidents/{incidentId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Supprimer un incident")
    fun deleteIncident(@PathVariable id: Long, @PathVariable incidentId: Long): ResponseEntity<Map<String, String>> {
        incidentService.delete(id, incidentId)
        return ResponseEntity.ok(mapOf("message" to "Incident supprimé avec succès"))
    }

    @PostMapping("/{id}/incidents/{incidentId}/maintenance-corrective")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Créer une maintenance corrective à partir d'un incident")
    fun creerMaintenanceCorrective(@PathVariable id: Long, @PathVariable incidentId: Long): ResponseEntity<OperationMaintenanceResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(incidentService.creerMaintenanceCorrective(id, incidentId))
    }

    // ========== Documents ==========
    @PostMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Ajouter un document à un engin")
    fun createDocument(@PathVariable id: Long, @Valid @RequestBody request: DocumentEnginCreateRequest): ResponseEntity<DocumentEnginResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.create(id, request))
    }

    @GetMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister les documents d'un engin")
    fun findDocumentsByEngin(@PathVariable id: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<DocumentEnginResponse>> {
        return ResponseEntity.ok(documentService.findByEnginId(id, pageable))
    }

    @PutMapping("/{id}/documents/{documentId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Mettre à jour un document")
    fun updateDocument(@PathVariable id: Long, @PathVariable documentId: Long, @Valid @RequestBody request: DocumentEnginUpdateRequest): ResponseEntity<DocumentEnginResponse> {
        return ResponseEntity.ok(documentService.update(id, documentId, request))
    }

    @DeleteMapping("/{id}/documents/{documentId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Supprimer un document")
    fun deleteDocument(@PathVariable id: Long, @PathVariable documentId: Long): ResponseEntity<Map<String, String>> {
        documentService.delete(id, documentId)
        return ResponseEntity.ok(mapOf("message" to "Document supprimé avec succès"))
    }

    // ========== Relevés compteur ==========
    @PostMapping("/{id}/releves-compteur")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Enregistrer un relevé compteur")
    fun createReleve(@PathVariable id: Long, @Valid @RequestBody request: ReleveCompteurCreateRequest): ResponseEntity<ReleveCompteurResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(releveCompteurService.create(id, request))
    }

    @GetMapping("/{id}/releves-compteur")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Historique des relevés compteur d'un engin")
    fun findRelevesByEngin(@PathVariable id: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<ReleveCompteurResponse>> {
        return ResponseEntity.ok(releveCompteurService.findByEnginId(id, pageable))
    }

    @GetMapping("/{id}/heures-mensuelles")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Heures d'utilisation mensuelles sur 12 mois (pour graphique barres)")
    fun getHeuresMensuelles(@PathVariable id: Long): ResponseEntity<HeuresMensuellesResponse> {
        return ResponseEntity.ok(releveCompteurService.getHeuresMensuelles(id))
    }

    // ========== Consommation carburant ==========
    @PostMapping("/{id}/consommations")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Enregistrer un plein de carburant")
    fun createConsommation(@PathVariable id: Long, @Valid @RequestBody request: ConsommationCarburantCreateRequest): ResponseEntity<ConsommationCarburantResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(consommationService.create(id, request))
    }

    @GetMapping("/{id}/consommations")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Historique des consommations carburant d'un engin")
    fun findConsommationsByEngin(@PathVariable id: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<ConsommationCarburantResponse>> {
        return ResponseEntity.ok(consommationService.findByEnginId(id, pageable))
    }
}
