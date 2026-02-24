package com.mikaservices.platform.modules.user.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.NiveauHierarchique
import jakarta.persistence.*

@Entity
@Table(name = "roles")
class Role(
    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,
    
    @Column(name = "nom", nullable = false, length = 100)
    var nom: String,
    
    @Column(name = "description", length = 500)
    var description: String? = null,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "niveau", nullable = false, length = 30)
    var niveau: NiveauHierarchique,
    
    @Column(name = "actif", nullable = false)
    var actif: Boolean = true,
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "role_permissions",
        joinColumns = [JoinColumn(name = "role_id")],
        inverseJoinColumns = [JoinColumn(name = "permission_id")]
    )
    var permissions: MutableSet<Permission> = mutableSetOf()
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Role) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()

    override fun toString(): String = "Role(id=$id, code='$code', nom='$nom')"
}
