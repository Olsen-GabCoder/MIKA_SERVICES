package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*
import java.time.Instant

enum class SourcePosition {
    QR_SCAN,
    GPS_AUTO,
    MANUEL,
    CHANTIER
}

@Entity
@Table(name = "positions_engin", indexes = [
    Index(name = "idx_position_engin", columnList = "engin_id"),
    Index(name = "idx_position_horodatage", columnList = "horodatage")
])
class PositionEngin(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engin_id", nullable = false)
    var engin: Engin,

    @Column(name = "latitude", nullable = false)
    var latitude: Double,

    @Column(name = "longitude", nullable = false)
    var longitude: Double,

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    var source: SourcePosition = SourcePosition.MANUEL,

    @Column(name = "precision_metres")
    var precisionMetres: Int? = null,

    @Column(name = "chantier_nom", length = 300)
    var chantierNom: String? = null,

    @Column(name = "confirme_par", length = 200)
    var confirmePar: String? = null,

    @Column(name = "horodatage", nullable = false)
    var horodatage: Instant = Instant.now(),

    /** Idempotence offline : UUID fourni par le client, unique. */
    @Column(name = "client_request_id", unique = true, length = 36)
    var clientRequestId: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PositionEngin) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)
}
