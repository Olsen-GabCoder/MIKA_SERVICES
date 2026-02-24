package com.mikaservices.platform.modules.user.entity

import com.mikaservices.platform.common.enums.TypeSpecialite
import jakarta.persistence.*

@Entity
@Table(name = "specialites")
class Specialite(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
    
    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,
    
    @Column(name = "nom", nullable = false, length = 100)
    var nom: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "categorie", nullable = false, length = 30)
    var categorie: TypeSpecialite,
    
    @Column(name = "description", length = 500)
    var description: String? = null,
    
    @Column(name = "actif", nullable = false)
    var actif: Boolean = true
) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Specialite) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()

    override fun toString(): String = "Specialite(id=$id, code='$code', nom='$nom')"
}
