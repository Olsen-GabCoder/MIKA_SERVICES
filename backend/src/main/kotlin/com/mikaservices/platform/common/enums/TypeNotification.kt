package com.mikaservices.platform.common.enums

enum class TypeNotification {
    INFO,
    ALERTE,
    TACHE_ASSIGNEE,
    INCIDENT,
    NON_CONFORMITE,
    ECHEANCE,
    STOCK_BAS,
    MESSAGE,
    SYSTEME,
    /** Demandes de matériel (spec Engins & DMA) */
    DMA_SOUMISE,
    DMA_VALIDEE_CHANTIER,
    DMA_VALIDEE_PROJET,
    DMA_PRISE_EN_CHARGE,
    DMA_COMPLEMENT_REQUIS,
    DMA_COMMANDEE,
    DMA_LIVREE,
    DMA_REJETEE,

    /** Mouvements d'engins inter-chantiers (spec Engins & DMA §7) */
    MOUVEMENT_ORDRE_CREE,
    MOUVEMENT_DEPART_CONFIRME,
    MOUVEMENT_RECEPTION_CONFIRMEE,
    MOUVEMENT_ANNULE,

    /** Rappels automatiques hebdomadaires */
    RAPPEL_MAJ_PROJET,

    /** QSHE — notifications ajoutées au livrable #14 */
    QSHE_INCIDENT_GRAVE,
    QSHE_CNSS_EN_RETARD,
    QSHE_INSPECTION_TERMINEE,
    QSHE_ACTION_EN_RETARD,
    QSHE_CERTIFICATION_EXPIRE,
    QSHE_PERMIS_EXPIRE,
    QSHE_EPI_STOCK_BAS,
    QSHE_DEPASSEMENT_ENVIRONNEMENTAL,
}
