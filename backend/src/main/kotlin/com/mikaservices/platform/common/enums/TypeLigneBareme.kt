package com.mikaservices.platform.common.enums

/**
 * Type d'une ligne du barème bâtiment.
 * - MATERIAU : ligne de référentiel prix (N°, Matériaux, U, P.TTC, Fournisseur)
 * - PRESTATION_ENTETE : titre d'une prestation (libellé du bloc)
 * - PRESTATION_LIGNE : ligne de décomposition (Libellé, Qté, P.U, Sommes)
 * - PRESTATION_TOTAL : ligne de total (Déboursé, P.V)
 */
enum class TypeLigneBareme {
    MATERIAU,
    PRESTATION_ENTETE,
    PRESTATION_LIGNE,
    PRESTATION_TOTAL
}
