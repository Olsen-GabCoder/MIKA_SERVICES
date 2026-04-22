package com.mikaservices.platform.modules.qualite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.qualite.enums.RoleCollegial
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "qualite_signataires_collegiaux",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_qsc_section_role", columnNames = ["section_id", "role_attendu"])
    ]
)
class SectionSignataireCollegial(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    var section: SectionEvenement,

    @Enumerated(EnumType.STRING)
    @Column(name = "role_attendu", nullable = false, length = 5)
    var roleAttendu: RoleCollegial,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signataire_designe_id")
    var signataireDesigne: User? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signataire_effectif_id")
    var signataireEffectif: User? = null,

    @Column(name = "date_signature")
    var dateSignature: LocalDateTime? = null,

    @Column(name = "signee", nullable = false)
    var signee: Boolean = false,

) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is SectionSignataireCollegial) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
}
