package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.qshe.enums.GraviteIncident
import com.mikaservices.platform.modules.qshe.enums.StatutIncident
import com.mikaservices.platform.modules.qshe.enums.TypeIncident
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.entity.SousProjet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalTime

@Entity
@Table(name = "qshe_incidents", indexes = [
    Index(name = "idx_qinc_projet", columnList = "projet_id"),
    Index(name = "idx_qinc_statut", columnList = "statut"),
    Index(name = "idx_qinc_gravite", columnList = "gravite"),
    Index(name = "idx_qinc_type", columnList = "type_incident"),
    Index(name = "idx_qinc_date", columnList = "date_incident"),
    Index(name = "idx_qinc_echeance_cnss", columnList = "date_echeance_cnss")
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
    @Column(name = "statut", nullable = false, length = 30)
    var statut: StatutIncident = StatutIncident.BROUILLON,

    // --- Temporel et spatial ---

    @Column(name = "date_incident", nullable = false)
    var dateIncident: LocalDate,

    @Column(name = "heure_incident")
    var heureIncident: LocalTime? = null,

    @Column(name = "lieu", length = 300)
    var lieu: String? = null,

    @Column(name = "zone_chantier", length = 200)
    var zoneChantier: String? = null,

    @Column(name = "latitude")
    var latitude: Double? = null,

    @Column(name = "longitude")
    var longitude: Double? = null,

    // --- Circonstances ---

    @Column(name = "description_circonstances", columnDefinition = "TEXT")
    var descriptionCirconstances: String? = null,

    @Column(name = "activite_en_cours", length = 500)
    var activiteEnCours: String? = null,

    @Column(name = "equipement_implique", length = 500)
    var equipementImplique: String? = null,

    @Column(name = "epi_portes", length = 500)
    var epiPortes: String? = null,

    // --- Causes ---

    @Column(name = "cause_immediate", columnDefinition = "TEXT")
    var causeImmediate: String? = null,

    @Column(name = "cause_racine", columnDefinition = "TEXT")
    var causeRacine: String? = null,

    // --- Mesures conservatoires ---

    @Column(name = "mesures_conservatoires", columnDefinition = "TEXT")
    var mesuresConservatoires: String? = null,

    // --- Rattachement ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sous_projet_id")
    var sousProjet: SousProjet? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "declare_par_id")
    var declarePar: User? = null,

    // --- Echeances reglementaires CNSS / Inspection du Travail ---

    /**
     * Délai encodé à 48h en jours calendaires. À confirmer contre le texte
     * en vigueur de la Loi n° 3/94 (Code du Travail gabonais). Ne pas utiliser
     * comme source légale tant que la vérification juridique n'a pas été effectuée.
     */
    @Column(name = "date_echeance_cnss")
    var dateEcheanceCnss: LocalDate? = null,

    @Column(name = "declaration_cnss_effectuee")
    var declarationCnssEffectuee: Boolean = false,

    @Column(name = "date_declaration_cnss")
    var dateDeclarationCnss: LocalDate? = null,

    /**
     * Délai encodé à 48h en jours calendaires. À confirmer contre le texte
     * en vigueur de la Loi n° 3/94 (Code du Travail gabonais). Ne pas utiliser
     * comme source légale tant que la vérification juridique n'a pas été effectuée.
     */
    @Column(name = "date_echeance_inspection_travail")
    var dateEcheanceInspectionTravail: LocalDate? = null,

    @Column(name = "declaration_inspection_effectuee")
    var declarationInspectionEffectuee: Boolean = false,

    @Column(name = "date_declaration_inspection")
    var dateDeclarationInspection: LocalDate? = null,

    // --- Relations ---

    @OneToMany(mappedBy = "incident", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var victimes: MutableList<VictimeIncident> = mutableListOf(),

    @OneToMany(mappedBy = "incident", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var temoins: MutableList<TemoinIncident> = mutableListOf(),

    @OneToMany(mappedBy = "incident", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var piecesJointes: MutableList<PieceJointeIncident> = mutableListOf()

) : BaseEntity() {

    /** Calcule si la declaration CNSS est en retard (depassement du delai 48h calendaires) */
    val declarationCnssEnRetard: Boolean
        get() = !declarationCnssEffectuee
                && dateEcheanceCnss != null
                && LocalDate.now().isAfter(dateEcheanceCnss)

    val declarationInspectionEnRetard: Boolean
        get() = !declarationInspectionEffectuee
                && dateEcheanceInspectionTravail != null
                && LocalDate.now().isAfter(dateEcheanceInspectionTravail)

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Incident) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
    override fun toString(): String = "Incident(id=$id, reference='$reference', type=$typeIncident, gravite=$gravite)"
}
