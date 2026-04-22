package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.qshe.enums.TypeDechet
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "qshe_dechets", indexes = [
    Index(name = "idx_qdec_projet", columnList = "projet_id"),
    Index(name = "idx_qdec_type", columnList = "type_dechet"),
    Index(name = "idx_qdec_date", columnList = "date_enlevement")
])
class DechetRecord(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_dechet", nullable = false, length = 20)
    var typeDechet: TypeDechet,

    @Column(name = "designation", nullable = false, length = 300)
    var designation: String,

    @Column(name = "quantite", precision = 15, scale = 2)
    var quantite: BigDecimal? = null,

    @Column(name = "unite", length = 20)
    var unite: String? = null,

    @Column(name = "filiere_elimination", length = 200)
    var filiereElimination: String? = null,

    @Column(name = "transporteur", length = 200)
    var transporteur: String? = null,

    @Column(name = "destination", length = 300)
    var destination: String? = null,

    /** Numero du bordereau de suivi des dechets (BSD) pour les dechets dangereux */
    @Column(name = "numero_bsd", length = 100)
    var numeroBsd: String? = null,

    @Column(name = "date_enlevement")
    var dateEnlevement: LocalDate? = null,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null

) : BaseEntity() {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DechetRecord) return false
        return id != null && id == other.id
    }
    override fun hashCode(): Int = id?.hashCode() ?: designation.hashCode()
}
