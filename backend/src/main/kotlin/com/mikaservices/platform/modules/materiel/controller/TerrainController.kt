package com.mikaservices.platform.modules.materiel.controller

import com.mikaservices.platform.common.enums.StatutDemandeMateriel
import com.mikaservices.platform.common.enums.StatutMouvementEngin
import com.mikaservices.platform.modules.materiel.dto.request.ConsommationCarburantCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielCommanderRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielCommentaireRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielRejetRequest
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.InspectionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.MouvementEnginActionRequest
import com.mikaservices.platform.modules.materiel.dto.request.MouvementEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.PositionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.ReceptionTransfertRequest
import com.mikaservices.platform.modules.materiel.dto.request.RejetTransfertRequest
import com.mikaservices.platform.modules.materiel.dto.request.ReleveCompteurCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.ValidationTransfertRequest
import com.mikaservices.platform.modules.materiel.dto.response.TransfertBonResponse
import com.mikaservices.platform.common.service.FileStorageService
import org.springframework.web.multipart.MultipartFile
import com.mikaservices.platform.modules.materiel.dto.response.DemandeMaterielHistoriqueResponse
import com.mikaservices.platform.modules.materiel.dto.response.DemandeMaterielResponse
import com.mikaservices.platform.modules.materiel.dto.response.MouvementEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.CarnetEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.TerrainEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.TerrainMeResponse
import com.mikaservices.platform.modules.materiel.dto.response.TerrainChantierResponse
import com.mikaservices.platform.modules.communication.dto.response.NotificationResponse
import com.mikaservices.platform.modules.materiel.service.DemandeMaterielService
import com.mikaservices.platform.modules.materiel.service.MouvementEnginService
import com.mikaservices.platform.modules.materiel.service.EnginService
import com.mikaservices.platform.modules.materiel.service.TerrainAuditService
import com.mikaservices.platform.modules.materiel.service.TerrainService
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

/** Rôles autorisés à opérer une machine (inspection, relevé, plein). */
private const val ROLES_OPERATEUR = "hasAnyRole('CONDUCTEUR','CHEF_CHANTIER','CHEF_PROJET','LOGISTIQUE','ADMIN','SUPER_ADMIN')"

/** Rôles autorisés à créer une DMA (matrice validée : pas les conducteurs ni les profils qualité). */
private const val ROLES_DMA_CREATE = "hasAnyRole('USER','CHEF_CHANTIER','CHEF_PROJET','LOGISTIQUE','ADMIN','SUPER_ADMIN')"

/** Rôles autorisés à demander un transfert d'engin. */
private const val ROLES_TRANSFERT = "hasAnyRole('CHEF_CHANTIER','CHEF_PROJET','LOGISTIQUE','ADMIN','SUPER_ADMIN')"

/**
 * API de l'application mobile terrain.
 * Authentification requise (SecurityConfig) ; les capacités suivent la matrice
 * rôles × modules (@PreAuthorize ici + contrôles fins dans les services),
 * le périmètre des données suit les affectations utilisateur↔projet EN_COURS.
 */
