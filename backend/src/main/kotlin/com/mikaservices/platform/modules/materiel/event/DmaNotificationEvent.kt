package com.mikaservices.platform.modules.materiel.event

enum class DmaNotificationKind {
    SOUMISE,
    VALIDEE_CHANTIER,
    VALIDEE_PROJET,
    PRISE_EN_CHARGE,
    COMPLEMENT_REQUIS,
    COMMANDEE,
    LIVREE,
    REJETEE,
}

data class DmaNotificationEvent(
    val kind: DmaNotificationKind,
    val dmaId: Long,
    val reference: String,
    val projetNom: String,
    val projetId: Long,
    val createurId: Long,
    val responsableProjetId: Long?,
)
