package com.mikaservices.platform.modules.bareme.service

import com.mikaservices.platform.common.enums.TypeLigneBareme
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleCompareResponse
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleDetailResponse
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleListResponse
import com.mikaservices.platform.modules.bareme.dto.response.CorpsEtatBaremeResponse
import com.mikaservices.platform.modules.bareme.dto.response.CoefficientEloignementResponse
import com.mikaservices.platform.modules.bareme.dto.response.LignePrestationDto
import com.mikaservices.platform.modules.bareme.dto.response.PrixFournisseurDto
import java.math.BigDecimal
import java.time.LocalDateTime
import com.mikaservices.platform.modules.bareme.entity.FournisseurBareme
import com.mikaservices.platform.modules.bareme.entity.LignePrixBareme
import com.mikaservices.platform.modules.bareme.repository.CoefficientEloignementRepository
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
    private val coefficientEloignementRepository: CoefficientEloignementRepository,
    private val corpsEtatBaremeRepository: CorpsEtatBaremeRepository,
    private val fournisseurBaremeRepository: FournisseurBaremeRepository,
    private val lignePrixBaremeRepository: LignePrixBaremeRepository
) {

    fun getCoefficientsEloignement(): List<CoefficientEloignementResponse> =
        coefficientEloignementRepository.findAllByOrderByOrdreAffichageAscNomAsc().map { c ->
            CoefficientEloignementResponse(
                id = c.id!!,
                nom = c.nom,
                pourcentage = c.pourcentage,
                coefficient = c.coefficient,
                note = c.note,
                ordreAffichage = c.ordreAffichage
            )
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

    fun getArticles(
        corpsEtatId: Long?,
        type: TypeLigneBareme?,
        fournisseurId: Long?,
        recherche: String?,
        pageable: Pageable
    ): Page<BaremeArticleListResponse> {
        val searchTrimmed = recherche?.trim()?.takeIf { it.isNotEmpty() }
        val page = lignePrixBaremeRepository.findArticlesFiltered(
            corpsId = corpsEtatId,
            type = type,
            fournId = fournisseurId,
            search = searchTrimmed,
            pageable = pageable
        )
        return page.map { toListResponse(it) }
    }

    fun getArticleById(id: Long): BaremeArticleDetailResponse {
        val ligne = lignePrixBaremeRepository.findByIdWithCorpsEtatAndFournisseur(id)
            ?: throw NoSuchElementException("Article barème non trouvé: $id")
        return toDetailResponse(ligne)
    }

    /** Articles groupés par (corps d'état, libellé, référence, unité, type) pour comparaison des prix entre fournisseurs. Pagination sur les articles (groupes), pas sur les lignes. */
    fun getArticlesCompare(
        corpsEtatId: Long?,
        type: TypeLigneBareme?,
        fournisseurId: Long?,
        recherche: String?,
        pageable: Pageable
    ): Page<BaremeArticleCompareResponse> {
        val searchTrimmed = recherche?.trim()?.takeIf { it.isNotEmpty() }
        val maxLines = 10000
        val allPage = lignePrixBaremeRepository.findArticlesFiltered(
            corpsId = corpsEtatId,
            type = type,
            fournId = fournisseurId,
            search = searchTrimmed,
            pageable = PageRequest.of(0, maxLines)
        )
        val lines = allPage.content
        if (lines.isEmpty()) return PageImpl(emptyList(), pageable, 0)

        val key: (LignePrixBareme) -> String = { l ->
            "${l.corpsEtat.id!!}|${l.libelle}|${l.reference}|${l.unite}|${l.type}"
        }
        val groups = lines.groupBy(key).values.toList()

        val sortedGroups = groups.sortedWith(
            compareBy(
                { it.first().corpsEtat.ordreAffichage },
                { it.first().libelle.orEmpty() }
            )
        )

        val total = sortedGroups.size
        val pageNumber = pageable.pageNumber.coerceIn(0, (total - 1).coerceAtLeast(0) / pageable.pageSize.coerceAtLeast(1))
        val pageSize = pageable.pageSize.coerceAtLeast(1)
        val from = pageNumber * pageSize
        val to = (from + pageSize).coerceAtMost(total)
        val corpsIds = lines.map { it.corpsEtat.id!! }.toSet()
        val fromPage = corpsIds.associateWith { cid ->
            lines.filter { it.corpsEtat.id == cid && it.type == TypeLigneBareme.MATERIAU && it.fournisseurBareme != null }
                .mapNotNull { it.fournisseurBareme }.distinctBy { it.id }.sortedBy { it.nom }
        }
        val corpsToFournisseurs = corpsIds.associateWith { cid ->
            fromPage.getValue(cid).ifEmpty {
                lignePrixBaremeRepository.findArticlesFiltered(
                    cid, TypeLigneBareme.MATERIAU, null, null, PageRequest.of(0, 5000)
                ).content.mapNotNull { it.fournisseurBareme }.distinctBy { it.id }.sortedBy { it.nom }
            }
        }
        val pageContent = sortedGroups.subList(from, to).map { group ->
            toCompareResponse(group, corpsToFournisseurs[group.first().corpsEtat.id!!].orEmpty())
        }

        return PageImpl(pageContent, PageRequest.of(pageNumber, pageSize), total.toLong())
    }

    private fun toCompareResponse(group: List<LignePrixBareme>, fournisseursDuCorps: List<FournisseurBareme> = emptyList()): BaremeArticleCompareResponse {
        val first = group.first()
        val corps = first.corpsEtat
        val corpsResp = CorpsEtatBaremeResponse(id = corps.id!!, code = corps.code, libelle = corps.libelle, ordreAffichage = corps.ordreAffichage)

        return when (first.type) {
            TypeLigneBareme.MATERIAU -> {
                val existingByFournisseurId = group.mapNotNull { it.fournisseurBareme?.id }.toSet()
                val fromGroup = group.map { l ->
                    PrixFournisseurDto(
                        fournisseurId = l.fournisseurBareme?.id,
                        fournisseurNom = l.fournisseurBareme?.nom ?: "-",
                        fournisseurContact = l.fournisseurBareme?.contact,
                        prixTtc = l.prixTtc ?: BigDecimal.ZERO,
                        datePrix = l.datePrix,
                        prixEstime = l.prixEstime
                    )
                }
                val missingFournisseurs = fournisseursDuCorps.filter { it.id !in existingByFournisseurId }
                val estimated = missingFournisseurs.map { f ->
                    PrixFournisseurDto(
                        fournisseurId = f.id,
                        fournisseurNom = f.nom,
                        fournisseurContact = f.contact,
                        prixTtc = BigDecimal.valueOf(5000 + (f.id!! % 25) * 2000L),
                        datePrix = "—",
                        prixEstime = true
                    )
                }
                val prixParFournisseur = (fromGroup + estimated).sortedBy { it.fournisseurNom }
                BaremeArticleCompareResponse(
                    id = first.id!!,
                    type = first.type,
                    reference = first.reference,
                    libelle = first.libelle,
                    unite = first.unite,
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
                val prixParFournisseurPrestation = fournisseursDuCorps.map { f ->
                    PrixFournisseurDto(
                        fournisseurId = f.id,
                        fournisseurNom = f.nom,
                        fournisseurContact = f.contact,
                        prixTtc = null,
                        datePrix = null,
                        prixEstime = false
                    )
                }
                BaremeArticleCompareResponse(
                    id = first.id!!,
                    type = first.type,
                    reference = first.reference,
                    libelle = first.libelle,
                    unite = first.unite,
                    corpsEtat = corpsResp,
                    prixParFournisseur = prixParFournisseurPrestation,
                    debourse = debourse ?: BigDecimal.ZERO,
                    prixVente = prixVente ?: BigDecimal.ZERO,
                    unitePrestation = unitePrestation,
                    prixEstime = prixEstimePrest
                )
            }
        }
    }

    /** Date/heure du dernier import (max updated_at sur les lignes de prix). Null si aucune donnée. */
    fun getDerniereMiseAJour(): LocalDateTime? = lignePrixBaremeRepository.findLastUpdatedAt()

    /** Dump de toutes les données barème (debug) : coefficients, corps d'état, fournisseurs, échantillon de lignes. */
    fun getDebugDump(maxLignes: Int = 500): Map<String, Any> {
        val coefficients = coefficientEloignementRepository.findAllByOrderByOrdreAffichageAscNomAsc().map { c ->
            mapOf(
                "id" to c.id,
                "nom" to c.nom,
                "pourcentage" to c.pourcentage,
                "coefficient" to c.coefficient,
                "note" to c.note,
                "ordreAffichage" to c.ordreAffichage
            )
        }
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
            "coefficients" to coefficients,
            "coefficientsCount" to coefficients.size,
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
                lignePrixBaremeRepository.findSameArticle(
                    corpsId = corps.id!!,
                    libelle = ligne.libelle,
                    unite = ligne.unite,
                    type = TypeLigneBareme.MATERIAU
                ).map { l ->
                    PrixFournisseurDto(
                        fournisseurId = l.fournisseurBareme?.id,
                        fournisseurNom = l.fournisseurBareme?.nom ?: "-",
                        fournisseurContact = l.fournisseurBareme?.contact,
                        prixTtc = l.prixTtc ?: BigDecimal.ZERO,
                        datePrix = l.datePrix,
                        prixEstime = l.prixEstime
                    )
                }
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
}
