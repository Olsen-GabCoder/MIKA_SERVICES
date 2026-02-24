package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.TypeEngin
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "engins", indexes = [
    Index(name = "idx_engin_code", columnList = "code", unique = true),
    Index(name = "idx_engin_statut", columnList = "statut")
])
class Engin(
    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,

    @Column(name = "nom", nullable = false, length = 200)
    var nom: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TypeEngin,

    @Column(name = "marque", length = 100)
    var marque: String? = null,

    @Column(name = "modele", length = 100)
    var modele: String? = null,

    @Column(name = "immatriculation", length = 50)
    var immatriculation: String? = null,

    @Column(name = "numero_serie", length = 100)
    var numeroSerie: String? = null,

    @Column(name = "annee_fabrication")
    var anneeFabrication: Int? = null,

    @Column(name = "date_acquisition")
    var dateAcquisition: LocalDate? = null,

    @Column(name = "valeur_acquisition", precision = 20, scale = 2)
    var valeurAcquisition: BigDecimal? = null,

    @Column(name = "heures_compteur")
    var heuresCompteur: Int = 0,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutEngin = StatutEngin.DISPONIBLE,

    @Column(name = "proprietaire", length = 200)
    var proprietaire: String? = null,

    @Column(name = "est_location", nullable = false)
    var estLocation: Boolean = false,

    @Column(name = "cout_location_journalier", precision = 15, scale = 2)
    var coutLocationJournalier: BigDecimal? = null,

    @Column(name = "actif", nullable = false)
    var actif: Boolean = true
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Engin) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()
    override fun toString(): String = "Engin(id=$id, code='$code', nom='$nom')"
}