@RestController
@RequestMapping("/terrain")
@Tag(name = "Terrain", description = "Application mobile terrain (conducteurs)")
class TerrainController(
    private val terrainService: TerrainService,
    private val demandeMaterielService: DemandeMaterielService,
    private val mouvementEnginService: MouvementEnginService,
    private val auditService: TerrainAuditService,
    private val enginService: EnginService,
    private val fileStorageService: FileStorageService,
) {

    /** Journal append-only : trace une transition DMA. */
    private fun auditDma(action: String, dma: DemandeMaterielResponse): DemandeMaterielResponse {
        auditService.log(action, "DMA", dma.id, dma.projetId, payload = dma.statut.name)
        return dma
    }

    /** Journal append-only : trace une action sur un transfert d'engin. */
    private fun auditTransfert(action: String, mvt: MouvementEnginResponse): MouvementEnginResponse {
        auditService.log(action, "TRANSFERT", mvt.id, mvt.projetDestinationId, payload = mvt.statut.name)
        return mvt
    }

    // ── Contexte utilisateur ──────────────────────────────────────────────

    @GetMapping("/me")
    @Operation(summary = "Contexte de l'utilisateur connecté (identité, rôles, permissions, chantiers)")
    fun me(): ResponseEntity<TerrainMeResponse> =
        ResponseEntity.ok(terrainService.me())

    // ── Chantiers (pour le formulaire de demande) ─────────────────────────

    @GetMapping("/chantiers")
    @Operation(summary = "Chantiers actifs du périmètre (trio = tous, sinon affectations EN_COURS ; ?contexte=transfert = destinations possibles pour les rôles habilités)")
    fun chantiers(@RequestParam(required = false) contexte: String?): ResponseEntity<List<TerrainChantierResponse>> =
        ResponseEntity.ok(terrainService.chantiersVisibles(contexte))

    // ── Notifications in-app (écran Alertes) ──────────────────────────────

    @GetMapping("/notifications")
    @Operation(summary = "Notifications de l'utilisateur courant (tri date desc)")
    fun notifications(@PageableDefault(size = 50) pageable: Pageable): ResponseEntity<Page<NotificationResponse>> =
        ResponseEntity.ok(terrainService.mesNotifications(pageable))

    @GetMapping("/notifications/count")
    @Operation(summary = "Nombre de notifications non lues")
    fun notificationsCount(): ResponseEntity<Map<String, Long>> =
        ResponseEntity.ok(mapOf("count" to terrainService.countNotificationsNonLues()))

    @PatchMapping("/notifications/{id}/lu")
    @Operation(summary = "Marquer une notification comme lue")
    fun marquerNotificationLue(@PathVariable id: Long): ResponseEntity<NotificationResponse> =
        ResponseEntity.ok(terrainService.marquerNotificationLue(id))

    @PatchMapping("/notifications/tout-lu")
    @Operation(summary = "Marquer toutes les notifications comme lues")
    fun marquerToutesNotificationsLues(): ResponseEntity<Map<String, Int>> =
        ResponseEntity.ok(mapOf("count" to terrainService.marquerToutesNotificationsLues()))

    // ── Demandes de matériel (workflow DMA existant, accès terrain) ───────

    @GetMapping("/demandes")
    @Operation(summary = "Liste des DMA")
    fun demandes(
        @RequestParam(required = false) statut: StatutDemandeMateriel?,
        @RequestParam(required = false) projetId: Long?,
        @PageableDefault(size = 50) pageable: Pageable,
    ): ResponseEntity<Page<DemandeMaterielResponse>> =
        ResponseEntity.ok(demandeMaterielService.findAll(statut, projetId, pageable))

    @GetMapping("/demandes/{id}")
    @Operation(summary = "Détail d'une DMA")
    fun demande(@PathVariable id: Long): ResponseEntity<DemandeMaterielResponse> =
        ResponseEntity.ok(demandeMaterielService.findById(id))

    @GetMapping("/demandes/{id}/pdf")
    @Operation(summary = "Bon de demande de matériel au format PDF")
    fun demandePdf(@PathVariable id: Long): ResponseEntity<ByteArray> {
        val (reference, pdf) = demandeMaterielService.exportPdf(id)
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$reference.pdf\"")
            .body(pdf)
    }

    @GetMapping("/demandes/{id}/historique")
    @Operation(summary = "Historique des transitions d'une DMA")
    fun demandeHistorique(@PathVariable id: Long): ResponseEntity<List<DemandeMaterielHistoriqueResponse>> =
        ResponseEntity.ok(demandeMaterielService.findHistorique(id))

    @PostMapping("/demandes")
    @PreAuthorize(ROLES_DMA_CREATE)
    @Operation(summary = "Créer une DMA depuis le terrain")
    fun creerDemande(@Valid @RequestBody request: DemandeMaterielCreateRequest): ResponseEntity<DemandeMaterielResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(auditDma("DMA_CREEE", demandeMaterielService.create(request)))

    @PatchMapping("/demandes/{id}/prendre-en-charge")
    @Operation(summary = "Prise en charge logistique")
    fun prendreEnCharge(
        @PathVariable id: Long,
        @RequestBody(required = false) body: DemandeMaterielCommentaireRequest?,
    ): ResponseEntity<DemandeMaterielResponse> =
        ResponseEntity.ok(auditDma("DMA_TRANSITION", demandeMaterielService.prendreEnCharge(id, body)))

    @PatchMapping("/demandes/{id}/demander-complement")
    @Operation(summary = "Demander un complément au terrain")
    fun demanderComplement(
        @PathVariable id: Long,
        @RequestBody(required = false) body: DemandeMaterielCommentaireRequest?,
    ): ResponseEntity<DemandeMaterielResponse> =
        ResponseEntity.ok(auditDma("DMA_TRANSITION", demandeMaterielService.demanderComplement(id, body)))

    @PatchMapping("/demandes/{id}/completer")
    @Operation(summary = "Renvoyer la demande après complément")
    fun completer(
        @PathVariable id: Long,
        @RequestBody(required = false) body: DemandeMaterielCommentaireRequest?,
    ): ResponseEntity<DemandeMaterielResponse> =
        ResponseEntity.ok(auditDma("DMA_TRANSITION", demandeMaterielService.completer(id, body)))

    @PatchMapping("/demandes/{id}/livrer")
    @Operation(summary = "Enregistrer la livraison (réception terrain)")
    fun livrer(
        @PathVariable id: Long,
        @RequestBody(required = false) body: DemandeMaterielCommentaireRequest?,
    ): ResponseEntity<DemandeMaterielResponse> =
        ResponseEntity.ok(auditDma("DMA_TRANSITION", demandeMaterielService.livrer(id, body)))

    @PatchMapping("/demandes/{id}/commander")
    @Operation(summary = "Passer la demande en commande (logistique)")
    fun commander(
        @PathVariable id: Long,
        @RequestBody(required = false) body: DemandeMaterielCommanderRequest?,
    ): ResponseEntity<DemandeMaterielResponse> =
        ResponseEntity.ok(auditDma("DMA_TRANSITION", demandeMaterielService.commander(id, body ?: DemandeMaterielCommanderRequest())))

    @PatchMapping("/demandes/{id}/cloturer")
    @Operation(summary = "Clôturer la demande livrée (logistique)")
    fun cloturer(
        @PathVariable id: Long,
        @RequestBody(required = false) body: DemandeMaterielCommentaireRequest?,
    ): ResponseEntity<DemandeMaterielResponse> =
        ResponseEntity.ok(auditDma("DMA_TRANSITION", demandeMaterielService.cloturer(id, body)))

    @PatchMapping("/demandes/{id}/rejeter")
    @Operation(summary = "Rejeter la demande (motif obligatoire)")
    fun rejeter(
        @PathVariable id: Long,
        @Valid @RequestBody request: DemandeMaterielRejetRequest,
    ): ResponseEntity<DemandeMaterielResponse> =
        ResponseEntity.ok(auditDma("DMA_TRANSITION", demandeMaterielService.rejeter(id, request)))

    // ── Transferts d'engins (workflow MouvementEngin existant, accès terrain) ──

    @GetMapping("/transferts")
    @Operation(summary = "Liste des transferts d'engins")
    fun transferts(
        @RequestParam(required = false) statut: StatutMouvementEngin?,
        @RequestParam(required = false) enginId: Long?,
        @PageableDefault(size = 50) pageable: Pageable,
    ): ResponseEntity<Page<MouvementEnginResponse>> =
        ResponseEntity.ok(mouvementEnginService.findAllVisibles(statut, enginId, pageable))

    @GetMapping("/transferts/{id}")
    @Operation(summary = "Détail d'un transfert")
    fun transfert(@PathVariable id: Long): ResponseEntity<MouvementEnginResponse> =
        ResponseEntity.ok(mouvementEnginService.findById(id))

    @PostMapping("/transferts")
    @PreAuthorize(ROLES_TRANSFERT)
    @Operation(summary = "Demander un transfert d'engin (origine résolue automatiquement)")
    fun creerTransfert(@Valid @RequestBody request: MouvementEnginCreateRequest): ResponseEntity<MouvementEnginResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(auditTransfert("TRANSFERT_DEMANDE", terrainService.creerTransfert(request)))

    @PatchMapping("/transferts/{id}/confirmer-depart")
    @Operation(summary = "Confirmer le départ de l'engin (chantier origine)")
    fun confirmerDepartTransfert(
        @PathVariable id: Long,
        @RequestBody(required = false) body: MouvementEnginActionRequest?,
    ): ResponseEntity<MouvementEnginResponse> =
        ResponseEntity.ok(auditTransfert("DEPART_CONFIRME", mouvementEnginService.confirmerDepart(id, body)))

    @PatchMapping("/transferts/{id}/valider")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Valider une demande de transfert (logistique, destination modifiable)")
    fun validerTransfert(
        @PathVariable id: Long,
        @RequestBody(required = false) body: ValidationTransfertRequest?,
    ): ResponseEntity<MouvementEnginResponse> =
        ResponseEntity.ok(auditTransfert("TRANSFERT_VALIDE", mouvementEnginService.valider(id, body)))

    @PatchMapping("/transferts/{id}/rejeter")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Rejeter une demande de transfert (motif obligatoire)")
    fun rejeterTransfert(
        @PathVariable id: Long,
        @Valid @RequestBody request: RejetTransfertRequest,
    ): ResponseEntity<MouvementEnginResponse> =
        ResponseEntity.ok(auditTransfert("TRANSFERT_REJETE", mouvementEnginService.rejeter(id, request)))

    @GetMapping("/transferts/{id}/bon")
    @Operation(summary = "Bon de transfert : QR token + code manuel (initiateur, origine, logistique)")
    fun bonTransfert(@PathVariable id: Long): ResponseEntity<TransfertBonResponse> =
        ResponseEntity.ok(mouvementEnginService.getBon(id))

    @PatchMapping("/transferts/{id}/receptionner")
    @Operation(summary = "Réceptionner l'engin à destination (QR scanné ou code manuel, réserves possibles)")
    fun receptionnerTransfert(
        @PathVariable id: Long,
        @Valid @RequestBody request: ReceptionTransfertRequest,
    ): ResponseEntity<MouvementEnginResponse> =
        ResponseEntity.ok(auditTransfert("RECEPTION_CONFIRMEE", mouvementEnginService.receptionner(id, request)))

    @PostMapping("/transferts/{id}/reception-photos", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(summary = "Photos des réserves de réception (max 3, Cloudinary)")
    fun uploadReceptionPhotos(
        @PathVariable id: Long,
        @RequestParam("files") files: List<MultipartFile>,
    ): ResponseEntity<Map<String, List<String>>> {
        mouvementEnginService.assertPeutJoindrePhotosReception(id)
        val urls = files.take(3).map { fileStorageService.store(it, "transferts", "transfert_${id}_${System.currentTimeMillis()}") }
        auditService.log("RECEPTION_PHOTOS", "TRANSFERT", id, payload = "${urls.size} photo(s)")
        return ResponseEntity.ok(mapOf("urls" to urls))
    }

    @PatchMapping("/transferts/{id}/annuler")
    @Operation(summary = "Annuler un transfert (avant départ)")
    fun annulerTransfert(
        @PathVariable id: Long,
        @RequestBody(required = false) body: MouvementEnginActionRequest?,
    ): ResponseEntity<MouvementEnginResponse> =
        ResponseEntity.ok(auditTransfert("TRANSFERT_ANNULE", mouvementEnginService.annuler(id, body)))

    @GetMapping("/mes-engins")
    @Operation(summary = "Engins actuellement affectés aux chantiers (EN_COURS)")
    fun mesEngins(): ResponseEntity<List<TerrainEnginResponse>> =
        ResponseEntity.ok(terrainService.mesEngins())

    @GetMapping("/engins/{enginId}/photo")
    @Operation(summary = "Photo de l'engin (repli pour les fichiers legacy non-Cloudinary)")
    fun photoEngin(@PathVariable enginId: Long): ResponseEntity<Resource> {
        terrainService.assertEnginDansPerimetre(enginId)
        val resource = enginService.getPhotoResource(enginId)
            ?: return ResponseEntity.noContent().build()
        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_JPEG)
            .body(resource)
    }

    @GetMapping("/engins/{enginId}/carnet")
    @Operation(summary = "Timeline d'historique de l'engin (fiche enrichie)")
    fun carnet(@PathVariable enginId: Long): ResponseEntity<CarnetEnginResponse> =
        ResponseEntity.ok(terrainService.carnet(enginId))

    @GetMapping("/engins/scan")
    @Operation(summary = "Résoudre un engin depuis un scan QR (code, token ou URL)")
    fun scan(@RequestParam q: String): ResponseEntity<TerrainEnginResponse> {
        val engin = terrainService.scan(q)
        auditService.log("SCAN_QR", "ENGIN", engin.id)
        return ResponseEntity.ok(engin)
    }

    @PostMapping("/engins/{id}/position")
    @Operation(summary = "Confirmer la position de l'engin (source QR_SCAN)")
    fun confirmerPosition(
        @PathVariable id: Long,
        @Valid @RequestBody request: PositionEnginCreateRequest
    ) = ResponseEntity.status(HttpStatus.CREATED).body(terrainService.confirmerPosition(id, request))
        .also { auditService.log("POSITION_CONFIRMEE", "ENGIN", id, latitude = request.latitude, longitude = request.longitude) }

    @PostMapping("/engins/{id}/releve")
    @PreAuthorize(ROLES_OPERATEUR)
    @Operation(summary = "Relevé compteur horaire")
    fun creerReleve(
        @PathVariable id: Long,
        @Valid @RequestBody request: ReleveCompteurCreateRequest
    ) = ResponseEntity.status(HttpStatus.CREATED).body(terrainService.creerReleve(id, request))
        .also { auditService.log("RELEVE", "ENGIN", id, payload = "${request.valeurHeures}h") }

    @PostMapping("/engins/{id}/ravitaillement")
    @PreAuthorize(ROLES_OPERATEUR)
    @Operation(summary = "Déclarer un plein de carburant")
    fun creerRavitaillement(
        @PathVariable id: Long,
        @Valid @RequestBody request: ConsommationCarburantCreateRequest
    ) = ResponseEntity.status(HttpStatus.CREATED).body(terrainService.creerRavitaillement(id, request))
        .also { auditService.log("RAVITAILLEMENT", "ENGIN", id, payload = "${request.quantiteLitres}L") }

    @PostMapping("/engins/{id}/incident")
    @Operation(summary = "Signaler un problème (panne, casse, fuite…)")
    fun signalerIncident(
        @PathVariable id: Long,
        @Valid @RequestBody request: IncidentEnginCreateRequest
    ) = ResponseEntity.status(HttpStatus.CREATED).body(terrainService.signalerIncident(id, request))
        .also { auditService.log("INCIDENT", "ENGIN", id, payload = request.typeIncident.name) }

    @PostMapping("/engins/{id}/inspection")
    @PreAuthorize(ROLES_OPERATEUR)
    @Operation(summary = "Inspection quotidienne (checklist + signature)")
    fun creerInspection(
        @PathVariable id: Long,
        @Valid @RequestBody request: InspectionEnginCreateRequest
    ) = ResponseEntity.status(HttpStatus.CREATED).body(terrainService.creerInspection(id, request))
        .also { auditService.log("INSPECTION", "ENGIN", id) }
}
