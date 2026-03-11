package com.mikaservices.platform.modules.bareme.dto.response

import com.mikaservices.platform.common.enums.TypeLigneBareme
import java.math.BigDecimal

/**
 * Article barème groupé pour comparaison des prix entre fournisseurs.
 * Un même article (libellé + référence + corps d'état + unité) peut avoir plusieurs prix (un par fournisseur).
 */
data class BaremeArticleCompareResponse(
    /** Id d'une ligne représentative (pour lien vers la page détail) */
    val id: Long,
    val type: TypeLigneBareme,
    val reference: String?,
    val libelle: String?,
    val unite: String?,
    val corpsEtat: CorpsEtatBaremeResponse,
    /** Pour les matériaux : tous les prix par fournisseur pour cet article. */
    val prixParFournisseur: List<PrixFournisseurDto>,
    /** Pour les prestations : déboursé et P.V (pas de multi-fournisseur). */
    val debourse: BigDecimal?,
    val prixVente: BigDecimal?,
    val unitePrestation: String?,
    /** True si le(s) prix affichés sont des valeurs estimées (données de remplacement). */
    val prixEstime: Boolean = false
)
