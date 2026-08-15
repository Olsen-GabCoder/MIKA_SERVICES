package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutMaintenance
import com.mikaservices.platform.common.enums.TypeOperationMaintenance
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "operations_maintenance", indexes = [
    Index(name = "idx_op_maint_engin", columnList = "engin_id"),
    Index(name = "idx_op_maint_statut", columnList = "statut"),
    Index(name = "idx_op_maint_echeance", columnList = "echeance_date")
])
class OperationMaintenance(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engin_id", nullable = false)
    var engin: Engin,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_operation", nullable = false, length = 30)
    var typeOperation: TypeOperationMaintenance,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutMaintenance = StatutMaintenance.PLANIFIEE,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "echeance_date")
    var echeanceDate: LocalDate? = null,

    @Column(name = "echeance_heures")
    var echeanceHeures: Int? = null,

    @Column(name = "cout_estime", precision = 15, scale = 2)
    var coutEstime: BigDecimal? = null,

    @Column(name = "cout_reel", precision = 15, scale = 2)
    var coutReel: BigDecimal? = null,

    @Column(name = "execute_par", length = 200)
    var executePar: String? = null,

    @Column(name = "date_realisation")
    var dateRealisation: LocalDate? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is OperationMaintenance) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)
    override fun toString(): String = "OperationMaintenance(id=$id, type=$typeOperation, statut=$statut)"
}
