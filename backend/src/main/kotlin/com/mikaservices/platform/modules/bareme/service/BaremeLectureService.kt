package com.mikaservices.platform.modules.bareme.service

import com.mikaservices.platform.common.enums.TypeLigneBareme
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleCompareResponse
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleDetailResponse
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleListResponse
import com.mikaservices.platform.modules.bareme.dto.response.BaremeFilterFacetsResponse
import com.mikaservices.platform.modules.bareme.dto.response.CorpsEtatBaremeResponse
import com.mikaservices.platform.modules.bareme.dto.response.FournisseurBaremeListItemResponse
import com.mikaservices.platform.modules.bareme.dto.response.LignePrestationDto
import com.mikaservices.platform.modules.bareme.dto.response.PrixFournisseurDto
import java.math.BigDecimal
import java.time.LocalDateTime
import java.util.Locale
import com.mikaservices.platform.modules.bareme.entity.LignePrixBareme
import com.mikaservices.platform.modules.bareme.repository.BaremeCompareJdbcRepository
import com.mikaservices.platform.modules.bareme.repository.CorpsEtatBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.FournisseurBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.LignePrixBaremeRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

@Service
class BaremeLectureService(
    private val corpsEtatBaremeRepository: CorpsEtatBaremeRepository,
    private val fournisseurBaremeRepository: FournisseurBaremeRepository,
    private val lignePrixBaremeRepository: LignePrixBaremeRepository,
    private val baremeCompareJdbcRepository: BaremeCompareJdbcRepository
) {
    /** Tri stable côté appli (les requêtes DISTINCT n'ont plus ORDER BY : compatibilité PostgreSQL). */
    private fun sortFacetStrings(values: List<String>): List<String> =
        values.sortedWith(compareBy { it.lowercase(Locale.FRENCH) })

    private fun normalizeFilterUnit(unite: String?): Pair<String?, Boolean> {
        val normalized = unite?.trim()?.takeIf { it.isNotEmpty() }?.uppercase()
        if (normalized == null) return null to false
        return when (normalized) {
            "TON", "TONNE", "T" -> "T" to true
            else -> normalized to false
        }
    }

    /**
     * Une ligne physique par fournisseur logique : si la BDD contient plusieurs lignes pour le même fournisseur
     * (même id, ou même nom si pas d’id), on garde celle avec [LignePrixBareme.updatedAt] le plus récent, puis [LignePrixBareme.id] max.
     */
    private fun dedupeMateriauLignesParFournisseur(lines: List<LignePrixBareme>): List<LignePrixBareme> {
        if (lines.isEmpty()) return lines
        val byKey = lines.groupBy { line ->
            val fid = line.fournisseurBareme?.id
            if (fid != null) {
                "id:$fid"
            } else {
                val nom = line.fournisseurBareme?.nom?.trim()?.lowercase().orEmpty()
                if (nom.isNotEmpty()) {
                    "nom:$nom"
                } else {
                    "line:${line.id}"
                }
            }
        }
        return byKey.values.map { groupLines ->
            groupLines.maxWith(compareBy<LignePrixBareme> { it.updatedAt }.thenBy { it.id })
        }
    }

    fun getCorpsEtat(): List<CorpsEtatBaremeResponse> =
        corpsEtatBaremeRepository.findAllByOrderByOrdreAffichageAsc().map { c ->
            CorpsEtatBaremeResponse(
                id = c.id!!,
                code = c.code,
                libelle = c.libelle,
                ordreAffichage = c.ordreAffichage
            )
        }

    fun getFournisseursBareme(): List<FournisseurBaremeListItemResponse> =
        fournisseurBaremeRepository.findAllByOrderByNomAsc().map { f ->
            FournisseurBaremeListItemResponse(
                id = f.id!!,
                nom = f.nom,
                contact = f.contact
            )
        }

    fun getArticles(
        corpsEtatId: Long?,
        type: TypeLigneBareme?,
        fournisseurId: Long?,
        fournisseurNom: String?,
        article: String?,
        famille: String?,
        categorie: String?,
        unite: String?,
        recherche: String?,
        pageable: Pageable
    ): Page<BaremeArticleListResponse> {
        val searchTrimmed = recherche?.trim()?.takeIf { it.isNotEmpty() }
        val (uniteNormalized, uniteAliasT) = normalizeFilterUnit(unite)
        val page = lignePrixBaremeRepository.findArticlesFiltered(
            corpsId = corpsEtatId,
            type = type,
            fournId = fournisseurId,
            fournNom = fournisseurNom?.trim()?.takeIf { it.isNotEmpty() },
            famille = famille?.trim()?.takeIf { it.isNotEmpty() },
            categorie = categorie?.trim()?.takeIf { it.isNotEmpty() },
            unite = uniteNormalized,
            uniteAliasT = uniteAliasT,
            article = article?.trim()?.takeIf { it.isNotEmpty() },
            search = searchTrimmed,
            pageable = pageable
        )
        return page.map { toListResponse(it) }
    }

    fun getArticleById(id: Long): BaremeArticleDetailResponse {
        val ligne = lignePrixBaremeRepository.findByIdWithCorpsEtatAndFournisseur(id)
            ?: throw ResourceNotFoundException("Article barème non trouvé: $id")
        return toDetailResponse(ligne)
    }

    /** Articles groupés par (corps d'état, libellé, unité, type) pour comparaison ; un prix par fournisseur (ligne la plus récente). Pagination sur les groupes. */
    fun getArticlesCompare(
        corpsEtatId: Long?,
        type: TypeLigneBareme?,
        fournisseurId: Long?,
        fournisseurNom: String?,
        article: String?,
        famille: String?,
        categorie: String?,
        unite: String?,
        recherche: String?,
        pageable: Pageable
    ): Page<BaremeArticleCompareResponse> {
        val searchTrimmed = recherche?.trim()?.takeIf { it.isNotEmpty() }
        val (uniteNormalized, uniteAliasT) = normalizeFilterUnit(unite)
        val filtersFournNom = fournisseurNom?.trim()?.takeIf { it.isNotEmpty() }
        val filtersFamille = famille?.trim()?.takeIf { it.isNotEmpty() }
        val filtersCategorie = categorie?.trim()?.takeIf { it.isNotEmpty() }
        val filtersArticle = article?.trim()?.takeIf { it.isNotEmpty() }

        val total = baremeCompareJdbcRepository.countDistinctArticleGroups(
            corpsEtatId = corpsEtatId,
            type = type,
            fournId = fournisseurId,
            fournNom = filtersFournNom,
            famille = filtersFamille,
            categorie = filtersCategorie,
            unite = uniteNormalized,
            uniteAliasT = uniteAliasT,
            article = filtersArticle,
            search = searchTrimmed
        )
        if (total == 0L) return PageImpl(emptyList(), pageable, 0)

        val pageSize = pageable.pageSize.coerceAtLeast(1)
        val pageNumber = pageable.pageNumber.coerceIn(0, ((total - 1) / pageSize).toInt().coerceAtLeast(0))
        val offset = pageNumber * pageSize

        val groupKeys = baremeCompareJdbcRepository.findDistinctArticleGroupKeys(
            corpsEtatId = corpsEtatId,
            type = type,
            fournId = fournisseurId,
            fournNom = filtersFournNom,
            famille = filtersFamille,
            categorie = filtersCategorie,
            unite = uniteNormalized,
            uniteAliasT = uniteAliasT,
            article = filtersArticle,
            search = searchTrimmed,
            offset = offset,
            limit = pageSize
        )

        val pageContent = groupKeys.map { key ->
            val lines = lignePrixBaremeRepository.findLinesForArticleGroup(
                corpsId = key.corpsEtatId,
                libelle = key.libelle,
                unite = key.unite,
                type = key.type
            )
            toCompareResponse(lines)
        }

        return PageImpl(pageContent, PageRequest.of(pageNumber, pageSize), total)
    }

    private fun toCompareResponse(group: List<LignePrixBareme>): BaremeArticleCompareResponse {
        if (group.isEmpty()) {
            throw IllegalStateException("Groupe barème vide (clé sans lignes)")
        }
        val representative = group.minBy { it.id!! }
        val first = representative
        val corps = first.corpsEtat
        val corpsResp = CorpsEtatBaremeResponse(id = corps.id!!, code = corps.code, libelle = corps.libelle, ordreAffichage = corps.ordreAffichage)

        return when (first.type) {
            TypeLigneBareme.MATERIAU -> {
                val chosenLines = dedupeMateriauLignesParFournisseur(group)
                val prixParFournisseur = chosenLines
                    .map { l ->
                        PrixFournisseurDto(
                            fournisseurId = l.fournisseurBareme?.id,
                            fournisseurNom = l.fournisseurBareme?.nom ?: "-",
                            fournisseurContact = l.fournisseurBareme?.contact,
                            prixTtc = l.prixTtc,
                            datePrix = l.datePrix,
                            prixEstime = l.prixEstime
                        )
                    }
                    .sortedBy { it.fournisseurNom }
                BaremeArticleCompareResponse(
                    id = representative.id!!,
                    type = first.type,
                    reference = representative.reference,
                    libelle = first.libelle,
                    unite = first.unite,
                    famille = representative.famille,
                    categorie = representative.categorie,
                    corpsEtat = corpsResp,
                    prixParFournisseur = prixParFournisseur,
                    debourse = null,
                    prixVente = null,
                    unitePrestation = null,
                    prixEstime = prixParFournisseur.any { it.prixEstime }
                )
            }
            else -> {
                var debourse: java.math.BigDecimal? = null
                var prixVente: java.math.BigDecimal? = null
                var unitePrestation: String? = first.unitePrestation
                val totalLine = lignePrixBaremeRepository.findByParentIdOrderByOrdreLigneAsc(first.id!!)
                    .firstOrNull { it.type == TypeLigneBareme.PRESTATION_TOTAL }
                var prixEstimePrest = false
                totalLine?.let {
                    debourse = it.debourse ?: BigDecimal.ZERO
                    prixVente = it.prixVente ?: BigDecimal.ZERO
                    if (unitePrestation == null) unitePrestation = it.unitePrestation
                    prixEstimePrest = it.prixEstime
                }
                BaremeArticleCompareResponse(
                    id = representative.id!!,
                    type = first.type,
                    reference = representative.reference,
                    libelle = first.libelle,
                    unite = first.unite,
                    famille = representative.famille,
                    categorie = representative.categorie,
                    corpsEtat = corpsResp,
                    prixParFournisseur = emptyList(),
                    debourse = debourse,
                    prixVente = prixVente,
                    unitePrestation = unitePrestation,
                    prixEstime = prixEstimePrest
                )
            }
        }
    }

    /** Date/heure du dernier import (max updated_at sur les lignes de prix). Null si aucune donnée. */
    fun getDerniereMiseAJour(): LocalDateTime? = lignePrixBaremeRepository.findLastUpdatedAt()

    /** Dump de toutes les données barème (debug) : corps d'état, fournisseurs, échantillon de lignes. */
    fun getDebugDump(maxLignes: Int = 500): Map<String, Any> {
        val corpsEtat = corpsEtatBaremeRepository.findAllByOrderByOrdreAffichageAsc().map { c ->
            mapOf("id" to c.id, "code" to c.code, "libelle" to c.libelle, "ordreAffichage" to c.ordreAffichage)
        }
        val fournisseurs = fournisseurBaremeRepository.findAllByOrderByNomAsc().map { f ->
            mapOf("id" to f.id, "nom" to f.nom, "contact" to f.contact)
        }
        val totalLignes = lignePrixBaremeRepository.count().toInt()
        val lignesSample = lignePrixBaremeRepository.findAll(PageRequest.of(0, maxLignes.coerceAtLeast(1).coerceAtMost(2000))).content.map { l ->
            mapOf(
                "id" to l.id,
                "type" to l.type.toString(),
                "reference" to l.reference,
                "libelle" to (l.libelle?.take(80)),
                "unite" to l.unite,
                "prixTtc" to l.prixTtc,
                "datePrix" to l.datePrix,
                "fournisseurNom" to l.fournisseurBareme?.nom,
                "contactTexte" to l.contactTexte,
                "debourse" to l.debourse,
                "prixVente" to l.prixVente,
                "unitePrestation" to l.unitePrestation,
                "corpsEtatId" to l.corpsEtat.id,
                "parentId" to l.parent?.id
            )
        }
        return mapOf(
            "corpsEtat" to corpsEtat,
            "corpsEtatCount" to corpsEtat.size,
            "fournisseurs" to fournisseurs,
            "fournisseursCount" to fournisseurs.size,
            "lignesTotalCount" to totalLignes,
            "lignesSample" to lignesSample
        )
    }

    private fun toListResponse(l: LignePrixBareme): BaremeArticleListResponse {
        val corps = l.corpsEtat
        val corpsResp = CorpsEtatBaremeResponse(id = corps.id!!, code = corps.code, libelle = corps.libelle, ordreAffichage = corps.ordreAffichage)
        var debourse: java.math.BigDecimal? = null
        var prixVente: java.math.BigDecimal? = null
        var unitePrestation: String? = l.unitePrestation
        var prixEstime = l.prixEstime
        if (l.type == TypeLigneBareme.PRESTATION_ENTETE) {
            val totalLine = lignePrixBaremeRepository.findByParentIdOrderByOrdreLigneAsc(l.id!!)
                .firstOrNull { it.type == TypeLigneBareme.PRESTATION_TOTAL }
            totalLine?.let {
                debourse = it.debourse ?: BigDecimal.ZERO
                prixVente = it.prixVente ?: BigDecimal.ZERO
                if (unitePrestation == null) unitePrestation = it.unitePrestation
                prixEstime = it.prixEstime
            }
        }
        return BaremeArticleListResponse(
            id = l.id!!,
            type = l.type,
            reference = l.reference,
            libelle = l.libelle,
            unite = l.unite,
            corpsEtat = corpsResp,
            fournisseurNom = l.fournisseurBareme?.nom,
            fournisseurContact = l.fournisseurBareme?.contact,
            famille = l.famille,
            categorie = l.categorie,
            refReception = l.refReception,
            codeFournisseur = l.codeFournisseur,
            prixTtc = l.prixTtc ?: BigDecimal.ZERO,
            datePrix = l.datePrix,
            debourse = debourse ?: BigDecimal.ZERO,
            prixVente = prixVente ?: BigDecimal.ZERO,
            unitePrestation = unitePrestation,
            prixEstime = prixEstime
        )
    }

    private fun toDetailResponse(ligne: LignePrixBareme): BaremeArticleDetailResponse {
        val corps = ligne.corpsEtat
        val corpsResp = CorpsEtatBaremeResponse(id = corps.id!!, code = corps.code, libelle = corps.libelle, ordreAffichage = corps.ordreAffichage)

        val prixParFournisseur = when (ligne.type) {
            TypeLigneBareme.MATERIAU -> {
                val group = lignePrixBaremeRepository.findLinesForArticleGroup(
                    corpsId = corps.id!!,
                    libelle = ligne.libelle,
                    unite = ligne.unite,
                    type = TypeLigneBareme.MATERIAU
                )
                dedupeMateriauLignesParFournisseur(group)
                    .map { l ->
                        PrixFournisseurDto(
                            fournisseurId = l.fournisseurBareme?.id,
                            fournisseurNom = l.fournisseurBareme?.nom ?: "-",
                            fournisseurContact = l.fournisseurBareme?.contact,
                            prixTtc = l.prixTtc ?: BigDecimal.ZERO,
                            datePrix = l.datePrix,
                            prixEstime = l.prixEstime
                        )
                    }
                    .sortedBy { it.fournisseurNom }
            }
            else -> emptyList()
        }

        val enfants = lignePrixBaremeRepository.findByParentIdOrderByOrdreLigneAsc(ligne.id!!)
        val lignesPrestation = enfants
            .filter { it.type == TypeLigneBareme.PRESTATION_LIGNE }
            .map { LignePrestationDto(it.libelle, it.quantite ?: BigDecimal.ZERO, it.prixUnitaire ?: BigDecimal.ZERO, it.unitePrestation, it.somme ?: BigDecimal.ZERO, it.prixEstime) }
        val totalLine = enfants.firstOrNull { it.type == TypeLigneBareme.PRESTATION_TOTAL }

        return BaremeArticleDetailResponse(
            id = ligne.id!!,
            type = ligne.type,
            reference = ligne.reference,
            libelle = ligne.libelle,
            unite = ligne.unite,
            famille = ligne.famille,
            categorie = ligne.categorie,
            depot = ligne.depot,
            refReception = ligne.refReception,
            codeFournisseur = ligne.codeFournisseur,
            corpsEtat = corpsResp,
            prixParFournisseur = prixParFournisseur,
            lignesPrestation = lignesPrestation,
            debourse = totalLine?.debourse ?: ligne.debourse ?: BigDecimal.ZERO,
            prixVente = totalLine?.prixVente ?: ligne.prixVente ?: BigDecimal.ZERO,
            coefficientPv = totalLine?.coefficientPv ?: ligne.coefficientPv,
            unitePrestation = totalLine?.unitePrestation ?: ligne.unitePrestation,
            totauxEstimes = totalLine?.prixEstime ?: false
        )
    }

    /**
     * Valeurs distinctes pour les filtres (toute la base), avec filtres croisés :
     * chaque liste exclut son propre critère (ex. catégories selon famille/unité/recherche, pas selon catégorie).
     */
    fun getFilterFacets(
        corpsEtatId: Long?,
        type: TypeLigneBareme?,
        fournisseurId: Long?,
        fournisseurNom: String?,
        article: String?,
        famille: String?,
        categorie: String?,
        unite: String?,
        recherche: String?
    ): BaremeFilterFacetsResponse {
        val searchTrimmed = recherche?.trim()?.takeIf { it.isNotEmpty() }
        val (uniteNormalized, uniteAliasT) = normalizeFilterUnit(unite)
        val familleF = famille?.trim()?.takeIf { it.isNotEmpty() }
        val categorieF = categorie?.trim()?.takeIf { it.isNotEmpty() }
        val uniteF = uniteNormalized
        val fournisseurNomF = fournisseurNom?.trim()?.takeIf { it.isNotEmpty() }
        val articleF = article?.trim()?.takeIf { it.isNotEmpty() }

        val categories = lignePrixBaremeRepository.findDistinctCategories(
            corpsId = corpsEtatId,
            type = type,
            fournId = fournisseurId,
            fournNom = fournisseurNomF,
            famille = familleF,
            unite = uniteF,
            uniteAliasT = uniteAliasT,
            article = articleF,
            search = searchTrimmed
        )
        val familles = lignePrixBaremeRepository.findDistinctFamilles(
            corpsId = corpsEtatId,
            type = type,
            fournId = fournisseurId,
            fournNom = fournisseurNomF,
            categorie = categorieF,
            unite = uniteF,
            uniteAliasT = uniteAliasT,
            article = articleF,
            search = searchTrimmed
        )
        val unites = lignePrixBaremeRepository.findDistinctUnites(
            corpsId = corpsEtatId,
            type = type,
            fournId = fournisseurId,
            fournNom = fournisseurNomF,
            famille = familleF,
            categorie = categorieF,
            article = articleF,
            search = searchTrimmed
        )
        val fournisseurs = lignePrixBaremeRepository.findDistinctFournisseurNoms(
            corpsId = corpsEtatId,
            type = type,
            fournId = fournisseurId,
            fournNom = fournisseurNomF,
            famille = familleF,
            categorie = categorieF,
            unite = uniteF,
            uniteAliasT = uniteAliasT,
            article = articleF,
            search = searchTrimmed
        )
        val articles = lignePrixBaremeRepository.findDistinctArticleLibelles(
            corpsId = corpsEtatId,
            type = type,
            fournId = fournisseurId,
            fournNom = fournisseurNomF,
            famille = familleF,
            categorie = categorieF,
            unite = uniteF,
            uniteAliasT = uniteAliasT,
            search = searchTrimmed
        )
        val depots = lignePrixBaremeRepository.findDistinctDepots(
            corpsId = corpsEtatId,
            type = type,
            fournId = fournisseurId,
            fournNom = fournisseurNomF,
            famille = familleF,
            categorie = categorieF,
            unite = uniteF,
            uniteAliasT = uniteAliasT,
            article = articleF,
            search = searchTrimmed
        )
        return BaremeFilterFacetsResponse(
            categories = sortFacetStrings(categories),
            familles = sortFacetStrings(familles),
            unites = sortFacetStrings(unites),
            fournisseurs = sortFacetStrings(fournisseurs),
            articles = sortFacetStrings(articles),
            depots = sortFacetStrings(depots)
        )
    }
}
