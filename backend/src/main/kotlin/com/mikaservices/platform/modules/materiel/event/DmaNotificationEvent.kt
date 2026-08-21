package com.mikaservices.platform.modules.materiel.event

enum class DmaNotificationKind {
    SOUMISE,
    PRISE_EN_CHARGE,
    COMPLEMENT_REQUIS,
    COMMANDEE,
    LIVREE,
    CLOTUREE,
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
    /**
     * Chefs de projet (rôle global CHEF_PROJET) affectés EN_COURS au projet, calculés à
     * l'émission. Garde-fou informel du circuit à une porte : le CP n'a plus de veto
     * formel mais est informé dès la création (docs/matrice-roles-perimetres.md §2.2).
     */
    val chefsProjetAffectesIds: List<Long> = emptyList(),
)
