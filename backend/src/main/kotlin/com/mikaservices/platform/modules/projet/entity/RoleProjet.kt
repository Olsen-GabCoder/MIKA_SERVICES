package com.mikaservices.platform.modules.projet.entity

import com.mikaservices.platform.common.enums.FamilleRoleProjet
import jakarta.persistence.*

/**
 * Référentiel des rôles qu'un utilisateur peut occuper sur un projet
 * (chef de projet, conducteur de travaux, chef de chantier, magasinier…).
 * Table paramétrable : l'administration peut en ajouter au besoin.
 */
@Entity
@Table(name = "roles_projet")
class RoleProjet(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "code", nullable = false, unique = true, length = 50)
    var code: String,

    @Column(name = "nom", nullable = false, length = 100)
    var nom: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "famille", nullable = false, length = 30)
    var famille: FamilleRoleProjet,

    /** Rôle cumulable sur plusieurs projets en même temps (direction, support transverse). */
    @Column(name = "cumulable", nullable = false)
    var cumulable: Boolean = false,

    @Column(name = "description", length = 500)
    var description: String? = null,

    @Column(name = "actif", nullable = false)
    var actif: Boolean = true
) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is RoleProjet) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()

    override fun toString(): String = "RoleProjet(id=$id, code='$code', nom='$nom')"
}
