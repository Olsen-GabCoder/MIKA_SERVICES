package com.mikaservices.platform.modules.securite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutActionPrevention
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "actions_prevention", indexes = [
    Index(name = "idx_ap_incident", columnList = "incident_id"),
    Index(name = "idx_ap_statut", columnList = "statut"),
    Index(name = "idx_ap_responsable", columnList = "responsable_id")
])
class ActionPrevention(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id")
    var incident: Incident? = null,

    @Column(name = "titre", nullable = false, length = 300)
    var titre: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutActionPrevention = StatutActionPrevention.PLANIFIEE,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    var responsable: User? = null,

    @Column(name = "date_echeance")
    var dateEcheance: LocalDate? = null,

    @Column(name = "date_realisation")
    var dateRealisation: LocalDate? = null,

    @Column(name = "commentaire_verification", columnDefinition = "TEXT")
    var commentaireVerification: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ActionPrevention) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: titre.hashCode()
    override fun toString(): String = "ActionPrevention(id=$id, titre='$titre', statut=$statut)"
}
