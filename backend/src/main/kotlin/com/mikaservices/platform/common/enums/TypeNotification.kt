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
}
