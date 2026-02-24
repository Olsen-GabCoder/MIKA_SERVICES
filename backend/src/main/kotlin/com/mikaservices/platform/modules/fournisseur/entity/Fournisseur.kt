package com.mikaservices.platform.modules.fournisseur.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*

@Entity
@Table(name = "fournisseurs", indexes = [
    Index(name = "idx_fourn_nom", columnList = "nom"),
    Index(name = "idx_fourn_code", columnList = "code")
])
class Fournisseur(
    @Column(name = "code", nullable = false, unique = true, length = 30)
    var code: String,

    @Column(name = "nom", nullable = false, length = 200)
    var nom: String,

    @Column(name = "adresse", columnDefinition = "TEXT")
    var adresse: String? = null,

    @Column(name = "telephone", length = 30)
    var telephone: String? = null,

    @Column(name = "email", length = 150)
    var email: String? = null,

    @Column(name = "contact_nom", length = 150)
    var contactNom: String? = null,

    @Column(name = "specialite", length = 200)
    var specialite: String? = null,

    @Column(name = "note_evaluation")
    var noteEvaluation: Int? = null,

    @Column(name = "actif")
    var actif: Boolean = true,

    @OneToMany(mappedBy = "fournisseur", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    var commandes: MutableList<Commande> = mutableListOf()
) : BaseEntity() {
    override fun equals(other: Any?): Boolean { if (this === other) return true; if (other !is Fournisseur) return false; return id != null && id == other.id }
    override fun hashCode(): Int = id?.hashCode() ?: code.hashCode()
    override fun toString(): String = "Fournisseur(id=$id, code='$code', nom='$nom')"
}
