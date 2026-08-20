package com.mikaservices.platform.modules.materiel.event

enum class MouvementNotificationKind {
    DEMANDE_CREEE,
    VALIDE,
    REJETE,
    RECEPTION_AVEC_RESERVES,
    ORDRE_CREE,
    DEPART_CONFIRME,
    RECEPTION_CONFIRMEE,
    ANNULE,
    EN_TRANSIT_TROP_LONG,
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
    /** Initiateur de la demande (destinataire des notifications VALIDE/REJETE). */
    val initiateurUserId: Long? = null,
    /** Motif de rejet ou détail des réserves. */
    val detail: String? = null,
)
