package com.mikaservices.platform.modules.bareme.dto

import com.mikaservices.platform.common.enums.TypeLigneBareme

/**
 * Clé d’agrégation « un article » dans la vue comparaison (même corps, libellé, unité, type).
 * La référence interne (MAT-…) n’entre pas dans la clé : plusieurs lignes d’import partagent le même produit métier.
 */
data class BaremeArticleGroupKey(
    val corpsEtatId: Long,
    val libelle: String?,
    val unite: String?,
    val type: TypeLigneBareme
)
