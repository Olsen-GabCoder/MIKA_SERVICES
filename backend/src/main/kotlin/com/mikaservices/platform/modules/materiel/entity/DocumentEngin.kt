package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.TypeDocumentEngin
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "documents_engin", indexes = [
    Index(name = "idx_doc_engin", columnList = "engin_id"),
    // PostgreSQL : noms d'index uniques par schéma — idx_doc_type est déjà pris par la table documents
    Index(name = "idx_doc_engin_type", columnList = "type_document")
])
class DocumentEngin(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engin_id", nullable = false)
    var engin: Engin,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_document", nullable = false, length = 30)
    var typeDocument: TypeDocumentEngin,

    @Column(name = "nom", nullable = false, length = 300)
    var nom: String,

    @Column(name = "url_fichier", length = 500)
    var urlFichier: String? = null,

    @Column(name = "date_expiration")
    var dateExpiration: LocalDate? = null,

    @Column(name = "commentaire", columnDefinition = "TEXT")
    var commentaire: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DocumentEngin) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)
    override fun toString(): String = "DocumentEngin(id=$id, nom='$nom', type=$typeDocument)"
}
