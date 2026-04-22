package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.NiveauRisque
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.entity.SousProjet
import com.mikaservices.platform.modules.qshe.enums.CategorieRisque
import jakarta.persistence.*

/**
 * Evaluation de risque conforme DUERP / ISO 45001 clause 6.1.2 / methodologie INRS.
 * Matrice probabilite (1-5) x gravite (1-5) = niveau brut, puis residuel apres mesures.
 */
@Entity
@Table(name = "qshe_risques", indexes = [
    Index(name = "idx_qrsk_projet", columnList = "projet_id"),
    Index(name = "idx_qrsk_niveau_brut", columnList = "niveau_brut"),
    Index(name = "idx_qrsk_niveau_residuel", columnList = "niveau_residuel"),
    Index(name = "idx_qrsk_categorie", columnList = "categorie")
])
class Risque(
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
    @Column(name = "categorie", length = 30)
    var categorie: CategorieRisque? = null,

    /** Unite de travail : metier, phase, activite */
    @Column(name = "unite_travail", length = 300)
    var uniteTravail: String? = null,

    @Column(name = "danger_identifie", columnDefinition = "TEXT")
    var dangerIdentifie: String? = null,

    // --- Evaluation brute (avant mesures) ---

    /** Probabilite d'occurrence (1 = rare, 5 = quasi-certain) */
    @Column(name = "probabilite_brute", nullable = false)
    var probabiliteBrute: Int = 3,

    /** Gravite des consequences (1 = negligeable, 5 = catastrophique) */
    @Column(name = "gravite_brute", nullable = false)
    var graviteBrute: Int = 3,

    /** Niveau brut calcule automatiquement depuis probabilite x gravite */
    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_brut", nullable = false, length = 20)
    var niveauBrut: NiveauRisque = NiveauRisque.MOYEN,

    // --- Mesures de maitrise (hierarchie des controles) ---

    @Column(name = "mesures_elimination", columnDefinition = "TEXT")
    var mesuresElimination: String? = null,

    @Column(name = "mesures_substitution", columnDefinition = "TEXT")
    var mesuresSubstitution: String? = null,

    @Column(name = "mesures_ingenierie", columnDefinition = "TEXT")
    var mesuresIngenierie: String? = null,

    @Column(name = "mesures_administratives", columnDefinition = "TEXT")
    var mesuresAdministratives: String? = null,

    @Column(name = "mesures_epi", columnDefinition = "TEXT")
    var mesuresEpi: String? = null,

    // --- Evaluation residuelle (apres mesures) ---

    @Column(name = "probabilite_residuelle")
    var probabiliteResiduelle: Int? = null,

    @Column(name = "gravite_residuelle")
    var graviteResiduelle: Int? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_residuel", length = 20)
    var niveauResiduel: NiveauRisque? = null,

    // --- Rattachement ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sous_projet_id")
    var sousProjet: SousProjet? = null,

    @Column(name = "zone_concernee", length = 200)
    var zoneConcernee: String? = null,

    @Column(name = "actif")
    var actif: Boolean = true

) : BaseEntity() {

    /** Calcule le niveau depuis la matrice probabilite x gravite */
    fun calculerNiveauBrut() {
        val score = probabiliteBrute * graviteBrute
        niveauBrut = scoreToNiveau(score)
    }

    fun calculerNiveauResiduel() {
        val p = probabiliteResiduelle ?: return
        val g = graviteResiduelle ?: return
        niveauResiduel = scoreToNiveau(p * g)
    }

    private fun scoreToNiveau(score: Int): NiveauRisque = when {
        score <= 4 -> NiveauRisque.FAIBLE
        score <= 9 -> NiveauRisque.MOYEN
        score <= 15 -> NiveauRisque.ELEVE
        else -> NiveauRisque.CRITIQUE
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Risque) return false
        return id != null && id == other.id
    }
    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
    override fun toString(): String = "Risque(id=$id, reference='$reference', niveauBrut=$niveauBrut)"
}
