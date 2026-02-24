package com.mikaservices.platform.modules.document.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.TypeDocument
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*

@Entity
@Table(name = "documents", indexes = [
    Index(name = "idx_doc_projet", columnList = "projet_id"),
    Index(name = "idx_doc_type", columnList = "type_document")
])
class Document(
    @Column(name = "nom_fichier", nullable = false, length = 500)
    var nomFichier: String,

    @Column(name = "nom_original", nullable = false, length = 500)
    var nomOriginal: String,

    @Column(name = "chemin_stockage", nullable = false, length = 1000)
    var cheminStockage: String,

    @Column(name = "type_mime", length = 100)
    var typeMime: String? = null,

    @Column(name = "taille_octets")
    var tailleOctets: Long = 0,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_document", nullable = false, length = 25)
    var typeDocument: TypeDocument,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id")
    var projet: Projet? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploade_par_id")
    var uploadePar: User? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Document) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: nomFichier.hashCode()
    override fun toString(): String = "Document(id=$id, nomOriginal='$nomOriginal', type=$typeDocument)"
}
