package com.mikaservices.platform.modules.bareme.dto.response

import com.mikaservices.platform.common.enums.TypeLigneBareme
import java.math.BigDecimal

/**
 * Élément de la liste paginée des articles du barème (matériaux et prestations).
 */
data class BaremeArticleListResponse(
    val id: Long,
    val type: TypeLigneBareme,
    val reference: String?,
    val libelle: String?,
    val unite: String?,
    val corpsEtat: CorpsEtatBaremeResponse,
    val fournisseurNom: String?,
    val fournisseurContact: String?,
    val prixTtc: BigDecimal?,
    val datePrix: String?,
    val debourse: BigDecimal?,
    val prixVente: BigDecimal?,
    val unitePrestation: String?,
    /** True si le prix affiché est une valeur estimée (donnée de remplacement, pas réelle). */
    val prixEstime: Boolean = false
)
