package com.mikaservices.platform.modules.bareme.controller

import com.mikaservices.platform.common.enums.TypeLigneBareme
import com.mikaservices.platform.modules.bareme.dto.request.BaremeArticleCreateRequest
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleCompareResponse
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleDetailResponse
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleListResponse
import com.mikaservices.platform.modules.bareme.dto.response.BaremeFilterFacetsResponse
import com.mikaservices.platform.modules.bareme.dto.response.BaremeVersionResponse
import com.mikaservices.platform.modules.bareme.dto.response.CorpsEtatBaremeResponse
import com.mikaservices.platform.modules.bareme.dto.response.FournisseurBaremeListItemResponse
import com.mikaservices.platform.modules.bareme.service.BaremeImportService
import com.mikaservices.platform.modules.bareme.service.BaremeEcritureService
import com.mikaservices.platform.modules.bareme.service.BaremeLectureService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.http.MediaType
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import jakarta.validation.Valid

@RestController
@RequestMapping("/bareme")
@Tag(name = "Barème bâtiment", description = "Import et consultation du barème de prix")
class BaremeImportController(
    private val baremeImportService: BaremeImportService,
    private val baremeLectureService: BaremeLectureService,
    private val baremeEcritureService: BaremeEcritureService
) {

    @GetMapping("/corps-etat")
    @Operation(summary = "Liste des corps d'état", description = "Pour filtre du dashboard (Gros-Oeuvre, Assainissement, etc.)")
    fun getCorpsEtat(): ResponseEntity<List<CorpsEtatBaremeResponse>> =
        ResponseEntity.ok(baremeLectureService.getCorpsEtat())

    @GetMapping("/fournisseurs")
    @Operation(summary = "Fournisseurs barème (id + nom)", description = "Liste ordonnée pour listes déroulantes de saisie.")
    fun getFournisseursBareme(): ResponseEntity<List<FournisseurBaremeListItemResponse>> =
        ResponseEntity.ok(baremeLectureService.getFournisseursBareme())

    @GetMapping("/facets")
    @Operation(
        summary = "Valeurs distinctes pour les filtres (catalogue)",
        description = "Interroge toute la base (pas la page courante). Chaque liste applique les filtres croisés (ex. catégories selon famille / unité / recherche, sans filtrer par catégorie)."
    )
    fun getFilterFacets(
        @RequestParam(required = false) corpsEtatId: Long?,
        @RequestParam(required = false) type: TypeLigneBareme?,
        @RequestParam(required = false) fournisseurId: Long?,
        @RequestParam(required = false) fournisseurNom: String?,
        @RequestParam(required = false) article: String?,
        @RequestParam(required = false) famille: String?,
        @RequestParam(required = false) categorie: String?,
        @RequestParam(required = false) unite: String?,
        @RequestParam(required = false) recherche: String?
    ): ResponseEntity<BaremeFilterFacetsResponse> =
        ResponseEntity.ok(
            baremeLectureService.getFilterFacets(
                corpsEtatId = corpsEtatId,
                type = type,
                fournisseurId = fournisseurId,
                fournisseurNom = fournisseurNom,
                article = article,
                famille = famille,
                categorie = categorie,
                unite = unite,
                recherche = recherche
            )
        )

    @GetMapping("/articles")
    @Operation(
        summary = "Liste paginée des articles barème",
        description = "Filtres optionnels : corpsEtatId, type (MATERIAU/PRESTATION_ENTETE), fournisseurId, recherche (sur libellé)"
    )
    fun getArticles(
        @PageableDefault(size = 20, sort = ["reference"], direction = Sort.Direction.ASC) pageable: Pageable,
        @RequestParam(required = false) corpsEtatId: Long?,
        @RequestParam(required = false) type: TypeLigneBareme?,
        @RequestParam(required = false) fournisseurId: Long?,
        @RequestParam(required = false) fournisseurNom: String?,
        @RequestParam(required = false) article: String?,
        @RequestParam(required = false) famille: String?,
        @RequestParam(required = false) categorie: String?,
        @RequestParam(required = false) unite: String?,
        @RequestParam(required = false) recherche: String?
    ): ResponseEntity<Page<BaremeArticleListResponse>> =
        ResponseEntity.ok(
            baremeLectureService.getArticles(
                corpsEtatId = corpsEtatId,
                type = type,
                fournisseurId = fournisseurId,
                fournisseurNom = fournisseurNom,
                article = article,
                famille = famille,
                categorie = categorie,
                unite = unite,
                recherche = recherche,
                pageable = pageable
            )
        )

    @GetMapping("/articles/compare")
    @Operation(
        summary = "Articles groupés pour comparaison des prix entre fournisseurs",
        description = "Mêmes filtres que /articles. Un groupe = même libellé + corps + unité (sans scinder par réf. MAT-). Un prix par fournisseur (ligne la plus récente en updated_at). Pagination sur les groupes."
    )
    fun getArticlesCompare(
        @PageableDefault(size = 20) pageable: Pageable,
        @RequestParam(required = false) corpsEtatId: Long?,
        @RequestParam(required = false) type: TypeLigneBareme?,
        @RequestParam(required = false) fournisseurId: Long?,
        @RequestParam(required = false) fournisseurNom: String?,
        @RequestParam(required = false) article: String?,
        @RequestParam(required = false) famille: String?,
        @RequestParam(required = false) categorie: String?,
        @RequestParam(required = false) unite: String?,
        @RequestParam(required = false) recherche: String?
    ): ResponseEntity<Page<BaremeArticleCompareResponse>> =
        ResponseEntity.ok(
            baremeLectureService.getArticlesCompare(
                corpsEtatId = corpsEtatId,
                type = type,
                fournisseurId = fournisseurId,
                fournisseurNom = fournisseurNom,
                article = article,
                famille = famille,
                categorie = categorie,
                unite = unite,
                recherche = recherche,
                pageable = pageable
            )
        )

    @GetMapping("/articles/{id}")
    @Operation(summary = "Détail d'un article", description = "En-tête + prix par fournisseur (matériaux) ou décomposition + Déboursé/P.V (prestations)")
    fun getArticleById(@PathVariable id: Long): ResponseEntity<BaremeArticleDetailResponse> =
        ResponseEntity.ok(baremeLectureService.getArticleById(id))

    @PostMapping("/articles")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Créer un article barème",
        description = "Crée un matériau ou une prestation. Matériau : si offresMateriau est renseigné (liste non vide), crée une ligne par offre (même libellé/unité/famille/catégorie, références MAT distinctes) ; sinon création historique avec fournisseurId / prixTtc sur la racine. Prestation : entête + sous-lignes + total. Réservé ADMIN/SUPER_ADMIN."
    )
    fun createArticle(@Valid @RequestBody request: BaremeArticleCreateRequest): ResponseEntity<BaremeArticleDetailResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(baremeEcritureService.createArticle(request))

    @PutMapping("/articles/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Modifier un article barème",
        description = "Matériau : si offresMateriau est renseigné (liste non vide), remplace tout le groupe (même libellé+unité avant MAJ) par ces offres et aligne libellé/unité/famille/catégorie/corps sur toutes les lignes ; sinon mise à jour historique d’une seule ligne (fournisseurId/prixTtc). Prestation : inchangé. Réservé ADMIN/SUPER_ADMIN."
    )
    fun updateArticle(
        @PathVariable id: Long,
        @Valid @RequestBody request: BaremeArticleCreateRequest
    ): ResponseEntity<BaremeArticleDetailResponse> =
        ResponseEntity.ok(baremeEcritureService.updateArticle(id, request))

    @DeleteMapping("/articles/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Supprimer un article barème", description = "Supprime un article racine et ses sous-lignes éventuelles. Réservé ADMIN/SUPER_ADMIN.")
    fun deleteArticle(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        baremeEcritureService.deleteArticle(id)
        return ResponseEntity.ok(mapOf("message" to "Article barème supprimé"))
    }

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
