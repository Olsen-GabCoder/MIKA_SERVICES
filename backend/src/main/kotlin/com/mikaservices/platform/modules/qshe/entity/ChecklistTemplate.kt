package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.qshe.enums.TypeInspection
import jakarta.persistence.*

/**
 * Modele de checklist reutilisable.
 * Contient les items (points de controle) a verifier lors d'une inspection.
 * Peut etre associe a un type d'inspection specifique.
 */
@Entity
@Table(name = "qshe_checklist_templates", indexes = [
    Index(name = "idx_qclt_code", columnList = "code", unique = true),
    Index(name = "idx_qclt_type", columnList = "type_inspection")
])
class ChecklistTemplate(
    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,

    @Column(name = "nom", nullable = false, length = 300)
    var nom: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_inspection", length = 30)
    var typeInspection: TypeInspection? = null,

    @Column(name = "actif")
    var actif: Boolean = true,

    /** Items ordonnes du template */
    @OneToMany(mappedBy = "template", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordre ASC")
    var items: MutableList<ChecklistTemplateItem> = mutableListOf()

) : BaseEntity() {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ChecklistTemplate) return false
        return id != null && id == other.id
    }
    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()
    override fun toString(): String = "ChecklistTemplate(id=$id, code='$code', nom='$nom')"
}
