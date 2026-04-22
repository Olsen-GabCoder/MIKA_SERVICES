package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*
import java.time.LocalDate

/**
 * Produit chimique avec lien vers sa Fiche de Donnees de Securite (FDS).
 * Non lie a un projet — un produit est global a l'entreprise.
 */
@Entity
@Table(name = "qshe_produits_chimiques", indexes = [
    Index(name = "idx_qpc_code", columnList = "code", unique = true)
])
class ProduitChimique(
    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,

    @Column(name = "nom_commercial", nullable = false, length = 300)
    var nomCommercial: String,

    @Column(name = "nom_chimique", length = 300)
    var nomChimique: String? = null,

    @Column(name = "fournisseur", length = 200)
    var fournisseur: String? = null,

    /** Pictogrammes GHS separes par virgule (ex: GHS02,GHS07) */
    @Column(name = "pictogrammes_ghs", length = 200)
    var pictogrammesGhs: String? = null,

    @Column(name = "mentions_danger", columnDefinition = "TEXT")
    var mentionsDanger: String? = null,

    @Column(name = "epi_requis", length = 500)
    var epiRequis: String? = null,

    @Column(name = "conditions_stockage", columnDefinition = "TEXT")
    var conditionsStockage: String? = null,

    @Column(name = "premiers_secours", columnDefinition = "TEXT")
    var premiersSecours: String? = null,

    @Column(name = "mesures_incendie", columnDefinition = "TEXT")
    var mesuresIncendie: String? = null,

    /** URL vers le document FDS (PDF) */
    @Column(name = "fds_url", length = 1000)
    var fdsUrl: String? = null,

    @Column(name = "date_fds")
    var dateFds: LocalDate? = null,

    @Column(name = "localisation_stockage", length = 300)
    var localisationStockage: String? = null,

    @Column(name = "quantite_stock", length = 100)
    var quantiteStock: String? = null,

    @Column(name = "actif")
    var actif: Boolean = true

) : BaseEntity() {

    /** FDS obsolete si > 3 ans */
    val fdsObsolete: Boolean
        get() = dateFds != null && dateFds!!.plusYears(3).isBefore(LocalDate.now())

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ProduitChimique) return false
        return id != null && id == other.id
    }
    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()
}
