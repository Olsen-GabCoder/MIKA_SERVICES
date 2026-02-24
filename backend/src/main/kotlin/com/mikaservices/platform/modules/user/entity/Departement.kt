package com.mikaservices.platform.modules.user.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.TypeDepartement
import jakarta.persistence.*

@Entity
@Table(name = "departements")
class Departement(
    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,
    
    @Column(name = "nom", nullable = false, length = 100)
    var nom: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TypeDepartement,
    
    @Column(name = "description", length = 500)
    var description: String? = null,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    var responsable: User? = null,
    
    @Column(name = "actif", nullable = false)
    var actif: Boolean = true
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Departement) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()

    override fun toString(): String = "Departement(id=$id, code='$code', nom='$nom')"
}
