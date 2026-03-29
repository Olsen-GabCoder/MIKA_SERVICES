package com.mikaservices.platform.modules.bareme.dto.response

import com.mikaservices.platform.common.enums.TypeLigneBareme
import java.math.BigDecimal

/**
 * Détail d'un article barème : en-tête + prix par fournisseur (matériaux) ou décomposition (prestations).
 */
data class BaremeArticleDetailResponse(
    val id: Long,
    val type: TypeLigneBareme,
    val reference: String?,
    val libelle: String?,
    val unite: String?,
    val famille: String?,
    val categorie: String?,
    val depot: String?,
    val refReception: String?,
    val codeFournisseur: String?,
    val corpsEtat: CorpsEtatBaremeResponse,
    val prixParFournisseur: List<PrixFournisseurDto>,
    val lignesPrestation: List<LignePrestationDto>,
    val debourse: BigDecimal?,
    val prixVente: BigDecimal?,
    val coefficientPv: BigDecimal?,
    val unitePrestation: String?,
    /** True si déboursé / P.V sont des valeurs estimées. */
    val totauxEstimes: Boolean = false
)

data class PrixFournisseurDto(
    val fournisseurId: Long?,
    val fournisseurNom: String,
    val fournisseurContact: String?,
    val prixTtc: BigDecimal?,
    val datePrix: String?,
    val prixEstime: Boolean = false
)

data class LignePrestationDto(
    val libelle: String?,
    val quantite: BigDecimal?,
    val prixUnitaire: BigDecimal?,
    val unite: String?,
    val somme: BigDecimal?,
    val prixEstime: Boolean = false
)
