package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.TypeOperationMaintenance
import jakarta.persistence.*
import java.time.LocalDate

/**
 * Modèle de maintenance récurrente.
 * Permet de planifier automatiquement des opérations à intervalles réguliers
 * (par jours, heures compteur ou kilomètres).
 */
@Entity
@Table(name = "plans_maintenance", indexes = [
    Index(name = "idx_plan_maint_engin", columnList = "engin_id"),
    Index(name = "idx_plan_maint_actif", columnList = "actif")
])
class PlanMaintenance(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engin_id", nullable = false)
    var engin: Engin,

    @Column(name = "titre", nullable = false, length = 300)
    var titre: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_operation", nullable = false, length = 30)
    var typeOperation: TypeOperationMaintenance,

    /** Récurrence en jours (ex: vidange tous les 90 jours). */
    @Column(name = "intervalle_jours")
    var intervalleJours: Int? = null,

    /** Récurrence en heures compteur (ex: vidange toutes les 250h). */
    @Column(name = "intervalle_heures")
    var intervalleHeures: Int? = null,

    /** Récurrence en kilomètres (ex: révision tous les 10000 km). */
    @Column(name = "intervalle_km")
    var intervalleKm: Int? = null,

    /** Nombre de jours/heures/km avant échéance pour déclencher l'alerte. */
    @Column(name = "seuil_alerte", nullable = false)
    var seuilAlerte: Int = 30,

    @Column(name = "actif", nullable = false)
    var actif: Boolean = true,

    @Column(name = "derniere_execution")
    var derniereExecution: LocalDate? = null,

    @Column(name = "dernier_compteur")
    var dernierCompteur: Int? = null,

    /** Prochaine échéance calculée (date). */
    @Column(name = "prochaine_echeance")
    var prochaineEcheance: LocalDate? = null,

    /** Prochain compteur calculé (heures ou km). */
    @Column(name = "prochain_compteur")
    var prochainCompteur: Int? = null
) : BaseEntity() {

    /** Recalcule les prochaines échéances après une exécution. */
    fun recalculerEcheances() {
        intervalleJours?.let { jours ->
            val base = derniereExecution ?: LocalDate.now()
            prochaineEcheance = base.plusDays(jours.toLong())
        }
        intervalleHeures?.let { heures ->
            val base = dernierCompteur ?: 0
            prochainCompteur = base + heures
        }
        intervalleKm?.let { km ->
            val base = dernierCompteur ?: 0
            prochainCompteur = base + km
        }
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PlanMaintenance) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)
    override fun toString(): String = "PlanMaintenance(id=$id, titre='$titre')"
}
