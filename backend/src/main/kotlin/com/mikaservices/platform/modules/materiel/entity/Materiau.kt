package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.TypeMateriau
import com.mikaservices.platform.common.enums.Unite
import jakarta.persistence.*
import java.math.BigDecimal

@Entity
@Table(name = "materiaux", indexes = [
    Index(name = "idx_materiau_code", columnList = "code", unique = true)
])
class Materiau(
    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,

    @Column(name = "nom", nullable = false, length = 200)
    var nom: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TypeMateriau,

    @Enumerated(EnumType.STRING)
    @Column(name = "unite", nullable = false, length = 20)
    var unite: Unite,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "prix_unitaire", precision = 15, scale = 2)
    var prixUnitaire: BigDecimal? = null,

    @Column(name = "stock_actuel", precision = 15, scale = 2)
    var stockActuel: BigDecimal = BigDecimal.ZERO,

    @Column(name = "stock_minimum", precision = 15, scale = 2)
    var stockMinimum: BigDecimal = BigDecimal.ZERO,

    @Column(name = "fournisseur", length = 200)
    var fournisseur: String? = null,

    @Column(name = "actif", nullable = false)
    var actif: Boolean = true
) : BaseEntity() {

    fun isStockBas(): Boolean = stockActuel <= stockMinimum

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Materiau) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()
    override fun toString(): String = "Materiau(id=$id, code='$code', nom='$nom')"
}
