package com.mikaservices.platform.modules.bareme.controller

import com.mikaservices.platform.common.enums.TypeLigneBareme
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleCompareResponse
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleDetailResponse
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleListResponse
import com.mikaservices.platform.modules.bareme.dto.response.BaremeVersionResponse
import com.mikaservices.platform.modules.bareme.dto.response.CoefficientEloignementResponse
import com.mikaservices.platform.modules.bareme.dto.response.CorpsEtatBaremeResponse
import com.mikaservices.platform.modules.bareme.service.BaremeImportService
import com.mikaservices.platform.modules.bareme.service.BaremeLectureService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/bareme")
@Tag(name = "Barème bâtiment", description = "Import et consultation du barème de prix")
class BaremeImportController(
    private val baremeImportService: BaremeImportService,
    private val baremeLectureService: BaremeLectureService
) {

    @GetMapping("/coefficients-eloignement")
    @Operation(summary = "Liste des coefficients d'éloignement", description = "Villes/localités avec %, coefficient et note (pour filtre ou détail)")
    fun getCoefficientsEloignement(): ResponseEntity<List<CoefficientEloignementResponse>> =
        ResponseEntity.ok(baremeLectureService.getCoefficientsEloignement())

    @GetMapping("/corps-etat")
    @Operation(summary = "Liste des corps d'état", description = "Pour filtre du dashboard (Gros-Oeuvre, Assainissement, etc.)")
    fun getCorpsEtat(): ResponseEntity<List<CorpsEtatBaremeResponse>> =
        ResponseEntity.ok(baremeLectureService.getCorpsEtat())

    @GetMapping("/articles")
    @Operation(
        summary = "Liste paginée des articles barème",
        description = "Filtres optionnels : corpsEtatId, type (MATERIAU/PRESTATION_ENTETE), fournisseurId, recherche (sur libellé)"
    )
    fun getArticles(
        @PageableDefault(size = 20) pageable: Pageable,
        @RequestParam(required = false) corpsEtatId: Long?,
        @RequestParam(required = false) type: TypeLigneBareme?,
        @RequestParam(required = false) fournisseurId: Long?,
        @RequestParam(required = false) recherche: String?
    ): ResponseEntity<Page<BaremeArticleListResponse>> =
        ResponseEntity.ok(baremeLectureService.getArticles(corpsEtatId, type, fournisseurId, recherche, pageable))

    @GetMapping("/articles/compare")
    @Operation(
        summary = "Articles groupés pour comparaison des prix entre fournisseurs",
        description = "Mêmes filtres que /articles (recherche sur libellé, corpsEtatId, type). Retourne un article par groupe (même libellé+corps+unité) avec la liste des prix par fournisseur. Pagination sur les articles (groupes)."
    )
    fun getArticlesCompare(
        @PageableDefault(size = 20) pageable: Pageable,
        @RequestParam(required = false) corpsEtatId: Long?,
        @RequestParam(required = false) type: TypeLigneBareme?,
        @RequestParam(required = false) fournisseurId: Long?,
        @RequestParam(required = false) recherche: String?
    ): ResponseEntity<Page<BaremeArticleCompareResponse>> =
        ResponseEntity.ok(baremeLectureService.getArticlesCompare(corpsEtatId, type, fournisseurId, recherche, pageable))

    @GetMapping("/articles/{id}")
    @Operation(summary = "Détail d'un article", description = "En-tête + prix par fournisseur (matériaux) ou décomposition + Déboursé/P.V (prestations)")
    fun getArticleById(@PathVariable id: Long): ResponseEntity<BaremeArticleDetailResponse> =
        ResponseEntity.ok(baremeLectureService.getArticleById(id))

    @GetMapping("/derniere-mise-a-jour")
    @Operation(summary = "Date du dernier import", description = "Date/heure du dernier chargement du barème (pour affichage sur le dashboard)")
    fun getDerniereMiseAJour(): ResponseEntity<BaremeVersionResponse> =
        ResponseEntity.ok(BaremeVersionResponse(baremeLectureService.getDerniereMiseAJour()))

    @GetMapping("/debug/dump")
    @Operation(summary = "[Debug] Dump des données barème", description = "Retourne coefficients, corps d'état, fournisseurs et un échantillon de lignes (max 500 par défaut). Nécessite une requête authentifiée.")
    fun getDebugDump(@RequestParam(required = false, defaultValue = "500") maxLignes: Int): ResponseEntity<Map<String, Any>> =
        ResponseEntity.ok(baremeLectureService.getDebugDump(maxLignes.coerceIn(1, 2000)))

    @PostMapping(
        value = ["/import"],
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE],
        produces = [MediaType.APPLICATION_JSON_VALUE]
    )
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Importer le barème depuis un fichier Excel", description = "Charge le fichier .xls/.xlsx et remplit les tables barème (coefficients, corps d'état, fournisseurs, lignes de prix). Remplace toutes les données existantes. Réservé aux rôles ADMIN.")
    fun importExcel(@RequestParam("file") file: MultipartFile): ResponseEntity<BaremeImportService.ImportResult> {
        if (file.isEmpty) {
            return ResponseEntity.badRequest().build()
        }
        val result = baremeImportService.importFromInputStream(file.inputStream)
        return ResponseEntity.ok(result)
    }
}
