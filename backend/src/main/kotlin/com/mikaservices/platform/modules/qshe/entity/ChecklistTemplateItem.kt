package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*

@Entity
@Table(name = "qshe_checklist_template_items", indexes = [
    Index(name = "idx_qclti_template", columnList = "template_id")
])
class ChecklistTemplateItem(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    var template: ChecklistTemplate,

    @Column(name = "ordre", nullable = false)
    var ordre: Int,

    @Column(name = "libelle", nullable = false, length = 500)
    var libelle: String,

    @Column(name = "section", length = 200)
    var section: String? = null,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    /** Si true, une NC sera auto-generee si le resultat est NON_CONFORME */
    @Column(name = "critique")
    var critique: Boolean = false,

    /** Ponderation pour le scoring (defaut 1) */
    @Column(name = "poids")
    var poids: Int = 1

) : BaseEntity() {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ChecklistTemplateItem) return false
        return id != null && id == other.id
    }
    override fun hashCode(): Int = id?.hashCode() ?: libelle.hashCode()
    override fun toString(): String = "ChecklistTemplateItem(id=$id, ordre=$ordre, libelle='$libelle')"
}
