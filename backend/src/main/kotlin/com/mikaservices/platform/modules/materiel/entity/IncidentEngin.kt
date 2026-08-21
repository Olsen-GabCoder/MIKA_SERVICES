package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.GraviteIncident
import com.mikaservices.platform.common.enums.TypeIncidentEngin
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "incidents_engin", indexes = [
    Index(name = "idx_incident_engin", columnList = "engin_id"),
    Index(name = "idx_incident_date", columnList = "date_incident")
])
class IncidentEngin(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engin_id", nullable = false)
    var engin: Engin,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_incident", nullable = false, length = 30)
    var typeIncident: TypeIncidentEngin,

    @Enumerated(EnumType.STRING)
    @Column(name = "gravite", nullable = false, length = 20)
    var gravite: GraviteIncident,

    @Column(name = "date_incident", nullable = false)
    var dateIncident: LocalDate,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "lieu", length = 300)
    var lieu: String? = null,

    @Column(name = "signale_par", length = 200)
    var signalePar: String? = null,

    @Column(name = "resolu", nullable = false)
    var resolu: Boolean = false,

    @Column(name = "date_resolution")
    var dateResolution: LocalDate? = null,

    @Column(name = "actions_correctives", columnDefinition = "TEXT")
    var actionsCorrectives: String? = null,

    /** URLs Cloudinary des photos d'incident (JSON array). */
    @Column(name = "photo_urls", columnDefinition = "TEXT")
    var photoUrls: String? = null,

    /** Idempotence offline : UUID fourni par le client, unique. */
    @Column(name = "client_request_id", unique = true, length = 36)
    var clientRequestId: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is IncidentEngin) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)
    override fun toString(): String = "IncidentEngin(id=$id, type=$typeIncident, gravite=$gravite)"
}
