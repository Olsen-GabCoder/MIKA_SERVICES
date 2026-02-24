package com.mikaservices.platform.modules.qualite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutControleQualite
import com.mikaservices.platform.common.enums.TypeControle
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "controles_qualite", indexes = [
    Index(name = "idx_cq_projet", columnList = "projet_id"),
    Index(name = "idx_cq_statut", columnList = "statut"),
    Index(name = "idx_cq_type", columnList = "type_controle")
])
class ControleQualite(
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
    @Column(name = "type_controle", nullable = false, length = 30)
    var typeControle: TypeControle,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutControleQualite = StatutControleQualite.PLANIFIE,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspecteur_id")
    var inspecteur: User? = null,

    @Column(name = "date_planifiee")
    var datePlanifiee: LocalDate? = null,

    @Column(name = "date_realisation")
    var dateRealisation: LocalDate? = null,

    @Column(name = "zone_controlee", length = 200)
    var zoneControlee: String? = null,

    @Column(name = "criteres_verification", columnDefinition = "TEXT")
    var criteresVerification: String? = null,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null,

    @Column(name = "note_globale")
    var noteGlobale: Int? = null,

    @OneToMany(mappedBy = "controleQualite", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var nonConformites: MutableList<NonConformite> = mutableListOf()
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ControleQualite) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
    override fun toString(): String = "ControleQualite(id=$id, reference='$reference', statut=$statut)"
}
