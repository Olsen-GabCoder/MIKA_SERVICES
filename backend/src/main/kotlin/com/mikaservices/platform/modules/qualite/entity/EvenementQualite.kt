package com.mikaservices.platform.modules.qualite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.qualite.enums.*
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(
    name = "qualite_evenements",
    indexes = [
        Index(name = "idx_qev_projet", columnList = "projet_id"),
        Index(name = "idx_qev_type", columnList = "type_evenement"),
        Index(name = "idx_qev_statut", columnList = "statut"),
    ]
)
class EvenementQualite(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "reference", nullable = false, unique = true, length = 50)
    var reference: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_evenement", nullable = false, length = 10)
    var typeEvenement: TypeEvenement,

    @ElementCollection(targetClass = CategorieEvenement::class, fetch = FetchType.EAGER)
    @CollectionTable(name = "qualite_evenement_categories", joinColumns = [JoinColumn(name = "evenement_id")])
    @Enumerated(EnumType.STRING)
    @Column(name = "categorie", length = 20)
    var categories: MutableSet<CategorieEvenement> = mutableSetOf(),

    @Enumerated(EnumType.STRING)
    @Column(name = "origine", nullable = false, length = 30)
    var origine: OrigineEvenement,

    @Column(name = "ouvrage_concerne", length = 300)
    var ouvrageConcerne: String? = null,

    @Column(name = "controle_exige_cctp", nullable = false)
    var controleExigeCctp: Boolean = false,

    // Bloc sous-traitance
    @Column(name = "fournisseur_nom", length = 200)
    var fournisseurNom: String? = null,

    @Column(name = "numero_bc", length = 50)
    var numeroBc: String? = null,

    @Column(name = "numero_bl", length = 50)
    var numeroBl: String? = null,

    @Column(name = "date_livraison")
    var dateLivraison: LocalDate? = null,

    // Statut global calculé
    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutEvenement = StatutEvenement.BROUILLON,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createur_id")
    var createur: User? = null,

    @OneToMany(mappedBy = "evenement", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var sections: MutableList<SectionEvenement> = mutableListOf(),

) : BaseEntity() {

    /** Recalcule le statut global à partir des sections signées. */
    fun recalculerStatut() {
        val signed = sections.filter { it.signee }.map { it.numeroSection }.toSet()
        statut = when {
            NumeroSection.SECTION_7 in signed -> StatutEvenement.CLOTUREE
            NumeroSection.SECTION_6 in signed -> StatutEvenement.ANALYSEE
            NumeroSection.SECTION_5 in signed -> StatutEvenement.LEVEE
            NumeroSection.SECTION_4 in signed -> StatutEvenement.EN_VERIFICATION
            NumeroSection.SECTION_2 in signed -> StatutEvenement.EN_TRAITEMENT
            NumeroSection.SECTION_1 in signed -> StatutEvenement.DETECTEE
            else -> StatutEvenement.BROUILLON
        }
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is EvenementQualite) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
}
