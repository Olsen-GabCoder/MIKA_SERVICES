package com.mikaservices.platform.modules.bareme.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.TypeLigneBareme
import jakarta.persistence.*
import java.math.BigDecimal

/**
 * Une ligne du barème (une ligne Excel = une entrée).
 * Couvre à la fois :
 * - les lignes "référentiel prix" (matériaux : N°, Matériaux, U, P.TTC, Fournisseur)
 * - les lignes "prestations" : entête de bloc, lignes de décomposition (Qté × P.U = Sommes), ligne total (Déboursé, P.V).
 * Les sous-détails d'une prestation sont liés via parent (self-reference).
 */
@Entity
@Table(name = "bareme_lignes_prix", indexes = [
    Index(name = "idx_bareme_ligne_corps", columnList = "corps_etat_id"),
    Index(name = "idx_bareme_ligne_type", columnList = "type"),
    Index(name = "idx_bareme_ligne_fourn", columnList = "fournisseur_bareme_id"),
    Index(name = "idx_bareme_ligne_parent", columnList = "parent_id"),
    Index(name = "idx_bareme_ligne_famille", columnList = "famille"),
    Index(name = "idx_bareme_ligne_categorie", columnList = "categorie")
    // Pas d'index sur libelle (TEXT) : MySQL exige une longueur pour indexer BLOB/TEXT
])
class LignePrixBareme(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "corps_etat_id", nullable = false)
    var corpsEtat: CorpsEtatBareme,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TypeLigneBareme,

    @Column(name = "reference", length = 50)
    var reference: String? = null,

    @Column(name = "libelle", columnDefinition = "TEXT")
    var libelle: String? = null,

    @Column(name = "unite", length = 20)
    var unite: String? = null,

    @Column(name = "prix_ttc", precision = 18, scale = 2)
    var prixTtc: BigDecimal? = null,

    @Column(name = "date_prix", length = 50)
    var datePrix: String? = null,

    @Column(name = "ref_reception", length = 50)
    var refReception: String? = null,

    @Column(name = "code_fournisseur", length = 30)
    var codeFournisseur: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fournisseur_bareme_id")
    var fournisseurBareme: FournisseurBareme? = null,

    @Column(name = "contact_texte", length = 100)
    var contactTexte: String? = null,

    @Column(name = "famille", length = 120)
    var famille: String? = null,

    @Column(name = "categorie", length = 120)
    var categorie: String? = null,

    /** Dépôt optionnel (ex. ADR, LBV) — fichier PRO. */
    @Column(name = "depot", length = 20)
    var depot: String? = null,

    @Column(name = "quantite", precision = 18, scale = 4)
    var quantite: BigDecimal? = null,

    @Column(name = "prix_unitaire", precision = 18, scale = 2)
    var prixUnitaire: BigDecimal? = null,

    @Column(name = "somme", precision = 18, scale = 2)
    var somme: BigDecimal? = null,

    @Column(name = "debourse", precision = 18, scale = 2)
    var debourse: BigDecimal? = null,

    @Column(name = "prix_vente", precision = 18, scale = 2)
    var prixVente: BigDecimal? = null,

    @Column(name = "coefficient_pv", precision = 4, scale = 2)
    var coefficientPv: BigDecimal? = null,

    @Column(name = "unite_prestation", length = 20)
    var unitePrestation: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    var parent: LignePrixBareme? = null,

    @OneToMany(mappedBy = "parent", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    var enfants: MutableList<LignePrixBareme> = mutableListOf(),

    @Column(name = "ordre_ligne")
    var ordreLigne: Int = 0,

    @Column(name = "numero_ligne_excel")
    var numeroLigneExcel: Int? = null,

    /** True si le(s) prix de cette ligne ont été remplis par une valeur estimée (pas une donnée réelle entreprise). */
    @Column(name = "prix_estime", nullable = false)
    var prixEstime: Boolean = false
) : BaseEntity() {
    override fun equals(other: Any?): Boolean =
        (this === other) || (other is LignePrixBareme && id != null && id == other.id)

    override fun hashCode(): Int = id?.hashCode() ?: 0
    override fun toString(): String = "LignePrixBareme(id=$id, type=$type, libelle=${libelle?.take(30)})"
}
