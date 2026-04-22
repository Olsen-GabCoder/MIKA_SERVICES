package com.mikaservices.platform.modules.qualite.enums

/** Workflow 5 statuts identiques pour les 6 sous-flux de réception (Document A) */
enum class StatutReception {
    ETABLIE,
    EN_ATTENTE_MDC,
    ACCORDEE_SANS_RESERVE,
    ACCORDEE_AVEC_RESERVE,
    REJETEE
}
