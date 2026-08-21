package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "consommations_carburant", indexes = [
    Index(name = "idx_conso_engin", columnList = "engin_id"),
    Index(name = "idx_conso_date", columnList = "date_plein")
])
class ConsommationCarburant(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engin_id", nullable = false)
    var engin: Engin,

    @Column(name = "date_plein", nullable = false)
    var datePlein: LocalDate,

    @Column(name = "quantite_litres", nullable = false, precision = 10, scale = 2)
    var quantiteLitres: BigDecimal,

    @Column(name = "cout_total", precision = 15, scale = 2)
    var coutTotal: BigDecimal? = null,

    @Column(name = "heures_compteur_au_plein")
    var heuresCompteurAuPlein: Int? = null,

    @Column(name = "plein_par", length = 200)
    var pleinPar: String? = null,

    @Column(name = "commentaire", columnDefinition = "TEXT")
    var commentaire: String? = null,

    /** URL Cloudinary de la photo du ticket/compteur. */
    @Column(name = "photo_url", length = 512)
    var photoUrl: String? = null,

    /** Idempotence offline : UUID fourni par le client, unique. */
    @Column(name = "client_request_id", unique = true, length = 36)
    var clientRequestId: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ConsommationCarburant) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)
}
