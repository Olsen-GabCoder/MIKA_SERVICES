package com.mikaservices.platform.modules.qualite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.qualite.enums.ChoixTraitement
import com.mikaservices.platform.modules.qualite.enums.NumeroSection
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "qualite_sections_evenement",
    indexes = [
        Index(name = "idx_qse_evenement", columnList = "evenement_id"),
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_qse_evt_section", columnNames = ["evenement_id", "numero_section"])
    ]
)
class SectionEvenement(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evenement_id", nullable = false)
    var evenement: EvenementQualite,

    @Enumerated(EnumType.STRING)
    @Column(name = "numero_section", nullable = false, length = 15)
    var numeroSection: NumeroSection,

    @Column(name = "contenu", columnDefinition = "TEXT")
    var contenu: String? = null,

    // Signataire désigné (assigné à la création)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signataire_designe_id")
    var signataireDesigne: User? = null,

    // Signataire effectif (rempli à la signature)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signataire_effectif_id")
    var signataireEffectif: User? = null,

    @Column(name = "date_signature")
    var dateSignature: LocalDateTime? = null,

    @Column(name = "signee", nullable = false)
    var signee: Boolean = false,

    // Champs spécifiques section 2
    @Enumerated(EnumType.STRING)
    @Column(name = "choix_traitement", length = 15)
    var choixTraitement: ChoixTraitement? = null,

    // Champs spécifiques section 6
    @Column(name = "necessite_capa")
    var necessiteCapa: Boolean? = null,

    // Sous-entités
    @OneToMany(mappedBy = "section", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var signatairesCollegiaux: MutableList<SectionSignataireCollegial> = mutableListOf(),

    @OneToMany(mappedBy = "section", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var actionsTraitement: MutableList<ActionTraitement> = mutableListOf(),

    @OneToMany(mappedBy = "section", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var piecesJointes: MutableList<PieceJointeEvenement> = mutableListOf(),

) : BaseEntity() {

    /** Section 6 signée = toutes les 4 signatures collégiales sont présentes. */
    fun estCollegalementSignee(): Boolean =
        numeroSection == NumeroSection.SECTION_6 &&
        signatairesCollegiaux.size == 4 &&
        signatairesCollegiaux.all { it.signee }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is SectionEvenement) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
}
