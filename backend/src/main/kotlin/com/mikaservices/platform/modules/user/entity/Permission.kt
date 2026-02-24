package com.mikaservices.platform.modules.user.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.TypePermission
import jakarta.persistence.*

@Entity
@Table(name = "permissions")
class Permission(
    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,
    
    @Column(name = "nom", nullable = false, length = 100)
    var nom: String,
    
    @Column(name = "module", nullable = false, length = 50)
    var module: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    var type: TypePermission,
    
    @Column(name = "description", length = 500)
    var description: String? = null,
    
    @Column(name = "actif", nullable = false)
    var actif: Boolean = true
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Permission) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()

    override fun toString(): String = "Permission(id=$id, code='$code', nom='$nom')"
}
