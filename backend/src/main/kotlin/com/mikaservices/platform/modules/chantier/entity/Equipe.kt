package com.mikaservices.platform.modules.chantier.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.TypeEquipe
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*

@Entity
@Table(name = "equipes", indexes = [
    Index(name = "idx_equipe_code", columnList = "code", unique = true)
])
class Equipe(
    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,

    @Column(name = "nom", nullable = false, length = 200)
    var nom: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TypeEquipe,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chef_equipe_id")
    var chefEquipe: User? = null,

    @Column(name = "effectif")
    var effectif: Int = 0,

    @Column(name = "actif", nullable = false)
    var actif: Boolean = true
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Equipe) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()
    override fun toString(): String = "Equipe(id=$id, code='$code', nom='$nom')"
}
