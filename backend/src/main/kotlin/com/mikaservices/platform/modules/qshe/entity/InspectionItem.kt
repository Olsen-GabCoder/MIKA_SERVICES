package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.qshe.enums.ResultatItem
import jakarta.persistence.*

@Entity
@Table(name = "qshe_inspection_items", indexes = [
    Index(name = "idx_qinsi_inspection", columnList = "inspection_id"),
    Index(name = "idx_qinsi_resultat", columnList = "resultat")
])
class InspectionItem(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    var inspection: Inspection,

    @Column(name = "ordre", nullable = false)
    var ordre: Int,

    @Column(name = "libelle", nullable = false, length = 500)
    var libelle: String,

    @Column(name = "section", length = 200)
    var section: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "resultat", nullable = false, length = 20)
    var resultat: ResultatItem = ResultatItem.NON_VERIFIE,

    @Column(name = "commentaire", columnDefinition = "TEXT")
    var commentaire: String? = null,

    /** Chemin photo (stub — upload fonctionnel au livrable #1bis) */
    @Column(name = "photo_url", length = 1000)
    var photoUrl: String? = null,

    @Column(name = "critique")
    var critique: Boolean = false,

    @Column(name = "poids")
    var poids: Int = 1

) : BaseEntity() {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is InspectionItem) return false
        return id != null && id == other.id
    }
    override fun hashCode(): Int = id?.hashCode() ?: libelle.hashCode()
    override fun toString(): String = "InspectionItem(id=$id, ordre=$ordre, resultat=$resultat)"
}
