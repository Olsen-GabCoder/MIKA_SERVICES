package com.mikaservices.platform.modules.projet.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutSousProjet
import com.mikaservices.platform.common.enums.TypeTravaux
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "sous_projets", indexes = [
    Index(name = "idx_sous_projet_code", columnList = "code", unique = true),
    Index(name = "idx_sous_projet_projet", columnList = "projet_id")
])
class SousProjet(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,

    @Column(name = "nom", nullable = false, length = 300)
    var nom: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_travaux", nullable = false, length = 30)
    var typeTravaux: TypeTravaux,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 30)
    var statut: StatutSousProjet = StatutSousProjet.PLANIFIE,

    @Column(name = "montant_ht", precision = 20, scale = 2)
    var montantHT: BigDecimal? = null,

    @Column(name = "montant_ttc", precision = 20, scale = 2)
    var montantTTC: BigDecimal? = null,

    @Column(name = "delai_mois")
    var delaiMois: Int? = null,

    @Column(name = "date_debut")
    var dateDebut: LocalDate? = null,

    @Column(name = "date_fin")
    var dateFin: LocalDate? = null,

    @Column(name = "avancement_physique", precision = 5, scale = 2)
    var avancementPhysique: BigDecimal = BigDecimal.ZERO,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    var responsable: User? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is SousProjet) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()

    override fun toString(): String = "SousProjet(id=$id, code='$code', nom='$nom')"
}
