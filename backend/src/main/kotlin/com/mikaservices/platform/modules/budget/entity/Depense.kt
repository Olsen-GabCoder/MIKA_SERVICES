package com.mikaservices.platform.modules.budget.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutDepense
import com.mikaservices.platform.common.enums.TypeDepense
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "depenses", indexes = [
    Index(name = "idx_depense_projet", columnList = "projet_id"),
    Index(name = "idx_depense_date", columnList = "date_depense"),
    Index(name = "idx_depense_statut", columnList = "statut")
])
class Depense(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "reference", nullable = false, length = 50)
    var reference: String,

    @Column(name = "libelle", nullable = false, length = 300)
    var libelle: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TypeDepense,

    @Column(name = "montant", nullable = false, precision = 20, scale = 2)
    var montant: BigDecimal,

    @Column(name = "date_depense", nullable = false)
    var dateDepense: LocalDate,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutDepense = StatutDepense.BROUILLON,

    @Column(name = "fournisseur", length = 200)
    var fournisseur: String? = null,

    @Column(name = "numero_facture", length = 100)
    var numeroFacture: String? = null,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "valide_par_id")
    var validePar: User? = null,

    @Column(name = "date_validation")
    var dateValidation: LocalDate? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Depense) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
    override fun toString(): String = "Depense(id=$id, reference='$reference', montant=$montant)"
}
