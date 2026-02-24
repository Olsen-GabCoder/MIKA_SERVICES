package com.mikaservices.platform.modules.qualite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.GraviteNonConformite
import com.mikaservices.platform.common.enums.StatutNonConformite
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "non_conformites", indexes = [
    Index(name = "idx_nc_controle", columnList = "controle_qualite_id"),
    Index(name = "idx_nc_statut", columnList = "statut"),
    Index(name = "idx_nc_gravite", columnList = "gravite")
])
class NonConformite(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "controle_qualite_id", nullable = false)
    var controleQualite: ControleQualite,

    @Column(name = "reference", nullable = false, unique = true, length = 50)
    var reference: String,

    @Column(name = "titre", nullable = false, length = 300)
    var titre: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "gravite", nullable = false, length = 20)
    var gravite: GraviteNonConformite,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutNonConformite = StatutNonConformite.OUVERTE,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_traitement_id")
    var responsableTraitement: User? = null,

    @Column(name = "cause_identifiee", columnDefinition = "TEXT")
    var causeIdentifiee: String? = null,

    @Column(name = "action_corrective", columnDefinition = "TEXT")
    var actionCorrective: String? = null,

    @Column(name = "date_detection")
    var dateDetection: LocalDate? = null,

    @Column(name = "date_echeance_correction")
    var dateEcheanceCorrection: LocalDate? = null,

    @Column(name = "date_cloture")
    var dateCloture: LocalDate? = null,

    @Column(name = "preuve_correction", columnDefinition = "TEXT")
    var preuveCorrection: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is NonConformite) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
    override fun toString(): String = "NonConformite(id=$id, reference='$reference', gravite=$gravite, statut=$statut)"
}
