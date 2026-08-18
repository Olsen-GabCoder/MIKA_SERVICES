package com.mikaservices.platform.modules.chantier.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate

/**
 * Affectation individuelle d'un utilisateur sur un projet/chantier avec un poste précis.
 */
@Entity
@Table(name = "affectations_utilisateur_projet", indexes = [
    Index(name = "idx_affuser_user", columnList = "user_id"),
    Index(name = "idx_affuser_projet", columnList = "projet_id")
])
class AffectationUtilisateurProjet(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "poste", nullable = false, length = 100)
    var poste: String,

    @Column(name = "date_debut", nullable = false)
    var dateDebut: LocalDate,

    @Column(name = "date_fin")
    var dateFin: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutAffectation = StatutAffectation.EN_COURS,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is AffectationUtilisateurProjet) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
    override fun toString(): String = "AffectationUtilisateurProjet(id=$id, poste='$poste', statut=$statut)"
}
