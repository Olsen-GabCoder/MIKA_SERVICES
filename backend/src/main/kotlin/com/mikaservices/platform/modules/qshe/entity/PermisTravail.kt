package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.qshe.enums.StatutPermis
import com.mikaservices.platform.modules.qshe.enums.TypePermis
import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@Entity
@Table(name = "qshe_permis_travail", indexes = [
    Index(name = "idx_qpt_projet", columnList = "projet_id"),
    Index(name = "idx_qpt_type", columnList = "type_permis"),
    Index(name = "idx_qpt_statut", columnList = "statut"),
    Index(name = "idx_qpt_fin_validite", columnList = "date_fin_validite")
])
class PermisTravail(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "reference", nullable = false, unique = true, length = 50)
    var reference: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_permis", nullable = false, length = 20)
    var typePermis: TypePermis,

    @Column(name = "description_travaux", nullable = false, columnDefinition = "TEXT")
    var descriptionTravaux: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutPermis = StatutPermis.DEMANDE,

    @Column(name = "zone_travail", length = 200)
    var zoneTravail: String? = null,

    @Column(name = "date_debut_validite")
    var dateDebutValidite: LocalDate? = null,

    @Column(name = "heure_debut")
    var heureDebut: LocalTime? = null,

    @Column(name = "date_fin_validite")
    var dateFinValidite: LocalDate? = null,

    @Column(name = "heure_fin")
    var heureFin: LocalTime? = null,

    /** Mesures de securite / checklist verifiee avant emission */
    @Column(name = "mesures_securite", columnDefinition = "TEXT")
    var mesuresSecurite: String? = null,

    @Column(name = "conditions_particulieres", columnDefinition = "TEXT")
    var conditionsParticulieres: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demandeur_id")
    var demandeur: User? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autorisateur_id")
    var autorisateur: User? = null,

    @Column(name = "date_approbation")
    var dateApprobation: LocalDateTime? = null,

    @Column(name = "date_cloture")
    var dateCloture: LocalDateTime? = null,

    @Column(name = "observations_cloture", columnDefinition = "TEXT")
    var observationsCloture: String? = null

) : BaseEntity() {

    val estExpire: Boolean
        get() = dateFinValidite != null && LocalDate.now().isAfter(dateFinValidite)
                && statut in listOf(StatutPermis.ACTIF, StatutPermis.APPROUVE)

    val estActif: Boolean
        get() = statut == StatutPermis.ACTIF && !estExpire

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PermisTravail) return false
        return id != null && id == other.id
    }
    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
    override fun toString(): String = "PermisTravail(id=$id, reference='$reference', type=$typePermis)"
}
