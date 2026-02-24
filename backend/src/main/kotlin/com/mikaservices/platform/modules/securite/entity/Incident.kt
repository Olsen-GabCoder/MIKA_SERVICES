package com.mikaservices.platform.modules.securite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.GraviteIncident
import com.mikaservices.platform.common.enums.StatutIncident
import com.mikaservices.platform.common.enums.TypeIncident
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalTime

@Entity
@Table(name = "incidents", indexes = [
    Index(name = "idx_incident_projet", columnList = "projet_id"),
    Index(name = "idx_incident_statut", columnList = "statut"),
    Index(name = "idx_incident_gravite", columnList = "gravite")
])
class Incident(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "reference", nullable = false, unique = true, length = 50)
    var reference: String,

    @Column(name = "titre", nullable = false, length = 300)
    var titre: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_incident", nullable = false, length = 30)
    var typeIncident: TypeIncident,

    @Enumerated(EnumType.STRING)
    @Column(name = "gravite", nullable = false, length = 20)
    var gravite: GraviteIncident,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutIncident = StatutIncident.DECLARE,

    @Column(name = "date_incident", nullable = false)
    var dateIncident: LocalDate,

    @Column(name = "heure_incident")
    var heureIncident: LocalTime? = null,

    @Column(name = "lieu", length = 300)
    var lieu: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "declare_par_id")
    var declarePar: User? = null,

    @Column(name = "nb_blesses")
    var nbBlesses: Int = 0,

    @Column(name = "arret_travail")
    var arretTravail: Boolean = false,

    @Column(name = "nb_jours_arret")
    var nbJoursArret: Int = 0,

    @Column(name = "cause_identifiee", columnDefinition = "TEXT")
    var causeIdentifiee: String? = null,

    @Column(name = "mesures_immediates", columnDefinition = "TEXT")
    var mesuresImmediates: String? = null,

    @Column(name = "analyse_cause", columnDefinition = "TEXT")
    var analyseCause: String? = null,

    @OneToMany(mappedBy = "incident", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var actionsPrevention: MutableList<ActionPrevention> = mutableListOf()
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Incident) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
    override fun toString(): String = "Incident(id=$id, reference='$reference', gravite=$gravite)"
}
