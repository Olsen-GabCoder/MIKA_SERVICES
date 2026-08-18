package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.EtatEngin
import com.mikaservices.platform.common.enums.ModeAcquisition
import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.TypeCarburant
import com.mikaservices.platform.common.enums.TypeEngin
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(name = "engins", indexes = [
    Index(name = "idx_engin_code", columnList = "code", unique = true),
    Index(name = "idx_engin_statut", columnList = "statut"),
    Index(name = "idx_engin_type", columnList = "type")
])
class Engin(
    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,

    @Column(name = "nom", nullable = false, length = 200)
    var nom: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TypeEngin,

    @Column(name = "marque", length = 100)
    var marque: String? = null,

    @Column(name = "modele", length = 100)
    var modele: String? = null,

    @Column(name = "immatriculation", length = 50)
    var immatriculation: String? = null,

    @Column(name = "numero_serie", length = 100)
    var numeroSerie: String? = null,

    @Column(name = "annee_fabrication")
    var anneeFabrication: Int? = null,

    @Column(name = "date_acquisition")
    var dateAcquisition: LocalDate? = null,

    @Column(name = "date_mise_en_service")
    var dateMiseEnService: LocalDate? = null,

    @Column(name = "valeur_acquisition", precision = 20, scale = 2)
    var valeurAcquisition: BigDecimal? = null,

    @Column(name = "heures_compteur", nullable = false)
    var heuresCompteur: Int = 0,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutEngin = StatutEngin.DISPONIBLE,

    // --- Nouveaux champs Phase 1 ---

    @Enumerated(EnumType.STRING)
    @Column(name = "etat", length = 20)
    var etat: EtatEngin? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_acquisition", length = 30)
    var modeAcquisition: ModeAcquisition? = null,

    @Column(name = "proprietaire", length = 200)
    var proprietaire: String? = null,

    @Column(name = "est_location", nullable = false)
    var estLocation: Boolean = false,

    @Column(name = "cout_location_journalier", precision = 15, scale = 2)
    var coutLocationJournalier: BigDecimal? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "carburant", length = 20)
    var carburant: TypeCarburant? = null,

    @Column(name = "puissance", length = 50)
    var puissance: String? = null,

    @Column(name = "poids", length = 50)
    var poids: String? = null,

    @Column(name = "capacite", length = 50)
    var capacite: String? = null,

    /** Données techniques libres (JSON). */
    @Column(name = "caracteristiques", columnDefinition = "TEXT")
    var caracteristiques: String? = null,

    @Column(name = "photo", length = 500)
    var photo: String? = null,

    /** Token unique pour QR code (généré automatiquement). */
    @Column(name = "qr_code_token", length = 64, unique = true)
    var qrCodeToken: String? = null,

    @Column(name = "latitude")
    var latitude: Double? = null,

    @Column(name = "longitude")
    var longitude: Double? = null,

    @Column(name = "position_maj")
    var positionMaj: Instant? = null,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "actif", nullable = false)
    var actif: Boolean = true
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Engin) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()
    override fun toString(): String = "Engin(id=$id, code='$code', nom='$nom')"
}
