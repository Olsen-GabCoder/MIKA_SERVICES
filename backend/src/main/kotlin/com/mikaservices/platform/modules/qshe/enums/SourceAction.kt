package com.mikaservices.platform.modules.qshe.enums

/** Type de la source qui a genere l'action CAPA (lien polymorphe via sourceType + sourceId) */
enum class SourceAction {
    INCIDENT,
    INSPECTION,
    NON_CONFORMITE,
    RISQUE,
    AUDIT
}
