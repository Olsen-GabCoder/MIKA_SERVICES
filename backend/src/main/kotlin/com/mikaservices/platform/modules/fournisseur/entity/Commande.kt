package com.mikaservices.platform.modules.fournisseur.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutCommande
import com.mikaservices.platform.modules.projet.entity.Projet
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "commandes", indexes = [
    Index(name = "idx_cmd_fournisseur", columnList = "fournisseur_id"),
    Index(name = "idx_cmd_projet", columnList = "projet_id"),
    Index(name = "idx_cmd_statut", columnList = "statut")
])
class Commande(
    @Column(name = "reference", nullable = false, unique = true, length = 50)
    var reference: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fournisseur_id", nullable = false)
    var fournisseur: Fournisseur,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id")
    var projet: Projet? = null,

    @Column(name = "designation", nullable = false, length = 500)
    var designation: String,

    @Column(name = "montant_total", precision = 20, scale = 2)
    var montantTotal: BigDecimal? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutCommande = StatutCommande.BROUILLON,

    @Column(name = "date_commande")
    var dateCommande: LocalDate? = null,

    @Column(name = "date_livraison_prevue")
    var dateLivraisonPrevue: LocalDate? = null,

    @Column(name = "date_livraison_effective")
    var dateLivraisonEffective: LocalDate? = null,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null
) : BaseEntity() {
    override fun equals(other: Any?): Boolean { if (this === other) return true; if (other !is Commande) return false; return id != null && id == other.id }
    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
    override fun toString(): String = "Commande(id=$id, reference='$reference', statut=$statut)"
}
