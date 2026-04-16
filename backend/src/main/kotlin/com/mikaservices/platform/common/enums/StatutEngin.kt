package com.mikaservices.platform.common.enums

enum class StatutEngin {
    DISPONIBLE,
    /** Ordre de mouvement créé, en attente de confirmation de départ (chantier source). */
    EN_ATTENTE_DEPART,
    EN_SERVICE,
    EN_MAINTENANCE,
    EN_PANNE,
    HORS_SERVICE,
    EN_TRANSIT
}
