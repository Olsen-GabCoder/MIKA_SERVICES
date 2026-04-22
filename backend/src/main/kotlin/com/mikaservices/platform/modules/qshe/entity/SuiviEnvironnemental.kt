package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.qshe.enums.TypeMesureEnvironnementale
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "qshe_suivi_environnemental", indexes = [
    Index(name = "idx_qse_projet", columnList = "projet_id"),
    Index(name = "idx_qse_type", columnList = "type_mesure"),
    Index(name = "idx_qse_date", columnList = "date_mesure")
])
class SuiviEnvironnemental(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_mesure", nullable = false, length = 30)
    var typeMesure: TypeMesureEnvironnementale,

    @Column(name = "parametre", nullable = false, length = 200)
    var parametre: String,

    @Column(name = "valeur", precision = 15, scale = 4)
    var valeur: BigDecimal? = null,

    @Column(name = "unite", length = 50)
    var unite: String? = null,

    @Column(name = "limite_reglementaire", precision = 15, scale = 4)
    var limiteReglementaire: BigDecimal? = null,

    @Column(name = "date_mesure", nullable = false)
    var dateMesure: LocalDate,

    @Column(name = "localisation", length = 200)
    var localisation: String? = null,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null,

    @Column(name = "conforme")
    var conforme: Boolean? = null

) : BaseEntity() {

    val depassement: Boolean
        get() = valeur != null && limiteReglementaire != null && valeur!! > limiteReglementaire!!

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is SuiviEnvironnemental) return false
        return id != null && id == other.id
    }
    override fun hashCode(): Int = id?.hashCode() ?: parametre.hashCode()
}
