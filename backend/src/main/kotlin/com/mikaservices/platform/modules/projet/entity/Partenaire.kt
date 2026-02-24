package com.mikaservices.platform.modules.projet.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.TypePartenaire
import jakarta.persistence.*

@Entity
@Table(name = "partenaires", indexes = [
    Index(name = "idx_partenaire_code", columnList = "code", unique = true)
])
class Partenaire(
    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,

    @Column(name = "nom", nullable = false, length = 200)
    var nom: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TypePartenaire,

    @Column(name = "pays", length = 100)
    var pays: String? = null,

    @Column(name = "telephone", length = 20)
    var telephone: String? = null,

    @Column(name = "email", length = 100)
    var email: String? = null,

    @Column(name = "adresse", length = 500)
    var adresse: String? = null,

    @Column(name = "contact_principal", length = 200)
    var contactPrincipal: String? = null,

    @Column(name = "actif", nullable = false)
    var actif: Boolean = true
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Partenaire) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()

    override fun toString(): String = "Partenaire(id=$id, code='$code', nom='$nom')"
}
