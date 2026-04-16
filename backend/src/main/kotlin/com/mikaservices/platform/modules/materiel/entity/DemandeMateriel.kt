package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.PrioriteDemandeMateriel
import com.mikaservices.platform.common.enums.StatutDemandeMateriel
import com.mikaservices.platform.modules.fournisseur.entity.Commande
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import org.hibernate.annotations.BatchSize
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(
    name = "demandes_materiel",
    indexes = [
        Index(name = "idx_dma_projet", columnList = "projet_id"),
        Index(name = "idx_dma_statut", columnList = "statut"),
        Index(name = "idx_dma_createur", columnList = "createur_user_id"),
    ]
)
class DemandeMateriel(
    @Column(name = "reference", nullable = false, unique = true, length = 40)
    var reference: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createur_user_id", nullable = false)
    var createur: User,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 40)
    var statut: StatutDemandeMateriel = StatutDemandeMateriel.SOUMISE,

    @Enumerated(EnumType.STRING)
    @Column(name = "priorite", nullable = false, length = 20)
    var priorite: PrioriteDemandeMateriel = PrioriteDemandeMateriel.NORMALE,

    @Column(name = "date_souhaitee")
    var dateSouhaitee: LocalDate? = null,

    @Column(name = "commentaire", columnDefinition = "TEXT")
    var commentaire: String? = null,

    @Column(name = "montant_estime", precision = 20, scale = 2)
    var montantEstime: BigDecimal? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id")
    var commande: Commande? = null,

    @OneToMany(mappedBy = "demande", cascade = [CascadeType.ALL], orphanRemoval = true)
    @BatchSize(size = 32)
    var lignes: MutableList<DemandeMaterielLigne> = mutableListOf(),

    @OneToMany(mappedBy = "demande", cascade = [CascadeType.ALL], orphanRemoval = true)
    @BatchSize(size = 32)
    var historique: MutableList<DemandeMaterielHistorique> = mutableListOf(),
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DemandeMateriel) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
    override fun toString(): String = "DemandeMateriel(id=$id, reference='$reference', statut=$statut)"
}
