package com.mikaservices.platform.modules.bareme.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*
import java.math.BigDecimal

/**
 * Coefficient d'éloignement par ville/localité (feuille 1 du barème Excel).
 * Permet d'appliquer un coefficient au coût selon la localisation du chantier (Gabon).
 */
@Entity
@Table(name = "bareme_coefficients_eloignement", indexes = [
    Index(name = "idx_bareme_coef_nom", columnList = "nom")
])
class CoefficientEloignement(
    @Column(name = "nom", nullable = false, length = 100)
    var nom: String,

    @Column(name = "pourcentage", precision = 5, scale = 2)
    var pourcentage: BigDecimal? = null,

    @Column(name = "coefficient", nullable = false, precision = 5, scale = 2)
    var coefficient: BigDecimal,

    @Column(name = "note", columnDefinition = "TEXT")
    var note: String? = null,

    @Column(name = "ordre_affichage")
    var ordreAffichage: Int = 0
) : BaseEntity() {
    override fun equals(other: Any?): Boolean =
        (this === other) || (other is CoefficientEloignement && id != null && id == other.id)

    override fun hashCode(): Int = id?.hashCode() ?: nom.hashCode()
    override fun toString(): String = "CoefficientEloignement(id=$id, nom='$nom', coef=$coefficient)"
}
