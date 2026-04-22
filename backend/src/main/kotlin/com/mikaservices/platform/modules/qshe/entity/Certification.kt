package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.qshe.enums.StatutCertification
import com.mikaservices.platform.modules.qshe.enums.TypeCertification
import jakarta.persistence.*
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/**
 * Certification / habilitation d'un travailleur.
 * Le statut est calcule dynamiquement depuis la date d'expiration.
 */
@Entity
@Table(name = "qshe_certifications", indexes = [
    Index(name = "idx_qcert_user", columnList = "user_id"),
    Index(name = "idx_qcert_type", columnList = "type_certification"),
    Index(name = "idx_qcert_expiration", columnList = "date_expiration")
])
class Certification(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_certification", nullable = false, length = 30)
    var typeCertification: TypeCertification,

    @Column(name = "libelle", nullable = false, length = 300)
    var libelle: String,

    @Column(name = "categorie_niveau", length = 100)
    var categorieNiveau: String? = null,

    @Column(name = "organisme_formation", length = 300)
    var organismeFormation: String? = null,

    @Column(name = "numero_certificat", length = 100)
    var numeroCertificat: String? = null,

    @Column(name = "date_obtention")
    var dateObtention: LocalDate? = null,

    @Column(name = "date_expiration")
    var dateExpiration: LocalDate? = null,

    /** Duree de validite en mois (pour calculer la prochaine echeance) */
    @Column(name = "duree_validite_mois")
    var dureeValiditeMois: Int? = null,

    @Column(name = "document_url", length = 1000)
    var documentUrl: String? = null,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null

) : BaseEntity() {

    /** Statut calcule dynamiquement */
    val statutCalcule: StatutCertification
        get() {
            if (dateExpiration == null) return StatutCertification.VALIDE
            val today = LocalDate.now()
            if (today.isAfter(dateExpiration)) return StatutCertification.EXPIREE
            val joursRestants = ChronoUnit.DAYS.between(today, dateExpiration)
            if (joursRestants <= 60) return StatutCertification.EXPIRE_BIENTOT
            return StatutCertification.VALIDE
        }

    val joursAvantExpiration: Long?
        get() = dateExpiration?.let { ChronoUnit.DAYS.between(LocalDate.now(), it) }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Certification) return false
        return id != null && id == other.id
    }
    override fun hashCode(): Int = id?.hashCode() ?: libelle.hashCode()
    override fun toString(): String = "Certification(id=$id, type=$typeCertification, user=${user.id})"
}
