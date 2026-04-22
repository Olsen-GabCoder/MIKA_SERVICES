package com.mikaservices.platform.modules.chantier.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.NiveauRisque
import com.mikaservices.platform.common.enums.TypeZone
import com.mikaservices.platform.modules.projet.entity.Projet
import jakarta.persistence.*
import java.math.BigDecimal

@Entity
@Table(name = "zones_projet", indexes = [
    Index(name = "idx_zone_projet", columnList = "projet_id"),
    Index(name = "idx_zone_code", columnList = "code", unique = true)
])
class ZoneChantier(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,

    @Column(name = "nom", nullable = false, length = 200)
    var nom: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TypeZone,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "latitude")
    var latitude: Double? = null,

    @Column(name = "longitude")
    var longitude: Double? = null,

    @Column(name = "superficie", precision = 15, scale = 2)
    var superficie: BigDecimal? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_danger", length = 20)
    var niveauDanger: NiveauRisque = NiveauRisque.FAIBLE,

    @Column(name = "actif", nullable = false)
    var actif: Boolean = true
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ZoneChantier) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()
    override fun toString(): String = "ZoneChantier(id=$id, code='$code', nom='$nom')"
}
