package com.mikaservices.platform.common.enums

/**
 * Familles de rôles au sein de l'organisation d'un projet BTP.
 * L'ordre de déclaration correspond au rang hiérarchique (direction → support).
 */
enum class FamilleRoleProjet {
    DIRECTION_PROJET,
    ENCADREMENT_TRAVAUX,
    ENCADREMENT_CHANTIER,
    ETUDES_TECHNIQUE,
    GROS_OEUVRE_TP,
    SECOND_OEUVRE,
    MATERIEL_ENGINS,
    LOGISTIQUE_APPRO,
    QSHE,
    ADMINISTRATIF_SUPPORT
}
