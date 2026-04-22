package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.entity.SousProjet
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.qshe.enums.StatutInspection
import com.mikaservices.platform.modules.qshe.enums.TypeInspection
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "qshe_inspections", indexes = [
    Index(name = "idx_qins_projet", columnList = "projet_id"),
    Index(name = "idx_qins_statut", columnList = "statut"),
    Index(name = "idx_qins_type", columnList = "type_inspection"),
    Index(name = "idx_qins_date", columnList = "date_planifiee")
])
class Inspection(
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
    @Column(name = "type_inspection", nullable = false, length = 30)
    var typeInspection: TypeInspection,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutInspection = StatutInspection.PLANIFIEE,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspecteur_id")
    var inspecteur: User? = null,

    @Column(name = "date_planifiee")
    var datePlanifiee: LocalDate? = null,

    @Column(name = "date_realisation")
    var dateRealisation: LocalDate? = null,

    @Column(name = "zone_inspecte", length = 200)
    var zoneInspecte: String? = null,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null,

    /** Score global calcule automatiquement a partir des items (0-100) */
    @Column(name = "score_global")
    var scoreGlobal: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sous_projet_id")
    var sousProjet: SousProjet? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checklist_template_id")
    var checklistTemplate: ChecklistTemplate? = null,

    @OneToMany(mappedBy = "inspection", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordre ASC")
    var items: MutableList<InspectionItem> = mutableListOf()

) : BaseEntity() {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Inspection) return false
        return id != null && id == other.id
    }
    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
    override fun toString(): String = "Inspection(id=$id, reference='$reference', type=$typeInspection)"
}
