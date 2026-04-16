package com.mikaservices.platform.common.enums

/** Cycle de vie d'un ordre de déplacement d'engin (spec Engins / DMA). */
enum class StatutMouvementEngin {
    EN_ATTENTE_DEPART,
    EN_TRANSIT,
    RECU,
    ANNULE,
}
