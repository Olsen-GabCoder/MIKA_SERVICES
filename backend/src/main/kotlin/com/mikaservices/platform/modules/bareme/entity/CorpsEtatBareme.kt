package com.mikaservices.platform.modules.bareme.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*

/**
 * Corps d'état du barème (une feuille Excel = un corps d'état).
 * Ex. : Gros-Oeuvre, Assainissement, Plomberie, Electricité...
 */
@Entity
@Table(name = "bareme_corps_etat", indexes = [
    Index(name = "idx_bareme_corps_code", columnList = "code", unique = true)
])
class CorpsEtatBareme(
    @Column(name = "code", nullable = false, unique = true, length = 80)
    var code: String,

    @Column(name = "libelle", nullable = false, length = 200)
    var libelle: String,

    @Column(name = "ordre_affichage")
    var ordreAffichage: Int = 0
) : BaseEntity() {
    override fun equals(other: Any?): Boolean =
        (this === other) || (other is CorpsEtatBareme && id != null && id == other.id)

    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()
    override fun toString(): String = "CorpsEtatBareme(id=$id, code='$code')"
}
