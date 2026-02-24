package com.mikaservices.platform.modules.chantier.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.RoleDansEquipe
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "membres_equipe", indexes = [
    Index(name = "idx_membre_equipe", columnList = "equipe_id"),
    Index(name = "idx_membre_user", columnList = "user_id")
])
class MembreEquipe(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    var equipe: Equipe,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    var role: RoleDansEquipe,

    @Column(name = "date_affectation", nullable = false)
    var dateAffectation: LocalDate = LocalDate.now(),

    @Column(name = "date_fin")
    var dateFin: LocalDate? = null,

    @Column(name = "actif", nullable = false)
    var actif: Boolean = true
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is MembreEquipe) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
    override fun toString(): String = "MembreEquipe(id=$id, role=$role)"
}
