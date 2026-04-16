package com.mikaservices.platform.modules.materiel.event

enum class MouvementNotificationKind {
    ORDRE_CREE,
    DEPART_CONFIRME,
    RECEPTION_CONFIRMEE,
    ANNULE,
}

data class MouvementNotificationEvent(
    val kind: MouvementNotificationKind,
    val mouvementId: Long,
    val enginCode: String,
    val enginNom: String,
    /** Null si départ depuis dépôt central */
    val projetOrigineNom: String?,
    val projetOrigineResponsableId: Long?,
    val projetDestinationNom: String,
    val projetDestinationResponsableId: Long?,
)
