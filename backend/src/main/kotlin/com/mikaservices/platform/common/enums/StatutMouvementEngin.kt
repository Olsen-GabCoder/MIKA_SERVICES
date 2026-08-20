package com.mikaservices.platform.common.enums

/** Cycle de vie d'un ordre de déplacement d'engin (spec Engins / DMA). */
enum class StatutMouvementEngin {
    /** Demande initiée par un non-logistique, en attente de validation logistique. */
    DEMANDE,
    /** Demande rejetée par la logistique (motif obligatoire). */
    REJETE,
    EN_ATTENTE_DEPART,
    EN_TRANSIT,
    RECU,
    ANNULE,
}
