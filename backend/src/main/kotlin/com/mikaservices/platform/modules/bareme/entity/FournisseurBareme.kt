package com.mikaservices.platform.modules.bareme.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*

/**
 * Fournisseur tel que mentionné dans le barème Excel (colonnes Fournisseurs / Contacts).
 * Table dédiée au barème pour ne pas impacter le module fournisseurs existant.
 * Un lien optionnel vers Fournisseur (module fournisseurs) pourra être ajouté plus tard.
 */
@Entity
@Table(name = "bareme_fournisseurs", indexes = [
    Index(name = "idx_bareme_fourn_nom", columnList = "nom")
])
class FournisseurBareme(
    @Column(name = "nom", nullable = false, length = 200)
    var nom: String,

    @Column(name = "contact", length = 100)
    var contact: String? = null
) : BaseEntity() {
    override fun equals(other: Any?): Boolean =
        (this === other) || (other is FournisseurBareme && id != null && id == other.id)

    override fun hashCode(): Int = id?.hashCode() ?: nom.hashCode()
    override fun toString(): String = "FournisseurBareme(id=$id, nom='$nom')"
}
