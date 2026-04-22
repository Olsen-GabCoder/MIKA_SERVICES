package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.qshe.enums.PrioriteAction
import com.mikaservices.platform.modules.qshe.enums.SourceAction
import com.mikaservices.platform.modules.qshe.enums.StatutAction
import com.mikaservices.platform.modules.qshe.enums.TypeAction
import jakarta.persistence.*
import java.time.LocalDate

/**
 * Action corrective / preventive transversale (CAPA).
 * Peut etre generee depuis un incident, une inspection, une NC, un risque ou un audit
 * via le lien polymorphe sourceType + sourceId.
 */
@Entity
@Table(name = "qshe_actions_correctives", indexes = [
    Index(name = "idx_qac_projet", columnList = "projet_id"),
    Index(name = "idx_qac_statut", columnList = "statut"),
    Index(name = "idx_qac_priorite", columnList = "priorite"),
    Index(name = "idx_qac_source", columnList = "source_type, source_id"),
    Index(name = "idx_qac_responsable", columnList = "responsable_id"),
    Index(name = "idx_qac_echeance", columnList = "date_echeance")
])
class ActionCorrective(
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
    @Column(name = "type_action", nullable = false, length = 30)
    var typeAction: TypeAction,

    @Enumerated(EnumType.STRING)
    @Column(name = "priorite", nullable = false, length = 20)
    var priorite: PrioriteAction = PrioriteAction.NORMALE,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutAction = StatutAction.PLANIFIEE,

    // --- Source polymorphe ---

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 20)
    var sourceType: SourceAction,

    @Column(name = "source_id", nullable = false)
    var sourceId: Long,

    /** Reference lisible de la source (ex: INC-00001, NC-00001) pour affichage sans jointure */
    @Column(name = "source_reference", length = 100)
    var sourceReference: String? = null,

    // --- Responsabilite ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    var responsable: User? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verificateur_id")
    var verificateur: User? = null,

    // --- Echeances ---

    @Column(name = "date_echeance")
    var dateEcheance: LocalDate? = null,

    @Column(name = "date_realisation")
    var dateRealisation: LocalDate? = null,

    @Column(name = "date_verification")
    var dateVerification: LocalDate? = null,

    @Column(name = "date_cloture")
    var dateCloture: LocalDate? = null,

    // --- Contenu ---

    @Column(name = "description_action", columnDefinition = "TEXT")
    var descriptionAction: String? = null,

    @Column(name = "resultat_verification", columnDefinition = "TEXT")
    var resultatVerification: String? = null,

    /** null = pas encore verifiee, true = efficace, false = inefficace (necessite nouvelle action) */
    @Column(name = "efficace")
    var efficace: Boolean? = null,

    @Column(name = "commentaire", columnDefinition = "TEXT")
    var commentaire: String? = null

) : BaseEntity() {

    /** Action en retard : echeance depassee et pas encore realisee/verifiee/cloturee/annulee */
    val enRetard: Boolean
        get() = dateEcheance != null
                && LocalDate.now().isAfter(dateEcheance)
                && statut in listOf(StatutAction.PLANIFIEE, StatutAction.EN_COURS)

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ActionCorrective) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
    override fun toString(): String = "ActionCorrective(id=$id, reference='$reference', type=$typeAction, statut=$statut)"
}
