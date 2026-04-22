package com.mikaservices.platform.modules.qualite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*

@Entity
@Table(
    name = "qualite_versions_document",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_qvd_doc_version", columnNames = ["document_id", "numero_version"])
    ]
)
class VersionDocumentQualite(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    var document: DocumentQualite,

    @Column(name = "numero_version", nullable = false, length = 20)
    var numeroVersion: String,

    @Column(name = "nom_original", nullable = false, length = 500)
    var nomOriginal: String,

    @Column(name = "nom_stockage", nullable = false, length = 500)
    var nomStockage: String,

    @Column(name = "chemin_stockage", nullable = false, length = 1000)
    var cheminStockage: String,

    @Column(name = "type_mime", length = 200)
    var typeMime: String? = null,

    @Column(name = "taille_octets", nullable = false)
    var tailleOctets: Long = 0,

    @Column(name = "commentaire", columnDefinition = "TEXT")
    var commentaire: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id")
    var auteur: User? = null,

) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is VersionDocumentQualite) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
}
