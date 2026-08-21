package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.EtatGeneralInspection
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "inspections_engin", indexes = [
    Index(name = "idx_inspection_engin", columnList = "engin_id"),
    Index(name = "idx_inspection_date", columnList = "date_inspection")
])
class InspectionEngin(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engin_id", nullable = false)
    var engin: Engin,

    @Column(name = "date_inspection", nullable = false)
    var dateInspection: LocalDate,

    @Column(name = "inspecte_par", length = 200)
    var inspectePar: String? = null,

    @Column(name = "compteur_heures")
    var compteurHeures: Int? = null,

    /** JSON : [{"code","label","ok","commentaire"}] */
    @Column(name = "checklist_resultats", columnDefinition = "TEXT")
    var checklistResultats: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "etat_general", nullable = false, length = 20)
    var etatGeneral: EtatGeneralInspection = EtatGeneralInspection.BON,

    @Column(name = "anomalies_detectees", nullable = false)
    var anomaliesDetectees: Boolean = false,

    @Column(name = "commentaire", columnDefinition = "TEXT")
    var commentaire: String? = null,

    @Column(name = "signature", columnDefinition = "TEXT")
    var signature: String? = null,

    @Column(name = "incident_cree_id")
    var incidentCreeId: Long? = null,

    /** URLs Cloudinary des photos d'inspection (JSON array). */
    @Column(name = "photo_urls", columnDefinition = "TEXT")
    var photoUrls: String? = null,

    /** Idempotence offline : UUID fourni par le client, unique. */
    @Column(name = "client_request_id", unique = true, length = 36)
    var clientRequestId: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is InspectionEngin) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)
    override fun toString(): String = "InspectionEngin(id=$id, date=$dateInspection, etat=$etatGeneral)"
}
