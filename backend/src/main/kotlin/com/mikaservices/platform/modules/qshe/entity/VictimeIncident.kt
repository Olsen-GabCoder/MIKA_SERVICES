package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.qshe.enums.LocalisationCorporelle
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "qshe_victimes_incident", indexes = [
    Index(name = "idx_qvic_incident", columnList = "incident_id")
])
class VictimeIncident(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    var incident: Incident,

    /** Lien optionnel vers un utilisateur MIKA (peut etre un travailleur externe non enregistre) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    var user: User? = null,

    @Column(name = "nom", nullable = false, length = 100)
    var nom: String,

    @Column(name = "prenom", nullable = false, length = 100)
    var prenom: String,

    @Column(name = "poste", length = 200)
    var poste: String? = null,

    /** Nom de l'entreprise — critique pour chantiers multi-entreprises (titulaire vs sous-traitant) */
    @Column(name = "entreprise", length = 200)
    var entreprise: String? = null,

    @Column(name = "anciennete", length = 100)
    var anciennete: String? = null,

    @Column(name = "type_contrat", length = 50)
    var typeContrat: String? = null,

    @Column(name = "nature_lesion", length = 500)
    var natureLesion: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "localisation_corporelle", length = 30)
    var localisationCorporelle: LocalisationCorporelle? = null,

    @Column(name = "description_blessure", columnDefinition = "TEXT")
    var descriptionBlessure: String? = null,

    @Column(name = "arret_travail")
    var arretTravail: Boolean = false,

    @Column(name = "nb_jours_arret")
    var nbJoursArret: Int = 0,

    @Column(name = "hospitalisation")
    var hospitalisation: Boolean = false,

    @Column(name = "declaration_cnss")
    var declarationCnss: Boolean = false,

    @Column(name = "date_declaration_cnss")
    var dateDeclarationCnss: LocalDate? = null

) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is VictimeIncident) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: "$nom$prenom".hashCode()
    override fun toString(): String = "VictimeIncident(id=$id, nom='$nom', prenom='$prenom')"
}
