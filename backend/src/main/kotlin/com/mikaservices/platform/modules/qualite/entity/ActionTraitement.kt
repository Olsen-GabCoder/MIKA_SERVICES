package com.mikaservices.platform.modules.qualite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "qualite_actions_traitement")
class ActionTraitement(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    var section: SectionEvenement,

    @Column(name = "description_action", nullable = false, columnDefinition = "TEXT")
    var descriptionAction: String,

    @Column(name = "responsable", length = 200)
    var responsable: String? = null,

    @Column(name = "delai_prevu")
    var delaiPrevu: LocalDate? = null,

) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ActionTraitement) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
}
