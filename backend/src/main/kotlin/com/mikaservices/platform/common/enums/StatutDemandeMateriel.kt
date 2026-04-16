package com.mikaservices.platform.common.enums

/** Machine à états DMA (spec Engins / DMA). */
enum class StatutDemandeMateriel {
    SOUMISE,
    EN_VALIDATION_CHANTIER,
    EN_VALIDATION_PROJET,
    PRISE_EN_CHARGE,
    EN_ATTENTE_COMPLEMENT,
    EN_COMMANDE,
    LIVRE,
    REJETEE,
    CLOTUREE,
}
