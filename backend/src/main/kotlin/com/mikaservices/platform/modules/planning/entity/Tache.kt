package com.mikaservices.platform.modules.planning.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutTache
import com.mikaservices.platform.common.enums.TypePrevision
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "taches", indexes = [
    Index(name = "idx_tache_projet", columnList = "projet_id"),
    Index(name = "idx_tache_statut", columnList = "statut"),
    Index(name = "idx_tache_assigne", columnList = "assigne_a_id"),
    Index(name = "idx_tache_semaine_annee", columnList = "semaine, annee"),
    Index(name = "idx_tache_type_prevision", columnList = "type_prevision"),
    Index(name = "idx_tache_date_echeance", columnList = "date_echeance")
])
class Tache(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "titre", nullable = false, length = 300)
    var titre: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutTache = StatutTache.A_FAIRE,

    @Enumerated(EnumType.STRING)
    @Column(name = "priorite", nullable = false, length = 20)
    var priorite: Priorite = Priorite.NORMALE,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigne_a_id")
    var assigneA: User? = null,

    @Column(name = "date_debut")
    var dateDebut: LocalDate? = null,

    @Column(name = "date_fin")
    var dateFin: LocalDate? = null,

    @Column(name = "date_echeance")
    var dateEcheance: LocalDate? = null,

    @Column(name = "pourcentage_avancement")
    var pourcentageAvancement: Int = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tache_parent_id")
    var tacheParent: Tache? = null,

    @OneToMany(mappedBy = "tacheParent", fetch = FetchType.LAZY, cascade = [CascadeType.ALL], orphanRemoval = true)
    var tachesEnfants: MutableList<Tache> = mutableListOf(),

    @Column(name = "semaine")
    var semaine: Int? = null,

    @Column(name = "annee")
    var annee: Int? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_prevision", length = 30)
    var typePrevision: TypePrevision? = null,

    @Column(name = "est_jalon", nullable = false, columnDefinition = "boolean not null default false")
    var estJalon: Boolean = false,

    @Column(name = "couleur", length = 7)
    var couleur: String? = null,

    @Column(name = "ordre_affichage")
    var ordreAffichage: Int? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Tache) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = javaClass.hashCode()
    override fun toString(): String = "Tache(id=$id, titre='$titre', statut=$statut)"
}
