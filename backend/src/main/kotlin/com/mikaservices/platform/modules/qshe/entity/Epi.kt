package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.qshe.enums.EtatEpi
import com.mikaservices.platform.modules.qshe.enums.TypeEpi
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Entity
@Table(name = "qshe_epi", indexes = [
    Index(name = "idx_qepi_type", columnList = "type_epi"),
    Index(name = "idx_qepi_user", columnList = "affecte_a_id"),
    Index(name = "idx_qepi_expiration", columnList = "date_expiration"),
    Index(name = "idx_qepi_etat", columnList = "etat")
])
class Epi(
    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_epi", nullable = false, length = 30)
    var typeEpi: TypeEpi,

    @Column(name = "designation", nullable = false, length = 300)
    var designation: String,

    @Column(name = "marque", length = 100)
    var marque: String? = null,

    @Column(name = "modele", length = 100)
    var modele: String? = null,

    @Column(name = "taille", length = 20)
    var taille: String? = null,

    @Column(name = "norme_reference", length = 100)
    var normeReference: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "etat", nullable = false, length = 20)
    var etat: EtatEpi = EtatEpi.NEUF,

    @Column(name = "date_achat")
    var dateAchat: LocalDate? = null,

    @Column(name = "date_premiere_utilisation")
    var datePremiereUtilisation: LocalDate? = null,

    @Column(name = "date_expiration")
    var dateExpiration: LocalDate? = null,

    @Column(name = "date_prochaine_inspection")
    var dateProchaineInspection: LocalDate? = null,

    @Column(name = "prix_unitaire", precision = 10, scale = 2)
    var prixUnitaire: BigDecimal? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affecte_a_id")
    var affecteA: User? = null,

    @Column(name = "date_affectation")
    var dateAffectation: LocalDate? = null,

    @Column(name = "quantite_stock")
    var quantiteStock: Int = 0,

    @Column(name = "stock_minimum")
    var stockMinimum: Int = 0,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null

) : BaseEntity() {

    val expire: Boolean
        get() = dateExpiration != null && LocalDate.now().isAfter(dateExpiration)

    val joursAvantExpiration: Long?
        get() = dateExpiration?.let { ChronoUnit.DAYS.between(LocalDate.now(), it) }

    val stockBas: Boolean
        get() = quantiteStock <= stockMinimum

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Epi) return false
        return id != null && id == other.id
    }
    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()
    override fun toString(): String = "Epi(id=$id, code='$code', type=$typeEpi)"
}
