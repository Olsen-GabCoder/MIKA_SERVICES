package com.mikaservices.platform.modules.bareme.dto.response

import com.mikaservices.platform.common.enums.TypeLigneBareme
import java.math.BigDecimal

/**
 * Article barème groupé pour comparaison des prix entre fournisseurs.
 * Regroupement métier : corps d'état + libellé + unité ; un prix affiché par fournisseur (ligne la plus récente si plusieurs imports).
 * [reference] et [id] proviennent d'une ligne représentative (id minimal) pour liens détail.
 */
data class BaremeArticleCompareResponse(
    /** Id d'une ligne représentative (pour lien vers la page détail) */
    val id: Long,
    val type: TypeLigneBareme,
    val reference: String?,
    val libelle: String?,
    val unite: String?,
    val famille: String?,
    val categorie: String?,
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
