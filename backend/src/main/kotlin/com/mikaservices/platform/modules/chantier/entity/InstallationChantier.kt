package com.mikaservices.platform.modules.chantier.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutInstallation
import com.mikaservices.platform.common.enums.TypeInstallation
import com.mikaservices.platform.modules.projet.entity.Projet
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "installations_projet", indexes = [
    Index(name = "idx_installation_projet", columnList = "projet_id")
])
class InstallationChantier(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TypeInstallation,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "date_installation")
    var dateInstallation: LocalDate? = null,

    @Column(name = "date_retrait")
    var dateRetrait: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 30)
    var statut: StatutInstallation = StatutInstallation.PLANIFIEE
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is InstallationChantier) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
    override fun toString(): String = "InstallationChantier(id=$id, type=$type, statut=$statut)"
}
